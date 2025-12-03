# Quick Guide: Test Alerts

## 🚀 Fastest Way to Test Alerts

### Method 1: Lower the Threshold (Instant Test)

**In Grafana:**
1. Go to your dashboard
2. Edit the panel with alert
3. Go to **Alert** tab
4. Change threshold to **0.0001** (very low)
5. Click **Save**
6. Alert should fire immediately! ⚡

### Method 2: Use the Test Script

```powershell
.\test-alerts.ps1
```

This will:
- Generate 50 errors (triggers HighErrorRate alert)
- Generate 200 requests (triggers HighRequestRate alert)
- Show active alerts

### Method 3: Manual Test

```powershell
# Generate errors
for ($i = 1; $i -le 50; $i++) {
    curl http://localhost:3001/api/nonexistent-endpoint
}

# Generate high load
for ($i = 1; $i -le 200; $i++) {
    curl http://localhost:3001/api/health
}
```

## 📍 Where to Check Alerts

### Prometheus
- **URL**: http://localhost:9090/alerts
- Shows all alert rules and their states

### Grafana
- **URL**: http://localhost:9091/alerting/list
- Shows alert rules and firing alerts

## ✅ Verify Alert is Working

1. **Check Alert State**:
   - Go to http://localhost:9090/alerts
   - Look for your alert
   - State should be **"firing"** (red) or **"pending"** (yellow)

2. **Check Notifications**:
   - If you configured email/webhook, check for notifications
   - Grafana → Alerting → Alert rules → Click on alert → See history

3. **Test Alert Resolution**:
   - Stop generating errors
   - Wait 2-5 minutes
   - Alert should change to **"resolved"** (green)

## 🎯 Common Alert Tests

### Test Error Rate Alert
```bash
# Make backend return errors
curl http://localhost:3001/api/nonexistent-endpoint
# Repeat 50+ times
```

### Test Response Time Alert
```bash
# Add delay to an endpoint (temporarily in code)
# Or generate slow requests
```

### Test Backend Down Alert
```bash
# Stop backend container
docker stop alliance-courtage-backend
# Wait 2 minutes
# Alert should fire
# Start it again
docker start alliance-courtage-backend
```

## 🔧 Troubleshooting

**Alert not firing?**
- Check query works: Test in Prometheus Graph tab
- Lower threshold temporarily
- Wait for evaluation period (check `for` duration)
- Check alert is enabled

**No notifications?**
- Verify notification channel is configured
- Test notification channel separately
- Check Alertmanager logs: `docker logs alertmanager`

**Alert firing too often?**
- Increase `for` duration (e.g., from 2m to 5m)
- Increase threshold
- Add more conditions to query
