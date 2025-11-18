#!/bin/bash

# Script pour builder le frontend directement sur le serveur
# Pas besoin de copier-coller depuis votre machine Windows

set -e

echo "🚀 Build du frontend directement sur le serveur..."
echo ""

cd ~/alliance/alliance

# 1. Vérifier que Node.js et npm sont disponibles
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js n'est pas installé, installation..."
    
    # Installer Node.js via le gestionnaire de paquets Ubuntu
    sudo apt-get update
    sudo apt-get install -y nodejs
    
    # Si ça ne fonctionne pas, essayer avec NodeSource
    if ! command -v node &> /dev/null; then
        echo "⚠️  Tentative d'installation via NodeSource..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - || true
        sudo apt-get install -y nodejs || true
    fi
fi

if ! command -v npm &> /dev/null; then
    echo "⚠️  npm n'est pas installé, installation..."
    sudo apt-get install -y npm
    
    # Si npm n'est toujours pas disponible, l'installer via Node.js
    if ! command -v npm &> /dev/null; then
        echo "⚠️  Installation de npm via corepack..."
        sudo corepack enable || true
        sudo corepack prepare npm@latest --activate || true
    fi
    
    # Vérifier à nouveau
    if ! command -v npm &> /dev/null; then
        echo "❌ Impossible d'installer npm automatiquement"
        echo "💡 Essayez manuellement: sudo apt-get install -y npm"
        exit 1
    fi
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# 2. Vérifier que le code est à jour
echo ""
echo "📥 Mise à jour du code depuis GitHub..."
git pull origin main

# 3. Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installation des dépendances..."
    npm install
else
    echo "✅ Dépendances déjà installées"
fi

# 4. Build du frontend
echo ""
echo "🔨 Build du frontend..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Erreur: Le dossier dist/ n'a pas été créé"
    exit 1
fi

echo "✅ Build terminé"
echo "📁 Fichiers créés:"
ls -lh dist/ | head -10

# 5. Copier dans le conteneur Docker
echo ""
echo "🐳 Copie dans le conteneur Docker..."
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/

# 6. Vérifier dans le conteneur
echo "✅ Vérification dans le conteneur:"
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/assets/ | head -5

# 7. Redémarrer le conteneur
echo ""
echo "🔄 Redémarrage du conteneur..."
docker restart alliance-courtage-extranet

# 8. Attendre et vérifier
sleep 5
echo ""
echo "📊 État du conteneur:"
docker ps | grep alliance-courtage-extranet

echo ""
echo "✅ Frontend déployé avec succès !"
echo "📝 Videz le cache du navigateur (Ctrl+Shift+R) pour voir les changements"

