# 🚀 Guide d'exécution de la migration sur le serveur

## ⚠️ IMPORTANT : Exécuter sur le serveur

Ces commandes doivent être exécutées **directement sur votre serveur Ubuntu**, pas en local.

## 📋 Étapes à suivre

### 1. Se connecter au serveur

```bash
ssh ubuntu@votre-ip-serveur
```

### 2. Aller dans le dossier du projet

```bash
cd ~/prod
```

### 3. Récupérer les dernières modifications

```bash
git pull origin deploy-new-version
```

### 4. Vérifier l'état actuel (optionnel mais recommandé)

```bash
cd backend/scripts
chmod +x verify-tables.sh
./verify-tables.sh
```

Cela vous montrera quelles tables/colonnes manquent.

### 5. Exécuter le script de migration

```bash
chmod +x fix-database.sh
./fix-database.sh
```

Vous devriez voir :
```
🔧 Correction de la base de données...
✅ Migration terminée!
✅ Script terminé!
```

### 6. Vérifier que tout a été créé

```bash
./verify-tables.sh
```

Tous les éléments devraient maintenant afficher ✅.

### 7. Redémarrer le backend

```bash
cd ~/prod/backend
sudo docker-compose restart backend
```

### 8. Vérifier les logs

```bash
sudo docker logs --tail 50 alliance-courtage-backend
```

Il ne devrait plus y avoir d'erreurs `ER_NO_SUCH_TABLE` ou `ER_BAD_FIELD_ERROR`.

## 🔧 Si le script échoue

### Vérifier que le conteneur MySQL est en cours d'exécution

```bash
sudo docker ps | grep mysql
```

### Vérifier les permissions

```bash
sudo docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;"
```

### Exécuter manuellement les commandes SQL

Si le script échoue, vous pouvez exécuter les commandes SQL directement :

```bash
sudo docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage < fix-database.sh
```

**Note** : Cette méthode ne fonctionnera pas car le script contient des commandes bash. Utilisez plutôt la méthode avec `<< 'SQL'`.

## ✅ Vérification finale

Testez ces endpoints dans votre navigateur :

- `http://votre-ip/api/favoris` - devrait retourner `[]`
- `http://votre-ip/api/simulators/usage` - devrait retourner `[]` ou des données
- `http://votre-ip/api/structured-products/reservations/all` - devrait retourner `[]`
- `http://votre-ip/api/formations?year=2025` - devrait retourner `[]`

Si tous ces endpoints fonctionnent sans erreur 500, la migration est réussie ! 🎉

