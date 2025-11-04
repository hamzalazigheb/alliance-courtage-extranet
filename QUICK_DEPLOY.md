# ⚡ Déploiement Rapide - Version avec Favoris

## 🎯 3 Étapes Simples

### 1. Backup (Important !)
```bash
mysqldump -u root -p alliance_courtage > backup_$(date +%Y%m%d).sql
```

### 2. Migration Base de Données
```bash
cd backend
node scripts/addFavorisTable.js
```

### 3. Redémarrage
```bash
# PM2
pm2 restart all

# Docker
docker-compose restart

# Systemd
sudo systemctl restart alliance-courtage-backend
```

---

## ✅ Vérification

1. **Vérifier la table favoris:**
   ```sql
   USE alliance_courtage;
   SHOW TABLES LIKE 'favoris';
   ```

2. **Tester l'API:**
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Tester l'interface:**
   - Se connecter
   - Vérifier que "Mes Favoris" apparaît dans le menu
   - Vérifier les boutons favoris sur les pages

---

## 📝 Changements Déployés

- ✅ Nouvelle table `favoris`
- ✅ Système de favoris complet
- ✅ Configuration de date pour upload en masse
- ✅ Interface simplifiée upload en masse

---

**Documentation complète:** `DEPLOYMENT_GUIDE.md`

