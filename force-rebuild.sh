#!/bin/bash
# Script pour forcer un rebuild complet sans cache

echo "🔄 Rebuild complet sans cache..."
echo ""

cd ~/alliance/alliance

# 1. S'assurer que le code est à jour
echo "📥 Pull des derniers changements..."
git pull origin main

# 2. Arrêter et supprimer le conteneur
echo "🛑 Arrêt du conteneur..."
docker stop alliance-courtage-extranet 2>/dev/null
docker rm alliance-courtage-extranet 2>/dev/null

# 3. Rebuild SANS cache pour forcer la reconstruction
echo "🔨 Build sans cache..."
docker build --no-cache -t alliance-courtage-frontend:latest .

# 4. Démarrer le nouveau conteneur
echo "🚀 Démarrage du conteneur..."
docker run -d -p 80:80 --name alliance-courtage-extranet alliance-courtage-frontend:latest

# 5. Vérifier
echo "✅ Vérification..."
sleep 2
if docker ps | grep -q "alliance-courtage-extranet"; then
    echo "✅ Conteneur démarré avec succès"
    
    # Vérifier que les nouvelles fonctions sont présentes
    if docker exec alliance-courtage-extranet grep -q "handleDeleteBordereau" /usr/share/nginx/html/assets/*.js 2>/dev/null; then
        echo "✅ Nouvelles fonctionnalités déployées!"
    else
        echo "⚠️  Vérifiez manuellement dans le navigateur"
    fi
else
    echo "❌ Erreur lors du démarrage"
    docker logs alliance-courtage-extranet
fi

echo ""
echo "✅ Terminé! Testez maintenant dans le navigateur."

