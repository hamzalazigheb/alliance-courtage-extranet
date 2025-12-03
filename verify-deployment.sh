#!/bin/bash
# Script pour vérifier que les nouvelles fonctionnalités sont déployées

echo "🔍 Vérification du déploiement..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "1️⃣ Vérification du backend - Route /bordereaux/recent"
echo "---------------------------------------------------"

# Vérifier si la route retourne hasFileContent
RESPONSE=$(curl -s http://localhost:3001/api/bordereaux/recent -H "x-auth-token: test" 2>/dev/null)

if echo "$RESPONSE" | grep -q "hasFileContent"; then
    echo -e "${GREEN}✅ Backend: Route /recent retourne hasFileContent (NOUVEAU)${NC}"
else
    echo -e "${YELLOW}⚠️  Backend: Route /recent ne retourne pas hasFileContent${NC}"
    echo "Réponse: $RESPONSE" | head -c 200
    echo ""
fi

echo ""
echo "2️⃣ Vérification du frontend - Fichier GestionComptabilitePage.tsx"
echo "---------------------------------------------------"

# Vérifier dans le conteneur frontend
if docker exec alliance-courtage-extranet grep -q "handleOpenBordereau" /usr/share/nginx/html/assets/*.js 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend: Fonction handleOpenBordereau trouvée (NOUVEAU)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: handleOpenBordereau non trouvé${NC}"
fi

if docker exec alliance-courtage-extranet grep -q "handleDeleteBordereau" /usr/share/nginx/html/assets/*.js 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend: Fonction handleDeleteBordereau trouvée (NOUVEAU)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: handleDeleteBordereau non trouvé${NC}"
fi

if docker exec alliance-courtage-extranet grep -q "Supprimer" /usr/share/nginx/html/assets/*.js 2>/dev/null; then
    echo -e "${GREEN}✅ Frontend: Bouton 'Supprimer' trouvé (NOUVEAU)${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend: Bouton 'Supprimer' non trouvé${NC}"
fi

echo ""
echo "3️⃣ Vérification des conteneurs"
echo "---------------------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep -E "alliance-courtage|NAMES"

echo ""
echo "4️⃣ Vérification des dates de build"
echo "---------------------------------------------------"
echo "Backend:"
docker inspect alliance-courtage-backend --format='{{.Created}}' 2>/dev/null || echo "Conteneur non trouvé"
echo ""
echo "Frontend:"
docker inspect alliance-courtage-extranet --format='{{.Created}}' 2>/dev/null || echo "Conteneur non trouvé"

echo ""
echo "✅ Vérification terminée!"

