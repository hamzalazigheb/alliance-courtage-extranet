# Grafana & Prometheus Setup Guide

## ✅ What's Already Configured

1. **Prometheus** - Running on port 9090
2. **Grafana** - Running on port 9091
3. **Prometheus Data Source** - Automatically configured in Grafana
4. **Metrics Endpoint** - Available at http://localhost:3001/metrics

## 🚀 Quick Start

### 1. Start Your Backend

```powershell
cd backend
node server.js
```

### 2. Access Grafana

- **URL**: http://localhost:9091
- **Username**: `admin`
- **Password**: `admin123`

You'll be asked to change the password (you can skip for now).

### 3. Verify Prometheus Data Source

1. Go to **Connections** → **Data sources**
2. You should see **Prometheus** already configured
3. Click on it and click **Save & Test**
4. Should show: "Data source is working"

### 4. Create Your First Dashboard

#### Option A: Use the Query Editor (Recommended)

1. Click **"+"** → **"Dashboard"**
2. Click **"Add visualization"**
3. Select **"Prometheus"** as data source
4. In the query editor, try these queries:

**Request Rate:**
```promql
rate(http_requests_total[5m])
```

**Average Response Time:**
```promql
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

**Total Requests:**
```promql
sum(http_requests_total)
```

**Error Rate (5xx errors):**
```promql
sum(rate(http_requests_total{status_code=~"5.."}[5m]))
```

**Requests by Status Code:**
```promql
sum by (status_code) (rate(http_requests_total[5m]))
```

#### Option B: Import Pre-built Dashboard

1. Go to **Dashboards** → **Import**
2. Use dashboard ID: **11159** (Node.js Application Dashboard)
3. Select **Prometheus** as data source
4. Click **Import**

## 📊 Useful Queries

### Request Metrics

```promql
# Total requests per second
rate(http_requests_total[5m])

# Requests by endpoint
sum by (route) (rate(http_requests_total[5m]))

# Requests by HTTP method
sum by (method) (rate(http_requests_total[5m]))
```

### Performance Metrics

```promql
# Average response time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile response time
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### Error Metrics

```promql
# Error rate (4xx and 5xx)
sum(rate(http_requests_total{status_code=~"4..|5.."}[5m]))

# Error percentage
sum(rate(http_requests_total{status_code=~"4..|5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

### System Metrics

```promql
# CPU usage
process_cpu_user_seconds_total

# Memory usage
process_resident_memory_bytes

# Node.js heap size
nodejs_heap_size_total_bytes
```

## 🔍 Verify Everything Works

### Check Prometheus Targets

1. Go to http://localhost:9090
2. Click **Status** → **Targets**
3. You should see `nodejs-backend` with status **UP**

### Check Metrics Endpoint

1. Open http://localhost:3001/metrics
2. You should see metrics output starting with `# HELP` and `# TYPE`

### Test in Prometheus

1. Go to http://localhost:9090
2. Click **Graph** tab
3. Type: `rate(http_requests_total[5m])`
4. Click **Execute**
5. You should see data if your backend is running

## 🎨 Dashboard Tips

1. **Time Range**: Use the time picker (top right) to select time ranges
2. **Refresh**: Set auto-refresh to 10s or 30s for live monitoring
3. **Variables**: Create variables for filtering by route, method, etc.
4. **Alerts**: Set up alerts for high error rates or slow response times

## 🛠️ Troubleshooting

### No Data in Grafana

1. Check if backend is running: `http://localhost:3001/metrics`
2. Check Prometheus targets: http://localhost:9090/targets
3. Verify data source URL in Grafana: `http://host.docker.internal:9090`

### Prometheus Can't Scrape Backend

1. Make sure backend is running on port 3001
2. Check if metrics endpoint works: `http://localhost:3001/metrics`
3. Verify Prometheus config: `backend/prometheus/prometheus.yml`

### Restart Containers

```powershell
.\start-monitoring.ps1
```

## 📈 Next Steps

1. Create custom dashboards for your specific needs
2. Set up alerts for critical metrics
3. Monitor specific endpoints (e.g., `/api/products`, `/api/users`)
4. Track business metrics (user logins, file uploads, etc.)

## 🔗 Useful Links

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:9091
- **Metrics Endpoint**: http://localhost:3001/metrics
- **Backend Health**: http://localhost:3001/api/health
