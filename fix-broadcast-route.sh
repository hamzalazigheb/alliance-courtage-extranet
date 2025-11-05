#!/bin/bash
# Script de diagnostic et correction pour la route /api/notifications/broadcast

set -e

echo "🔍 Diagnostic de la route /api/notifications/broadcast"
echo ""

cd /var/www/alliance-courtage

# 1. Vérifier que le code est à jour
echo "1️⃣ Vérification du code Git..."
git pull origin main
echo "✅ Code à jour"
echo ""

# 2. Vérifier que la route existe dans le fichier local
echo "2️⃣ Vérification que la route existe dans le fichier..."
if grep -q "router.post('/broadcast'" backend/routes/notifications.js; then
    echo "✅ Route trouvée dans le fichier local"
else
    echo "❌ Route NON trouvée dans le fichier local"
    exit 1
fi
echo ""

# 3. Vérifier que le fichier existe dans le conteneur
echo "3️⃣ Vérification du fichier dans le conteneur..."
if docker exec alliance-courtage-backend test -f /app/routes/notifications.js; then
    echo "✅ Fichier existe dans le conteneur"
    
    # Vérifier si la route existe dans le conteneur
    if docker exec alliance-courtage-backend grep -q "router.post('/broadcast'" /app/routes/notifications.js; then
        echo "✅ Route trouvée dans le conteneur"
    else
        echo "⚠️ Route NON trouvée dans le conteneur - Copie du fichier..."
        docker cp backend/routes/notifications.js alliance-courtage-backend:/app/routes/notifications.js
        echo "✅ Fichier copié"
    fi
else
    echo "❌ Fichier n'existe pas dans le conteneur"
    echo "Copie du fichier..."
    docker cp backend/routes/notifications.js alliance-courtage-backend:/app/routes/notifications.js
    echo "✅ Fichier copié"
fi
echo ""

# 4. Vérifier la syntaxe du fichier
echo "4️⃣ Vérification de la syntaxe..."
if docker exec alliance-courtage-backend node -c /app/routes/notifications.js 2>&1; then
    echo "✅ Syntaxe correcte"
else
    echo "❌ Erreur de syntaxe détectée"
    docker exec alliance-courtage-backend node -c /app/routes/notifications.js
    exit 1
fi
echo ""

# 5. Rebuild du backend
echo "5️⃣ Rebuild du backend..."
cd backend
docker stop alliance-courtage-backend || true
docker compose build --no-cache backend
docker start alliance-courtage-backend
echo "✅ Backend rebuild et redémarré"
echo ""

# 6. Attendre que le backend démarre
echo "6️⃣ Attente du démarrage du backend..."
sleep 10

# 7. Vérifier les logs
echo "7️⃣ Vérification des logs..."
docker logs alliance-courtage-backend --tail 30
echo ""

# 8. Vérifier que le backend répond
echo "8️⃣ Test de l'API..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend répond correctement"
else
    echo "❌ Backend ne répond pas"
    exit 1
fi
echo ""

# 9. Vérification finale de la route dans le conteneur
echo "9️⃣ Vérification finale..."
if docker exec alliance-courtage-backend grep -q "router.post('/broadcast'" /app/routes/notifications.js; then
    echo "✅ Route confirmée dans le conteneur"
else
    echo "❌ Route toujours absente - Vérification manuelle nécessaire"
    exit 1
fi
echo ""

echo "✅ Diagnostic terminé avec succès!"
echo ""
echo "📝 Pour tester la route:"
echo "curl -X POST \\"
echo "  -H \"x-auth-token: YOUR_TOKEN\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"title\":\"Test\",\"message\":\"Test message\",\"type\":\"info\"}' \\"
echo "  http://localhost:3001/api/notifications/broadcast"

