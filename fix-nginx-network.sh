#!/bin/bash

# Script pour corriger le problème de réseau Nginx
# Usage: ./fix-nginx-network.sh

set -e

echo "🔧 Correction du problème de réseau Nginx"
echo "=========================================="
echo ""

# Arrêter le frontend
echo "🛑 Arrêt du frontend..."
docker stop alliance-courtage-extranet 2>/dev/null || true
docker rm alliance-courtage-extranet 2>/dev/null || true
echo "✅ Frontend arrêté"
echo ""

# Trouver le réseau du backend
echo "🔍 Recherche du réseau du backend..."
BACKEND_NETWORK=$(docker inspect alliance-courtage-backend --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null | head -1)

if [ -z "$BACKEND_NETWORK" ]; then
    echo "⚠️  Aucun réseau trouvé pour le backend"
    echo "📦 Création du réseau alliance-network..."
    docker network create alliance-network 2>/dev/null || true
    BACKEND_NETWORK="alliance-network"
    
    # Connecter le backend au réseau
    echo "🔗 Connexion du backend au réseau..."
    docker network connect "$BACKEND_NETWORK" alliance-courtage-backend 2>/dev/null || true
else
    echo "✅ Réseau détecté: $BACKEND_NETWORK"
fi
echo ""

# Redémarrer le frontend sur le même réseau
echo "🚀 Démarrage du frontend sur le réseau $BACKEND_NETWORK..."
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  --network "$BACKEND_NETWORK" \
  -p 80:80 \
  alliance-courtage-frontend:latest

if [ $? -eq 0 ]; then
    echo "✅ Frontend démarré avec succès"
else
    echo "❌ Erreur lors du démarrage du frontend"
    exit 1
fi
echo ""

# Attendre quelques secondes
echo "⏳ Attente du démarrage..."
sleep 5

# Vérifier les logs
echo "📋 Vérification des logs:"
echo "========================"
docker logs alliance-courtage-extranet --tail 20

echo ""
echo "📊 État des conteneurs:"
echo "======================"
docker ps --filter "name=alliance-courtage" --format "table {{.Names}}\t{{.Status}}\t{{.Networks}}"

echo ""
# Vérifier si Nginx démarre correctement
if docker logs alliance-courtage-extranet 2>&1 | grep -q "host not found"; then
    echo "❌ Le problème persiste. Vérifiez que le backend est bien démarré."
    echo "💡 Essayez: docker ps | grep backend"
else
    echo "✅ Le frontend semble fonctionner correctement!"
fi
echo ""

