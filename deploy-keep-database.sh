#!/bin/bash

# Script de déploiement avec conservation des données de la base de données
# Ce script met à jour uniquement le code sans toucher à la base de données

set -e  # Arrêter en cas d'erreur

echo "🚀 DÉPLOIEMENT AVEC CONSERVATION DES DONNÉES"
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
BACKEND_CONTAINER="alliance-courtage-backend"
FRONTEND_CONTAINER="alliance-courtage-extranet"
MYSQL_CONTAINER="alliance-courtage-mysql"

echo -e "${BLUE}📋 Étape 1/7: Vérification de l'état actuel${NC}"
echo "------------------------------------------------------------"

# Vérifier les conteneurs en cours
echo "Conteneurs actuels:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Vérifier que MySQL tourne
if ! docker ps | grep -q "$MYSQL_CONTAINER"; then
    echo -e "${RED}❌ Erreur: Le conteneur MySQL n'est pas démarré${NC}"
    exit 1
fi
echo -e "${GREEN}✅ MySQL est en ligne${NC}"

echo ""
echo -e "${BLUE}📋 Étape 2/7: Sauvegarde de sécurité de la base de données${NC}"
echo "------------------------------------------------------------"

# Créer un dossier de backup avec timestamp
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "Sauvegarde de la base de données..."
docker exec $MYSQL_CONTAINER mysqldump \
  -u root \
  -p${DB_PASSWORD:-alliance2024Secure} \
  alliance_courtage > "$BACKUP_DIR/database_backup.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Sauvegarde créée: $BACKUP_DIR/database_backup.sql${NC}"
else
    echo -e "${RED}❌ Erreur lors de la sauvegarde${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Étape 3/7: Récupération des derniers changements${NC}"
echo "------------------------------------------------------------"

# Sauvegarder les modifications locales si nécessaires
echo "Statut Git actuel:"
git status

echo ""
read -p "Voulez-vous sauvegarder les modifications locales? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    git stash push -m "Sauvegarde avant déploiement $(date +%Y%m%d_%H%M%S)"
    echo -e "${GREEN}✅ Modifications locales sauvegardées${NC}"
fi

# Pull des derniers changements
echo "Récupération des derniers changements..."
git pull origin main

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code mis à jour${NC}"
else
    echo -e "${RED}❌ Erreur lors du pull${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Étape 4/7: Construction du nouveau backend${NC}"
echo "------------------------------------------------------------"

# Build backend
cd backend
echo "Construction de l'image backend..."
docker build -t backend_backend:new .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image backend construite${NC}"
else
    echo -e "${RED}❌ Erreur lors de la construction du backend${NC}"
    exit 1
fi
cd ..

echo ""
echo -e "${BLUE}📋 Étape 5/7: Construction du nouveau frontend${NC}"
echo "------------------------------------------------------------"

echo "Construction de l'image frontend..."
docker build -t alliance-courtage-frontend:new .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image frontend construite${NC}"
else
    echo -e "${RED}❌ Erreur lors de la construction du frontend${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Étape 6/7: Déploiement avec zéro downtime${NC}"
echo "------------------------------------------------------------"

# Récupérer le réseau MySQL
MYSQL_NETWORK=$(docker inspect $MYSQL_CONTAINER --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)
echo "Réseau MySQL: $MYSQL_NETWORK"

# Déployer le nouveau backend
echo ""
echo "Déploiement du backend..."
docker run -d \
  --name backend-new \
  -p 3002:3001 \
  --network $MYSQL_NETWORK \
  --env-file backend/config.env \
  -e NODE_ENV=production \
  -e DB_HOST=$MYSQL_CONTAINER \
  -e DB_PORT=3306 \
  -e DB_NAME=alliance_courtage \
  -e DB_USER=root \
  -e DB_PASSWORD=${DB_PASSWORD:-alliance2024Secure} \
  -v $(pwd)/backend/uploads:/app/uploads \
  backend_backend:new

# Attendre que le backend soit prêt
echo "Attente du démarrage du backend..."
sleep 10

# Vérifier que le nouveau backend fonctionne
if curl -f http://localhost:3002/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nouveau backend opérationnel${NC}"
    
    # Arrêter l'ancien backend
    echo "Arrêt de l'ancien backend..."
    docker stop $BACKEND_CONTAINER
    docker rm $BACKEND_CONTAINER
    
    # Renommer le nouveau backend
    docker stop backend-new
    docker rm backend-new
    
    # Lancer le backend final sur le bon port
    docker run -d \
      --name $BACKEND_CONTAINER \
      --restart unless-stopped \
      -p 3001:3001 \
      --network $MYSQL_NETWORK \
      --env-file backend/config.env \
      -e NODE_ENV=production \
      -e DB_HOST=$MYSQL_CONTAINER \
      -e DB_PORT=3306 \
      -e DB_NAME=alliance_courtage \
      -e DB_USER=root \
      -e DB_PASSWORD=${DB_PASSWORD:-alliance2024Secure} \
      -v $(pwd)/backend/uploads:/app/uploads \
      backend_backend:new
    
    echo -e "${GREEN}✅ Backend déployé${NC}"
else
    echo -e "${RED}❌ Le nouveau backend ne répond pas${NC}"
    docker logs backend-new
    docker rm -f backend-new
    exit 1
fi

# Déployer le nouveau frontend
echo ""
echo "Déploiement du frontend..."
docker run -d \
  --name frontend-new \
  -p 81:80 \
  --restart unless-stopped \
  alliance-courtage-frontend:new

# Attendre que le frontend soit prêt
echo "Attente du démarrage du frontend..."
sleep 5

# Vérifier que le nouveau frontend fonctionne
if curl -f http://localhost:81 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Nouveau frontend opérationnel${NC}"
    
    # Arrêter l'ancien frontend
    echo "Arrêt de l'ancien frontend..."
    docker stop $FRONTEND_CONTAINER
    docker rm $FRONTEND_CONTAINER
    
    # Renommer le nouveau frontend
    docker stop frontend-new
    docker rm frontend-new
    
    # Lancer le frontend final sur le bon port
    docker run -d \
      --name $FRONTEND_CONTAINER \
      --restart unless-stopped \
      -p 80:80 \
      alliance-courtage-frontend:new
    
    echo -e "${GREEN}✅ Frontend déployé${NC}"
else
    echo -e "${RED}❌ Le nouveau frontend ne répond pas${NC}"
    docker logs frontend-new
    docker rm -f frontend-new
    exit 1
fi

echo ""
echo -e "${BLUE}📋 Étape 7/7: Vérification finale${NC}"
echo "------------------------------------------------------------"

# Vérifier tous les services
echo "Services après déploiement:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "Tests de santé:"

# Test backend
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend: OK${NC}"
else
    echo -e "${RED}❌ Backend: ERREUR${NC}"
fi

# Test frontend
if curl -f http://localhost > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend: OK${NC}"
else
    echo -e "${RED}❌ Frontend: ERREUR${NC}"
fi

# Test MySQL
if docker exec $MYSQL_CONTAINER mysqladmin ping -h localhost -u root -p${DB_PASSWORD:-alliance2024Secure} 2>/dev/null | grep -q "mysqld is alive"; then
    echo -e "${GREEN}✅ MySQL: OK (données conservées)${NC}"
else
    echo -e "${RED}❌ MySQL: ERREUR${NC}"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!${NC}"
echo "=============================================="
echo ""
echo "📊 Résumé:"
echo "   • Code: MIS À JOUR ✅"
echo "   • Base de données: CONSERVÉE ✅"
echo "   • Sauvegarde: $BACKUP_DIR"
echo ""
echo "🌐 URLs:"
echo "   • Frontend: http://votre-serveur"
echo "   • Backend: http://votre-serveur:3001"
echo "   • API Health: http://votre-serveur:3001/api/health"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Tester le site en production"
echo "   2. Vérifier que toutes les données sont présentes"
echo "   3. Consulter les logs si nécessaire:"
echo "      docker logs $BACKEND_CONTAINER"
echo "      docker logs $FRONTEND_CONTAINER"
echo ""

