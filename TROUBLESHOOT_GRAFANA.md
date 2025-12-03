# Troubleshooting: No Graph in Grafana

## Common Reasons & Solutions

### 1. ✅ Backend is Running (VERIFIED)
- Your backend is running on port 3001
- Metrics endpoint is working: http://localhost:3001/metrics

### 2. Check if Prometheus is Running

Open PowerShell and run:
```powershell
docker ps
```

You should see `prometheus` and `grafana` containers running.

If not, restart them:
```powershell
.\start-monitoring.ps1
```

### 3. Check Prometheus Targets

1. Open: http://localhost:9090
2. Click **Status** → **Targets**
3. Look for `nodejs-backend` target
4. Status should be **UP** (green)

**If status is DOWN:**
- Check the error message
- Make sure backend is running
- Verify the target URL: `host.docker.internal:3001`

### 4. Generate Some Traffic

**The graph will be empty if there's no data!**

You need to make some API requests to generate metrics:

```powershell
# Make some test requests
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health
curl http://localhost:3001/api/health
```

Or open in browser:
- http://localhost:3001/api/health
- Refresh a few times

### 5. Check Time Range in Grafana

1. In Grafana, look at the **time picker** (top right)
2. Make sure it's set to **"Last 5 minutes"** or **"Last 15 minutes"**
3. If it's set to "Last 6 hours" and you just started, there won't be data

### 6. Use Correct Query

In Grafana query editor, try these queries:

**Simple test query:**
```promql
http_requests_total
```

**Request rate (needs traffic):**
```promql
rate(http_requests_total[5m])
```

**If no data, try:**
```promql
up
```
This should show if Prometheus is running.

### 7. Verify Data Source Connection

1. In Grafana, go to **Connections** → **Data sources**
2. Click on **Prometheus**
3. Click **"Save & Test"**
4. Should show: "Data source is working"

If it fails, check the URL:
- Should be: `http://host.docker.internal:9090`
- Or try: `http://localhost:9090`

### 8. Check Prometheus Has Data

1. Go to http://localhost:9090
2. Click **Graph** tab
3. Type: `http_requests_total`
4. Click **Execute**
5. You should see data if backend has received requests

## Quick Fix Steps

1. **Restart monitoring:**
   ```powershell
   .\start-monitoring.ps1
   ```

2. **Generate traffic:**
   ```powershell
   # Run this a few times
   curl http://localhost:3001/api/health
   ```

3. **In Grafana:**
   - Set time range to "Last 5 minutes"
   - Use query: `http_requests_total`
   - Click "Run queries"

4. **If still no data:**
   - Check Prometheus targets: http://localhost:9090/targets
   - Verify backend metrics: http://localhost:3001/metrics
   - Check Prometheus logs: `docker logs prometheus`

## Test Query Sequence

Try these queries in order (in Grafana):

1. `up` - Should show 1 or 2 (Prometheus and backend)
2. `http_requests_total` - Should show total requests
3. `rate(http_requests_total[5m])` - Should show request rate

If `up` works but `http_requests_total` doesn't, you need to generate traffic!
