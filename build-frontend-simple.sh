#!/bin/bash

# Script simplifié pour builder le frontend - Version robuste

set -e

echo "🚀 Build du frontend - Version simplifiée..."
echo ""

cd ~/alliance/alliance

# 1. Résoudre les conflits Git
echo "📥 Gestion Git..."
git stash 2>/dev/null || true
git pull origin main || {
    echo "⚠️  Erreur git pull, continuons quand même..."
}

# 2. Vérifier que le code est là
if [ ! -f "package.json" ]; then
    echo "❌ package.json non trouvé. Vérifiez que vous êtes dans le bon dossier."
    exit 1
fi

# 3. Builder avec Docker
echo ""
echo "🐳 Build dans un conteneur Docker..."

# Créer un Dockerfile temporaire
cat > /tmp/Dockerfile.build << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copier package.json d'abord (pour le cache Docker)
COPY package*.json ./

# Installer les dépendances
RUN npm ci --silent

# Copier tout le reste
COPY . .

# Build
RUN npm run build

# Le dist/ sera dans /app/dist
EOF

# Builder l'image
echo "📦 Création de l'image Docker..."
docker build -f /tmp/Dockerfile.build -t alliance-frontend-builder:temp . 2>&1 | tail -20

# Créer un conteneur temporaire et extraire dist/
echo ""
echo "📤 Extraction du dossier dist/..."
CONTAINER_ID=$(docker create alliance-frontend-builder:temp)
docker cp ${CONTAINER_ID}:/app/dist ./dist-new 2>&1
docker rm ${CONTAINER_ID} >/dev/null 2>&1

# Vérifier que dist-new existe
if [ ! -d "dist-new" ] || [ -z "$(ls -A dist-new 2>/dev/null)" ]; then
    echo "❌ Erreur: Le dossier dist-new est vide ou n'existe pas"
    echo "📋 Logs du build:"
    docker build -f /tmp/Dockerfile.build -t alliance-frontend-builder:temp . 2>&1 | tail -30
    rm -f /tmp/Dockerfile.build
    exit 1
fi

# Remplacer l'ancien dist par le nouveau
echo "🔄 Remplacement de l'ancien dist/..."
rm -rf dist
mv dist-new dist

# Nettoyer
echo "🧹 Nettoyage..."
docker rmi alliance-frontend-builder:temp >/dev/null 2>&1 || true
rm -f /tmp/Dockerfile.build

echo "✅ Build terminé"
echo "📁 Fichiers créés:"
ls -lh dist/ | head -10

# 4. Copier dans le conteneur frontend
echo ""
echo "🐳 Copie dans le conteneur frontend..."
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/ 2>&1

# 5. Vérifier dans le conteneur
echo "✅ Vérification dans le conteneur:"
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/assets/ 2>/dev/null | head -5 || echo "⚠️  Impossible de vérifier"

# 6. Redémarrer
echo ""
echo "🔄 Redémarrage du conteneur..."
docker restart alliance-courtage-extranet

# 7. Attendre et vérifier
sleep 5
echo ""
echo "📊 État du conteneur:"
docker ps | grep alliance-courtage-extranet || docker ps -a | grep alliance-courtage-extranet

echo ""
echo "✅ Frontend déployé !"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Videz le cache du navigateur (Ctrl+Shift+R)"
echo "   2. Rechargez la page"
echo "   3. Vérifiez que l'icône ✏️ apparaît à côté des catégories"

