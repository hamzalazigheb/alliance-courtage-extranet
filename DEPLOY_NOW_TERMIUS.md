# 🚀 Déploiement Immédiat - Via Termius

## 📍 Vous êtes ici : `/var/www/alliance-courtage`

Vos conteneurs Docker sont arrêtés. Voici les étapes :

---

## ✅ ÉTAPE 1 : Backup de la Base de Données

```bash
# Créer le répertoire de backup
mkdir -p ~/backups

# Backup (entrer le mot de passe MySQL quand demandé)
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# OU si le conteneur MySQL n'est pas accessible, démarrer d'abord :
docker start alliance-courtage-mysql
sleep 5
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

**Vérification:**
```bash
ls -lh ~/backups/
```

---

## ✅ ÉTAPE 2 : Uploader les Nouveaux Fichiers

### Option A : Via Git (si vous utilisez Git)

```bash
# Vérifier si c'est un repo Git
git status

# Si oui, mettre à jour
git pull origin main
# ou
git pull origin master
```

### Option B : Via SFTP dans Termius

1. **Dans Termius, cliquer sur l'icône SFTP** (ou File Transfer)
2. **Naviguer vers** `/var/www/alliance-courtage`
3. **Uploader ces fichiers:**

**Backend:**
- `backend/routes/favoris.js` ⭐ NOUVEAU
- `backend/scripts/addFavorisTable.js` ⭐ NOUVEAU
- `backend/server.js` (modifié - ajouter la route favoris si pas déjà fait)

**Frontend:**
- `src/FavorisPage.tsx` ⭐ NOUVEAU
- `src/components/FavoriteButton.tsx` ⭐ NOUVEAU
- `src/App.tsx` (modifié)
- `src/api.js` (modifié)

**Vérification après upload:**
```bash
# Vérifier que les fichiers existent
ls -la backend/routes/favoris.js
ls -la backend/scripts/addFavorisTable.js
ls -la src/FavorisPage.tsx
ls -la src/components/FavoriteButton.tsx
```

---

## ✅ ÉTAPE 3 : Installer les Dépendances (si nécessaire)

```bash
# Backend
cd backend
npm install
cd ..

# Frontend (si nécessaire)
npm install
```

---

## ✅ ÉTAPE 4 : Créer la Table `favoris`

```bash
# Démarrer MySQL si pas déjà démarré
docker start alliance-courtage-mysql
sleep 5

# Créer la table favoris
cd backend
node scripts/addFavorisTable.js
cd ..
```

**Vérification:**
```bash
# Vérifier que la table existe
docker exec alliance-courtage-mysql mysql -u root -p -e "USE alliance_courtage; SHOW TABLES LIKE 'favoris';"
```

---

## ✅ ÉTAPE 5 : Vérifier docker-compose.yml

```bash
# Vérifier que docker-compose.yml existe
ls -la docker-compose.yml

# Vérifier le contenu (si nécessaire)
cat docker-compose.yml | grep -A 5 "backend"
```

---

## ✅ ÉTAPE 6 : Rebuild et Redémarrer Docker

```bash
# Rebuild les images (si nécessaire)
docker-compose build

# OU simplement redémarrer
docker-compose up -d

# Vérifier que les conteneurs sont en cours d'exécution
docker ps
```

**Si erreur, démarrer les conteneurs un par un:**
```bash
# Démarrer MySQL
docker start alliance-courtage-mysql

# Démarrer Backend
docker start alliance-courtage-backend

# Démarrer Frontend
docker start alliance-courtage-extranet
```

---

## ✅ ÉTAPE 7 : Vérification

### 7.1 Vérifier les conteneurs
```bash
docker ps
```

**Tous les conteneurs doivent être "Up" (pas "Exited")**

### 7.2 Vérifier les logs
```bash
# Logs backend
docker logs alliance-courtage-backend --tail 50

# Logs MySQL
docker logs alliance-courtage-mysql --tail 20

# Logs frontend
docker logs alliance-courtage-extranet --tail 20
```

**Chercher:**
- ✅ "Server running on port 3001" (backend)
- ✅ Pas d'erreurs "Cannot find module"
- ✅ Pas d'erreurs "Table doesn't exist"

### 7.3 Tester l'API
```bash
# Test de santé
curl http://localhost:3001/api/health
```

**Réponse attendue:**
```json
{"status":"OK","message":"Alliance Courtage API is running",...}
```

### 7.4 Vérifier la base de données
```bash
docker exec -it alliance-courtage-mysql mysql -u root -p
```

```sql
USE alliance_courtage;
SHOW TABLES LIKE 'favoris';
DESCRIBE favoris;
SELECT COUNT(*) FROM favoris;
EXIT;
```

---

## ⚠️ Si les Conteneurs ne Démarrant Pas

### Vérifier les logs d'erreur
```bash
docker logs alliance-courtage-backend
docker logs alliance-courtage-mysql
```

### Vérifier docker-compose.yml
```bash
cat docker-compose.yml
```

### Redémarrer proprement
```bash
# Arrêter tout
docker-compose down

# Redémarrer
docker-compose up -d

# Vérifier
docker ps
```

---

## 📋 Checklist Rapide

```bash
# 1. Backup
docker start alliance-courtage-mysql
sleep 5
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d).sql

# 2. Migration
docker start alliance-courtage-mysql
sleep 5
cd backend && node scripts/addFavorisTable.js && cd ..

# 3. Redémarrer Docker
docker-compose up -d
# ou
docker start alliance-courtage-mysql
docker start alliance-courtage-backend
docker start alliance-courtage-extranet

# 4. Vérifier
docker ps
curl http://localhost:3001/api/health
```

---

## 🔧 Commandes de Diagnostic

```bash
# Vérifier les fichiers uploadés
ls -la backend/routes/favoris.js
ls -la src/FavorisPage.tsx

# Vérifier la configuration
cat backend/config.env | grep DB_

# Vérifier les ports
netstat -tulpn | grep 3001

# Vérifier les logs en temps réel
docker logs -f alliance-courtage-backend
```

---

**Suivez ces étapes dans l'ordre dans Termius ! 🚀**

