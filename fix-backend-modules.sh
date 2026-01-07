#!/bin/bash

# Script pour réparer le backend après une copie corrompue
# Usage: ./fix-backend-modules.sh [test|prod]

set -e

ENV=${1:-test}

if [ "$ENV" = "test" ]; then
  REMOTE_HOST="13.38.115.36"
  REMOTE_USER="ubuntu"
  REMOTE_DIR="~/alliance/alliance"
  CONTAINER_BACKEND="alliance-courtage-backend"
elif [ "$ENV" = "prod" ]; then
  REMOTE_HOST="ip-172-31-0-149"
  REMOTE_USER="ubuntu"
  REMOTE_DIR="~/prod"
  CONTAINER_BACKEND="alliance-courtage-backend"
else
  echo "❌ Usage: $0 [test|prod]"
  exit 1
fi

echo "🔧 Réparation du backend sur $ENV..."
echo "📡 Connexion à $REMOTE_USER@$REMOTE_HOST..."

# 1. Vérifier l'état du conteneur
echo ""
echo "📊 Vérification de l'état du conteneur..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker ps -a | grep ${CONTAINER_BACKEND} || echo 'Conteneur non trouvé'"

# 2. Arrêter le conteneur s'il est en cours d'exécution
echo ""
echo "🛑 Arrêt du conteneur..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker stop ${CONTAINER_BACKEND} 2>/dev/null || true"

# 3. Réinstaller les dépendances dans le conteneur
echo ""
echo "📦 Réinstallation des dépendances dans le conteneur..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker start ${CONTAINER_BACKEND} 2>/dev/null || docker run -d --name ${CONTAINER_BACKEND}_temp node:18-alpine sleep 3600 && docker cp ${REMOTE_DIR}/backend/package.json ${CONTAINER_BACKEND}_temp:/app/ && docker exec ${CONTAINER_BACKEND}_temp sh -c 'cd /app && npm install --production' && docker cp ${CONTAINER_BACKEND}_temp:/app/node_modules ${CONTAINER_BACKEND}:/app/ && docker rm -f ${CONTAINER_BACKEND}_temp"

# Solution alternative : réinstaller directement dans le conteneur existant
echo ""
echo "🔧 Réinstallation des dépendances (méthode alternative)..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
  # Copier package.json dans le conteneur
  docker cp ~/alliance/alliance/backend/package.json alliance-courtage-backend:/app/package.json 2>/dev/null || docker cp ~/prod/backend/package.json alliance-courtage-backend:/app/package.json 2>/dev/null || echo "Erreur copie package.json"
  
  # Réinstaller les dépendances
  docker exec alliance-courtage-backend sh -c "cd /app && rm -rf node_modules && npm install --production" || echo "Erreur installation dépendances"
ENDSSH

# 4. Redémarrer le backend
echo ""
echo "🚀 Redémarrage du backend..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker restart ${CONTAINER_BACKEND}"

# 5. Attendre le démarrage
echo ""
echo "⏳ Attente du démarrage..."
sleep 20

# 6. Vérifier les logs
echo ""
echo "📋 Logs du backend:"
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker logs ${CONTAINER_BACKEND} --tail 30"

# 7. Tester l'API
echo ""
echo "🧪 Test de l'API..."
ssh ${REMOTE_USER}@${REMOTE_HOST} "curl -s http://localhost:3001/api/health || echo '❌ API non accessible'"

echo ""
echo "✅ Réparation terminée!"

