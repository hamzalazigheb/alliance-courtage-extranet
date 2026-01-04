#!/bin/bash

# Script de déploiement frontend avec force reload
# Force le rebuild et évite les problèmes de cache

set -e

echo "🚀 Déploiement frontend avec force reload..."

# 1. Pull latest code
echo "📥 Récupération du code..."
cd ~/prod
git pull origin deploy-new-version

# 2. Build avec timestamp pour forcer le rechargement
echo "🔨 Build du frontend..."
docker build --no-cache -t alliance-courtage-frontend:new --build-arg BUILD_DATE=$(date +%s) .

# 3. Arrêter l'ancien container
echo "🛑 Arrêt de l'ancien container..."
docker stop alliance-courtage-extranet 2>/dev/null || true
docker rm alliance-courtage-extranet 2>/dev/null || true

# 4. Démarrer le nouveau container
echo "▶️ Démarrage du nouveau container..."
docker run -d -p 80:80 \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  --network backend_alliance-network \
  alliance-courtage-frontend:new

# 5. Tagger comme latest
docker tag alliance-courtage-frontend:new alliance-courtage-frontend:latest

# 6. Attendre que le container soit prêt
echo "⏳ Attente du démarrage..."
sleep 5

# 7. Vérifier le statut
echo "✅ Vérification du déploiement..."
if docker ps | grep -q alliance-courtage-extranet; then
    echo "✅ Container démarré avec succès!"
    echo "🌐 Test de l'application..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Application accessible (HTTP $HTTP_CODE)"
    else
        echo "⚠️ Application retourne HTTP $HTTP_CODE"
    fi
else
    echo "❌ Erreur: Container non démarré"
    docker logs alliance-courtage-extranet --tail 50
    exit 1
fi

echo ""
echo "🎉 Déploiement terminé!"
echo "💡 Pour forcer le rechargement dans le navigateur:"
echo "   - Chrome/Edge: Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)"
echo "   - Firefox: Ctrl+F5 (Windows) ou Cmd+Shift+R (Mac)"
echo "   - Ou vider le cache: Ctrl+Shift+Delete"

