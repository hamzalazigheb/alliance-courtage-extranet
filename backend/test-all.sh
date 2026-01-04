#!/bin/bash

# Script pour tester toutes les APIs avant déploiement

echo "🧪 TESTS COMPLETS AVANT DÉPLOIEMENT"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
API_URL=${API_URL:-"http://localhost:3001"}
ADMIN_EMAIL=${ADMIN_EMAIL:-"admin@alliance.com"}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-"admin123"}

echo "📝 Configuration:"
echo "   API URL: $API_URL"
echo "   Admin Email: $ADMIN_EMAIL"
echo ""

# Vérifier que le serveur est démarré
echo "🔍 Vérification du serveur..."
if curl -s "$API_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Serveur accessible${NC}"
else
    echo -e "${RED}❌ Serveur inaccessible à $API_URL${NC}"
    echo "   Veuillez démarrer le serveur avec: npm start"
    exit 1
fi

echo ""

# Test 1: APIs générales
echo "🚀 Test 1/2: APIs générales"
echo "----------------------------"
node test-all-apis.js
API_TEST_RESULT=$?

echo ""
echo ""

# Test 2: Upload de fichiers
echo "📤 Test 2/2: Upload de fichiers"
echo "--------------------------------"
node test-file-uploads.js
UPLOAD_TEST_RESULT=$?

echo ""
echo ""

# Résumé final
echo "=================================="
echo "📊 RÉSUMÉ FINAL"
echo "=================================="
echo ""

if [ $API_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Tests APIs générales: RÉUSSIS${NC}"
else
    echo -e "${RED}❌ Tests APIs générales: ÉCHOUÉS${NC}"
fi

if [ $UPLOAD_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Tests Upload fichiers: RÉUSSIS${NC}"
else
    echo -e "${RED}❌ Tests Upload fichiers: ÉCHOUÉS${NC}"
fi

echo ""

if [ $API_TEST_RESULT -eq 0 ] && [ $UPLOAD_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}🎉 TOUS LES TESTS SONT RÉUSSIS!${NC}"
    echo -e "${GREEN}✅ Le projet est prêt pour le déploiement${NC}"
    exit 0
else
    echo -e "${RED}⚠️ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
    echo -e "${YELLOW}⚠️ Veuillez corriger les erreurs avant de déployer${NC}"
    exit 1
fi

