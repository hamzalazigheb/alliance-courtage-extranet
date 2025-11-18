#!/bin/bash

# Script pour rebuild et redémarrer le backend après un git pull
# Usage: ./rebuild-backend.sh

echo "🔄 Rebuild et redémarrage du backend Alliance Courtage"
echo "======================================================"
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ -f "backend/docker-compose.yml" ]; then
    cd backend
elif [ ! -f "docker-compose.yml" ]; then
    echo "❌ docker-compose.yml non trouvé!"
    echo "💡 Assurez-vous d'être dans le dossier racine ou backend/"
    exit 1
fi

# Vérifier que le container existe
if ! docker ps -a --format "{{.Names}}" | grep -q "alliance-courtage-backend"; then
    echo "❌ Container 'alliance-courtage-backend' non trouvé!"
    echo ""
    echo "Conteneurs disponibles:"
    docker ps -a --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi

echo "✅ Container trouvé: alliance-courtage-backend"
echo ""

# Arrêter le backend
echo "🛑 Arrêt du backend..."
docker stop alliance-courtage-backend 2>/dev/null || true
echo "✅ Backend arrêté"
echo ""

# Rebuild l'image backend
echo "🏗️  Build de la nouvelle image backend..."
if command -v docker-compose &> /dev/null; then
    docker-compose build backend
elif command -v docker &> /dev/null; then
    docker compose build backend
else
    echo "❌ docker-compose ou docker non trouvé!"
    exit 1
fi

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du build!"
    exit 1
fi
echo "✅ Image backend construite"
echo ""

# Redémarrer le backend
echo "🚀 Redémarrage du backend..."
if command -v docker-compose &> /dev/null; then
    docker-compose up -d backend
elif command -v docker &> /dev/null; then
    docker compose up -d backend
fi

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors du redémarrage!"
    exit 1
fi
echo "✅ Backend redémarré"
echo ""

# Attendre quelques secondes
echo "⏳ Attente du démarrage (5 secondes)..."
sleep 5
echo ""

# Vérifier les logs
echo "📋 Derniers logs du backend:"
echo "============================"
docker logs alliance-courtage-backend --tail 30

echo ""
echo "✅ Rebuild et redémarrage terminés!"
echo ""
echo "💡 Pour voir les logs en temps réel:"
echo "   docker logs -f alliance-courtage-backend"
echo ""

