#!/bin/bash
# Script de déploiement en production
# Usage: ./deploy-production.sh

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Démarrage du déploiement en production...${NC}"

# Variables
PROJECT_DIR="/var/www/alliance-courtage"
FRONTEND_DIR="/var/www/alliance-courtage-frontend"
BACKEND_DIR="$PROJECT_DIR/backend"

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Erreur: $PROJECT_DIR n'existe pas${NC}"
    exit 1
fi

cd $PROJECT_DIR

# Étape 1: Pull les dernières modifications
echo -e "${YELLOW}📥 Récupération des dernières modifications...${NC}"
git pull origin main || echo -e "${YELLOW}⚠️  Git pull échoué (peut-être pas un repo Git)${NC}"

# Étape 2: Backend
echo -e "${YELLOW}🔧 Configuration du backend...${NC}"
cd $BACKEND_DIR

# Installer les dépendances
echo -e "${YELLOW}📦 Installation des dépendances backend...${NC}"
npm install --production

# Vérifier que config.env existe
if [ ! -f "config.env" ]; then
    echo -e "${RED}❌ Erreur: config.env n'existe pas dans backend/${NC}"
    echo -e "${YELLOW}💡 Créez config.env avec vos variables d'environnement${NC}"
    exit 1
fi

# Redémarrer le backend avec PM2
echo -e "${YELLOW}🔄 Redémarrage du backend...${NC}"
if pm2 list | grep -q "alliance-backend"; then
    pm2 restart alliance-backend
else
    pm2 start server.js --name "alliance-backend"
    pm2 save
fi

# Attendre que le backend démarre
sleep 3

# Vérifier que le backend répond
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend démarré avec succès${NC}"
else
    echo -e "${RED}❌ Erreur: Le backend ne répond pas${NC}"
    echo -e "${YELLOW}📋 Logs backend:${NC}"
    pm2 logs alliance-backend --lines 20 --nostream
    exit 1
fi

# Étape 3: Exécuter les migrations (si nécessaire)
echo -e "${YELLOW}📊 Exécution des migrations...${NC}"
node scripts/runAllMigrations.js || echo -e "${YELLOW}⚠️  Migrations avec avertissements${NC}"

# Étape 4: Frontend
echo -e "${YELLOW}🎨 Build du frontend...${NC}"
cd $PROJECT_DIR

# Installer les dépendances
npm install

# Build de production
npm run build

# Vérifier que dist/ existe
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erreur: Le dossier dist/ n'existe pas après le build${NC}"
    exit 1
fi

# Copier les fichiers build
echo -e "${YELLOW}📁 Copie des fichiers frontend...${NC}"
sudo mkdir -p $FRONTEND_DIR
sudo cp -r dist/* $FRONTEND_DIR/
sudo chown -R www-data:www-data $FRONTEND_DIR

# Étape 5: Redémarrer Nginx
echo -e "${YELLOW}🔄 Redémarrage de Nginx...${NC}"
sudo nginx -t && sudo systemctl reload nginx

# Étape 6: Nettoyage
echo -e "${YELLOW}🧹 Nettoyage...${NC}"
npm cache clean --force

# Résumé
echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo ""
echo -e "${GREEN}📊 Statut:${NC}"
pm2 status
echo ""
echo -e "${GREEN}🌐 Votre application est disponible sur:${NC}"
echo "   Frontend: https://votre-domaine.com"
echo "   Backend:  https://votre-domaine.com/api"
echo ""
echo -e "${YELLOW}📝 Commandes utiles:${NC}"
echo "   Logs backend:  pm2 logs alliance-backend"
echo "   Logs Nginx:    sudo tail -f /var/log/nginx/error.log"
echo "   Status PM2:    pm2 status"
echo "   Redémarrer:    pm2 restart alliance-backend"

