# Troubleshooting Connection Errors

## Issue: `net::ERR_CONNECTION_...` when trying to login

This means the frontend cannot reach the backend API.

### Fix Applied ✅
Updated `src/api.js` to use relative URLs in production:
- **Production**: `/api` (nginx proxies to backend)
- **Development**: `http://localhost:3001/api` (direct connection)

### Steps to Fix:

1. **Rebuild and redeploy the frontend** (after the fix):
   ```bash
   # On your EC2 server
   docker stop alliance-courtage-extranet
   docker rm alliance-courtage-extranet
   docker build -t alliance-courtage-frontend:latest .
   docker run -d \
     --name alliance-courtage-extranet \
     --network backend_alliance-network \
     -p 80:80 \
     --restart unless-stopped \
     alliance-courtage-frontend:latest
   ```

2. **Verify backend is running**:
   ```bash
   cd backend
   docker compose ps
   # Should show both mysql and backend running
   ```

3. **Test backend API directly**:
   ```bash
   curl http://localhost:3001/api/health
   # Should return: {"status":"OK",...}
   ```

4. **Test through nginx proxy** (from inside frontend container):
   ```bash
   docker exec alliance-courtage-extranet wget -qO- http://localhost/api/health
   # Or test from browser: http://your-server-ip/api/health
   ```

5. **Check nginx logs**:
   ```bash
   docker logs alliance-courtage-extranet
   ```

6. **Check backend logs**:
   ```bash
   cd backend
   docker compose logs backend
   ```

### Common Issues:

1. **Backend not running**: 
   - Start it: `cd backend && docker compose up -d`

2. **Wrong network**: 
   - Frontend must be on `backend_alliance-network`
   - Verify: `docker network inspect backend_alliance-network`

3. **Backend container name mismatch**:
   - Nginx looks for `alliance-courtage-backend`
   - Verify: `docker ps | grep backend`

4. **Port mismatch**:
   - Backend should be on port 3001
   - Check: `docker compose ps` in backend folder

### Quick Test Command:
```bash
# Test the full stack
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

