#!/bin/bash
# Script pour vérifier et forcer le déploiement si nécessaire

echo "🔍 Vérification du déploiement..."
echo ""

# 1. Vérifier que git pull a été fait
echo "1️⃣ Vérification Git..."
cd ~/alliance/alliance
LATEST_COMMIT=$(git log -1 --oneline)
echo "Dernier commit: $LATEST_COMMIT"

if echo "$LATEST_COMMIT" | grep -q "bordereaux\|suppression\|ouvrir"; then
    echo "✅ Commit récent trouvé"
else
    echo "⚠️  Faire git pull d'abord"
    git pull origin main
fi

echo ""

# 2. Vérifier que les fichiers modifiés sont présents
echo "2️⃣ Vérification des fichiers..."
if grep -q "handleDeleteBordereau" src/pages/GestionComptabilitePage.tsx; then
    echo "✅ Frontend: handleDeleteBordereau trouvé"
else
    echo "❌ Frontend: handleDeleteBordereau NON trouvé"
fi

if grep -q "has_file_content" backend/routes/bordereaux.js; then
    echo "✅ Backend: has_file_content trouvé"
else
    echo "❌ Backend: has_file_content NON trouvé"
fi

echo ""

# 3. Vérifier le conteneur
echo "3️⃣ Vérification du conteneur..."
if docker ps | grep -q "alliance-courtage-extranet"; then
    echo "✅ Conteneur frontend actif"
    CONTAINER_ID=$(docker ps | grep alliance-courtage-extranet | awk '{print $1}')
    echo "ID: $CONTAINER_ID"
else
    echo "❌ Conteneur frontend non trouvé"
fi

echo ""

# 4. Vérifier dans le conteneur
echo "4️⃣ Vérification dans le conteneur..."
if docker exec alliance-courtage-extranet grep -q "handleDeleteBordereau" /usr/share/nginx/html/assets/*.js 2>/dev/null; then
    echo "✅ Fonction handleDeleteBordereau trouvée dans le conteneur"
else
    echo "❌ Fonction handleDeleteBordereau NON trouvée dans le conteneur"
    echo "⚠️  Rebuild nécessaire sans cache"
fi

echo ""
echo "✅ Vérification terminée!"

