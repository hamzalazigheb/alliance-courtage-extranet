#!/bin/bash

# Script bash pour déployer le frontend vers le serveur
# Usage: ./deploy-frontend-to-server.sh

SERVER_IP="13.38.115.36"
SERVER_USER="ubuntu"
SERVER_PATH="~/alliance/alliance"

echo "🚀 Déploiement du frontend vers le serveur..."

# 1. Build du frontend
echo "📦 Build du frontend..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Erreur: Le dossier dist/ n'existe pas après le build"
    exit 1
fi

echo "✅ Build terminé"

# 2. Copier vers le serveur
echo "📤 Copie des fichiers vers le serveur..."

# Créer le dossier dist sur le serveur
ssh "${SERVER_USER}@${SERVER_IP}" "mkdir -p ${SERVER_PATH}/dist"

# Copier les fichiers
scp -r dist/* "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}/dist/"

if [ $? -eq 0 ]; then
    echo "✅ Fichiers copiés vers le serveur"
else
    echo "❌ Erreur lors de la copie"
    exit 1
fi

# 3. Copier dans le conteneur Docker
echo "🐳 Copie dans le conteneur Docker..."

ssh "${SERVER_USER}@${SERVER_IP}" << 'ENDSSH'
cd ~/alliance/alliance
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/
docker restart alliance-courtage-extranet
echo "✅ Frontend déployé dans le conteneur"
ENDSSH

echo ""
echo "✅ Déploiement terminé !"
echo "📝 Videz le cache de votre navigateur (Ctrl+Shift+R) pour voir les changements"

