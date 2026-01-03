#!/bin/bash

# Script pour corriger et redéployer le backend
# Ce script force la mise à jour du code et rebuild sans cache

set -e

echo "🔧 Correction et redéploiement du backend..."

# Aller dans le dossier backend
cd "$(dirname "$0")"

# 1. Pull les dernières modifications
echo "📥 Récupération des dernières modifications..."
git pull origin deploy-new-version || git pull origin main

# 2. Vérifier la syntaxe du fichier cms.js
echo "✅ Vérification de la syntaxe..."
if ! node -c routes/cms.js; then
  echo "❌ Erreur de syntaxe dans routes/cms.js"
  exit 1
fi

# 3. Trouver le conteneur MySQL et son réseau
MYSQL_CONTAINER=$(docker ps --filter "ancestor=mysql:8.0" --format "{{.Names}}" | head -1)
if [ -z "$MYSQL_CONTAINER" ]; then
  echo "❌ Conteneur MySQL non trouvé"
  exit 1
fi

echo "📦 Conteneur MySQL trouvé: $MYSQL_CONTAINER"

MYSQL_NETWORK=$(docker inspect "$MYSQL_CONTAINER" --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)

if [ -z "$MYSQL_NETWORK" ]; then
  MYSQL_NETWORK="backend_alliance-network"
  echo "🔗 Création du réseau: $MYSQL_NETWORK"
  docker network create "$MYSQL_NETWORK" 2>/dev/null || true
  docker network connect "$MYSQL_NETWORK" "$MYSQL_CONTAINER" 2>/dev/null || true
fi

echo "🌐 Réseau MySQL: $MYSQL_NETWORK"

# 4. Arrêter et supprimer l'ancien conteneur backend
echo "🛑 Arrêt de l'ancien conteneur backend..."
docker stop alliance-courtage-backend 2>/dev/null || true
docker rm alliance-courtage-backend 2>/dev/null || true

# 5. Rebuild l'image sans cache pour forcer la mise à jour
echo "🔨 Rebuild de l'image backend (sans cache)..."
docker build --no-cache -t backend_backend:latest .

# 6. Redémarrer le backend
echo "🚀 Démarrage du nouveau conteneur backend..."
docker run -d \
  --name alliance-courtage-backend \
  --restart unless-stopped \
  --network "$MYSQL_NETWORK" \
  -p 3001:3001 \
  --env-file config.env \
  -e NODE_ENV=production \
  -e DB_HOST="$MYSQL_CONTAINER" \
  -e DB_PORT=3306 \
  -e DB_NAME=alliance_courtage \
  -e DB_USER=root \
  -e DB_PASSWORD=alliance2024Secure \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/config.env:/app/config.env:ro \
  backend_backend:latest

# 7. Attendre que le backend démarre
echo "⏳ Attente du démarrage du backend..."
sleep 15

# 8. Vérifier les logs
echo "📋 Derniers logs du backend:"
docker logs alliance-courtage-backend --tail 30

# 9. Tester l'API
echo ""
echo "🧪 Test de l'API backend..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
  echo "✅ Backend démarré avec succès!"
  curl http://localhost:3001/api/health
else
  echo "❌ Le backend ne répond pas. Vérifiez les logs ci-dessus."
  exit 1
fi

echo ""
echo "✅ Déploiement terminé!"

