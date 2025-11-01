# 🐳 Déploiement Docker - Guide Rapide

## ⚡ Déploiement en 5 Minutes

### 1. Prérequis

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo apt install -y docker-compose

# Ajouter utilisateur au groupe docker
sudo usermod -aG docker $USER
# (Déconnexion/reconnexion nécessaire)
```

### 2. Configuration

```bash
# Cloner le code
cd /var/www
git clone https://github.com/votre-repo/alliance-courtage.git
cd alliance-courtage

# Configurer les variables d'environnement
cd backend
nano .env  # Créer avec vos variables
nano config.env  # Créer avec vos variables
```

**Exemple `.env` :**
```env
DB_ROOT_PASSWORD=MotDePasseFort123
DB_NAME=alliance_courtage
DB_USER=alliance_user
DB_PASSWORD=MotDePasseFort123
JWT_SECRET=VotreSecretTresLongEtUnique2024
CORS_ORIGIN=https://votre-domaine.com
```

**Exemple `config.env` :**
```env
DB_HOST=mysql
DB_PORT=3306
DB_NAME=alliance_courtage
DB_USER=alliance_user
DB_PASSWORD=MotDePasseFort123
JWT_SECRET=VotreSecretTresLongEtUnique2024
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=votre_user
SMTP_PASSWORD=votre_password
```

### 3. Déploiement

```bash
# Dans le répertoire racine du projet
chmod +x deploy.sh
./deploy.sh
```

**C'est tout !** 🎉

### 4. Vérification

```bash
# Vérifier les containers
docker ps

# Devrait afficher :
# - alliance-courtage-mysql
# - alliance-courtage-backend
# - alliance-courtage-extranet

# Tester l'API
curl http://localhost:3001/api/health

# Accéder au site
# http://VOTRE_IP
```

---

## 🔄 Mise à Jour

```bash
# Mettre à jour le code
git pull

# Redéployer
./deploy.sh
```

---

## 📋 Commandes Utiles

```bash
# Logs
docker logs -f alliance-courtage-backend
docker logs -f alliance-courtage-extranet

# Arrêter tout
cd backend && docker compose down && cd ..

# Redémarrer
cd backend && docker compose restart && cd ..

# Accéder au container backend
docker exec -it alliance-courtage-backend sh

# Base de données
docker exec -it alliance-courtage-mysql mysql -u alliance_user -p
```

---

## 🆘 Problèmes Courants

### Containers ne démarrent pas

```bash
# Vérifier les logs
cd backend && docker compose logs

# Vérifier Docker
docker ps -a
docker images
```

### Base de données ne se connecte pas

```bash
# Vérifier MySQL
docker logs alliance-courtage-mysql

# Vérifier les variables d'environnement
docker exec alliance-courtage-backend env | grep DB_
```

### Frontend ne charge pas

```bash
# Rebuild frontend
docker build -t alliance-courtage-frontend:latest .
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet
./deploy.sh
```

---

## 📚 Documentation Complète

Voir `DOCKER_DEPLOYMENT_FROM_SCRATCH.md` pour plus de détails.

