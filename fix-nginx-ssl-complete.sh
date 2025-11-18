#!/bin/bash

# Script complet pour corriger l'erreur SSL nginx
# Remplace complètement la configuration

set -e

CONTAINER_NAME="alliance-courtage-extranet"

echo "🔧 Correction complète de la configuration nginx..."

# Arrêter le conteneur
echo "⏹️  Arrêt du conteneur..."
docker stop ${CONTAINER_NAME} 2>/dev/null || true

# Vérifier que le conteneur existe
if ! docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Conteneur ${CONTAINER_NAME} non trouvé"
    exit 1
fi

# Créer la configuration HTTP uniquement (sans SSL)
echo "📝 Création de la nouvelle configuration..."
cat > /tmp/nginx-default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json application/xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # API Backend - Proxy vers Node.js
    location /api {
        proxy_pass http://alliance-courtage-backend:3001;
        proxy_http_version 1.1;
        
        # Headers pour éviter le cache sur les réponses API
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
        
        # Headers pour le proxy
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Désactiver le cache proxy
        proxy_no_cache 1;
        proxy_cache_bypass 1;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Serveur les fichiers uploads
    location /uploads {
        proxy_pass http://alliance-courtage-backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend - Routes React (SPA)
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache pour index.html (pas de cache)
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }

    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Bloquer l'accès aux fichiers sensibles
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Logs
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
}
EOF

# Copier la configuration dans le conteneur
echo "📤 Copie de la configuration dans le conteneur..."
docker cp /tmp/nginx-default.conf ${CONTAINER_NAME}:/etc/nginx/conf.d/default.conf

# Vérifier qu'il n'y a pas d'autres fichiers de config avec SSL
echo "🔍 Vérification des autres fichiers de configuration..."
docker exec ${CONTAINER_NAME} sh -c 'find /etc/nginx -name "*.conf" -type f' 2>/dev/null || true

# Démarrer le conteneur
echo "🚀 Démarrage du conteneur..."
docker start ${CONTAINER_NAME}

# Attendre que le conteneur démarre
echo "⏳ Attente du démarrage..."
sleep 5

# Vérifier l'état
echo ""
echo "📊 État du conteneur:"
docker ps | grep ${CONTAINER_NAME} || docker ps -a | grep ${CONTAINER_NAME}

# Tester la configuration
echo ""
echo "🧪 Test de la configuration nginx..."
if docker exec ${CONTAINER_NAME} nginx -t 2>&1; then
    echo "✅ Configuration nginx valide"
else
    echo "❌ Erreur dans la configuration"
    echo ""
    echo "📋 Contenu actuel du fichier de configuration:"
    docker exec ${CONTAINER_NAME} cat /etc/nginx/conf.d/default.conf
    echo ""
    echo "📋 Logs du conteneur:"
    docker logs ${CONTAINER_NAME} --tail 30
    exit 1
fi

# Vérifier les logs
echo ""
echo "📋 Derniers logs:"
docker logs ${CONTAINER_NAME} --tail 10

# Nettoyer
rm -f /tmp/nginx-default.conf

echo ""
echo "✅ Correction terminée !"
echo "📝 Le conteneur devrait maintenant fonctionner sans erreur SSL"

