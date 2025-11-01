# 🚀 Guide de Déploiement Complet - De Zéro à la Production

## 📋 Table des Matières

1. [Prérequis](#1-prérequis)
2. [Préparation du Code](#2-préparation-du-code)
3. [Build de l'Application](#3-build-de-lapplication)
4. [Configuration du Serveur](#4-configuration-du-serveur)
5. [Déploiement Backend](#5-déploiement-backend)
6. [Déploiement Frontend](#6-déploiement-frontend)
7. [Configuration Nginx](#7-configuration-nginx)
8. [Configuration SSL/HTTPS](#8-configuration-sslhttps)
9. [Vérification](#9-vérification)
10. [Maintenance](#10-maintenance)

---

## 1. Prérequis

### 1.1 Logiciels Nécessaires

**Sur votre machine locale :**
- ✅ Node.js 18+ (`node --version`)
- ✅ npm (`npm --version`)
- ✅ Git (`git --version`)
- ✅ Docker (optionnel, pour déploiement avec Docker)
- ✅ SSH client (Termius, PuTTY, ou terminal intégré)

**Sur le serveur :**
- ✅ Ubuntu 20.04+ ou 22.04 LTS
- ✅ Accès root/sudo
- ✅ Minimum 2GB RAM
- ✅ 20GB espace disque

### 1.2 Comptes/Services Requis

- ✅ Serveur (EC2, VPS, ou serveur dédié)
- ✅ Nom de domaine (optionnel mais recommandé)
- ✅ Base de données MySQL (locale ou RDS)
- ✅ Service email (Mailtrap pour dev, AWS SES pour production)

---

## 2. Préparation du Code

### Étape 2.1 : Vérifier le Code Local

```bash
# Assurez-vous d'être dans le répertoire du projet
cd C:\Users\Hamza\Desktop\saveweb2zip-com-www-extranet-gnca-fr

# Vérifier que tout est commité
git status

# Si des modifications non commitées, les commit :
git add .
git commit -m "Prepare for deployment"
```

### Étape 2.2 : Créer un Repository Git (si pas déjà fait)

```bash
# Initialiser Git (si pas déjà fait)
git init

# Ajouter le remote (remplacez par votre URL)
git remote add origin https://github.com/votre-username/alliance-courtage.git

# Push le code
git push -u origin main
```

### Étape 2.3 : Créer un Fichier .env pour Production

Créez `backend/config.prod.env` :

```env
# Base de données (Production)
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alliance_courtage
DB_USER=alliance_user
DB_PASSWORD=VOTRE_MOT_DE_PASSE_DB_FORT

# Serveur
PORT=3001
NODE_ENV=production

# JWT (CHANGEZ EN PRODUCTION !)
JWT_SECRET=VOTRE_SECRET_JWT_TRES_FORT_ET_UNIQUE_2024
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=https://votre-domaine.com

# Uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Configuration SMTP (Production - AWS SES ou autre)
SMTP_HOST=email-smtp.eu-west-3.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=VOTRE_SMTP_USER
SMTP_PASSWORD=VOTRE_SMTP_PASSWORD
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=https://votre-domaine.com
```

### Étape 2.4 : Vérifier .gitignore

Assurez-vous que `backend/.gitignore` contient :

```
config.env
config.prod.env
.env
*.log
node_modules/
uploads/
.DS_Store
```

---

## 3. Build de l'Application

### Étape 3.1 : Build du Frontend

**Localement :**

```bash
# Dans le répertoire racine
npm install
npm run build
```

**Résultat :** Dossier `dist/` créé avec les fichiers statiques

### Étape 3.2 : Vérifier le Build

```bash
# Vérifier que dist/ existe
ls -la dist/

# Tester le build localement
npm run preview
```

### Étape 3.3 : Préparer le Backend

```bash
cd backend

# Installer les dépendances
npm install

# Vérifier que tout fonctionne
npm start
# (Testez que le serveur démarre correctement)
```

---

## 4. Configuration du Serveur

### Étape 4.1 : Choisir votre Serveur

**Options :**
1. **AWS EC2** (Cloud)
2. **VPS** (DigitalOcean, Linode, OVH, etc.)
3. **Serveur dédié**
4. **Docker** (sur n'importe quel serveur)

### Étape 4.2 : Créer/Accéder au Serveur

**Si EC2 :**
1. Créez une instance EC2 Ubuntu 22.04
2. Configurez le Security Group (ports 22, 80, 443)
3. Téléchargez la clé .pem
4. Notez l'IP publique

**Si VPS/Serveur :**
1. Créez votre serveur
2. Notez l'IP et les identifiants SSH

### Étape 4.3 : Se Connecter au Serveur

```bash
# Windows (PowerShell ou Termius)
ssh -i "alliance-key.pem" ubuntu@VOTRE_IP_SERVEUR

# Ou avec Termius/putty (plus simple)
# Entrez l'IP et la clé
```

---

## 5. Configuration Initiale du Serveur

### Étape 5.1 : Mise à Jour du Système

```bash
# Se connecter au serveur
ssh ubuntu@VOTRE_IP

# Mettre à jour
sudo apt update
sudo apt upgrade -y

# Installer les outils de base
sudo apt install -y curl wget git build-essential
```

### Étape 5.2 : Installer Node.js

```bash
# Installer Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier
node --version  # Doit être 18.x ou supérieur
npm --version
```

### Étape 5.3 : Installer MySQL

```bash
# Installer MySQL
sudo apt install -y mysql-server

# Sécuriser MySQL
sudo mysql_secure_installation

# Créer la base de données
sudo mysql -u root -p

# Dans MySQL :
CREATE DATABASE alliance_courtage;
CREATE USER 'alliance_user'@'localhost' IDENTIFIED BY 'VOTRE_MOT_DE_PASSE_FORT';
GRANT ALL PRIVILEGES ON alliance_courtage.* TO 'alliance_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Étape 5.4 : Installer PM2 (Gestionnaire de Processus)

```bash
# Installer PM2 globalement
sudo npm install -g pm2

# Configurer PM2 pour démarrer au boot
pm2 startup
# (Copiez et exécutez la commande affichée)
```

### Étape 5.5 : Installer Nginx

```bash
# Installer Nginx
sudo apt install -y nginx

# Démarrer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Vérifier
sudo systemctl status nginx
```

---

## 6. Déploiement du Code

### Étape 6.1 : Cloner le Repository

```bash
# Sur le serveur
cd /var/www
sudo mkdir -p alliance-courtage
sudo chown -R $USER:$USER /var/www/alliance-courtage
cd alliance-courtage

# Cloner le repository
git clone https://github.com/votre-username/alliance-courtage.git .

# Ou si vous préférez uploader manuellement :
# Utilisez scp ou FTP
```

### Étape 6.2 : Configuration Backend

```bash
cd /var/www/alliance-courtage/backend

# Installer les dépendances
npm install --production

# Créer config.env pour production
nano config.env
# (Copiez le contenu de config.prod.env et adaptez)

# Créer le dossier uploads
mkdir -p uploads/structured-products
mkdir -p uploads/partners-logos
mkdir -p uploads/financial-documents
mkdir -p uploads/cms-content
```

### Étape 6.3 : Initialiser la Base de Données

```bash
cd /var/www/alliance-courtage/backend

# Initialiser la base de données
node scripts/initDatabase.js

# Exécuter les migrations
node scripts/runAllMigrations.js

# Créer un admin (si nécessaire)
node scripts/resetAdminPassword.js
```

### Étape 6.4 : Démarrer le Backend avec PM2

```bash
cd /var/www/alliance-courtage/backend

# Démarrer avec PM2
pm2 start server.js --name "alliance-backend"

# Sauvegarder la configuration PM2
pm2 save

# Vérifier le statut
pm2 status
pm2 logs alliance-backend
```

---

## 7. Build et Déploiement Frontend

### Étape 7.1 : Build du Frontend sur le Serveur

```bash
cd /var/www/alliance-courtage

# Installer les dépendances
npm install

# Build de production
npm run build

# Vérifier que dist/ existe
ls -la dist/
```

### Étape 7.2 : Modifier l'URL API pour Production

Avant de builder, modifiez `src/api.js` pour utiliser l'URL de production :

```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://votre-domaine.com/api'  // Production
  : 'http://localhost:3001/api';     // Développement
```

### Étape 7.3 : Copier les Fichiers Build

```bash
# Créer le répertoire pour Nginx
sudo mkdir -p /var/www/alliance-courtage-frontend

# Copier les fichiers build
sudo cp -r /var/www/alliance-courtage/dist/* /var/www/alliance-courtage-frontend/

# Donner les permissions
sudo chown -R www-data:www-data /var/www/alliance-courtage-frontend
```

---

## 8. Configuration Nginx

### Étape 8.1 : Créer la Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/alliance-courtage
```

**Contenu :**

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Redirection HTTPS (une fois SSL configuré)
    # return 301 https://$server_name$request_uri;

    # Frontend
    root /var/www/alliance-courtage-frontend;
    index index.html;

    # Gérer les routes React (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Serveur les fichiers statiques uploads
    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
    }

    # Cache pour les assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Étape 8.2 : Activer le Site

```bash
# Créer le lien symbolique
sudo ln -s /etc/nginx/sites-available/alliance-courtage /etc/nginx/sites-enabled/

# Supprimer la configuration par défaut (optionnel)
sudo rm /etc/nginx/sites-enabled/default

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## 9. Configuration SSL/HTTPS (Let's Encrypt)

### Étape 9.1 : Installer Certbot

```bash
# Installer Certbot
sudo apt install -y certbot python3-certbot-nginx
```

### Étape 9.2 : Obtenir un Certificat SSL

```bash
# Obtenir et installer le certificat
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com

# Suivez les instructions :
# - Entrez votre email
# - Acceptez les conditions
# - Choisissez de rediriger HTTP vers HTTPS (recommandé)
```

### Étape 9.3 : Renouvellement Automatique

Le renouvellement est automatique avec Certbot, mais vous pouvez tester :

```bash
# Tester le renouvellement
sudo certbot renew --dry-run
```

---

## 10. Vérification Finale

### Étape 10.1 : Vérifier le Backend

```bash
# Vérifier que le backend tourne
pm2 status

# Vérifier les logs
pm2 logs alliance-backend --lines 50

# Tester l'API
curl http://localhost:3001/api/health
```

### Étape 10.2 : Vérifier le Frontend

1. Ouvrez votre navigateur
2. Allez sur `http://VOTRE_IP` ou `https://votre-domaine.com`
3. Vérifiez que l'application se charge

### Étape 10.3 : Tester les Fonctionnalités

- ✅ Page de login
- ✅ Connexion
- ✅ Navigation entre les pages
- ✅ Upload de fichiers
- ✅ Réinitialisation de mot de passe (testez avec Mailtrap d'abord)

---

## 11. Déploiement avec Docker (Alternative)

### Étape 11.1 : Installer Docker sur le Serveur

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo apt install -y docker-compose

# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Redémarrer la session (déconnexion/reconnexion)
```

### Étape 11.2 : Déployer avec Docker

```bash
# Sur le serveur
cd /var/www/alliance-courtage

# Modifier les variables dans docker-compose.yml si nécessaire

# Démarrer tous les services
cd backend
docker compose up -d

# Build et démarrer le frontend
cd ..
docker build -t alliance-frontend .
docker run -d -p 80:80 --name alliance-frontend alliance-frontend

# Vérifier
docker ps
```

---

## 12. Script de Déploiement Automatique

### Créer un Script de Déploiement

Créez `deploy-production.sh` sur le serveur :

```bash
#!/bin/bash
set -e

echo "🚀 Déploiement en production..."

# Aller dans le répertoire
cd /var/www/alliance-courtage

# Pull les dernières modifications
git pull origin main

# Backend
cd backend
npm install --production
pm2 restart alliance-backend

# Frontend
cd ..
npm install
npm run build
sudo cp -r dist/* /var/www/alliance-courtage-frontend/

# Redémarrer Nginx
sudo systemctl reload nginx

echo "✅ Déploiement terminé!"
```

**Rendre exécutable :**
```bash
chmod +x deploy-production.sh
```

**Utilisation :**
```bash
./deploy-production.sh
```

---

## 13. Variables d'Environnement de Production

### Checklist des Variables

Assurez-vous que toutes ces variables sont configurées :

```env
# ✅ Base de données
DB_HOST=localhost
DB_USER=alliance_user
DB_PASSWORD=TRES_FORT_ET_UNIQUE
DB_NAME=alliance_courtage

# ✅ Sécurité
JWT_SECRET=TRES_LONG_ET_ALEATOIRE
NODE_ENV=production

# ✅ URLs
CORS_ORIGIN=https://votre-domaine.com
FRONTEND_URL=https://votre-domaine.com

# ✅ SMTP (Production)
SMTP_HOST=email-smtp.eu-west-3.amazonaws.com
SMTP_USER=...
SMTP_PASSWORD=...
```

---

## 14. Sécurité Production

### Checklist Sécurité

- [ ] **Changer tous les mots de passe par défaut**
- [ ] **Utiliser des mots de passe forts** (minimum 16 caractères)
- [ ] **Configurer le firewall** (UFW)
- [ ] **Activer HTTPS** (Let's Encrypt)
- [ ] **Désactiver les ports non utilisés**
- [ ] **Configurer les backups automatiques**
- [ ] **Activer les logs**
- [ ] **Configurer les alertes**

### Configurer le Firewall

```bash
# Installer UFW
sudo apt install -y ufw

# Autoriser SSH (IMPORTANT - avant d'activer!)
sudo ufw allow 22/tcp

# Autoriser HTTP et HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activer le firewall
sudo ufw enable

# Vérifier
sudo ufw status
```

---

## 15. Monitoring et Logs

### PM2 Monitoring

```bash
# Monitor en temps réel
pm2 monit

# Voir les logs
pm2 logs alliance-backend

# Voir les métriques
pm2 status
```

### Logs Nginx

```bash
# Logs d'accès
sudo tail -f /var/log/nginx/access.log

# Logs d'erreur
sudo tail -f /var/log/nginx/error.log
```

---

## 16. Backups

### Script de Backup

Créez `backup.sh` :

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/alliance-courtage"

mkdir -p $BACKUP_DIR

# Backup base de données
mysqldump -u alliance_user -p'PASSWORD' alliance_courtage > $BACKUP_DIR/db_$DATE.sql

# Backup fichiers uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/alliance-courtage/backend/uploads

# Backup code (optionnel)
tar -czf $BACKUP_DIR/code_$DATE.tar.gz /var/www/alliance-courtage

# Supprimer les backups de plus de 30 jours
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup terminé: $DATE"
```

**Cronjob (quotidien à 2h du matin) :**
```bash
crontab -e
# Ajouter :
0 2 * * * /var/www/alliance-courtage/backup.sh
```

---

## 17. Mise à Jour de l'Application

### Processus de Mise à Jour

```bash
# 1. Sur votre machine locale
git add .
git commit -m "Update: description des changements"
git push origin main

# 2. Sur le serveur
cd /var/www/alliance-courtage
git pull origin main

# 3. Backend
cd backend
npm install --production
pm2 restart alliance-backend

# 4. Frontend
cd ..
npm install
npm run build
sudo cp -r dist/* /var/www/alliance-courtage-frontend/

# 5. Migrations (si nécessaire)
cd backend
node scripts/runAllMigrations.js

# 6. Redémarrer Nginx
sudo systemctl reload nginx
```

---

## 18. Dépannage

### Problème : Backend ne démarre pas

```bash
# Vérifier les logs
pm2 logs alliance-backend

# Vérifier la configuration
cd backend
cat config.env

# Vérifier MySQL
sudo systemctl status mysql

# Tester manuellement
node server.js
```

### Problème : Frontend ne se charge pas

```bash
# Vérifier Nginx
sudo nginx -t
sudo systemctl status nginx

# Vérifier les fichiers
ls -la /var/www/alliance-courtage-frontend/

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/error.log
```

### Problème : Erreurs 502 Bad Gateway

```bash
# Vérifier que le backend tourne
pm2 status

# Vérifier le port 3001
netstat -tlnp | grep 3001

# Vérifier les logs backend
pm2 logs alliance-backend
```

---

## 19. Checklist de Déploiement Complète

### Pré-déploiement
- [ ] Code testé localement
- [ ] Git repository à jour
- [ ] Variables d'environnement préparées
- [ ] Base de données préparée
- [ ] SMTP configuré

### Sur le Serveur
- [ ] Serveur créé et accessible
- [ ] Node.js installé (18+)
- [ ] MySQL installé et configuré
- [ ] Nginx installé
- [ ] PM2 installé
- [ ] Code cloné/téléchargé
- [ ] Configuration backend (config.env)
- [ ] Base de données initialisée
- [ ] Backend démarré avec PM2
- [ ] Frontend build et déployé
- [ ] Nginx configuré
- [ ] SSL/HTTPS configuré (Let's Encrypt)
- [ ] Firewall configuré
- [ ] Backups configurés

### Vérification
- [ ] Site accessible via HTTPS
- [ ] Login fonctionne
- [ ] API backend répond
- [ ] Upload de fichiers fonctionne
- [ ] Réinitialisation mot de passe fonctionne
- [ ] Logs vérifiés
- [ ] Monitoring actif

---

## 20. Commandes Utiles

### PM2
```bash
pm2 start server.js --name "alliance-backend"
pm2 stop alliance-backend
pm2 restart alliance-backend
pm2 logs alliance-backend
pm2 monit
pm2 save
```

### Nginx
```bash
sudo nginx -t                    # Tester config
sudo systemctl reload nginx       # Recharger
sudo systemctl restart nginx     # Redémarrer
sudo tail -f /var/log/nginx/error.log
```

### MySQL
```bash
sudo mysql -u root -p
sudo systemctl status mysql
sudo systemctl restart mysql
```

### Docker (si utilisé)
```bash
docker ps
docker logs alliance-backend
docker-compose up -d
docker-compose down
```

---

## 21. URLs et Accès

Après déploiement :

- **Frontend** : `https://votre-domaine.com`
- **Backend API** : `https://votre-domaine.com/api`
- **Health Check** : `https://votre-domaine.com/api/health`
- **Admin Login** : `https://votre-domaine.com/#manage`

---

**🎉 Félicitations ! Votre application est déployée en production !**

