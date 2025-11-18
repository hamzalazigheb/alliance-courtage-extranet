#!/bin/bash

# Script pour corriger la configuration nginx (fonctionne même si le conteneur est arrêté)

set -e

echo "🔧 Correction de la configuration nginx..."

CONTAINER_NAME="alliance-courtage-extranet"

# Vérifier si le conteneur existe
if ! docker ps -a --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Conteneur ${CONTAINER_NAME} non trouvé"
    exit 1
fi

# Créer le fichier de configuration temporaire
cat > /tmp/nginx-default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    location /api {
        proxy_pass http://alliance-courtage-backend:3001;
        proxy_http_version 1.1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_no_cache 1;
        proxy_cache_bypass 1;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /uploads {
        proxy_pass http://alliance-courtage-backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        try_files $uri $uri/ /index.html;
        
        location = /index.html {
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Copier le fichier dans le conteneur (même s'il est arrêté)
echo "📝 Copie de la configuration dans le conteneur..."
docker cp /tmp/nginx-default.conf ${CONTAINER_NAME}:/etc/nginx/conf.d/default.conf

# Nettoyer le fichier temporaire
rm /tmp/nginx-default.conf

echo "✅ Configuration copiée"

# Démarrer le conteneur
echo "🚀 Démarrage du conteneur..."
docker start ${CONTAINER_NAME}

# Attendre un peu
sleep 3

# Tester la configuration
echo "🧪 Test de la configuration nginx..."
if docker exec ${CONTAINER_NAME} nginx -t 2>/dev/null; then
    echo "✅ Configuration nginx valide"
else
    echo "⚠️  Erreur dans la configuration, voir les logs:"
    docker logs ${CONTAINER_NAME} --tail 20
    exit 1
fi

# Vérifier l'état
echo ""
echo "📊 État du conteneur:"
docker ps | grep ${CONTAINER_NAME} || docker ps -a | grep ${CONTAINER_NAME}

echo ""
echo "✅ Correction terminée !"
echo "📝 Vérifiez que le conteneur est 'Up' et non 'Restarting'"

