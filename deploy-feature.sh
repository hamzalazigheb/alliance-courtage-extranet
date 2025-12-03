#!/bin/bash
# Script pour déployer une nouvelle fonctionnalité sur le serveur

echo "🚀 Déploiement de la nouvelle fonctionnalité..."
echo ""

# Configuration (à adapter selon votre serveur)
SERVER_USER="ubuntu"
SERVER_HOST="votre-serveur.com"
SERVER_PATH="/chemin/vers/projet"
BACKEND_PATH="$SERVER_PATH/backend"
FRONTEND_PATH="$SERVER_PATH"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📦 Étape 1: Push vers Git..."
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
    npm install
    if [ \$? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation"
        exit 1
    fi
    echo "✅ Dépendances backend installées"
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de l'installation des dépendances${NC}"
    exit 1
fi
echo ""

echo "🔄 Étape 4: Redémarrage du backend..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    cd ${BACKEND_PATH}
    # Avec PM2
    pm2 restart alliance-courtage-backend || \
    # Ou avec Docker
    docker-compose restart backend || \
    # Ou avec systemd
    sudo systemctl restart alliance-backend
    echo "✅ Backend redémarré"
EOF

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Vérifiez manuellement le redémarrage du backend${NC}"
fi
echo ""

echo "🏗️  Étape 5: Build du frontend..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    cd ${FRONTEND_PATH}
    npm install
    npm run build
    if [ \$? -ne 0 ]; then
        echo "❌ Erreur lors du build"
        exit 1
    fi
    echo "✅ Frontend buildé"
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du build du frontend${NC}"
    exit 1
fi
echo ""

echo "📤 Étape 6: Déploiement du frontend..."
ssh ${SERVER_USER}@${SERVER_HOST} << EOF
    # Copier vers nginx (adapter selon votre configuration)
    sudo cp -r ${FRONTEND_PATH}/dist/* /var/www/html/ || \
    # Ou si vous utilisez un autre chemin
    sudo cp -r ${FRONTEND_PATH}/dist/* /usr/share/nginx/html/
    echo "✅ Frontend déployé"
EOF

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Vérifiez manuellement le déploiement du frontend${NC}"
fi
echo ""

echo "✅ Déploiement terminé!"
echo ""
echo "🔍 Vérifications:"
echo "   1. Vérifier que le backend répond: curl https://votre-domaine.com/api/nouvelle-fonctionnalite"
echo "   2. Vérifier que le frontend fonctionne: https://votre-domaine.com"
echo "   3. Vérifier les logs: pm2 logs alliance-courtage-backend"

