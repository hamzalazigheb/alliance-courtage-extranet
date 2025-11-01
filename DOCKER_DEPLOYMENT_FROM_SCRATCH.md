# 🐳 Guide de Déploiement Docker - De Zéro à la Production

## 📋 Table des Matières

1. [Prérequis](#1-prérequis)
2. [Architecture Docker](#2-architecture-docker)
3. [Configuration des Dockerfiles](#3-configuration-des-dockerfiles)
4. [Configuration docker-compose](#4-configuration-docker-compose)
5. [Variables d'Environnement](#5-variables-denvironnement)
6. [Premier Déploiement](#6-premier-déploiement)
7. [Déploiement Automatique](#7-déploiement-automatique)
8. [Mise à Jour](#8-mise-à-jour)
9. [Monitoring](#9-monitoring)
10. [Dépannage](#10-dépannage)

---

## 1. Prérequis

### 1.1 Sur votre Machine Locale

- ✅ Docker Desktop (Windows/Mac) ou Docker Engine (Linux)
- ✅ Docker Compose v2+
- ✅ Git
- ✅ Terminal/SSH client

### 1.2 Sur le Serveur

- ✅ Ubuntu 20.04+ ou 22.04 LTS
- ✅ Docker installé
- ✅ Docker Compose installé
- ✅ Accès root/sudo
- ✅ Minimum 2GB RAM, 20GB disque

---

## 2. Architecture Docker

```
┌─────────────────────────────────────────┐
│         Frontend Container               │
│         (Nginx + React Build)            │
│         Port: 80/443                      │
└────────────────┬─────────────────────────┘
                 │
                 │ /api → proxy
                 │
┌────────────────▼─────────────────────────┐
│         Backend Container                 │
│         (Node.js + Express)                │
│         Port: 3001 (interne)               │
└────────────────┬─────────────────────────┘
                 │
                 │ Connection MySQL
                 │
┌────────────────▼─────────────────────────┐
│         MySQL Container                   │
│         Port: 3306 (interne)              │
│         Volume: mysql_data                │
└───────────────────────────────────────────┘
```

---

## 3. Configuration des Dockerfiles

### 3.1 Dockerfile Backend

Le fichier `backend/Dockerfile` devrait contenir :

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le code source
COPY . .

# Créer les dossiers uploads
RUN mkdir -p uploads/structured-products \
    uploads/partners-logos \
    uploads/financial-documents \
    uploads/cms-content

# Exposer le port
EXPOSE 3001

# Commande de démarrage
CMD ["node", "server.js"]
```

### 3.2 Dockerfile Frontend

Le fichier `Dockerfile` (racine) devrait contenir :

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le code source
COPY . .

# Build de production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copier les fichiers build
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 3.3 Vérifier les Dockerfiles Existants

Vérifiez que vos Dockerfiles correspondent à cette structure.

---

## 4. Configuration docker-compose

### 4.1 Structure docker-compose.yml

Le fichier `backend/docker-compose.yml` devrait contenir :

```yaml
version: '3.8'

services:
  # Base de données MySQL
  mysql:
    image: mysql:8.0
    container_name: alliance-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-alliance2024}
      MYSQL_DATABASE: ${DB_NAME:-alliance_courtage}
      MYSQL_USER: ${DB_USER:-alliance_user}
      MYSQL_PASSWORD: ${DB_PASSWORD:-alliance_pass}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - alliance-network
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_ROOT_PASSWORD:-alliance2024}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s

  # Backend API
  backend:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: alliance-backend
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${DB_NAME:-alliance_courtage}
      DB_USER: ${DB_USER:-alliance_user}
      DB_PASSWORD: ${DB_PASSWORD:-alliance_pass}
      JWT_SECRET: ${JWT_SECRET:-alliance_courtage_secret_key_2024}
      JWT_EXPIRES_IN: 24h
      CORS_ORIGIN: ${CORS_ORIGIN:-http://localhost}
      UPLOAD_PATH: ./uploads
      MAX_FILE_SIZE: 10485760
      # SMTP
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_SECURE: ${SMTP_SECURE:-false}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      SMTP_FROM: ${SMTP_FROM:-noreply@alliance-courtage.fr}
      FRONTEND_URL: ${FRONTEND_URL:-http://localhost}
    volumes:
      - ./uploads:/app/uploads
      - ./config.env:/app/config.env:ro
    networks:
      - alliance-network
    depends_on:
      mysql:
        condition: service_healthy

volumes:
  mysql_data:

networks:
  alliance-network:
    driver: bridge
```

---

## 5. Variables d'Environnement

### 5.1 Créer .env pour Docker

Créez `backend/.env` :

```env
# Base de données
DB_ROOT_PASSWORD=TRES_FORT_MOT_DE_PASSE_ROOT
DB_NAME=alliance_courtage
DB_USER=alliance_user
DB_PASSWORD=TRES_FORT_MOT_DE_PASSE_USER

# Backend
JWT_SECRET=TRES_LONG_SECRET_UNIQUE_ET_ALEATOIRE_2024
JWT_EXPIRES_IN=24h
NODE_ENV=production
CORS_ORIGIN=https://votre-domaine.com

# SMTP (Production)
SMTP_HOST=email-smtp.eu-west-3.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=VOTRE_SMTP_USER
SMTP_PASSWORD=VOTRE_SMTP_PASSWORD
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=https://votre-domaine.com
```

### 5.2 Créer config.env pour Backend

Créez aussi `backend/config.env` (utilisé par le code) :

```env
DB_HOST=mysql
DB_PORT=3306
DB_NAME=alliance_courtage
DB_USER=alliance_user
DB_PASSWORD=TRES_FORT_MOT_DE_PASSE_USER
PORT=3001
NODE_ENV=production
JWT_SECRET=TRES_LONG_SECRET_UNIQUE_ET_ALEATOIRE_2024
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://votre-domaine.com
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
SMTP_HOST=email-smtp.eu-west-3.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=VOTRE_SMTP_USER
SMTP_PASSWORD=VOTRE_SMTP_PASSWORD
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=https://votre-domaine.com
```

**⚠️ Important :** `DB_HOST=mysql` (nom du service Docker, pas `localhost`)

---

## 6. Premier Déploiement

### Étape 6.1 : Installer Docker sur le Serveur

```bash
# Se connecter au serveur
ssh ubuntu@VOTRE_IP_SERVEUR

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo apt install -y docker-compose

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Redémarrer la session (déconnexion/reconnexion)
exit
```

**Reconnectez-vous** pour que les permissions Docker prennent effet.

### Étape 6.2 : Cloner le Code sur le Serveur

```bash
# Sur le serveur
cd /var/www
sudo mkdir -p alliance-courtage
sudo chown -R $USER:$USER /var/www/alliance-courtage
cd alliance-courtage

# Cloner le repository
git clone https://github.com/votre-username/alliance-courtage.git .

# Ou uploader via SCP/FTP
```

### Étape 6.3 : Configurer les Variables d'Environnement

```bash
cd /var/www/alliance-courtage/backend

# Créer .env
nano .env
# (Copiez et adaptez les variables)

# Créer config.env
nano config.env
# (Copiez et adaptez les variables)

# Créer les dossiers uploads
mkdir -p uploads/structured-products
mkdir -p uploads/partners-logos
mkdir -p uploads/financial-documents
mkdir -p uploads/cms-content
```

### Étape 6.4 : Build et Démarrer les Services

```bash
cd /var/www/alliance-courtage/backend

# Build et démarrer MySQL + Backend
docker compose up -d --build

# Vérifier que les containers démarrent
docker compose ps

# Vérifier les logs
docker compose logs -f
```

### Étape 6.5 : Initialiser la Base de Données

```bash
cd /var/www/alliance-courtage/backend

# Attendre que MySQL soit prêt
sleep 20

# Initialiser la base de données
docker compose exec backend node scripts/initDatabase.js

# Exécuter les migrations
docker compose exec backend node scripts/runAllMigrations.js
```

### Étape 6.6 : Build et Démarrer le Frontend

```bash
cd /var/www/alliance-courtage

# Build le frontend
docker build -t alliance-frontend:latest .

# Démarrer le frontend (sur le même réseau)
docker run -d \
  --name alliance-frontend \
  --network backend_alliance-network \
  -p 80:80 \
  -p 443:443 \
  --restart unless-stopped \
  alliance-frontend:latest
```

### Étape 6.7 : Vérifier le Déploiement

```bash
# Vérifier tous les containers
docker ps

# Devrait afficher :
# - alliance-mysql
# - alliance-backend
# - alliance-frontend

# Tester le backend
curl http://localhost:3001/api/health

# Vérifier les logs
docker logs alliance-backend
docker logs alliance-frontend
```

---

## 7. Déploiement Automatique avec deploy.sh

### Étape 7.1 : Utiliser le Script deploy.sh

Le script `deploy.sh` existe déjà et fait tout automatiquement !

```bash
# Sur le serveur, dans le répertoire du projet
cd /var/www/alliance-courtage

# Rendre exécutable
chmod +x deploy.sh

# Exécuter
./deploy.sh
```

### Étape 7.2 : Ce que fait deploy.sh

1. ✅ Arrête les containers existants
2. ✅ Build les images backend (MySQL + Backend)
3. ✅ Démarre les services backend
4. ✅ Attend que MySQL soit prêt
5. ✅ Exécute les migrations
6. ✅ Build le frontend
7. ✅ Démarre le frontend
8. ✅ Nettoie les anciennes images
9. ✅ Affiche le statut

---

## 8. Configuration Nginx pour Docker

### 8.1 nginx.conf (Frontend)

Votre `nginx.conf` devrait être :

```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy API requests to backend
    location /api {
        proxy_pass http://alliance-backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serveur les fichiers uploads
    location /uploads {
        proxy_pass http://alliance-backend:3001;
        proxy_set_header Host $host;
    }

    # Serve static files (React SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**⚠️ Important :** `http://alliance-backend:3001` (nom du service Docker)

---

## 9. Déploiement Automatique Amélioré

### 9.1 Script deploy.sh Amélioré

Je vais améliorer votre `deploy.sh` existant pour qu'il soit plus robuste :

**Modifications nécessaires :**
- Vérifier que Docker est installé
- Gérer les variables d'environnement
- Meilleure gestion des erreurs
- Backup avant déploiement (optionnel)

---

## 10. Mise à Jour de l'Application

### Processus de Mise à Jour

```bash
# Sur le serveur
cd /var/www/alliance-courtage

# Méthode 1 : Utiliser deploy.sh
./deploy.sh

# Méthode 2 : Manuelle
git pull origin main
cd backend
docker compose down
docker compose build --no-cache
docker compose up -d
sleep 15
docker compose exec backend node scripts/runAllMigrations.js
cd ..
docker build -t alliance-frontend:latest .
docker stop alliance-frontend
docker rm alliance-frontend
docker run -d --name alliance-frontend --network backend_alliance-network -p 80:80 --restart unless-stopped alliance-frontend:latest
```

---

## 11. Monitoring et Logs

### Commandes Utiles

```bash
# Voir tous les containers
docker ps

# Logs backend
docker logs -f alliance-backend

# Logs frontend
docker logs -f alliance-frontend

# Logs MySQL
docker logs -f alliance-mysql

# Logs docker-compose (tous les services)
cd backend
docker compose logs -f

# Utilisation des ressources
docker stats

# Entrer dans un container
docker exec -it alliance-backend sh
```

---

## 12. Configuration SSL/HTTPS avec Docker

### Option 1 : Nginx Reverse Proxy Externe

Installer Nginx sur l'hôte (pas dans Docker) pour gérer SSL :

```bash
# Installer Nginx sur l'hôte
sudo apt install -y nginx certbot python3-certbot-nginx

# Configuration Nginx sur l'hôte
sudo nano /etc/nginx/sites-available/alliance-courtage
```

**Configuration :**

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2 : Traefik (Alternative Moderne)

Utiliser Traefik comme reverse proxy pour gérer automatiquement SSL.

---

## 13. Backup avec Docker

### Script de Backup

Créez `backup-docker.sh` :

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/alliance-courtage"

mkdir -p $BACKUP_DIR

# Backup base de données
docker exec alliance-mysql mysqldump -u alliance_user -p'PASSWORD' alliance_courtage > $BACKUP_DIR/db_$DATE.sql

# Backup volumes uploads
docker run --rm \
  -v alliance-courtage_uploads:/data \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/uploads_$DATE.tar.gz -C /data .

# Supprimer les backups de plus de 30 jours
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup terminé: $DATE"
```

---

## 14. Dépannage Docker

### Problème : Containers ne démarrent pas

```bash
# Vérifier les logs
docker compose logs

# Vérifier la configuration
docker compose config

# Redémarrer
docker compose restart
```

### Problème : MySQL ne démarre pas

```bash
# Vérifier les logs MySQL
docker logs alliance-mysql

# Vérifier les volumes
docker volume ls

# Supprimer et recréer (ATTENTION : perte de données !)
docker compose down -v
docker compose up -d
```

### Problème : Backend ne se connecte pas à MySQL

```bash
# Vérifier que MySQL est prêt
docker exec alliance-mysql mysqladmin ping -h localhost -u root -p

# Vérifier les variables d'environnement
docker exec alliance-backend env | grep DB_

# Vérifier le réseau Docker
docker network inspect backend_alliance-network
```

### Problème : Frontend ne charge pas

```bash
# Vérifier les logs
docker logs alliance-frontend

# Vérifier que le build a réussi
docker images | grep alliance-frontend

# Rebuild le frontend
docker build -t alliance-frontend:latest .
docker restart alliance-frontend
```

---

## 15. Checklist Déploiement Docker

### Pré-déploiement

- [ ] Docker installé sur le serveur
- [ ] Docker Compose installé
- [ ] Code cloné sur le serveur
- [ ] `.env` configuré dans `backend/.env`
- [ ] `config.env` configuré dans `backend/config.env`

### Déploiement

- [ ] `docker compose up -d` exécuté (backend)
- [ ] Containers MySQL et Backend démarrés
- [ ] Base de données initialisée
- [ ] Migrations exécutées
- [ ] Frontend build (`docker build`)
- [ ] Frontend container démarré
- [ ] Tous les containers en cours d'exécution (`docker ps`)

### Vérification

- [ ] Backend répond : `curl http://localhost:3001/api/health`
- [ ] Frontend accessible : `http://VOTRE_IP`
- [ ] API fonctionne : `/api/` routes accessibles
- [ ] Uploads fonctionnent
- [ ] Logs vérifiés (pas d'erreurs)

---

## 16. Commandes Rapides Docker

### Gestion des Containers

```bash
# Démarrer tout
cd backend && docker compose up -d

# Arrêter tout
cd backend && docker compose down

# Redémarrer
cd backend && docker compose restart

# Rebuild et redémarrer
cd backend && docker compose up -d --build

# Voir le statut
docker ps
docker compose ps
```

### Logs

```bash
# Logs backend
docker logs -f alliance-backend

# Logs tous les services
cd backend && docker compose logs -f

# Logs des 100 dernières lignes
docker logs --tail 100 alliance-backend
```

### Maintenance

```bash
# Nettoyer les images inutilisées
docker image prune -a

# Nettoyer tout (ATTENTION : supprime containers arrêtés)
docker system prune -a

# Voir l'utilisation disque
docker system df
```

---

## 17. Script de Déploiement Automatique

Votre `deploy.sh` actuel est déjà bon ! Voici comment l'améliorer :

**Améliorations possibles :**
- Vérifier Docker avant de commencer
- Backup automatique avant déploiement
- Rollback en cas d'erreur
- Notifications (email, Slack, etc.)

---

## 18. Architecture de Production Recommandée

```
Internet
   │
   ▼
Load Balancer (Optionnel)
   │
   ▼
Nginx (Host - SSL/HTTPS)
   │
   ├─► Frontend Container (Port 80)
   │       │
   │       └─► /api → proxy
   │
   └─► Backend Container (Port 3001 interne)
           │
           └─► MySQL Container (Port 3306 interne)
```

---

## ✅ Résumé - Déploiement Docker

### Étapes Essentielles :

1. **Installation Docker** sur serveur
2. **Clone du code** sur `/var/www/alliance-courtage`
3. **Configuration** `.env` et `config.env`
4. **Déploiement** : `./deploy.sh`
5. **Vérification** : Containers démarrés, site accessible

### Commandes Principales :

```bash
# Déploiement complet
cd /var/www/alliance-courtage
./deploy.sh

# Ou manuellement
cd backend
docker compose up -d --build
cd ..
docker build -t alliance-frontend .
docker run -d --name alliance-frontend --network backend_alliance-network -p 80:80 alliance-frontend
```

---

**🎉 Avec Docker, le déploiement est simple et reproductible !**

