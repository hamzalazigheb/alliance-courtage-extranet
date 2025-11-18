#!/bin/bash

# Script de déploiement pour la configuration actuelle
# Frontend avec nginx dans alliance-courtage-extranet
# Backend dans alliance-courtage-backend

set -e

echo "🚀 Déploiement des corrections de cache..."

cd ~/alliance/alliance

# 1. Copier la configuration nginx dans le conteneur frontend
echo "📝 Mise à jour de la configuration nginx..."
docker cp nginx-production.conf alliance-courtage-extranet:/etc/nginx/conf.d/default.conf

# 2. Tester la configuration nginx
echo "✅ Test de la configuration nginx..."
docker exec alliance-courtage-extranet nginx -t

# 3. Recharger nginx
echo "🔄 Rechargement de nginx..."
docker exec alliance-courtage-extranet nginx -s reload

# 4. Redémarrer le backend (pour appliquer les changements dans src/api.js)
echo "🔄 Redémarrage du backend..."
docker restart alliance-courtage-backend

# 5. Attendre que le backend soit prêt
echo "⏳ Attente du démarrage du backend..."
sleep 5

# 6. Vérifier les logs
echo "📋 Vérification des logs..."
echo "--- Backend logs (dernières 10 lignes) ---"
docker logs alliance-courtage-backend --tail 10

echo ""
echo "--- Nginx logs (dernières 10 lignes) ---"
docker logs alliance-courtage-extranet --tail 10

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📝 Prochaines étapes :"
echo "   1. Vider le cache du navigateur (Ctrl+Shift+R)"
echo "   2. Tester l'API : curl http://localhost/api/archives"
echo "   3. Vérifier dans le navigateur que les erreurs ont disparu"

