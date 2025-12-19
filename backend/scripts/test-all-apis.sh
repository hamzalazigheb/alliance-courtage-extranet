#!/bin/bash
# Script pour tester que toutes les API principales fonctionnent

echo "🧪 Test des API principales..."
echo ""

# Récupérer le token admin (nécessite d'être connecté)
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alliance-courtage.fr","password":"alliance2024"}' \
  2>/dev/null | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "⚠️  Impossible de récupérer le token. Vérifiez que le backend fonctionne et que le mot de passe admin est correct."
  echo ""
  echo "Test de base (sans authentification):"
  curl -s http://localhost:3001/api/health | head -5
  exit 1
fi

echo "✅ Token récupéré"
echo ""

ERRORS=0

# Test 1: Health check
echo "1. Test /api/health..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
if [ "$STATUS" = "200" ]; then
  echo "   ✅ Health check OK"
else
  echo "   ❌ Health check échoué (HTTP $STATUS)"
  ((ERRORS++))
fi

# Test 2: Simulators usage
echo "2. Test /api/simulators/usage..."
RESPONSE=$(curl -s -w "\n%{http_code}" -H "x-auth-token: $TOKEN" http://localhost:3001/api/simulators/usage?limit=50)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Simulators usage OK"
else
  echo "   ❌ Simulators usage échoué (HTTP $HTTP_CODE)"
  echo "   Réponse: $BODY" | head -3
  ((ERRORS++))
fi

# Test 3: Structured products
echo "3. Test /api/structured-products..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/structured-products)
if [ "$STATUS" = "200" ]; then
  echo "   ✅ Structured products OK"
else
  echo "   ❌ Structured products échoué (HTTP $STATUS)"
  ((ERRORS++))
fi

# Test 4: Favoris
echo "4. Test /api/favoris..."
RESPONSE=$(curl -s -w "\n%{http_code}" -H "x-auth-token: $TOKEN" http://localhost:3001/api/favoris)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Favoris OK"
else
  echo "   ❌ Favoris échoué (HTTP $HTTP_CODE)"
  ((ERRORS++))
fi

# Test 5: Formations
echo "5. Test /api/formations..."
RESPONSE=$(curl -s -w "\n%{http_code}" -H "x-auth-token: $TOKEN" "http://localhost:3001/api/formations?year=2025")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Formations OK"
else
  echo "   ❌ Formations échoué (HTTP $HTTP_CODE)"
  ((ERRORS++))
fi

# Test 6: Users
echo "6. Test /api/users..."
RESPONSE=$(curl -s -w "\n%{http_code}" -H "x-auth-token: $TOKEN" http://localhost:3001/api/users)
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Users OK"
else
  echo "   ❌ Users échoué (HTTP $HTTP_CODE)"
  ((ERRORS++))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ Tous les tests sont passés! Les API fonctionnent correctement."
else
  echo "❌ $ERRORS test(s) ont échoué. Vérifiez les logs du backend."
fi

echo ""
echo "✅ Tests terminés!"

