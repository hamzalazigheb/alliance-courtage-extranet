#!/bin/bash

# Script pour builder le frontend dans un conteneur Docker
# Solution alternative si Node.js n'est pas installé sur le serveur

set -e

echo "🚀 Build du frontend dans un conteneur Docker..."
echo ""

cd ~/alliance/alliance

# 1. Vérifier que le code est à jour
echo "📥 Mise à jour du code depuis GitHub..."
git pull origin main

# 2. Créer un Dockerfile temporaire pour le build
cat > Dockerfile.build << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers package
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build
RUN npm run build

# Le dossier dist/ sera disponible dans le conteneur
EOF

# 3. Builder l'image
echo ""
echo "🔨 Build de l'image Docker..."
docker build -f Dockerfile.build -t alliance-frontend-builder .

# 4. Créer un conteneur temporaire et copier dist/
echo ""
echo "📦 Extraction du dossier dist/..."
docker create --name temp-builder alliance-frontend-builder
docker cp temp-builder:/app/dist ./dist
docker rm temp-builder

# 5. Nettoyer
docker rmi alliance-frontend-builder
rm Dockerfile.build

# 6. Vérifier
if [ ! -d "dist" ]; then
    echo "❌ Erreur: Le dossier dist/ n'a pas été créé"
    exit 1
fi

echo "✅ Build terminé"
echo "📁 Fichiers créés:"
ls -lh dist/ | head -10

# 7. Copier dans le conteneur frontend
echo ""
echo "🐳 Copie dans le conteneur frontend..."
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/

# 8. Redémarrer
echo "🔄 Redémarrage du conteneur..."
docker restart alliance-courtage-extranet

# 9. Vérifier
sleep 5
echo ""
echo "📊 État du conteneur:"
docker ps | grep alliance-courtage-extranet

echo ""
echo "✅ Frontend déployé avec succès !"
echo "📝 Videz le cache du navigateur (Ctrl+Shift+R) pour voir les changements"

