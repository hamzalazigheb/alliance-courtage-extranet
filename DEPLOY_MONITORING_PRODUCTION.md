# Deploy Monitoring to Production Server (via Termius/SSH)

## Prerequisites

- Access to your production server via Termius/SSH
- Docker and Docker Compose installed on server
- Your 3 production containers running:
  - `alliance-courtage-mysql`
  - `alliance-courtage-backend`
  - `alliance-courtage-extranet`

## Step 1: Connect to Production Server

1. Open Termius
2. Connect to your production server
3. Navigate to your project directory:

```bash
cd ~/alliance/alliance
# or wherever your project is located
```

## Step 2: Upload Monitoring Files

You need to upload these files to your server:

### Files to Upload:

1. `backend/prometheus/prometheus.yml`
2. `backend/grafana/provisioning/datasources/prometheus.yml`
3. `backend/grafana/provisioning/dashboards/dashboard.yml`
4. `backend/middleware/metrics.js` (already in your code)

### Option A: Using SCP (from your local machine)

```powershell
# From your local PowerShell
scp backend/prometheus/prometheus.yml user@your-server:~/alliance/alliance/backend/prometheus/
scp -r backend/grafana/provisioning user@your-server:~/alliance/alliance/backend/grafana/
```

### Option B: Create files directly on server

Connect via Termius and create the files:

```bash
# Create directories
mkdir -p backend/prometheus
mkdir -p backend/grafana/provisioning/datasources
mkdir -p backend/grafana/provisioning/dashboards
```

## Step 3: Create Prometheus Config on Server

```bash
nano backend/prometheus/prometheus.yml
```

Paste this content:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Backend API running in Docker container (production)
  - job_name: 'nodejs-backend'
    static_configs:
      - targets: ['alliance-courtage-backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s

  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

Save: `Ctrl+X`, then `Y`, then `Enter`

## Step 4: Create Grafana Provisioning on Server

### Data Source Config:

```bash
nano backend/grafana/provisioning/datasources/prometheus.yml
```

Paste:

```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
    jsonData:
      timeInterval: "15s"
```

### Dashboard Config:

```bash
nano backend/grafana/provisioning/dashboards/dashboard.yml
```

Paste:

```yaml
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
```

## Step 5: Update docker-compose.yml on Server

Add monitoring services to `backend/docker-compose.yml`:

```bash
nano backend/docker-compose.yml
```

Add at the end (before `volumes:`):

```yaml
  # Prometheus Monitoring
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    networks:
      - alliance-network
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  # Grafana Visualization
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "9091:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    networks:
      - alliance-network
    depends_on:
      - prometheus
```

Update the `volumes:` section to include:

```yaml
volumes:
  mysql_data:
  prometheus-data:
  grafana-data:
```

## Step 6: Pull Docker Images

```bash
cd backend
docker pull prom/prometheus:latest
docker pull grafana/grafana:latest
```

## Step 7: Start Monitoring Containers

```bash
cd backend
docker-compose up -d prometheus grafana
```

## Step 8: Verify Containers are Running

```bash
docker ps
```

You should see:
- ✅ `alliance-courtage-mysql`
- ✅ `alliance-courtage-backend`
- ✅ `alliance-courtage-extranet`
- ✅ `prometheus`
- ✅ `grafana`

## Step 9: Check Prometheus Targets

1. Open browser: `http://your-server-ip:9090`
2. Go to **Status** → **Targets**
3. Verify `nodejs-backend` shows **UP** (green)

## Step 10: Access Grafana

1. Open browser: `http://your-server-ip:9091`
2. Login: `admin` / `admin123`
3. Go to **Connections** → **Data sources**
4. Verify **Prometheus** is configured and working

## Step 11: Generate Traffic & Test

```bash
# Make some API requests to generate metrics
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health
```

## Step 12: Create Dashboard in Grafana

1. In Grafana, click **"+"** → **"Dashboard"**
2. Click **"Add visualization"**
3. Select **"Prometheus"** data source
4. Try query: `rate(http_requests_total[5m])`
5. Click **"Run queries"**

## Firewall Configuration

If you can't access from outside, open ports:

```bash
# Ubuntu/Debian
sudo ufw allow 9090/tcp  # Prometheus
sudo ufw allow 9091/tcp  # Grafana

# Or if using iptables
sudo iptables -A INPUT -p tcp --dport 9090 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 9091 -j ACCEPT
```

## Quick Commands Reference

```bash
# View logs
docker logs prometheus
docker logs grafana

# Restart monitoring
docker-compose restart prometheus grafana

# Stop monitoring
docker-compose stop prometheus grafana

# View all containers
docker ps -a

# Check network
docker network inspect alliance-network
```

## Troubleshooting

### Prometheus can't reach backend

```bash
# Check if backend is on same network
docker network inspect alliance-network | grep alliance-courtage-backend

# Check backend container
docker logs alliance-courtage-backend | grep metrics
```

### No data in Grafana

1. Generate traffic: `curl http://localhost:3001/api/health`
2. Wait 15 seconds for Prometheus to scrape
3. Check Prometheus: `http://your-server:9090` → Graph → `http_requests_total`

### Can't access from browser

1. Check firewall: `sudo ufw status`
2. Check if ports are open: `netstat -tuln | grep 9090`
3. Verify containers are running: `docker ps`

## Security Notes

⚠️ **Important for Production:**

1. Change Grafana password immediately
2. Consider using reverse proxy (nginx) with authentication
3. Restrict access to ports 9090 and 9091
4. Use HTTPS for Grafana access

## Next Steps

- Set up alerts in Grafana
- Create custom dashboards
- Monitor specific endpoints
- Track business metrics
