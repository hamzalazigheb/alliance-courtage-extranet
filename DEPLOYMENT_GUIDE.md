# 🚀 Guide de Déploiement - Version avec Favoris et Notifications

## 📋 Changements depuis la dernière version

### ✅ Nouvelles Fonctionnalités
- ✅ Système de favoris (bookmarks)
- ✅ Notifications étendues (documents, archives, produits, rencontres)
- ✅ Configuration de date pour upload en masse
- ✅ Interface simplifiée pour upload en masse

### ✅ Nouvelles Tables
- ✅ `favoris` - Système de favoris
- ✅ Modifications mineures sur tables existantes

### ✅ Nouvelles Routes API
- ✅ `/api/favoris/*` - Gestion des favoris
- ✅ `/api/notifications/*` - Notifications (déjà existantes, améliorées)

---

## 🎯 Étapes de Déploiement

### Étape 1 : Sauvegarde de la Base de Données Actuelle

⚠️ **IMPORTANT : Toujours faire un backup avant de déployer !**

```bash
# Sur le serveur
mysqldump -u root -p alliance_courtage > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou via script
cd backend
node scripts/exportLocalDatabase.js
```

---

### Étape 2 : Mise à Jour du Code

#### Option A : Git (si vous utilisez Git)

```bash
# Sur le serveur
cd /chemin/vers/projet
git pull origin main  # ou master, selon votre branche
```

#### Option B : Upload Manuel

1. Uploader les nouveaux fichiers :
   - `backend/routes/favoris.js` (nouveau)
   - `backend/scripts/freshDatabase.js` (nouveau)
   - `backend/scripts/installDatabase.sql` (nouveau)
   - `src/FavorisPage.tsx` (nouveau)
   - `src/components/FavoriteButton.tsx` (nouveau)
   - `src/App.tsx` (modifié)
   - `src/api.js` (modifié)
   - `backend/server.js` (modifié)
   - Tous les autres fichiers modifiés

2. Sur le serveur, extraire les fichiers si nécessaire

---

### Étape 3 : Installation des Dépendances

```bash
# Backend
cd backend
npm install

# Frontend (si nécessaire)
cd ../frontend  # ou où se trouve le frontend
npm install
```

---

### Étape 4 : Migration de la Base de Données

#### Ajouter la nouvelle table `favoris`

```bash
cd backend
node scripts/addFavorisTable.js
```

✅ Vérifier que la table est créée :
```sql
SHOW TABLES LIKE 'favoris';
DESCRIBE favoris;
```

---

### Étape 5 : Mise à Jour de la Configuration

Vérifier `backend/config.env` :

```env
DB_HOST=votre_host
DB_PORT=3306
DB_NAME=alliance_courtage
DB_USER=votre_user
DB_PASSWORD=votre_password

# Autres configurations...
JWT_SECRET=votre_secret
PORT=3001
```

---

### Étape 6 : Build du Frontend (si nécessaire)

```bash
# Si vous utilisez un build
npm run build

# Ou pour Vite
npm run build
```

---

### Étape 7 : Redémarrage des Services

#### Si vous utilisez PM2 :

```bash
# Backend
cd backend
pm2 restart alliance-courtage-backend
# ou
pm2 restart all

# Frontend (si séparé)
pm2 restart alliance-courtage-frontend
```

#### Si vous utilisez systemd :

```bash
sudo systemctl restart alliance-courtage-backend
sudo systemctl restart alliance-courtage-frontend
```

#### Si vous utilisez Docker :

```bash
docker-compose down
docker-compose up -d --build
```

#### Si vous utilisez directement Node :

```bash
# Arrêter l'ancien processus
pkill -f "node.*server.js"

# Redémarrer
cd backend
npm start
# ou
npm run dev
```

---

### Étape 8 : Vérification

#### 1. Vérifier que le serveur démarre

```bash
# Vérifier les logs
pm2 logs
# ou
tail -f backend/logs/app.log
```

#### 2. Vérifier la base de données

```sql
USE alliance_courtage;
SHOW TABLES;
SELECT COUNT(*) FROM favoris; -- Doit retourner 0 (table vide)
```

#### 3. Tester les routes API

```bash
# Test de santé
curl http://localhost:3001/api/health

# Test favoris (nécessite auth)
curl -H "x-auth-token: VOTRE_TOKEN" http://localhost:3001/api/favoris
```

#### 4. Tester l'interface

- Se connecter en tant qu'admin
- Vérifier que la page "Mes Favoris" apparaît dans le menu
- Vérifier que les boutons favoris apparaissent sur les pages
- Tester l'upload en masse avec la configuration de date

---

## 🔧 Script de Déploiement Automatique

Créez un script `deploy.sh` sur votre serveur :

```bash
#!/bin/bash

echo "🚀 Déploiement Alliance Courtage..."

# 1. Backup
echo "📦 Création du backup..."
mysqldump -u root -p alliance_courtage > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull code (si Git)
echo "📥 Mise à jour du code..."
git pull origin main

# 3. Install dependencies
echo "📦 Installation des dépendances..."
cd backend && npm install && cd ..

# 4. Migration DB
echo "🗄️  Migration de la base de données..."
cd backend && node scripts/addFavorisTable.js && cd ..

# 5. Build frontend (si nécessaire)
echo "🏗️  Build du frontend..."
npm run build

# 6. Restart services
echo "🔄 Redémarrage des services..."
pm2 restart all

echo "✅ Déploiement terminé !"
```

Rendre exécutable :
```bash
chmod +x deploy.sh
```

---

## ⚠️ Points d'Attention

### 1. Compatibilité
- ✅ Les nouvelles fonctionnalités sont rétro-compatibles
- ✅ Les tables existantes ne sont pas modifiées
- ✅ Seule la table `favoris` est ajoutée

### 2. Permissions
- ✅ Vérifier que MySQL peut créer des tables
- ✅ Vérifier les permissions d'écriture pour les logs

### 3. Performance
- ✅ Les nouvelles tables ont des index appropriés
- ✅ Pas d'impact sur les performances existantes

### 4. Sécurité
- ✅ Les routes `/api/favoris` sont protégées par authentification
- ✅ Chaque utilisateur voit uniquement ses favoris

---

## 🔄 Rollback (en cas de problème)

Si quelque chose ne fonctionne pas :

### 1. Restaurer la base de données

```bash
mysql -u root -p alliance_courtage < backup_YYYYMMDD_HHMMSS.sql
```

### 2. Revenir à l'ancienne version du code

```bash
# Si Git
git checkout <ancien-commit-hash>

# Sinon, restaurer les fichiers depuis backup
```

### 3. Redémarrer les services

```bash
pm2 restart all
```

---

## ✅ Checklist de Déploiement

- [ ] Backup de la base de données créé
- [ ] Code mis à jour sur le serveur
- [ ] Dépendances installées (`npm install`)
- [ ] Table `favoris` créée (`node scripts/addFavorisTable.js`)
- [ ] Configuration vérifiée (`config.env`)
- [ ] Services redémarrés
- [ ] Tests de santé passés
- [ ] Interface testée (login, favoris, notifications)
- [ ] Logs vérifiés (pas d'erreurs)

---

## 📞 Support

En cas de problème :

1. **Vérifier les logs** :
   ```bash
   pm2 logs
   # ou
   tail -f backend/logs/app.log
   ```

2. **Vérifier la base de données** :
   ```sql
   SHOW TABLES;
   DESCRIBE favoris;
   ```

3. **Tester les routes** :
   ```bash
   curl http://localhost:3001/api/health
   ```

4. **Rollback si nécessaire** (voir section Rollback)

---

**Bon déploiement ! 🚀**

