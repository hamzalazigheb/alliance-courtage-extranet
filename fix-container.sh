#!/bin/bash
# Script pour diagnostiquer et corriger le problème du conteneur

echo "🔍 Diagnostic du conteneur..."
echo ""

# Vérifier si le conteneur existe
if docker ps -a | grep -q "alliance-courtage-extranet"; then
    echo "📦 Conteneur trouvé"
    docker ps -a | grep alliance-courtage-extranet
    
    echo ""
    echo "📋 Logs du conteneur (dernières 50 lignes):"
    docker logs alliance-courtage-extranet --tail 50
    
    echo ""
    echo "🛑 Suppression du conteneur..."
    docker rm -f alliance-courtage-extranet
else
    echo "⚠️  Conteneur non trouvé"
fi

echo ""
echo "🚀 Redémarrage du conteneur..."
docker run -d -p 80:80 --name alliance-courtage-extranet alliance-courtage-frontend:latest

echo ""
echo "⏳ Attente de 3 secondes..."
sleep 3

echo ""
echo "✅ Vérification du statut:"
docker ps | grep alliance-courtage-extranet

if docker ps | grep -q "alliance-courtage-extranet"; then
    echo ""
    echo "✅ Conteneur démarré avec succès!"
    echo ""
    echo "🔍 Vérification des nouvelles fonctionnalités:"
    docker exec alliance-courtage-extranet grep -l "handleDeleteBordereau" /usr/share/nginx/html/assets/*.js 2>/dev/null && echo "✅ handleDeleteBordereau trouvé!" || echo "⚠️  handleDeleteBordereau non trouvé"
else
    echo ""
    echo "❌ Le conteneur ne démarre pas. Vérifiez les logs:"
    docker logs alliance-courtage-extranet
fi

