# Deployment Commands - Copy & Paste in Termius

## Step 1: Find your project directory
```bash
sudo find / -maxdepth 3 -type d -name "*gnca*" -o -name "*alliance*" -o -name "*extranet*" 2>/dev/null
```

## Step 2: Navigate to project
```bash
# Replace with the actual path from Step 1, for example:
cd /var/www/gnca
# OR
cd /home/ubuntu/gnca
# OR wherever your project is
pwd  # Verify you're in the right place
```

## Step 3: Make sure you have the latest code
```bash
# If using git:
git pull origin main

# OR if you uploaded files manually, verify nginx.conf exists:
ls -la nginx.conf
```

## Step 4: Make deploy script executable (if using script)
```bash
chmod +x deploy.sh
```

## Step 5: Run the deployment
```bash
# Option A: Use the automated script
./deploy.sh

# OR Option B: Manual deployment (copy all at once)
```

## Option B: Manual Deployment Commands
```bash
# Stop existing containers
docker stop alliance-courtage-extranet 2>/dev/null || true
docker rm alliance-courtage-extranet 2>/dev/null || true
cd backend && docker compose down && cd ..

# Build and start backend
cd backend
docker compose build --no-cache
docker compose up -d
sleep 15
cd ..

# Run database migrations
cd backend
docker compose exec -T backend node scripts/initDatabase.js || true
docker compose exec -T backend node scripts/createBordereauxTable.js || true
cd ..

# Build frontend
docker build -t alliance-courtage-frontend:latest .

# Start frontend
docker run -d \
  --name alliance-courtage-extranet \
  --network backend_alliance-network \
  -p 80:80 \
  --restart unless-stopped \
  alliance-courtage-frontend:latest

# Verify everything is running
docker ps
```

## Step 6: Check if it worked
```bash
# See all running containers
docker ps

# Check frontend logs
docker logs alliance-courtage-extranet

# Check backend logs
cd backend && docker compose logs backend && cd ..

# Test if frontend is accessible
curl -I http://localhost

# Get your public IP to access from browser
curl -s ifconfig.me
```

