#!/bin/bash
# Script to update Nginx configuration to allow larger file uploads

echo "📝 Updating system Nginx configuration for alliance-courtage.org..."

# Backup the current config
sudo cp /etc/nginx/sites-available/alliance-courtage.org /etc/nginx/sites-available/alliance-courtage.org.backup

# Update the configuration to add client_max_body_size
sudo tee /etc/nginx/sites-available/alliance-courtage.org > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name alliance-courtage.org www.alliance-courtage.org;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name alliance-courtage.org www.alliance-courtage.org;
    
    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/alliance-courtage.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/alliance-courtage.org/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Allow large file uploads (5GB)
    client_max_body_size 5000M;
    
    # Logs
    access_log /var/log/nginx/alliance-courtage.access.log;
    error_log /var/log/nginx/alliance-courtage.error.log;
    
    # Proxy to frontend (static files)
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Proxy to backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Allow large file uploads for API
        client_max_body_size 5000M;
        
        # Timeouts for backend (increased for large uploads)
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
}
EOF

echo "✅ Configuration updated"
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration is valid"
    echo "🔄 Reloading Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Configuration test failed! Restoring backup..."
    sudo cp /etc/nginx/sites-available/alliance-courtage.org.backup /etc/nginx/sites-available/alliance-courtage.org
    echo "⚠️ Backup restored. Please check the configuration manually."
    exit 1
fi

echo "✅ Done! File upload limit is now 5GB (5000MB)"

