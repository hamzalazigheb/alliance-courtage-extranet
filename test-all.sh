#!/bin/bash

echo "🧪 Tests Automatiques Alliance Courtage"
echo "======================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Test 1: Containers
echo "📦 Test 1: Containers Docker"
if docker ps | grep -q "alliance-courtage-mysql"; then
    echo -e "${GREEN}✅ MySQL running${NC}"
else
    echo -e "${RED}❌ MySQL not running${NC}"
    ERRORS=$((ERRORS + 1))
fi

if docker ps | grep -q "alliance-courtage-backend"; then
    echo -e "${GREEN}✅ Backend running${NC}"
else
    echo -e "${RED}❌ Backend not running${NC}"
    ERRORS=$((ERRORS + 1))
fi

if docker ps | grep -q "alliance-courtage-extranet"; then
    echo -e "${GREEN}✅ Frontend running${NC}"
else
    echo -e "${RED}❌ Frontend not running${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Test 2: API Health (Backend direct)
echo "🔍 Test 2: API Backend Direct"
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health 2>/dev/null)
if [ ! -z "$HEALTH_RESPONSE" ]; then
    echo -e "${GREEN}✅ Backend API responds: $HEALTH_RESPONSE${NC}"
else
    echo -e "${RED}❌ Backend API not responding${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test 3: API via Nginx
echo "🔍 Test 3: API via Nginx Proxy"
PROXY_RESPONSE=$(curl -s http://localhost/api/health 2>/dev/null)
if [ ! -z "$PROXY_RESPONSE" ]; then
    echo -e "${GREEN}✅ Nginx proxy works: $PROXY_RESPONSE${NC}"
else
    echo -e "${RED}❌ Nginx proxy not working${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Test 4: Database
echo "💾 Test 4: Database Connectivity"
cd /var/www/alliance-courtage/backend 2>/dev/null || cd backend
ROOT_PASSWORD=$(grep "MYSQL_ROOT_PASSWORD:" docker-compose.yml 2>/dev/null | awk '{print $2}' | tr -d '"' || echo "alliance2024Secure")

USER_COUNT=$(docker exec alliance-courtage-mysql mysql -u root -p"${ROOT_PASSWORD}" alliance_courtage -e "SELECT COUNT(*) FROM users;" 2>/dev/null | tail -1)

if [ ! -z "$USER_COUNT" ] && [ "$USER_COUNT" != "COUNT(*)" ] && [ "$USER_COUNT" != "NULL" ]; then
    echo -e "${GREEN}✅ Database accessible (${USER_COUNT} users)${NC}"
else
    echo -e "${RED}❌ Database not accessible${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Test Tables
TABLE_COUNT=$(docker exec alliance-courtage-mysql mysql -u root -p"${ROOT_PASSWORD}" alliance_courtage -e "SHOW TABLES;" 2>/dev/null | wc -l)
if [ "$TABLE_COUNT" -gt 1 ]; then
    echo -e "${GREEN}✅ Database has tables ($((TABLE_COUNT - 1)) tables)${NC}"
else
    echo -e "${YELLOW}⚠️  Database has few tables${NC}"
fi

echo ""

# Test 5: Network (Frontend → Backend)
echo "🌐 Test 5: Network Connectivity"
NETWORK_TEST=$(docker exec alliance-courtage-extranet wget -qO- http://alliance-courtage-backend:3001/api/health 2>/dev/null)
if echo "$NETWORK_TEST" | grep -q "OK\|ok\|200"; then
    echo -e "${GREEN}✅ Frontend can reach backend${NC}"
else
    echo -e "${RED}❌ Frontend cannot reach backend${NC}"
    echo -e "${YELLOW}   Response: $NETWORK_TEST${NC}"
    ERRORS=$((ERRORS + 1))
fi

echo ""

# Test 6: Ports
echo "🔌 Test 6: Ports"
if netstat -tln 2>/dev/null | grep -q ":80 "; then
    echo -e "${GREEN}✅ Port 80 is listening${NC}"
else
    echo -e "${YELLOW}⚠️  Port 80 check failed (may need sudo)${NC}"
fi

if netstat -tln 2>/dev/null | grep -q ":3001 "; then
    echo -e "${GREEN}✅ Port 3001 is listening${NC}"
else
    echo -e "${YELLOW}⚠️  Port 3001 check failed (may need sudo)${NC}"
fi

echo ""

# Résumé
echo "======================================="
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
    echo ""
    echo "🌐 Votre application est accessible sur:"
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "VOTRE_IP")
    echo "   http://${PUBLIC_IP}"
    exit 0
else
    echo -e "${RED}❌ $ERRORS erreur(s) détectée(s)${NC}"
    echo ""
    echo "💡 Vérifiez les logs:"
    echo "   docker logs alliance-courtage-backend"
    echo "   docker logs alliance-courtage-extranet"
    exit 1
fi

