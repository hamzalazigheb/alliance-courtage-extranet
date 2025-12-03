# ✅ Alerts Setup Complete!

## What's Been Done

1. ✅ **Prometheus restarted** with alerts configuration
2. ✅ **Alerts file created** (`backend/prometheus/alerts.yml`)
3. ✅ **Traffic generated** for testing
4. ✅ **Alerts loaded** and ready to fire

## 📍 Check Your Alerts

### Option 1: Prometheus Web UI (Best)

1. **Open**: http://localhost:9090/alerts
2. You'll see all alert rules:
   - **HighErrorRate** - Fires when error rate > 0.1/sec
   - **HighResponseTime** - Fires when response time > 2s
   - **BackendDown** - Fires when backend is down
   - **HighRequestRate** - Fires when requests > 100/sec
   - **HighMemoryUsage** - Fires when memory > 500MB

3. **Alert States**:
   - 🟢 **Inactive** - Condition not met (normal)
   - 🟡 **Pending** - Condition met, waiting for `for` duration
   - 🔴 **Firing** - Alert is active and firing

### Option 2: Prometheus API

```powershell
# Check all alerts
curl http://localhost:9090/api/v1/alerts
```

### Option 3: Grafana

1. **Open**: http://localhost:9091
2. Go to **Alerting** → **Alert rules**
3. Create alerts from dashboard panels

## 🧪 Test Alerts

### Test 1: Trigger HighErrorRate Alert

```powershell
# Generate 50+ errors
for ($i = 1; $i -le 50; $i++) {
    curl http://localhost:3001/api/nonexistent-endpoint
}
```

Wait 2-3 minutes, then check: http://localhost:9090/alerts

### Test 2: Trigger BackendDown Alert

```powershell
# Stop backend
docker stop alliance-courtage-backend

# Wait 2 minutes
# Check alerts: http://localhost:9090/alerts
# Should see "BackendDown" firing

# Start backend
docker start alliance-courtage-backend
```

### Test 3: Lower Threshold (Easiest)

Edit `backend/prometheus/alerts.yml`:

```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.0001  # Very low threshold
```

Then restart Prometheus:
```powershell
docker restart prometheus
```

## 📊 Current Alert Rules

All alerts are configured in: `backend/prometheus/alerts.yml`

1. **HighErrorRate**: Error rate > 0.1/sec for 2 minutes
2. **HighResponseTime**: Response time > 2s for 5 minutes  
3. **BackendDown**: Backend down for 1 minute
4. **HighRequestRate**: Request rate > 100/sec for 5 minutes
5. **HighMemoryUsage**: Memory > 500MB for 5 minutes

## 🎯 Next Steps

1. **View alerts**: http://localhost:9090/alerts
2. **Set up notifications** in Grafana (email/webhook)
3. **Create dashboards** with alert panels
4. **Adjust thresholds** based on your needs
5. **Set up Alertmanager** for advanced routing

## 🔗 Quick Links

- **Prometheus Alerts**: http://localhost:9090/alerts
- **Prometheus Graph**: http://localhost:9090/graph
- **Grafana**: http://localhost:9091
- **Backend Metrics**: http://localhost:3001/metrics
