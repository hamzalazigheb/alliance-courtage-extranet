#!/bin/bash

# Script simple pour redéployer uniquement le backend
# Usage: ./redeployBackend.sh

set -e

echo "🔄 Redéploiement du backend Alliance Courtage"
echo "=============================================="
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml non trouvé!"
    echo "💡 Assurez-vous d'être dans le dossier backend/"
    exit 1
fi

echo "✅ docker-compose.yml trouvé"
echo ""

# Arrêter le backend
echo "🛑 Arrêt du backend..."
docker-compose stop backend 2>/dev/null || docker stop alliance-courtage-backend 2>/dev/null || true
echo "✅ Backend arrêté"
echo ""

# Rebuild l'image backend
echo "🏗️  Build de la nouvelle image backend..."
docker-compose build backend
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build!"
    exit 1
fi
echo "✅ Image backend construite"
echo ""

# Redémarrer le backend
echo "🚀 Redémarrage du backend..."
docker-compose up -d backend
if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du redémarrage!"
    exit 1
fi
echo "✅ Backend redémarré"
echo ""

# Attendre quelques secondes
echo "⏳ Attente du démarrage..."
sleep 5

# Vérifier les logs
echo "📋 Derniers logs du backend:"
echo "============================"
docker logs alliance-courtage-backend --tail 20

echo ""
echo "✅ Redéploiement terminé!"
echo ""
echo "💡 Pour voir les logs en temps réel:"
echo "   docker logs -f alliance-courtage-backend"
echo ""


