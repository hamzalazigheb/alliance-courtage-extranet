# 🚀 Guide de Déploiement via Termius

## 📋 Prérequis

- ✅ Termius installé et configuré
- ✅ Connexion SSH au serveur établie
- ✅ Accès root ou sudo sur le serveur
- ✅ Git installé sur le serveur (si vous utilisez Git)

---

## 🎯 Étapes de Déploiement via Termius

### ÉTAPE 1 : Se Connecter au Serveur

1. Ouvrir Termius
2. Sélectionner votre serveur (ubuntu@ip-172-31-26-58)
3. Se connecter

---

### ÉTAPE 2 : Navigation vers le Projet

```bash
# Trouver le répertoire du projet
# ou
cd ~/alliance-courtage
# ou où se trouve votre projet

# Vérifier que vous êtes au bon endroit
ls -la
# Vous devriez voir: backend/, src/, package.json, etc.
```

**Si le projet n'existe pas encore:**

```bash
# Créer le répertoire
mkdir -p ~/alliance-courtage
cd ~/alliance-courtage
```

---

### ÉTAPE 3 : Backup de la Base de Données (OBLIGATOIRE)

```bash
# Créer un répertoire pour les backups
mkdir -p ~/backups

# Backup de la base de données
mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Vérifier que le backup a été créé
ls -lh ~/backups/
```

**Note:** Vous devrez entrer le mot de passe MySQL.

---

### ÉTAPE 4 : Mise à Jour du Code

#### Option A : Via Git (si vous utilisez Git)

```bash
# Si vous n'avez pas encore cloné le repo
git clone https://github.com/votre-repo/alliance-courtage.git .

# Si le repo existe déjà
git pull origin main
# ou
git pull origin master
```

#### Option B : Upload Manuel via Termius

1. **Dans Termius, utiliser SFTP:**

   - Cliquer sur l'icône SFTP dans Termius
   - Naviguer vers le répertoire du projet
2. **Uploader les nouveaux fichiers:**

   - `backend/routes/favoris.js` (NOUVEAU)
   - `backend/scripts/addFavorisTable.js` (NOUVEAU)
   - `src/FavorisPage.tsx` (NOUVEAU)
   - `src/components/FavoriteButton.tsx` (NOUVEAU)
   - Fichiers modifiés (App.tsx, api.js, server.js)
3. **Vérifier dans le terminal:**

   ```bash
   ls -la backend/routes/favoris.js
   ls -la src/FavorisPage.tsx
   ```

---

### ÉTAPE 5 : Installer les Dépendances

```bash
# Backend
cd backend
npm install

# Retour au répertoire racine
cd ..
```

---

### ÉTAPE 6 : Migration de la Base de Données

```bash
# Créer la table favoris
cd backend
node scripts/addFavorisTable.js
```

**Sortie attendue:**

```
✅ Connected to MySQL
✅ favoris table created successfully
✅ Database connection closed
```

**Vérification:**

```bash
mysql -u root -p -e "USE alliance_courtage; SHOW TABLES LIKE 'favoris';"
```

---

### ÉTAPE 7 : Redémarrer les Services

#### Si vous utilisez PM2:

```bash
# Vérifier les processus PM2
pm2 list

# Redémarrer
pm2 restart all
# ou
pm2 restart alliance-courtage-backend

# Sauvegarder la configuration
pm2 save

# Vérifier les logs
pm2 logs --lines 50
```

#### Si vous utilisez Docker:

```bash
# Vérifier les conteneurs
docker ps -a

# Redémarrer
docker-compose restart
# ou
docker-compose down && docker-compose up -d

# Vérifier les logs
docker-compose logs -f --tail 50
```

#### Si vous utilisez systemd:

```bash
# Redémarrer
sudo systemctl restart alliance-courtage-backend
sudo systemctl restart alliance-courtage-frontend

# Vérifier le statut
sudo systemctl status alliance-courtage-backend

# Vérifier les logs
sudo journalctl -u alliance-courtage-backend -f
```

#### Si vous utilisez Node.js directement:

```bash
# Trouver le processus
ps aux | grep "node.*server.js"

# Arrêter (remplacer PID par le numéro du processus)
kill PID

# Redémarrer
cd backend
nohup npm start > logs/app.log 2>&1 &
# ou en mode développement
nohup npm run dev > logs/app.log 2>&1 &

# Vérifier les logs
tail -f logs/app.log
```

---

### ÉTAPE 8 : Vérification

#### 8.1 Vérifier que le serveur démarre

```bash
# Test de santé de l'API
curl http://localhost:3001/api/health
```

**Réponse attendue:**

```json
{"status":"OK","message":"Alliance Courtage API is running","timestamp":"..."}
```

#### 8.2 Vérifier les logs

```bash
# PM2
pm2 logs alliance-courtage-backend --lines 50

# Docker
docker-compose logs backend --tail 50

# Systemd
sudo journalctl -u alliance-courtage-backend -n 50
```

**Chercher:**

- ✅ "Server running on port 3001"
- ❌ Pas d'erreurs "Cannot find module"
- ❌ Pas d'erreurs "Table doesn't exist"

#### 8.3 Vérifier la base de données

```bash
mysql -u root -p
```

```sql
USE alliance_courtage;
SHOW TABLES LIKE 'favoris';
DESCRIBE favoris;
SELECT COUNT(*) FROM favoris;
```

#### 8.4 Tester l'interface

1. Ouvrir votre navigateur
2. Aller sur votre site (ex: `http://votre-domaine.com`)
3. Se connecter
4. Vérifier que "⭐ Mes Favoris" apparaît dans le menu
5. Tester les favoris sur une page
6. Vérifier que l'upload en masse a la configuration de date

---

## 🔧 Commandes Utiles dans Termius

### Navigation

```bash
# Liste des fichiers
ls -la

# Changer de répertoire
cd /chemin/vers/projet

# Trouver un fichier
find . -name "favoris.js"

# Voir l'espace disque
df -h
```

### Vérification des Services

```bash
# Vérifier si Node.js est installé
node --version
npm --version

# Vérifier si MySQL est installé
mysql --version

# Vérifier les processus
ps aux | grep node
ps aux | grep mysql
```

### Logs en Temps Réel

```bash
# PM2
pm2 logs --lines 100

# Docker
docker-compose logs -f

# Systemd
sudo journalctl -u alliance-courtage-backend -f

# Fichier de log
tail -f backend/logs/app.log
```

---

## ⚠️ Problèmes Courants

### Erreur: "Permission denied"

```bash
# Donner les permissions
chmod +x backend/scripts/addFavorisTable.js
sudo chown -R ubuntu:ubuntu /chemin/vers/projet
```

### Erreur: "Cannot find module"

```bash
# Réinstaller les dépendances
cd backend
rm -rf node_modules
npm install
```

### Erreur: "Table 'favoris' already exists"

C'est normal, la table existe déjà. Continuez.

### Erreur: "Port 3001 already in use"

```bash
# Trouver le processus
lsof -i :3001
# ou
netstat -tulpn | grep 3001

# Arrêter le processus
kill PID
```

---

## 📋 Checklist Rapide

```bash
# 1. Backup
mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d).sql

# 2. Migration
cd backend && node scripts/addFavorisTable.js && cd ..

# 3. Redémarrer
pm2 restart all
# ou
docker-compose restart
```

---

## 🔄 Rollback (si nécessaire)

```bash
# 1. Restaurer la base de données
mysql -u root -p alliance_courtage < ~/backups/backup_YYYYMMDD.sql

# 2. Revenir à l'ancienne version (si Git)
git checkout <ancien-commit>

# 3. Redémarrer
pm2 restart all
```

---

## 📞 Support

**Documentation:**

- `DEPLOY_STEPS.md` - Étapes détaillées
- `DEPLOY_CHECKLIST.md` - Checklist complète
- `QUICK_DEPLOY.md` - Guide rapide

**Commandes de diagnostic:**

```bash
# Vérifier la configuration
cat backend/config.env

# Vérifier les fichiers
ls -la backend/routes/favoris.js
ls -la src/FavorisPage.tsx

# Vérifier les logs
pm2 logs
```

---

**Bon déploiement via Termius ! 🚀**
