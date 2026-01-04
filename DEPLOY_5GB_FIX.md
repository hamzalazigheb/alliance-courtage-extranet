# 🚀 Deployment Instructions - 5GB File Upload Fix

## Issue Fixed
- HTTP 413 "Payload Too Large" error
- Increased file upload limit from 50MB to **5GB (5000MB)**
- Increased timeouts from 60s to 300s (5 minutes)

---

## 📋 Steps to Deploy on Server

### 1️⃣ Pull Latest Changes
```bash
cd ~/prod
git pull origin deploy-new-version
```

### 2️⃣ Update System Nginx Configuration
```bash
cd ~/prod
chmod +x update-nginx-body-size.sh
sudo ./update-nginx-body-size.sh
```

This will:
- Update `/etc/nginx/sites-available/alliance-courtage.org`
- Set `client_max_body_size 5000M;`
- Test and reload Nginx configuration

### 3️⃣ Rebuild and Restart Backend
```bash
cd ~/prod/backend

# Stop old backend
docker stop alliance-courtage-backend
docker rm alliance-courtage-backend

# Rebuild backend (no-cache to ensure fresh build)
docker build --no-cache -t backend_backend:latest .

# Get MySQL network
MYSQL_NETWORK=$(docker inspect c4dbc8574704 --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)

# Start new backend
docker run -d \
  --name alliance-courtage-backend \
  --restart unless-stopped \
  --network $MYSQL_NETWORK \
  -p 3001:3001 \
  --env-file config.env \
  -e NODE_ENV=production \
  -e DB_HOST=mysql \
  -e DB_PORT=3306 \
  -e DB_NAME=alliance_courtage \
  -e DB_USER=root \
  -e DB_PASSWORD=alliance2024Secure \
  -v $(pwd)/uploads:/app/uploads \
  backend_backend:latest

# Check logs
docker logs -f alliance-courtage-backend
```

Press `Ctrl+C` when you see "✅ Server is running..."

### 4️⃣ Rebuild and Restart Frontend
```bash
cd ~/prod

# Stop old frontend
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# Rebuild frontend (no-cache to ensure fresh build)
docker build --no-cache -t alliance-courtage-frontend:latest .

# Start new frontend
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  --network backend_alliance-network \
  -p 8080:80 \
  alliance-courtage-frontend:latest

# Check logs
docker logs alliance-courtage-extranet
```

### 5️⃣ Verify Deployment
```bash
# Check all containers are running
docker ps

# Test backend
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost:8080
```

You should see:
- `alliance-courtage-backend` running on port 3001
- `alliance-courtage-extranet` running on port 8080
- System Nginx proxying HTTPS traffic

---

## ✅ What Changed

### Frontend (nginx.conf)
- `client_max_body_size: 50M → 5000M`
- `proxy timeouts: 60s → 300s`

### Backend (structuredProducts.js)
- `multer fileSize limit: 50MB → 5GB`
- `Error message: "50MB" → "5GB"`

### System Nginx (/etc/nginx/sites-available/alliance-courtage.org)
- `client_max_body_size: not set → 5000M`
- `proxy timeouts: not set → 300s`

---

## 🧪 Test File Upload
1. Go to https://alliance-courtage.org/admin
2. Navigate to "Gamme Produits" → "Produits structurés"
3. Try uploading large files (up to 5GB)
4. Should work without 413 errors ✅

---

## 🆘 Troubleshooting

### If you still get 413 errors:
```bash
# Check system Nginx config
sudo cat /etc/nginx/sites-available/alliance-courtage.org | grep client_max_body_size

# Should show: client_max_body_size 5000M;
```

### If frontend/backend not responding:
```bash
# Check container logs
docker logs alliance-courtage-backend
docker logs alliance-courtage-extranet

# Check system Nginx logs
sudo tail -50 /var/log/nginx/alliance-courtage.error.log
```

### Restart everything if needed:
```bash
sudo systemctl restart nginx
docker restart alliance-courtage-backend
docker restart alliance-courtage-extranet
```

