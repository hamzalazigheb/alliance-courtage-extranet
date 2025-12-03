# Alerts Setup & Testing Guide

## Option 1: Grafana Alerts (Easier - Recommended)

### Step 1: Create Alert in Grafana

1. **Open Grafana**: http://localhost:9091
2. **Create a Dashboard** or use existing one
3. **Add a Panel** or edit existing panel
4. **Set up Query**:
   - Data source: Prometheus
   - Query: `rate(http_requests_total{status_code=~"5.."}[5m])`
   - This tracks error rate

5. **Go to Alert Tab** (below the query)
6. **Click "Create Alert"**
7. **Configure Alert**:
   - **Alert name**: `High Error Rate`
   - **Condition**: 
     - When: `last()`
     - Of: `A`
     - Is above: `0.1` (10 errors per second)
   - **Evaluate every**: `1m`
   - **For**: `2m`

8. **Add Notification Channel**:
   - Click "Add notification channel"
   - Name: `Test Channel`
   - Type: `Email` or `Webhook`
   - For testing, use: `Webhook` with URL: `http://localhost:3001/api/test-webhook`
   - Or use: `Email` with your email

9. **Save Alert**

### Step 2: Test the Alert

#### Method A: Trigger Alert Manually

1. **Make your backend return errors**:
   ```bash
   # If you have an endpoint that can be made to fail
   curl http://localhost:3001/api/nonexistent-endpoint
   ```

2. **Or temporarily modify your backend** to return 500 errors

#### Method B: Use Alert Test Button

1. In Grafana, go to **Alerting** → **Alert rules**
2. Find your alert
3. Click **"Test"** button (if available)

#### Method C: Lower the Threshold

1. Edit your alert
2. Change threshold to very low value (e.g., `0.001`)
3. Save
4. Wait for evaluation
5. Alert should trigger immediately

### Step 3: Verify Alert Fired

1. Go to **Alerting** → **Alert rules**
2. You should see your alert in **"Firing"** state
3. Check notification channel for alert message

---

## Option 2: Prometheus Alertmanager (More Advanced)

### Step 1: Install Alertmanager

```bash
# Download Alertmanager
docker pull prom/alertmanager:latest

# Create alertmanager config
mkdir -p backend/alertmanager
```

### Step 2: Create Alert Rules

Create `backend/prometheus/alerts.yml`:

```yaml
groups:
  - name: backend_alerts
    interval: 30s
    rules:
      # High Error Rate Alert
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec (threshold: 0.1)"

      # High Response Time Alert
      - alert: HighResponseTime
        expr: |
          rate(http_request_duration_seconds_sum[5m]) / 
          rate(http_request_duration_seconds_count[5m]) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time"
          description: "Average response time is {{ $value }}s (threshold: 2s)"

      # Backend Down Alert
      - alert: BackendDown
        expr: up{job="nodejs-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Backend is down"
          description: "Backend service is not responding"

      # High Request Rate Alert
      - alert: HighRequestRate
        expr: rate(http_requests_total[5m]) > 100
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High request rate"
          description: "Request rate is {{ $value }} req/sec (threshold: 100)"
```

### Step 3: Update Prometheus Config

Edit `backend/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# Add rule_files section
rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: 'nodejs-backend'
    static_configs:
      - targets: ['alliance-courtage-backend:3001']
    metrics_path: '/metrics'
    scrape_interval: 15s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

### Step 4: Create Alertmanager Config

Create `backend/alertmanager/config.yml`:

```yaml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://localhost:3001/api/alerts'
        send_resolved: true
    # Or use email
    # email_configs:
    #   - to: 'admin@example.com'
    #     from: 'alerts@example.com'
    #     smarthost: 'smtp.example.com:587'
    #     auth_username: 'user'
    #     auth_password: 'password'
```

### Step 5: Start Alertmanager

```bash
docker run -d \
  --name alertmanager \
  --network alliance-network \
  -p 9093:9093 \
  -v "$(pwd)/backend/alertmanager/config.yml:/etc/alertmanager/config.yml" \
  prom/alertmanager \
  --config.file=/etc/alertmanager/config.yml
```

### Step 6: Restart Prometheus with Alerts

```bash
# Stop and remove old Prometheus
docker stop prometheus
docker rm prometheus

# Start with alerts config
docker run -d \
  --name prometheus \
  --network alliance-network \
  -p 9090:9090 \
  -v "$(pwd)/backend/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml" \
  -v "$(pwd)/backend/prometheus/alerts.yml:/etc/prometheus/alerts.yml" \
  prom/prometheus \
  --config.file=/etc/prometheus/prometheus.yml
```

### Step 7: View Alerts

1. **Prometheus Alerts**: http://localhost:9090/alerts
2. **Alertmanager**: http://localhost:9093

---

## Quick Test Methods

### Test 1: Lower Threshold (Easiest)

1. In Grafana, edit your alert
2. Set threshold to `0.0001` (very low)
3. Save
4. Alert should fire immediately

### Test 2: Simulate High Error Rate

Create a test endpoint in your backend:

```javascript
// Add to server.js
app.get('/api/test-error', (req, res) => {
  res.status(500).json({ error: 'Test error for alerting' });
});
```

Then call it repeatedly:
```bash
for i in {1..100}; do curl http://localhost:3001/api/test-error; done
```

### Test 3: Stop Backend Container

```bash
docker stop alliance-courtage-backend
# Wait 2 minutes
# Alert should fire: "BackendDown"
docker start alliance-courtage-backend
```

### Test 4: Generate High Load

```bash
# Use Apache Bench or similar
ab -n 10000 -c 100 http://localhost:3001/api/health
```

---

## Example Alert Queries

### Error Rate Alert
```promql
rate(http_requests_total{status_code=~"5.."}[5m]) > 0.1
```

### Response Time Alert
```promql
rate(http_request_duration_seconds_sum[5m]) / 
rate(http_request_duration_seconds_count[5m]) > 2
```

### Memory Usage Alert
```promql
process_resident_memory_bytes > 500000000
```

### CPU Usage Alert
```promql
rate(process_cpu_user_seconds_total[5m]) > 0.8
```

### Request Rate Spike
```promql
rate(http_requests_total[5m]) > 100
```

---

## Notification Channels

### Email (Grafana)

1. Go to **Alerting** → **Notification channels**
2. Click **"Add channel"**
3. Type: `Email`
4. Enter your email
5. Configure SMTP settings
6. Test

### Webhook (Grafana)

1. Type: `Webhook`
2. URL: `http://your-server:3001/api/webhook`
3. Create endpoint in backend to receive alerts

### Slack (Grafana)

1. Type: `Slack`
2. Get webhook URL from Slack
3. Configure

---

## Testing Checklist

- [ ] Alert rule created
- [ ] Threshold set appropriately
- [ ] Notification channel configured
- [ ] Alert triggers when condition met
- [ ] Alert resolves when condition clears
- [ ] Notifications received
- [ ] Alert history visible

---

## Troubleshooting

### Alert Not Firing

1. Check query works: Test in Prometheus Graph
2. Check threshold: Lower it temporarily
3. Check evaluation time: Wait for evaluation period
4. Check alert state: Go to Alerting → Alert rules

### No Notifications

1. Check notification channel: Test it
2. Check webhook URL: Verify it's accessible
3. Check email config: Test SMTP settings
4. Check Alertmanager logs: `docker logs alertmanager`

### Alert Firing Too Often

1. Increase `for` duration
2. Increase threshold
3. Add more conditions
4. Use `group_wait` and `group_interval` in Alertmanager
