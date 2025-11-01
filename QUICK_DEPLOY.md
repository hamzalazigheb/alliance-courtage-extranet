# 🚀 Déploiement Rapide - Un Seul Commande

## ⚡ Sur un Nouveau Serveur

### Prérequis Minimaux

- Serveur Ubuntu 20.04+ ou 22.04 LTS
- Accès root/sudo
- Connexion Internet

### Déploiement en 3 Étapes

#### 1. Cloner ou Télécharger le Projet

```bash
# Option A : Git
cd /var/www
git clone https://github.com/votre-repo/alliance-courtage.git
cd alliance-courtage

# Option B : Upload (FTP/SCP)
# Uploader tous les fichiers vers /var/www/alliance-courtage
cd /var/www/alliance-courtage
```

#### 2. Rendre le Script Exécutable

```bash
chmod +x deploy.sh
```

#### 3. Exécuter le Déploiement

```bash
./deploy.sh
```

**C'est tout !** 🎉

Le script va :
- ✅ Installer Docker automatiquement si nécessaire
- ✅ Installer Docker Compose automatiquement si nécessaire
- ✅ Créer les fichiers de configuration (.env, config.env)
- ✅ Build et démarrer tous les services
- ✅ Initialiser la base de données
- ✅ Démarrer le frontend

---

## 📋 Ce que fait deploy.sh

### Installation Automatique
- Docker
- Docker Compose
- Configuration des permissions

### Configuration Automatique
- Création de `backend/.env` avec valeurs par défaut
- Création de `backend/config.env` avec valeurs par défaut
- Création des dossiers uploads

### Déploiement
- Build des images Docker
- Démarrage MySQL + Backend
- Initialisation de la base de données
- Exécution des migrations
- Build du frontend
- Démarrage du frontend

---

## 🔧 Configuration Après Déploiement

### Changer les Mots de Passe (IMPORTANT!)

```bash
cd backend
nano .env
```

**Modifiez :**
- `DB_ROOT_PASSWORD` : Mot de passe root MySQL
- `DB_PASSWORD` : Mot de passe utilisateur MySQL
- `JWT_SECRET` : Secret JWT (très important pour la sécurité)

**Puis :**
```bash
nano config.env
# Mettez à jour les mêmes valeurs
```

**Redémarrer :**
```bash
cd ..
./deploy.sh  # Redéploie avec les nouveaux mots de passe
```

### Configurer SMTP (pour les emails)

```bash
cd backend
nano .env
```

**Ajoutez/modifiez :**
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=votre_user
SMTP_PASSWORD=votre_password
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=http://votre-domaine.com
```

**Mettez à jour aussi config.env :**
```bash
nano config.env
# Même configuration
```

**Redémarrer le backend :**
```bash
cd ..
cd backend
docker compose restart backend
```

---

## 🌐 Accès à l'Application

Après le déploiement :

- **Frontend** : `http://VOTRE_IP`
- **Backend API** : `http://VOTRE_IP/api`
- **Health Check** : `http://VOTRE_IP/api/health`

### Identifiants par Défaut

Si la base est vide (premier déploiement) :
- **Email** : `admin@alliance-courtage.fr`
- **Password** : `password`

**⚠️ IMPORTANT : Changez ce mot de passe immédiatement après la première connexion !**

---

## 📝 Commandes Utiles

### Vérifier le Statut

```bash
docker ps
```

### Voir les Logs

```bash
# Backend
docker logs -f alliance-courtage-backend

# Frontend
docker logs -f alliance-courtage-extranet

# MySQL
docker logs -f alliance-courtage-mysql

# Tous les services backend
cd backend
docker compose logs -f
```

### Redémarrer

```bash
# Redémarrer tout
cd backend
docker compose restart

# Redémarrer un service spécifique
docker compose restart backend
docker compose restart mysql

# Ou depuis la racine
./deploy.sh  # Redéploie tout
```

### Arrêter

```bash
cd backend
docker compose down

# Arrêter aussi le frontend
docker stop alliance-courtage-extranet
```

### Mettre à Jour le Code

```bash
# Si vous utilisez Git
git pull origin main

# Redéployer
./deploy.sh
```

---

## 🔍 Vérification Post-Déploiement

### 1. Vérifier les Containers

```bash
docker ps
```

**Devrait afficher :**
- `alliance-courtage-mysql`
- `alliance-courtage-backend`
- `alliance-courtage-extranet`

### 2. Tester l'API

```bash
curl http://localhost:3001/api/health
```

**Devrait retourner :** `OK` ou un JSON avec status

### 3. Tester le Frontend

Ouvrir dans le navigateur : `http://VOTRE_IP`

### 4. Tester la Connexion

- Aller sur `http://VOTRE_IP/#manage`
- Se connecter avec les identifiants par défaut
- Créer/modifier un utilisateur pour tester

---

## 🆘 Problèmes Courants

### Docker n'est pas installé

Le script essaie de l'installer automatiquement. Si ça échoue :

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Déconnexion/reconnexion nécessaire
```

### Erreur "Permission denied"

```bash
# Vérifier que vous êtes dans le groupe docker
groups | grep docker

# Si pas, redémarrer la session SSH
# Ou utiliser sudo (non recommandé)
```

### MySQL ne démarre pas

```bash
# Vérifier les logs
docker logs alliance-courtage-mysql

# Vérifier que le port 3306 n'est pas utilisé
sudo netstat -tlnp | grep 3306
```

### Frontend ne charge pas

```bash
# Vérifier les logs
docker logs alliance-courtage-extranet

# Vérifier que le port 80 n'est pas utilisé
sudo netstat -tlnp | grep 80

# Rebuild le frontend
docker build -t alliance-courtage-frontend:latest .
docker restart alliance-courtage-extranet
```

### Base de données vide

```bash
# Réinitialiser la base
cd backend
docker compose exec backend node scripts/initDatabase.js
docker compose exec backend node scripts/runAllMigrations.js
```

---

## 🔐 Sécurité Production

### Avant de mettre en production :

1. **Changer tous les mots de passe** dans `backend/.env`
2. **Changer JWT_SECRET** avec une valeur forte et unique
3. **Configurer SSL/HTTPS** (Let's Encrypt)
4. **Configurer le firewall** (UFW)
5. **Configurer SMTP réel** (AWS SES ou autre)
6. **Désactiver les ports inutiles**

---

## 📚 Documentation Complète

Pour plus de détails, voir :
- `DOCKER_DEPLOYMENT_FROM_SCRATCH.md` - Guide complet
- `MIGRATE_LOCAL_DB_TO_DOCKER.md` - Migration de données
- `DEPLOYMENT_FROM_SCRATCH.md` - Déploiement sans Docker

---

**🎉 C'est prêt ! Juste exécutez `./deploy.sh` et tout sera configuré automatiquement !**

