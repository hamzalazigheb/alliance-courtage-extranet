# Script to test alerts in Prometheus/Grafana
# Usage: .\test-alerts.ps1

Write-Host "🧪 Testing Alerts" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Generate errors to trigger HighErrorRate alert
Write-Host "Test 1: Generating errors to trigger HighErrorRate alert..." -ForegroundColor Yellow
Write-Host "Calling non-existent endpoint 50 times..." -ForegroundColor Gray

for ($i = 1; $i -le 50; $i++) {
    try {
        Invoke-WebRequest -Uri "http://localhost:3001/api/nonexistent-endpoint-$i" -Method GET -ErrorAction SilentlyContinue | Out-Null
    } catch {
        # Expected 404 errors
    }
    if ($i % 10 -eq 0) {
        Write-Host "  Generated $i errors..." -ForegroundColor Gray
    }
}

Write-Host "✅ Error generation complete" -ForegroundColor Green
Write-Host "   Check Prometheus: http://localhost:9090/alerts" -ForegroundColor White
Write-Host "   Check Grafana: http://localhost:9091/alerting/list" -ForegroundColor White
Write-Host ""

# Test 2: Generate high load
Write-Host "Test 2: Generating high request rate..." -ForegroundColor Yellow
Write-Host "Making 200 requests to /api/health..." -ForegroundColor Gray

for ($i = 1; $i -le 200; $i++) {
    try {
        Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -ErrorAction SilentlyContinue | Out-Null
    } catch {
        # Ignore errors
    }
    if ($i % 50 -eq 0) {
        Write-Host "  Made $i requests..." -ForegroundColor Gray
    }
}

Write-Host "✅ High load generation complete" -ForegroundColor Green
Write-Host ""

# Test 3: Check alert status
Write-Host "Test 3: Checking alert status..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "http://localhost:9090/api/v1/alerts" -Method GET -ErrorAction Stop
    $alerts = $response.Content | ConvertFrom-Json
    
    if ($alerts.data) {
        Write-Host "Active Alerts:" -ForegroundColor Cyan
        foreach ($alert in $alerts.data) {
            if ($alert.state -eq "firing") {
                Write-Host "  🔴 $($alert.labels.alertname) - $($alert.annotations.summary)" -ForegroundColor Red
            } elseif ($alert.state -eq "pending") {
                Write-Host "  🟡 $($alert.labels.alertname) - Pending..." -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "  No active alerts" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  Could not check Prometheus alerts API" -ForegroundColor Yellow
    Write-Host "     Make sure Prometheus is running on port 9090" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📊 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Open Prometheus: http://localhost:9090/alerts" -ForegroundColor White
Write-Host "  2. Open Grafana: http://localhost:9091/alerting/list" -ForegroundColor White
Write-Host "  3. Wait 2-5 minutes for alerts to evaluate" -ForegroundColor White
Write-Host "  4. Check notification channels for alerts" -ForegroundColor White
Write-Host ""
