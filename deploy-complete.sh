#!/bin/bash
# Script de déploiement complet pour la nouvelle version
# Utilise la branche deploy-new-version

set -e

echo "🚀 Déploiement complet de la nouvelle version..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="$HOME/prod"

echo -e "${BLUE}📁 Dossier du projet: $PROJECT_DIR${NC}"
echo ""

# 1. Vérifier qu'on est dans le bon dossier
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Le dossier $PROJECT_DIR n'existe pas${NC}"
    exit 1
fi

cd "$PROJECT_DIR"

# 2. Vérifier la branche
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}🌿 Branche actuelle: $CURRENT_BRANCH${NC}"

if [ "$CURRENT_BRANCH" != "deploy-new-version" ]; then
    echo -e "${YELLOW}⚠️  Vous n'êtes pas sur la branche deploy-new-version${NC}"
    read -p "Voulez-vous basculer sur deploy-new-version? (O/N): " switch_branch
    if [ "$switch_branch" = "O" ] || [ "$switch_branch" = "o" ] || [ "$switch_branch" = "Y" ] || [ "$switch_branch" = "y" ]; then
        git fetch origin
        git checkout deploy-new-version
        git pull origin deploy-new-version
    else
        echo -e "${RED}❌ Déploiement annulé${NC}"
        exit 1
    fi
fi

# 3. Pull les derniers changements
echo ""
echo -e "${BLUE}📥 Récupération des derniers changements...${NC}"
git pull origin deploy-new-version
echo -e "${GREEN}✅ Code à jour${NC}"

# 4. Configuration automatique
echo ""
echo -e "${BLUE}🔧 Configuration automatique...${NC}"
cd backend
chmod +x setup-deployment.sh
./setup-deployment.sh
cd ..

# 5. Déployer le backend
echo ""
echo -e "${BLUE}🐳 Déploiement du backend...${NC}"
cd backend

# Arrêter les conteneurs existants (sans supprimer les volumes)
echo "   Arrêt des conteneurs existants..."
docker-compose down || true

# Rebuild et démarrer
echo "   Build et démarrage des conteneurs..."
docker-compose up -d --build

# Attendre que les conteneurs démarrent
echo "   Attente du démarrage..."
sleep 10

# Vérifier le statut
echo ""
echo -e "${BLUE}📊 Statut des conteneurs:${NC}"
docker-compose ps

# Vérifier les logs
echo ""
echo -e "${BLUE}📋 Derniers logs du backend:${NC}"
docker-compose logs --tail 20 backend

cd ..

# 6. Déployer le frontend
echo ""
echo -e "${BLUE}🌐 Déploiement du frontend...${NC}"

# Arrêter l'ancien conteneur frontend
echo "   Arrêt de l'ancien conteneur frontend..."
docker stop alliance-courtage-extranet 2>/dev/null || true
docker rm alliance-courtage-extranet 2>/dev/null || true

# Build l'image frontend
echo "   Build de l'image frontend..."
docker build -t alliance-courtage-frontend:latest .

# Démarrer le conteneur frontend
echo "   Démarrage du conteneur frontend..."
docker run -d -p 80:80 --name alliance-courtage-extranet alliance-courtage-frontend:latest

# Attendre le démarrage
sleep 5

# Vérifier le statut
echo ""
echo -e "${BLUE}📊 Statut du frontend:${NC}"
docker ps | grep alliance-courtage-extranet || echo "⚠️  Conteneur frontend non trouvé"

# Voir les logs
echo ""
echo -e "${BLUE}📋 Derniers logs du frontend:${NC}"
docker logs alliance-courtage-extranet --tail 20

# 7. Vérification finale
echo ""
echo -e "${BLUE}✅ Vérification finale...${NC}"
echo ""
echo "📊 Tous les conteneurs:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
echo "🔍 Tests rapides:"
echo "   Backend: curl http://localhost:3001/api/health"
echo "   Frontend: curl http://localhost:80"
echo ""
echo "📋 Logs en temps réel:"
echo "   Backend: cd backend && docker-compose logs -f"
echo "   Frontend: docker logs -f alliance-courtage-extranet"

