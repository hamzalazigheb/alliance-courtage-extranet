# 🚀 Étapes de Déploiement - Version avec Favoris

## 📋 Résumé des Changements

### ✅ Nouvelles Fonctionnalités
- Système de favoris (bookmarks)
- Notifications étendues
- Configuration de date pour upload en masse
- Interface simplifiée upload en masse

### ✅ Nouvelle Table
- `favoris` - Table pour stocker les favoris des utilisateurs

### ✅ Nouveaux Fichiers
- `backend/routes/favoris.js`
- `backend/scripts/addFavorisTable.js`
- `src/FavorisPage.tsx`
- `src/components/FavoriteButton.tsx`
- Modifications dans `src/App.tsx`, `src/api.js`, `backend/server.js`

---

## 🎯 Étapes de Déploiement

### ⚠️ ÉTAPE 0 : Sauvegarde (OBLIGATOIRE)

```bash
# Sur le serveur
mysqldump -u root -p alliance_courtage > backup_$(date +%Y%m%d_%H%M%S).sql
```

**⚠️ NE PAS SAUTER CETTE ÉTAPE !**

---

### ÉTAPE 1 : Uploader les Nouveaux Fichiers

Via FTP/SFTP ou Git, uploader :

**Backend:**
- ✅ `backend/routes/favoris.js` (NOUVEAU)
- ✅ `backend/scripts/addFavorisTable.js` (NOUVEAU)
- ✅ `backend/server.js` (MODIFIÉ - ajout de la route favoris)
- ✅ `backend/package.json` (MODIFIÉ - si nécessaire)

**Frontend:**
- ✅ `src/FavorisPage.tsx` (NOUVEAU)
- ✅ `src/components/FavoriteButton.tsx` (NOUVEAU)
- ✅ `src/App.tsx` (MODIFIÉ - ajout de la page Favoris)
- ✅ `src/api.js` (MODIFIÉ - ajout de favorisAPI)

**Documentation:**
- ✅ `DEPLOYMENT_GUIDE.md`
- ✅ `QUICK_DEPLOY.md`
- ✅ `deploy.sh`

---

### ÉTAPE 2 : Installer les Dépendances

```bash
# Sur le serveur
cd /chemin/vers/projet/backend
npm install
```

**Note:** Les dépendances sont probablement déjà installées, mais cette étape assure que tout est à jour.

---

### ÉTAPE 3 : Créer la Table `favoris`

```bash
cd /chemin/vers/projet/backend
node scripts/addFavorisTable.js
```

**Vérification:**
```sql
mysql -u root -p
USE alliance_courtage;
SHOW TABLES LIKE 'favoris';
DESCRIBE favoris;
```

Vous devriez voir la table `favoris` avec les colonnes :
- `id`, `user_id`, `item_type`, `item_id`, `title`, `description`, `url`, `metadata`, `created_at`, `updated_at`

---

### ÉTAPE 4 : Redémarrer les Services

#### Si vous utilisez PM2 :

```bash
pm2 restart alliance-courtage-backend
# ou
pm2 restart all
pm2 save
```

#### Si vous utilisez Docker :

```bash
docker-compose down
docker-compose up -d --build
```

#### Si vous utilisez systemd :

```bash
sudo systemctl restart alliance-courtage-backend
sudo systemctl restart alliance-courtage-frontend
```

#### Si vous utilisez directement Node.js :

```bash
# Arrêter l'ancien processus
pkill -f "node.*server.js"

# Redémarrer
cd backend
npm start
# ou en mode développement
npm run dev
```

---

### ÉTAPE 5 : Vérification

#### 1. Vérifier les logs

```bash
# PM2
pm2 logs

# Docker
docker-compose logs -f

# Systemd
sudo journalctl -u alliance-courtage-backend -f
```

**Chercher des erreurs** liées à :
- `favoris` table
- Routes `/api/favoris`
- Import de modules

#### 2. Tester l'API

```bash
# Test de santé
curl http://localhost:3001/api/health

# Test favoris (nécessite authentification)
# Se connecter d'abord, puis :
curl -H "x-auth-token: VOTRE_TOKEN" http://localhost:3001/api/favoris
```

#### 3. Tester l'Interface

1. **Se connecter** avec un compte utilisateur
2. **Vérifier le menu** :
   - ✅ "⭐ Mes Favoris" doit apparaître dans la sidebar
3. **Tester les favoris** :
   - Aller sur "Gamme Financière"
   - Cliquer sur l'étoile (⭐) à côté d'un document
   - Aller sur "Mes Favoris" et vérifier que le document apparaît
4. **Tester l'upload en masse** (admin) :
   - Aller sur "Gestion Comptabilité"
   - Vérifier que la section "Date d'affichage" est visible
   - Vérifier que les 2 sections supprimées ne sont plus là

---

## 🔧 Commandes Rapides (Récapitulatif)

```bash
# 1. Backup
mysqldump -u root -p alliance_courtage > backup_$(date +%Y%m%d).sql

# 2. Migration DB
cd backend
node scripts/addFavorisTable.js

# 3. Redémarrer
pm2 restart all
```

---

## ⚠️ Problèmes Courants

### Erreur: "Table 'favoris' already exists"

**Solution:** La table existe déjà, c'est normal. Continuez.

### Erreur: "Cannot find module 'bcryptjs'"

**Solution:**
```bash
cd backend
npm install bcryptjs
```

### Erreur: "Route /api/favoris not found"

**Solution:**
1. Vérifier que `backend/server.js` inclut :
   ```javascript
   app.use('/api/favoris', favorisRoutes);
   ```
2. Redémarrer le serveur

### Erreur: "Cannot read property 'map' of undefined" dans FavorisPage

**Solution:**
1. Vérifier que `favorisAPI` est correctement défini dans `src/api.js`
2. Vérifier que l'API retourne un tableau
3. Vérifier les logs du navigateur (F12)

---

## 📞 Support

Si vous rencontrez un problème :

1. **Vérifier les logs** (voir Étape 5)
2. **Vérifier la base de données** :
   ```sql
   SHOW TABLES;
   DESCRIBE favoris;
   ```
3. **Vérifier les fichiers uploadés** :
   ```bash
   ls -la backend/routes/favoris.js
   ls -la src/FavorisPage.tsx
   ```
4. **Rollback si nécessaire** :
   ```bash
   mysql -u root -p alliance_courtage < backup_YYYYMMDD.sql
   ```

---

## ✅ Checklist Finale

- [ ] Backup créé
- [ ] Nouveaux fichiers uploadés
- [ ] Dépendances installées
- [ ] Table `favoris` créée
- [ ] Services redémarrés
- [ ] Logs vérifiés (pas d'erreurs)
- [ ] API testée
- [ ] Interface testée (favoris fonctionnent)
- [ ] Upload en masse testé (configuration de date)

---

**Bon déploiement ! 🚀**

