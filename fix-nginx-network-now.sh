#!/bin/bash
# Script pour corriger le problème de réseau nginx

echo "🔧 Correction du réseau nginx..."
echo ""

# 1. Trouver le réseau du backend
echo "1️⃣ Recherche du réseau du backend..."
BACKEND_NETWORK=$(docker inspect alliance-courtage-backend --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)

if [ -z "$BACKEND_NETWORK" ]; then
    echo "❌ Impossible de trouver le réseau du backend"
    echo "Tentative avec 'alliance-network'..."
    BACKEND_NETWORK="alliance-network"
fi

echo "Réseau trouvé: $BACKEND_NETWORK"
echo ""

# 2. Arrêter et supprimer le conteneur frontend
echo "2️⃣ Arrêt du conteneur frontend..."
docker stop alliance-courtage-extranet 2>/dev/null
docker rm alliance-courtage-extranet 2>/dev/null

# 3. Redémarrer sur le même réseau
echo "3️⃣ Démarrage du conteneur sur le réseau $BACKEND_NETWORK..."
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  --network "$BACKEND_NETWORK" \
  -p 80:80 \
  alliance-courtage-frontend:latest

# 4. Attendre un peu
sleep 3

# 5. Vérifier
echo ""
echo "4️⃣ Vérification..."
if docker ps | grep -q "alliance-courtage-extranet"; then
    echo "✅ Conteneur démarré avec succès!"
    echo ""
    echo "📋 Statut:"
    docker ps | grep alliance-courtage-extranet
    echo ""
    echo "📋 Logs (dernières 10 lignes):"
    docker logs alliance-courtage-extranet --tail 10
else
    echo "❌ Le conteneur ne démarre toujours pas"
    echo ""
    echo "📋 Logs d'erreur:"
    docker logs alliance-courtage-extranet --tail 20
fi

