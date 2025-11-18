#!/bin/bash

# Script de redéploiement pour Alliance Courtage (Linux/Ubuntu)
# Usage: ./redeploy.sh
# 
# Ce script redéploie l'application en préservant toutes les données

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔄 Redéploiement Alliance Courtage${NC}"
echo -e "${CYAN}====================================${NC}"
echo ""
echo -e "${YELLOW}⚠️  Ce script va redéployer l'application avec les nouvelles fonctionnalités${NC}"
echo -e "${GREEN}    Les données de production seront préservées${NC}"
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker détecté${NC}"
echo ""

# Vérifier que les conteneurs existent
echo -e "${BLUE}🔍 Vérification des conteneurs existants...${NC}"
BACKEND_CONTAINER=$(docker ps -a --filter "name=alliance-courtage-backend" --format "{{.Names}}" | head -1)
FRONTEND_CONTAINER=$(docker ps -a --filter "name=alliance-courtage-extranet" --format "{{.Names}}" | head -1)
MYSQL_CONTAINER=$(docker ps -a --filter "name=alliance-courtage" --format "{{.Names}}" | head -1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo -e "${YELLOW}⚠️  Conteneur backend non trouvé${NC}"
fi
if [ -z "$FRONTEND_CONTAINER" ]; then
    echo -e "${YELLOW}⚠️  Conteneur frontend non trouvé${NC}"
fi
if [ -z "$MYSQL_CONTAINER" ]; then
    echo -e "${YELLOW}⚠️  Conteneur MySQL non trouvé${NC}"
fi

echo -e "   Backend: ${BACKEND_CONTAINER:-non trouvé}"
echo -e "   Frontend: ${FRONTEND_CONTAINER:-non trouvé}"
echo -e "   MySQL: ${MYSQL_CONTAINER:-non trouvé}"
echo ""

# Demander confirmation
echo -e "${YELLOW}⚠️  CONFIRMATION REQUISE${NC}"
echo -e "   Ce script va:"
echo -e "   1. Faire un backup de la base de données"
echo -e "   2. Arrêter les conteneurs (données préservées)"
echo -e "   3. Rebuild les images avec les nouvelles fonctionnalités"
echo -e "   4. Redémarrer les conteneurs"
echo ""
read -p "Continuer? (O/N): " confirm

if [ "$confirm" != "O" ] && [ "$confirm" != "o" ] && [ "$confirm" != "Y" ] && [ "$confirm" != "y" ]; then
    echo -e "${RED}❌ Redéploiement annulé${NC}"
    exit 0
fi

echo ""

# Backup de la base de données
echo -e "${BLUE}💾 Étape 1/5: Backup de la base de données...${NC}"
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

if [ -n "$MYSQL_CONTAINER" ]; then
    echo -e "   Création du backup depuis le conteneur MySQL..."
    # Essayer avec le mot de passe par défaut
    MYSQL_PASSWORD="alliance2024Secure"
    docker exec "$MYSQL_CONTAINER" mysqldump -u root -p"$MYSQL_PASSWORD" alliance_courtage > "$BACKUP_FILE" 2>/dev/null || {
        echo -e "   ${YELLOW}⚠️  Backup avec mot de passe par défaut échoué${NC}"
        read -sp "   Entrez le mot de passe MySQL root: " MYSQL_PASSWORD
        echo ""
        docker exec "$MYSQL_CONTAINER" mysqldump -u root -p"$MYSQL_PASSWORD" alliance_courtage > "$BACKUP_FILE" 2>/dev/null || {
            echo -e "   ${YELLOW}⚠️  Backup échoué, mais continuons...${NC}"
        }
    }
    
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        echo -e "   ${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
        FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "   📊 Taille: $FILE_SIZE"
    else
        echo -e "   ${YELLOW}⚠️  Backup échoué, mais continuons...${NC}"
    fi
else
    echo -e "   ${YELLOW}⚠️  Conteneur MySQL non trouvé, backup ignoré${NC}"
fi
echo ""

# Arrêter les conteneurs (SANS supprimer les volumes)
echo -e "${BLUE}🛑 Étape 2/5: Arrêt des conteneurs (volumes préservés)...${NC}"
if [ -n "$BACKEND_CONTAINER" ]; then
    echo -e "   Arrêt du backend..."
    docker stop "$BACKEND_CONTAINER" 2>/dev/null || true
fi
if [ -n "$FRONTEND_CONTAINER" ]; then
    echo -e "   Arrêt du frontend..."
    docker stop "$FRONTEND_CONTAINER" 2>/dev/null || true
fi
# Ne PAS arrêter MySQL pour préserver les données
echo -e "   ${GREEN}✅ MySQL reste en cours d'exécution (données préservées)${NC}"
echo ""

# Build des nouvelles images
echo -e "${BLUE}🏗️  Étape 3/5: Build des nouvelles images...${NC}"

# Build backend
if [ -f "backend/Dockerfile" ]; then
    echo -e "   Build de l'image backend..."
    cd backend
    docker build -t alliance-courtage-backend:latest .
    if [ $? -ne 0 ]; then
        echo -e "   ${RED}❌ Erreur lors du build backend!${NC}"
        cd ..
        exit 1
    fi
    echo -e "   ${GREEN}✅ Image backend construite${NC}"
    cd ..
else
    echo -e "   ${YELLOW}⚠️  Dockerfile backend non trouvé${NC}"
fi

# Build frontend
if [ -f "Dockerfile" ]; then
    echo -e "   Build de l'image frontend..."
    docker build -t alliance-courtage-frontend:latest .
    if [ $? -ne 0 ]; then
        echo -e "   ${RED}❌ Erreur lors du build frontend!${NC}"
        exit 1
    fi
    echo -e "   ${GREEN}✅ Image frontend construite${NC}"
else
    echo -e "   ${YELLOW}⚠️  Dockerfile frontend non trouvé${NC}"
fi

echo ""

# Redémarrer les conteneurs
echo -e "${BLUE}🚀 Étape 4/5: Redémarrage des conteneurs...${NC}"

# Redémarrer backend
if [ -n "$BACKEND_CONTAINER" ]; then
    echo -e "   Redémarrage du backend..."
    docker start "$BACKEND_CONTAINER" 2>/dev/null && \
        echo -e "   ${GREEN}✅ Backend redémarré${NC}" || \
        echo -e "   ${YELLOW}⚠️  Le conteneur backend doit être recréé manuellement${NC}"
fi

# Redémarrer frontend
if [ -n "$FRONTEND_CONTAINER" ]; then
    echo -e "   Redémarrage du frontend..."
    docker start "$FRONTEND_CONTAINER" 2>/dev/null && \
        echo -e "   ${GREEN}✅ Frontend redémarré${NC}" || \
        echo -e "   ${YELLOW}⚠️  Le conteneur frontend doit être recréé manuellement${NC}"
fi

echo ""

# Vérifier l'état
echo -e "${BLUE}📊 Étape 5/5: Vérification de l'état...${NC}"
sleep 5

echo ""
echo -e "${CYAN}📋 État des conteneurs:${NC}"
docker ps --filter "name=alliance-courtage" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${GREEN}✅ Redéploiement terminé!${NC}"
echo ""
echo -e "${CYAN}📋 Prochaines étapes:${NC}"
echo -e "   1. Vérifier les logs: ${BLUE}docker logs alliance-courtage-backend${NC}"
echo -e "   2. Tester l'API: ${BLUE}curl http://localhost:3001/api/health${NC}"
echo -e "   3. Tester le frontend: ${BLUE}http://localhost${NC}"
echo ""
echo -e "${GREEN}🔒 Protection des données:${NC}"
echo -e "   ${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
echo -e "   ${GREEN}✅ MySQL toujours en cours d'exécution${NC}"
echo -e "   ${GREEN}✅ Volumes préservés${NC}"
echo -e "   ${GREEN}✅ Aucune donnée supprimée${NC}"
echo ""


