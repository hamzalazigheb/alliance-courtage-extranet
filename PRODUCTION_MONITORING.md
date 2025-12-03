# Production Monitoring Setup

## Your 3 Production Containers

1. **alliance-courtage-mysql** - MySQL Database (port 3306)
2. **alliance-courtage-backend** - Backend API (port 3001)
3. **alliance-courtage-extranet** - Frontend (port 80)

## Monitoring Containers Added

4. **prometheus** - Metrics collection (port 9090)
5. **grafana** - Visualization (port 9091)

## Important: Network Configuration

**Prometheus and Grafana are now connected to `alliance-network`** so they can communicate with your production containers.

## Setup Steps

### 1. Restart Monitoring with Network

```powershell
.\start-monitoring.ps1
```

This will:
- Connect Prometheus to `alliance-network`
- Connect Grafana to `alliance-network`
- Allow Prometheus to scrape `alliance-courtage-backend:3001`

### 2. Verify Backend Container is Running

```powershell
docker ps --filter "name=alliance-courtage-backend"
```

### 3. Check Prometheus Can Reach Backend

1. Go to: http://localhost:9090
2. Click **Status** → **Targets**
3. You should see:
   - `nodejs-backend` (targeting `alliance-courtage-backend:3001`) - **UP**
   - `nodejs-backend-host` (targeting `host.docker.internal:3001`) - **UP** or **DOWN** (depends if backend runs locally)

### 4. Generate Traffic

Make some API requests to generate metrics:

```powershell
# If backend is in container
docker exec alliance-courtage-backend curl http://localhost:3001/api/health

# Or from host
curl http://localhost:3001/api/health
```

### 5. Access Grafana

- URL: http://localhost:9091
- Login: `admin` / `admin123`

## Why No Graph?

### Common Issues:

1. **Backend container not running**
   ```powershell
   docker ps --filter "name=alliance-courtage-backend"
   ```

2. **Prometheus can't reach backend**
   - Check network: `docker network inspect alliance-network`
   - Verify Prometheus is on network: `docker inspect prometheus | Select-String "alliance-network"`

3. **No traffic generated**
   - Make API requests to generate metrics
   - Wait 15 seconds for Prometheus to scrape

4. **Wrong time range in Grafana**
   - Set to "Last 5 minutes"
   - Use query: `http_requests_total`

## Production Deployment

To add monitoring to production docker-compose:

Add to `backend/docker-compose.yml`:

```yaml
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

volumes:
  prometheus-data:
  grafana-data:
```

Then run:
```powershell
cd backend
docker-compose up -d prometheus grafana
```
