#!/bin/bash
set -e

echo "🚀 Starting deployment of Alliance Courtage Extranet..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Stop existing containers
echo -e "${YELLOW}📦 Stopping existing containers...${NC}"
docker stop alliance-courtage-extranet 2>/dev/null || true
docker rm alliance-courtage-extranet 2>/dev/null || true

cd backend
echo -e "${YELLOW}📦 Stopping backend services...${NC}"
docker compose down
cd ..

# Step 2: Build and start backend
echo -e "${YELLOW}🔨 Building backend services...${NC}"
cd backend
docker compose build --no-cache
echo -e "${YELLOW}🚀 Starting backend services...${NC}"
docker compose up -d
echo -e "${GREEN}✅ Backend services started${NC}"

# Step 3: Wait for MySQL to be ready
echo -e "${YELLOW}⏳ Waiting for MySQL to be ready...${NC}"
sleep 15

# Step 4: Run database migrations
echo -e "${YELLOW}📊 Running database migrations...${NC}"
docker compose exec -T backend node scripts/initDatabase.js || echo -e "${YELLOW}⚠️  initDatabase.js skipped or already run${NC}"
docker compose exec -T backend node scripts/createBordereauxTable.js || echo -e "${YELLOW}⚠️  createBordereauxTable.js skipped or already run${NC}"
cd ..

# Step 5: Build frontend
echo -e "${YELLOW}🔨 Building frontend...${NC}"
docker build -t alliance-courtage-frontend:latest .

# Step 6: Start frontend on backend network
echo -e "${YELLOW}🚀 Starting frontend container...${NC}"
docker run -d \
  --name alliance-courtage-extranet \
  --network backend_alliance-network \
  -p 80:80 \
  --restart unless-stopped \
  alliance-courtage-frontend:latest

# Step 7: Clean up old images
echo -e "${YELLOW}🧹 Cleaning up old images...${NC}"
docker image prune -f

# Step 8: Show status
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Container status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "📝 Logs (last 20 lines):"
docker logs --tail 20 alliance-courtage-extranet
echo ""
echo -e "${GREEN}🌐 Frontend should be available at http://$(curl -s ifconfig.me)${NC}"
echo -e "${GREEN}🔧 Check logs with: docker logs -f alliance-courtage-extranet${NC}"

