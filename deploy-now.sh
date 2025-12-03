#!/bin/bash
# Script de déploiement rapide pour les corrections bordereaux

echo "🚀 Déploiement des corrections bordereaux..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration (à adapter)
SERVER_USER="ubuntu"
SERVER_HOST="votre-serveur.com"  # REMPLACER par votre serveur
SERVER_PATH="/chemin/vers/projet"  # REMPLACER par le chemin réel
BACKEND_PATH="$SERVER_PATH/backend"
FRONTEND_PATH="$SERVER_PATH"

echo "📦 Étape 1: Commit et push des changements locaux..."
git add .
git commit -m "fix: correction ouverture fichiers bordereaux + suppression individuelle" || echo "Aucun changement à commiter"
git push origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du push Git${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Code pushé vers Git${NC}"
echo ""

echo "📡 Étape 2: Connexion au serveur et pull..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    cd ${SERVER_PATH}
    echo "📥 Pull des derniers changements..."
    git pull origin main
    
    if [ \$? -ne 0 ]; then
        echo "❌ Erreur lors du pull"
        exit 1
    fi
    echo "✅ Code mis à jour sur le serveur"
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de la mise à jour du code${NC}"
    exit 1
fi
echo ""

echo "🔧 Étape 3: Installation des dépendances backend..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    cd ${BACKEND_PATH}
    echo "📦 Installation des dépendances..."
    npm install --production
    
    if [ \$? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation"
        exit 1
    fi
    echo "✅ Dépendances backend installées"
EOF

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Vérifiez manuellement l'installation des dépendances${NC}"
fi
echo ""

echo "🔄 Étape 4: Redémarrage du backend..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    cd ${BACKEND_PATH}
    echo "🔄 Redémarrage du backend..."
    
    # Essayer PM2
    if command -v pm2 &> /dev/null; then
        pm2 restart alliance-courtage-backend || pm2 restart backend
        echo "✅ Backend redémarré (PM2)"
    # Essayer Docker
    elif [ -f "docker-compose.yml" ]; then
        docker-compose restart backend
        echo "✅ Backend redémarré (Docker)"
    # Essayer systemd
    elif systemctl is-active --quiet alliance-backend; then
        sudo systemctl restart alliance-backend
        echo "✅ Backend redémarré (systemd)"
    else
        echo "⚠️  Méthode de redémarrage non détectée - redémarrez manuellement"
    fi
EOF

echo ""

echo "🏗️  Étape 5: Build du frontend..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    cd ${FRONTEND_PATH}
    echo "📦 Installation des dépendances frontend..."
    npm install
    
    if [ \$? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation frontend"
        exit 1
    fi
    
    echo "🔨 Build du frontend..."
    npm run build
    
    if [ \$? -ne 0 ]; then
        echo "❌ Erreur lors du build"
        exit 1
    fi
    echo "✅ Frontend buildé avec succès"
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du build du frontend${NC}"
    exit 1
fi
echo ""

echo "📤 Étape 6: Déploiement du frontend..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    echo "📂 Copie des fichiers vers nginx..."
    
    # Essayer différents chemins nginx
    if [ -d "/var/www/html" ]; then
        sudo cp -r ${FRONTEND_PATH}/dist/* /var/www/html/
        echo "✅ Fichiers copiés vers /var/www/html"
    elif [ -d "/usr/share/nginx/html" ]; then
        sudo cp -r ${FRONTEND_PATH}/dist/* /usr/share/nginx/html/
        echo "✅ Fichiers copiés vers /usr/share/nginx/html"
    elif [ -d "/var/www" ]; then
        sudo cp -r ${FRONTEND_PATH}/dist/* /var/www/
        echo "✅ Fichiers copiés vers /var/www"
    else
        echo "⚠️  Chemin nginx non trouvé - copiez manuellement dist/ vers votre serveur web"
    fi
    
    # Redémarrer nginx si nécessaire
    if command -v nginx &> /dev/null; then
        sudo nginx -t && sudo systemctl reload nginx
        echo "✅ Nginx rechargé"
    fi
EOF

echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
echo "🔍 Vérifications:"
echo "   1. Backend: curl https://votre-domaine.com/api/bordereaux/recent"
echo "   2. Frontend: https://votre-domaine.com"
echo "   3. Logs backend: pm2 logs alliance-courtage-backend"

