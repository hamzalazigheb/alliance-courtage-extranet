# 🚀 Guide de Déploiement - Alliance Courtage

Ce guide vous explique comment déployer l'application Alliance Courtage en production.

## 📋 Prérequis

- Docker et Docker Compose installés
- Accès SSH au serveur (si déploiement sur serveur)
- Domaine configuré (optionnel)
- Base de données MySQL (ou utiliser Docker)

## 🎯 Architecture de Déploiement

L'application se compose de :
- **Frontend** : Application React (Vite)
- **Backend** : API Node.js/Express
- **Base de données** : MySQL 8.0
- **Reverse Proxy** : Nginx (optionnel)

## 🐳 Option 1 : Déploiement avec Docker Compose (Recommandé)

### Étape 1 : Préparer les fichiers

1. **Vérifier la configuration SMTP** dans `backend/config.env` :
   ```ini
   SMTP_USER=5b05acc25d7ca2
   SMTP_PASSWORD=fb65ba99981fa1
   ```

2. **Vérifier la configuration de la base de données** dans `backend/config.env` :
   ```ini
   DB_HOST=mysql
   DB_NAME=alliance_courtage
   DB_USER=alliance_user
   DB_PASSWORD=alliance_pass2024
   ```

3. **Vérifier les variables d'environnement** dans `backend/config.env` :
   - `JWT_SECRET` : Changez-le en production !
   - `CORS_ORIGIN` : Ajoutez votre domaine
   - `FRONTEND_URL` : URL de votre frontend

### Étape 2 : Build et démarrage

⚠️ **IMPORTANT : Protection des données de production**

```bash
cd backend
# Arrêter les conteneurs SANS supprimer les volumes (préserve les données)
docker-compose down
# Démarrer avec build (les volumes existants seront réutilisés)
docker-compose up -d --build
```

**Ne JAMAIS utiliser** :
- ❌ `docker-compose down -v` (supprime les volumes)
- ❌ `docker volume rm` (supprime les données)
- ❌ Scripts qui réinitialisent la base de données

### Étape 3 : Vérifier les services

```bash
# Vérifier les conteneurs
docker-compose ps

# Vérifier les logs
docker-compose logs -f

# Tester l'API
curl http://localhost:3001/api/health
```

### Étape 4 : Vérifier la base de données

⚠️ **NE PAS exécuter initDatabase.js en production !**

Ce script réinitialise la base de données et supprime toutes les données.

```bash
# Vérifier que la base de données est accessible
docker exec -it alliance-courtage-mysql mysql -u root -p -e "SHOW DATABASES;"

# Vérifier les tables existantes
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage -e "SHOW TABLES;"
```

**Pour les migrations uniquement** (si nécessaire) :
```bash
# Exécuter uniquement les scripts de migration spécifiques
docker exec -it alliance-courtage-backend node scripts/addFavorisTable.js
# etc. (uniquement les scripts qui ajoutent, pas ceux qui suppriment)
```

## 🌐 Option 2 : Déploiement Frontend + Backend séparés

### Backend (Serveur dédié)

1. **Installer Node.js 18+**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Cloner et installer**
   ```bash
   cd /var/www
   git clone <votre-repo> alliance-courtage
   cd alliance-courtage/backend
   npm install --production
   ```

3. **Configurer**
   ```bash
   cp config.env.example config.env
   nano config.env  # Éditer avec vos valeurs
   ```

4. **Installer PM2**
   ```bash
   npm install -g pm2
   pm2 start server.js --name alliance-backend
   pm2 save
   pm2 startup
   ```

5. **Configurer Nginx** (reverse proxy)
   ```nginx
   server {
       listen 80;
       server_name api.votre-domaine.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

### Frontend (Netlify/Vercel)

1. **Build local**
   ```bash
   npm install
   npm run build
   ```

2. **Déployer sur Netlify**
   - Connectez votre repo GitHub
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment variables:
     - `VITE_API_URL`: `https://api.votre-domaine.com`

3. **Ou déployer sur Vercel**
   ```bash
   npm install -g vercel
   vercel --prod
   ```

## 🔒 Configuration de Sécurité

### 1. Changer le JWT_SECRET

Dans `backend/config.env` :
```ini
JWT_SECRET=votre-secret-tres-long-et-aleatoire-changez-moi
```

### 2. Configurer HTTPS

Utilisez Let's Encrypt avec Certbot :
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

### 3. Sécuriser MySQL

```bash
# Dans docker-compose.yml, utilisez des mots de passe forts
DB_ROOT_PASSWORD=votre-mot-de-passe-tres-fort
DB_PASSWORD=votre-mot-de-passe-tres-fort
```

## 📊 Monitoring et Logs

### PM2 Monitoring
```bash
pm2 monit
pm2 logs alliance-backend
```

### Docker Logs
```bash
docker-compose logs -f backend
docker-compose logs -f mysql
```

## 🔄 Mise à jour

### Avec Docker

⚠️ **Protection des données** : Ne jamais utiliser `-v` avec `docker-compose down`

```bash
cd backend
git pull
# Arrêter SANS supprimer les volumes (préserve les données)
docker-compose down
# Redémarrer (les volumes existants seront réutilisés)
docker-compose up -d --build
```

**Commandes DANGEREUSES à éviter** :
- ❌ `docker-compose down -v` (supprime les volumes)
- ❌ `docker volume prune` (supprime les volumes non utilisés)
- ❌ `docker-compose down --volumes` (supprime les volumes)

### Avec PM2
```bash
cd backend
git pull
npm install --production
pm2 restart alliance-backend
```

## 🧪 Tests Post-Déploiement

1. **Tester l'API**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **Tester l'authentification**
   - Se connecter via l'interface
   - Vérifier le token JWT

3. **Tester l'envoi d'emails**
   - Réinitialiser un mot de passe admin
   - Vérifier dans Mailtrap

4. **Tester les uploads**
   - Uploader un fichier
   - Vérifier qu'il est accessible

## 🐛 Dépannage

### Backend ne démarre pas
```bash
# Vérifier les logs
docker-compose logs backend

# Vérifier la connexion MySQL
docker exec -it alliance-courtage-mysql mysql -u root -p
```

### Erreur de connexion à la base de données
- Vérifier que MySQL est démarré : `docker-compose ps`
- Vérifier les variables d'environnement dans `config.env`
- Vérifier que le réseau Docker est correct

### Emails ne sont pas envoyés
- Vérifier les identifiants SMTP dans `config.env`
- Vérifier les logs : `docker-compose logs backend | grep SMTP`
- Tester avec Mailtrap directement

## 📝 Checklist de Déploiement

- [ ] Configuration SMTP mise à jour
- [ ] JWT_SECRET changé
- [ ] Mots de passe MySQL sécurisés
- [ ] CORS_ORIGIN configuré avec le bon domaine
- [ ] FRONTEND_URL configuré
- [ ] ⚠️ **Backup de la base de données effectué** (OBLIGATOIRE)
- [ ] ⚠️ **Vérifié que docker-compose down n'utilise pas -v**
- [ ] ⚠️ **Vérifié qu'aucun script ne réinitialise la DB**
- [ ] HTTPS configuré (production)
- [ ] Backups automatiques configurés
- [ ] Monitoring configuré
- [ ] Tests effectués

## 🔒 Protection des Données de Production

### Règles d'Or

1. **JAMAIS utiliser `docker-compose down -v`** en production
2. **JAMAIS exécuter `initDatabase.js`** ou scripts similaires en production
3. **TOUJOURS faire un backup** avant tout déploiement
4. **Vérifier les scripts de migration** avant de les exécuter

### Backup avant déploiement

```bash
# Backup de la base de données
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup des uploads
docker cp alliance-courtage-backend:/app/uploads ./backups/uploads_$(date +%Y%m%d_%H%M%S)
```

## 🔗 URLs de Production

- **Frontend** : `https://votre-domaine.com`
- **Backend API** : `https://api.votre-domaine.com` ou `https://votre-domaine.com/api`
- **Health Check** : `https://api.votre-domaine.com/api/health`

## 📞 Support

En cas de problème, vérifiez :
1. Les logs du serveur
2. La configuration dans `config.env`
3. Les variables d'environnement Docker
4. La connectivité réseau

