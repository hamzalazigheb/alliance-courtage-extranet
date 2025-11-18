#!/bin/bash

# Script pour gérer les conflits Git et builder le frontend

set -e

echo "🔧 Gestion des conflits Git et build du frontend..."
echo ""

cd ~/alliance/alliance

# 1. Sauvegarder les changements locaux
echo "💾 Sauvegarde des changements locaux..."
git stash

# 2. Pull des modifications
echo "📥 Mise à jour depuis GitHub..."
git pull origin main

# 3. Appliquer les changements locaux si nécessaire
echo "🔄 Application des changements locaux..."
git stash pop || echo "Aucun changement local à appliquer"

# 4. Choisir la méthode de build
echo ""
echo "Choisissez la méthode de build :"
echo "1) Build dans Docker (recommandé - pas besoin de npm)"
echo "2) Build sur le serveur (nécessite npm)"
read -p "Votre choix (1 ou 2) : " choice

if [ "$choice" = "1" ]; then
    echo ""
    echo "🚀 Build dans Docker..."
    chmod +x build-frontend-docker.sh
    ./build-frontend-docker.sh
elif [ "$choice" = "2" ]; then
    echo ""
    echo "🚀 Build sur le serveur..."
    chmod +x build-frontend-on-server.sh
    ./build-frontend-on-server.sh
else
    echo "❌ Choix invalide"
    exit 1
fi

