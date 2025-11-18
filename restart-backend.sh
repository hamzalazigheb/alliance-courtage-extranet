#!/bin/bash

# Script pour redémarrer le backend après un git pull
# Usage: ./restart-backend.sh

echo "🔄 Redémarrage du backend Alliance Courtage"
echo "==========================================="
echo ""

# Vérifier que le container existe
if ! docker ps --format "{{.Names}}" | grep -q "alliance-courtage-backend"; then
    echo "❌ Container 'alliance-courtage-backend' non trouvé!"
    echo ""
    echo "Conteneurs disponibles:"
    docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi

echo "✅ Container trouvé: alliance-courtage-backend"
echo ""

# Redémarrer le container
echo "🔄 Redémarrage du backend..."
docker restart alliance-courtage-backend

if [ $? -eq 0 ]; then
    echo "✅ Backend redémarré avec succès!"
    echo ""
    echo "⏳ Attente du démarrage (5 secondes)..."
    sleep 5
    echo ""
    echo "📋 Derniers logs du backend:"
    echo "============================"
    docker logs alliance-courtage-backend --tail 20
    echo ""
    echo "✅ Terminé!"
    echo ""
    echo "💡 Pour voir les logs en temps réel:"
    echo "   docker logs -f alliance-courtage-backend"
else
    echo "❌ Erreur lors du redémarrage!"
    exit 1
fi

