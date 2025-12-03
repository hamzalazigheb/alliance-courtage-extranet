#!/bin/bash
# Script de déploiement pour Docker

echo "🚀 Déploiement avec Docker..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
SERVER_USER="ubuntu"
SERVER_HOST="votre-serveur.com"  # REMPLACER
SERVER_PATH="/chemin/vers/projet"  # REMPLACER

echo "📦 Étape 1: Commit et push..."
git add .
git commit -m "fix: correction ouverture fichiers bordereaux + suppression individuelle" || echo "Aucun changement"
git push origin main
echo -e "${GREEN}✅ Code pushé${NC}"
echo ""

echo "📡 Étape 2: Pull sur le serveur..."
ssh ${SERVER_USER}@${SERVER_HOST} << 'EOF'
    cd /chemin/vers/projet  # REMPLACER
    
    echo "📥 Pull des changements..."
    git pull origin main
    
    echo "🔧 Backend - Rebuild et restart..."
    cd backend
    docker-compose build backend
    docker-compose restart backend
    
    echo "🌐 Frontend - Rebuild et restart..."
    cd ..
    docker-compose build frontend 2>/dev/null || docker build -t alliance-courtage-frontend:latest .
    docker-compose restart frontend 2>/dev/null || docker restart alliance-courtage-extranet
    
    echo "✅ Déploiement terminé!"
EOF

echo ""
echo -e "${GREEN}✅ Terminé!${NC}"

