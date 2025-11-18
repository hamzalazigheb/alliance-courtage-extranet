# 🔧 Fix : Erreur SSL dans nginx

## Problème

```
nginx: [emerg] cannot load certificate "/etc/letsencrypt/live/votre-domaine.com/fullchain.pem"
```

Le conteneur nginx essaie de charger un certificat SSL qui n'existe pas.

## Solution : Utiliser la configuration HTTP uniquement

### Étape 1 : Arrêter le conteneur

```bash
docker stop alliance-courtage-extranet
```

### Étape 2 : Copier la configuration HTTP uniquement

```bash
cd ~/alliance/alliance

# Copier la nouvelle configuration (sans SSL)
docker cp nginx-production-http-only.conf alliance-courtage-extranet:/etc/nginx/conf.d/default.conf
```

**OU** si le fichier n'existe pas encore sur le serveur, créez-le :

```bash
# Créer le fichier directement dans le conteneur
docker exec alliance-courtage-extranet sh -c 'cat > /etc/nginx/conf.d/default.conf << "EOF"
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /api {
        proxy_pass http://host.docker.internal:3001;
        proxy_http_version 1.1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_no_cache 1;
        proxy_cache_bypass 1;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF'
```

### Étape 3 : Tester la configuration

```bash
docker exec alliance-courtage-extranet nginx -t
```

### Étape 4 : Redémarrer le conteneur

```bash
docker start alliance-courtage-extranet
```

### Étape 5 : Vérifier

```bash
docker ps | grep alliance-courtage-extranet
# Devrait afficher "Up" au lieu de "Restarting"
```

## Solution Alternative : Utiliser l'IP du backend

Si `host.docker.internal` ne fonctionne pas, utilisez l'IP du conteneur backend :

```bash
# Trouver l'IP du backend
BACKEND_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' alliance-courtage-backend)
echo "Backend IP: $BACKEND_IP"

# Modifier la configuration pour utiliser cette IP
docker exec alliance-courtage-extranet sed -i "s|http://host.docker.internal:3001|http://$BACKEND_IP:3001|g" /etc/nginx/conf.d/default.conf
```

## Solution Complète (Copier-Coller)

```bash
# 1. Arrêter le conteneur
docker stop alliance-courtage-extranet

# 2. Créer la configuration HTTP uniquement
docker exec alliance-courtage-extranet sh -c 'cat > /etc/nginx/conf.d/default.conf << "EOF"
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location /api {
        proxy_pass http://host.docker.internal:3001;
        proxy_http_version 1.1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_no_cache 1;
        proxy_cache_bypass 1;
    }

    location /uploads {
        proxy_pass http://host.docker.internal:3001;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF'

# 3. Tester
docker exec alliance-courtage-extranet nginx -t

# 4. Démarrer
docker start alliance-courtage-extranet

# 5. Vérifier
sleep 2
docker ps | grep alliance-courtage-extranet
```

## Si host.docker.internal ne fonctionne pas

Utilisez l'IP du réseau Docker :

```bash
# Trouver l'IP du backend dans le réseau Docker
BACKEND_IP=$(docker inspect alliance-courtage-backend | grep -A 20 "Networks" | grep "IPAddress" | head -1 | cut -d'"' -f4)
echo "Backend IP: $BACKEND_IP"

# Ou utiliser le nom du conteneur si sur le même réseau
# Dans la config, remplacer host.docker.internal par alliance-courtage-backend
```

---

**Note** : Cette configuration fonctionne en HTTP uniquement. Pour ajouter SSL plus tard, il faudra configurer Let's Encrypt.

