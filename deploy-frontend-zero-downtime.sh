#!/bin/bash
# Script de déploiement frontend sans downtime

set -e

echo "🚀 Déploiement frontend sans downtime..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="$HOME/prod"
CONTAINER_NAME="alliance-courtage-extranet"
TEST_CONTAINER_NAME="${CONTAINER_NAME}-test"
IMAGE_NAME="alliance-courtage-frontend:latest"
TEST_PORT=8080
PROD_PORT=80

cd "$PROJECT_DIR"

# 1. Pull les changements
echo -e "${BLUE}📥 Récupération des changements...${NC}"
git pull origin deploy-new-version
echo -e "${GREEN}✅ Code à jour${NC}"
echo ""

# 2. Build la nouvelle image
echo -e "${BLUE}🔨 Build de la nouvelle image frontend...${NC}"
docker build -t "$IMAGE_NAME" .
echo -e "${GREEN}✅ Image buildée${NC}"
echo ""

# 3. Tester le nouveau conteneur sur port temporaire
echo -e "${BLUE}🧪 Test du nouveau frontend sur port $TEST_PORT...${NC}"
docker stop "$TEST_CONTAINER_NAME" 2>/dev/null || true
docker rm "$TEST_CONTAINER_NAME" 2>/dev/null || true

docker run -d \
  -p $TEST_PORT:80 \
  --name "$TEST_CONTAINER_NAME" \
  --network backend_alliance-network \
  "$IMAGE_NAME"

# Attendre le démarrage
sleep 5

# Tester le nouveau conteneur
if curl -f http://localhost:$TEST_PORT > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Nouveau frontend fonctionne correctement${NC}"
  echo ""
  
  # 4. Basculer vers le nouveau (downtime minimal < 1 seconde)
  echo -e "${BLUE}🔄 Basculer vers le nouveau frontend...${NC}"
  
  # Arrêter l'ancien conteneur
  if docker ps | grep -q "$CONTAINER_NAME"; then
    docker stop "$CONTAINER_NAME"
    docker rm "$CONTAINER_NAME"
    echo "   Ancien conteneur arrêté"
  fi
  
  # Arrêter le conteneur de test
  docker stop "$TEST_CONTAINER_NAME"
  docker rm "$TEST_CONTAINER_NAME"
  
  # Démarrer le nouveau conteneur sur le port de production
  docker run -d \
    -p $PROD_PORT:80 \
    --name "$CONTAINER_NAME" \
    --restart unless-stopped \
    --network backend_alliance-network \
    "$IMAGE_NAME"
  
  echo -e "${GREEN}✅ Nouveau conteneur démarré sur port $PROD_PORT${NC}"
  echo ""
  
  # 5. Vérification finale
  echo -e "${BLUE}📊 Vérification finale...${NC}"
  sleep 3
  
  if curl -f http://localhost:$PROD_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend accessible sur port $PROD_PORT${NC}"
    echo ""
    echo -e "${GREEN}✅ Déploiement terminé sans downtime!${NC}"
    echo ""
    echo "📋 Statut des conteneurs:"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAMES|$CONTAINER_NAME" || docker ps | grep "$CONTAINER_NAME"
  else
    echo -e "${RED}❌ Erreur: Frontend non accessible après déploiement${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ Le nouveau frontend ne fonctionne pas correctement${NC}"
  echo -e "${YELLOW}⚠️  Annulation du déploiement, l'ancien conteneur reste actif${NC}"
  docker stop "$TEST_CONTAINER_NAME" 2>/dev/null || true
  docker rm "$TEST_CONTAINER_NAME" 2>/dev/null || true
  exit 1
fi

