# Stop and remove existing containers if they exist
Write-Host "Cleaning up existing containers..." -ForegroundColor Yellow
docker stop prometheus grafana 2>$null
docker rm prometheus grafana 2>$null

# Start Prometheus (connected to alliance-network for production)
Write-Host "`nStarting Prometheus..." -ForegroundColor Green
$prometheusPath = Join-Path $PWD "backend\prometheus\prometheus.yml"
docker run -d --name prometheus -p 9090:9090 `
  --network alliance-network `
  -v "${prometheusPath}:/etc/prometheus/prometheus.yml" `
  prom/prometheus

# Start Grafana (connected to alliance-network for production)
Write-Host "Starting Grafana..." -ForegroundColor Green
$grafanaProvisioning = Join-Path $PWD "backend\grafana\provisioning"
docker run -d --name grafana -p 9091:3000 `
  --network alliance-network `
  -e "GF_SECURITY_ADMIN_USER=admin" `
  -e "GF_SECURITY_ADMIN_PASSWORD=admin123" `
  -e "GF_USERS_ALLOW_SIGN_UP=false" `
  -v "${grafanaProvisioning}:/etc/grafana/provisioning" `
  grafana/grafana

# Wait a moment for containers to start
Start-Sleep -Seconds 3

# Check container status
Write-Host "`nChecking container status..." -ForegroundColor Yellow
docker ps --filter "name=prometheus" --filter "name=grafana"

Write-Host "`n✅ Monitoring setup complete!" -ForegroundColor Green
Write-Host "`nAccess your dashboards:" -ForegroundColor Cyan
Write-Host "  Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "  Grafana:    http://localhost:9091 (admin/admin123)" -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Install prom-client: cd backend && npm install prom-client" -ForegroundColor White
Write-Host "  2. Start your backend: node server.js" -ForegroundColor White
Write-Host "  3. Check metrics: http://localhost:3001/metrics" -ForegroundColor White
