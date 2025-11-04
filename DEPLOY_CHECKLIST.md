# ✅ Checklist de Déploiement - Version avec Favoris

## 📋 Avant de Commencer

### Fichiers à Vérifier (sur votre serveur)

**Backend:**
- [ ] `backend/routes/favoris.js` existe
- [ ] `backend/server.js` inclut `favorisRoutes` (ligne 30 et 91)
- [ ] `backend/scripts/addFavorisTable.js` existe

**Frontend:**
- [ ] `src/FavorisPage.tsx` existe
- [ ] `src/components/FavoriteButton.tsx` existe
- [ ] `src/App.tsx` inclut la page Favoris
- [ ] `src/api.js` inclut `favorisAPI`

---

## 🚀 Étapes de Déploiement

### ✅ ÉTAPE 1 : Backup (OBLIGATOIRE)

```bash
mysqldump -u root -p alliance_courtage > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Vérification:**
```bash
ls -lh backup_*.sql
```

---

### ✅ ÉTAPE 2 : Uploader les Fichiers

**Méthode A - Git (si vous utilisez Git):**
```bash
git pull origin main
# ou
git pull origin master
```

**Méthode B - Upload Manuel (FTP/SFTP):**

Uploader ces fichiers sur le serveur :

**Backend:**
- `backend/routes/favoris.js` ⭐ NOUVEAU
- `backend/scripts/addFavorisTable.js` ⭐ NOUVEAU
- `backend/server.js` (modifié)
- `backend/package.json` (si modifié)

**Frontend:**
- `src/FavorisPage.tsx` ⭐ NOUVEAU
- `src/components/FavoriteButton.tsx` ⭐ NOUVEAU
- `src/App.tsx` (modifié)
- `src/api.js` (modifié)

**Vérification:**
```bash
# Vérifier que les fichiers existent
ls -la backend/routes/favoris.js
ls -la src/FavorisPage.tsx
```

---

### ✅ ÉTAPE 3 : Installer les Dépendances

```bash
cd backend
npm install
```

**Note:** Normalement, aucune nouvelle dépendance n'est nécessaire (bcryptjs est déjà installé).

---

### ✅ ÉTAPE 4 : Créer la Table `favoris`

```bash
cd backend
node scripts/addFavorisTable.js
```

**Sortie attendue:**
```
✅ Connected to MySQL
✅ favoris table created successfully
✅ Database connection closed
```

**Vérification SQL:**
```sql
mysql -u root -p
USE alliance_courtage;
SHOW TABLES LIKE 'favoris';
DESCRIBE favoris;
```

**Résultat attendu:** La table `favoris` doit exister avec les colonnes :
- `id`, `user_id`, `item_type`, `item_id`, `title`, `description`, `url`, `metadata`, `created_at`, `updated_at`

---

### ✅ ÉTAPE 5 : Redémarrer les Services

**PM2:**
```bash
pm2 restart alliance-courtage-backend
pm2 save
```

**Docker:**
```bash
docker-compose restart backend
# ou
docker-compose down && docker-compose up -d
```

**Systemd:**
```bash
sudo systemctl restart alliance-courtage-backend
```

**Node.js Direct:**
```bash
# Arrêter
pkill -f "node.*server.js"

# Redémarrer
cd backend
npm start
```

---

### ✅ ÉTAPE 6 : Vérification

#### 6.1 Vérifier les Logs

**PM2:**
```bash
pm2 logs alliance-courtage-backend --lines 50
```

**Docker:**
```bash
docker-compose logs backend --tail 50
```

**Chercher:**
- ❌ Erreurs "Cannot find module"
- ❌ Erreurs "Table 'favoris' doesn't exist"
- ✅ "Server running on port 3001"

#### 6.2 Tester l'API

```bash
# Test de santé
curl http://localhost:3001/api/health

# Réponse attendue:
# {"status":"OK","message":"Alliance Courtage API is running",...}
```

#### 6.3 Tester l'Interface

1. **Se connecter** avec un compte utilisateur
2. **Vérifier le menu:**
   - ✅ "⭐ Mes Favoris" doit apparaître dans la sidebar
3. **Tester les favoris:**
   - Aller sur "Gamme Financière"
   - Cliquer sur l'étoile (⭐) à côté d'un document
   - Aller sur "Mes Favoris"
   - ✅ Le document doit apparaître dans la liste
4. **Tester l'upload en masse (admin):**
   - Aller sur "Gestion Comptabilité"
   - Cliquer sur "Upload en masse"
   - ✅ La section "Date d'affichage" doit être visible
   - ✅ Les sections "Sélectionner l'utilisateur" et "Règles de Nommage" ne doivent PAS être visibles

---

## ⚠️ Problèmes et Solutions

### ❌ Erreur: "Table 'favoris' already exists"

**Solution:** C'est normal si vous avez déjà exécuté le script. La table existe déjà. Continuez.

### ❌ Erreur: "Cannot find module 'favoris'"

**Solution:** Vérifier que `backend/routes/favoris.js` existe et que `backend/server.js` l'importe correctement.

### ❌ Erreur: "Route /api/favoris not found"

**Solution:**
1. Vérifier `backend/server.js` ligne 30 et 91 :
   ```javascript
   const favorisRoutes = require('./routes/favoris');
   app.use('/api/favoris', favorisRoutes);
   ```
2. Redémarrer le serveur

### ❌ Erreur: "Cannot read property 'map' of undefined" dans FavorisPage

**Solution:**
1. Ouvrir la console du navigateur (F12)
2. Vérifier les erreurs dans la console
3. Vérifier que `favorisAPI` est correctement défini dans `src/api.js`

### ❌ Les favoris ne s'affichent pas

**Solution:**
1. Vérifier que vous êtes connecté
2. Vérifier les logs du navigateur (F12 > Console)
3. Vérifier les logs du serveur
4. Tester l'API directement :
   ```bash
   curl -H "x-auth-token: VOTRE_TOKEN" http://localhost:3001/api/favoris
   ```

---

## 🔄 Rollback (si nécessaire)

Si quelque chose ne fonctionne pas :

```bash
# 1. Restaurer la base de données
mysql -u root -p alliance_courtage < backup_YYYYMMDD_HHMMSS.sql

# 2. Revenir à l'ancienne version du code (si Git)
git checkout <ancien-commit-hash>

# 3. Redémarrer
pm2 restart all
```

---

## ✅ Checklist Finale

- [ ] ✅ Backup créé et sauvegardé
- [ ] ✅ Nouveaux fichiers uploadés
- [ ] ✅ Dépendances installées
- [ ] ✅ Table `favoris` créée
- [ ] ✅ Services redémarrés
- [ ] ✅ Logs vérifiés (pas d'erreurs)
- [ ] ✅ API `/api/health` répond
- [ ] ✅ Interface se charge correctement
- [ ] ✅ Menu "Mes Favoris" visible
- [ ] ✅ Boutons favoris fonctionnent
- [ ] ✅ Page Favoris affiche les favoris
- [ ] ✅ Upload en masse avec date fonctionne

---

## 📞 Support

**Documentation complète:**
- `DEPLOYMENT_GUIDE.md` - Guide détaillé
- `QUICK_DEPLOY.md` - Guide rapide
- `DEPLOY_STEPS.md` - Étapes détaillées

**En cas de problème:**
1. Vérifier les logs
2. Vérifier la base de données
3. Vérifier les fichiers uploadés
4. Consulter la section "Problèmes et Solutions" ci-dessus

---

**Bon déploiement ! 🚀**

