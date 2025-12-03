#!/bin/bash
# Script pour tester une nouvelle fonctionnalité en local

echo "🧪 Test de la nouvelle fonctionnalité en local..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier que le backend est démarré
echo "📡 Vérification du backend..."
if curl -s http://localhost:3001/api/auth/me > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend est démarré${NC}"
else
    echo -e "${RED}❌ Backend n'est pas démarré. Lancez: cd backend && npm run dev${NC}"
    exit 1
fi

# Vérifier que le frontend est démarré
echo "🌐 Vérification du frontend..."
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend est démarré${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend n'est pas démarré. Lancez: npm run dev${NC}"
fi

# Test de l'API (remplacez par votre endpoint)
echo ""
echo "🔍 Test de l'API..."
API_URL="http://localhost:3001/api/nouvelle-fonctionnalite"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")

if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "401" ]; then
    echo -e "${GREEN}✅ API répond (code: $RESPONSE)${NC}"
else
    echo -e "${RED}❌ API ne répond pas correctement (code: $RESPONSE)${NC}"
fi

echo ""
echo "✅ Tests terminés!"
echo ""
echo "📝 Prochaines étapes:"
echo "   1. Tester manuellement sur http://localhost:5173"
echo "   2. Vérifier les logs du backend"
echo "   3. Vérifier la console du navigateur"
echo "   4. Si tout fonctionne, commit et push"

