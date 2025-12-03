#!/bin/bash

# Script to deploy monitoring (Prometheus + Grafana) to production server
# Usage: ./deploy-monitoring-production.sh

set -e

echo "🚀 Deploying Monitoring to Production Server"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "backend/docker-compose.yml" ]; then
    echo "❌ Error: backend/docker-compose.yml not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

# Navigate to backend directory
cd backend

echo "📦 Pulling Docker images..."
docker pull prom/prometheus:latest
docker pull grafana/grafana:latest

echo ""
echo "✅ Images pulled successfully"
echo ""

# Check if directories exist, create if not
echo "📁 Creating directories..."
mkdir -p prometheus
mkdir -p grafana/provisioning/datasources
mkdir -p grafana/provisioning/dashboards

echo "✅ Directories created"
echo ""

# Check if prometheus.yml exists
if [ ! -f "prometheus/prometheus.yml" ]; then
    echo "⚠️  prometheus/prometheus.yml not found"
    echo "   Creating default configuration..."
    cat > prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'nodejs-backend'
    static_configs:
      - targets: ['alliance-courtage-backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF
    echo "✅ Created prometheus/prometheus.yml"
fi

# Check if Grafana provisioning exists
if [ ! -f "grafana/provisioning/datasources/prometheus.yml" ]; then
    echo "⚠️  Grafana datasource config not found"
    echo "   Creating default configuration..."
    cat > grafana/provisioning/datasources/prometheus.yml << 'EOF'
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
EOF
    echo "✅ Created Grafana datasource config"
fi

if [ ! -f "grafana/provisioning/dashboards/dashboard.yml" ]; then
    echo "⚠️  Grafana dashboard config not found"
    echo "   Creating default configuration..."
    cat > grafana/provisioning/dashboards/dashboard.yml << 'EOF'
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
EOF
    echo "✅ Created Grafana dashboard config"
fi

echo ""
echo "🐳 Starting monitoring containers..."
echo ""

# Start containers using docker-compose if monitoring services are defined
# Otherwise, start manually
if docker-compose config --services | grep -q "prometheus\|grafana"; then
    echo "Using docker-compose..."
    docker-compose up -d prometheus grafana
else
    echo "⚠️  Monitoring services not in docker-compose.yml"
    echo "   Starting containers manually..."
    
    # Start Prometheus
    docker run -d \
      --name prometheus \
      --network alliance-network \
      -p 9090:9090 \
      -v "$(pwd)/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml" \
      -v prometheus-data:/prometheus \
      --restart unless-stopped \
      prom/prometheus \
      --config.file=/etc/prometheus/prometheus.yml \
      --storage.tsdb.path=/prometheus
    
    # Start Grafana
    docker run -d \
      --name grafana \
      --network alliance-network \
      -p 9091:3000 \
      -e "GF_SECURITY_ADMIN_USER=admin" \
      -e "GF_SECURITY_ADMIN_PASSWORD=admin123" \
      -e "GF_USERS_ALLOW_SIGN_UP=false" \
      -v grafana-data:/var/lib/grafana \
      -v "$(pwd)/grafana/provisioning:/etc/grafana/provisioning" \
      --restart unless-stopped \
      grafana/grafana
fi

echo ""
echo "⏳ Waiting for containers to start..."
sleep 5

echo ""
echo "📊 Container Status:"
docker ps --filter "name=prometheus" --filter "name=grafana" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "✅ Monitoring deployment complete!"
echo ""
echo "Access your dashboards:"
echo "  Prometheus: http://$(hostname -I | awk '{print $1}'):9090"
echo "  Grafana:    http://$(hostname -I | awk '{print $1}'):9091 (admin/admin123)"
echo ""
echo "Next steps:"
echo "  1. Generate traffic: curl http://localhost:3001/api/health"
echo "  2. Check Prometheus targets: http://your-server:9090/targets"
echo "  3. Login to Grafana and create dashboards"
echo ""
