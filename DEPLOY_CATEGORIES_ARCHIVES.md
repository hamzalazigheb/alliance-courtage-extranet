# 🚀 Guide de Déploiement - Système de Catégories pour les Archives

## 📋 Fonctionnalité à Déployer

✅ **Système de Catégories pour les Archives**
- Organisation des archives par catégories (comme des sous-dossiers)
- Édition de catégorie directement dans l'interface
- Filtrage par catégorie
- Correction du téléchargement des documents

---

## ⚠️ IMPORTANT : Protection des Données

**NE JAMAIS :**
- ❌ Exécuter `docker-compose down -v` (supprime les volumes)
- ❌ Exécuter `initDatabase.js` en production
- ❌ Supprimer les conteneurs MySQL

**TOUJOURS :**
- ✅ Faire un backup de la base de données avant toute opération
- ✅ Préserver les volumes Docker
- ✅ Tester sur un environnement de staging si possible

---

## 📦 Étape 1 : Préparation sur le Serveur

### 1.1 Se connecter au serveur

```bash
ssh ubuntu@votre-serveur
cd ~/alliance/alliance
```

### 1.2 Vérifier l'état actuel

```bash
# Vérifier les conteneurs en cours d'exécution
docker ps

# Vérifier si la colonne category existe déjà
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;" | grep category
```

### 1.3 Backup de la base de données (OBLIGATOIRE)

```bash
# Créer un dossier pour les backups
mkdir -p ~/backups

# Créer le backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec alliance-courtage-mysql mysqldump -u root -palliance2024Secure alliance_courtage > ~/backups/backup_before_categories_$TIMESTAMP.sql

# Vérifier que le backup a été créé
ls -lh ~/backups/backup_before_categories_*.sql
```

---

## 🗄️ Étape 2 : Ajout de la Colonne Category

### 2.1 Vérifier si la colonne existe déjà

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW COLUMNS FROM archives LIKE 'category';"
```

Si la colonne existe déjà, vous verrez une ligne avec "category". Sinon, passez à l'étape 2.2.

### 2.2 Ajouter la colonne category

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
ALTER TABLE archives 
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Non classé' AFTER type;
EOF
```

**Note :** Si MySQL ne supporte pas `IF NOT EXISTS` dans ALTER TABLE, utilisez cette version :

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
-- Vérifier si la colonne existe avant de l'ajouter
SET @dbname = DATABASE();
SET @tablename = 'archives';
SET @columnname = 'category';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) DEFAULT ''Non classé'' AFTER type')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
EOF
```

### 2.3 Vérifier que la colonne a été ajoutée

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;" | grep category
```

Vous devriez voir une ligne avec "category".

### 2.4 Catégoriser automatiquement les bordereaux 2024

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
UPDATE archives 
SET category = 'Bordereaux 2024' 
WHERE (title LIKE '%2024%' OR file_name LIKE '%2024%' OR description LIKE '%2024%')
AND (category IS NULL OR category = 'Non classé' OR category = '');
EOF
```

### 2.5 Vérifier les catégories existantes

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SELECT DISTINCT category, COUNT(*) as count FROM archives WHERE category IS NOT NULL GROUP BY category ORDER BY category;"
```

---

## 📥 Étape 3 : Mise à Jour du Code

### 3.1 Puller les dernières modifications

```bash
cd ~/alliance/alliance
git pull origin main
# ou git pull origin master selon votre branche
```

### 3.2 Vérifier que les fichiers sont à jour

```bash
# Vérifier que le script existe
ls -la backend/scripts/addCategoryToArchives.js

# Vérifier que les routes sont mises à jour
grep -n "category" backend/routes/archives.js

# Vérifier que le frontend est à jour
grep -n "updateCategory" src/api.js
grep -n "editingCategory" src/FileManagementPage.tsx
```

---

## 🔄 Étape 4 : Redémarrage des Services

### 4.1 Redémarrer le backend

```bash
cd ~/alliance/alliance/backend
docker-compose restart backend
```

Ou si vous utilisez docker-compose depuis la racine :

```bash
cd ~/alliance/alliance
docker-compose restart backend
```

### 4.2 Vérifier que le backend a redémarré

```bash
docker logs alliance-courtage-backend --tail 50
```

Vous devriez voir des logs indiquant que le serveur a démarré.

### 4.3 Redémarrer le frontend (si nécessaire)

Si vous utilisez un serveur de production pour le frontend :

```bash
# Si vous utilisez nginx + build statique
cd ~/alliance/alliance
npm run build
# Puis copier les fichiers build vers nginx

# Si vous utilisez un serveur de développement
# Le frontend se mettra à jour automatiquement
```

---

## ✅ Étape 5 : Tests

### 5.1 Tester l'API de catégories

```bash
# Tester la liste des catégories
curl -H "x-auth-token: VOTRE_TOKEN" http://localhost:3001/api/archives/categories/list

# Tester la mise à jour d'une catégorie (remplacer ID par un ID réel)
curl -X PUT \
  -H "x-auth-token: VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"category": "Bordereaux 2024"}' \
  http://localhost:3001/api/archives/1/category
```

### 5.2 Tester dans l'interface

1. **Se connecter en tant qu'administrateur**
   - Aller sur `/manage`
   - Se connecter avec vos identifiants admin

2. **Tester la gestion des archives**
   - Aller dans "Gestion des Archives"
   - Vérifier que la colonne "Catégorie" est visible
   - Cliquer sur ✏️ à côté d'une archive
   - Modifier la catégorie et valider
   - Vérifier que la modification est sauvegardée

3. **Tester le filtre**
   - Utiliser le filtre "Catégorie" en haut de la page
   - Sélectionner "Bordereaux 2024"
   - Vérifier que seules les archives de cette catégorie s'affichent

4. **Tester le téléchargement**
   - Cliquer sur "Télécharger" à côté d'une archive
   - Vérifier que le document s'ouvre correctement

---

## 🐛 Dépannage

### Problème : La colonne category n'existe pas

**Solution :**
```bash
# Vérifier d'abord
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;"

# Ajouter manuellement si nécessaire
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "ALTER TABLE archives ADD COLUMN category VARCHAR(100) DEFAULT 'Non classé' AFTER type;"
```

### Problème : Erreur "Column 'category' already exists"

**Solution :** C'est normal, la colonne existe déjà. Vous pouvez continuer.

### Problème : Le backend ne démarre pas

**Solution :**
```bash
# Vérifier les logs
docker logs alliance-courtage-backend --tail 100

# Vérifier la syntaxe du code
cd ~/alliance/alliance/backend
node -c routes/archives.js

# Redémarrer proprement
docker-compose down
docker-compose up -d
```

### Problème : L'interface ne montre pas les catégories

**Solution :**
1. Vérifier que le frontend est à jour : `git pull`
2. Vider le cache du navigateur (Ctrl+Shift+R ou Cmd+Shift+R)
3. Vérifier la console du navigateur pour les erreurs
4. Vérifier que l'API répond : `curl http://localhost:3001/api/archives/categories/list`

---

## 📊 Vérification Post-Déploiement

### Checklist

- [ ] Backup de la base de données créé
- [ ] Colonne `category` ajoutée à la table `archives`
- [ ] Code mis à jour (git pull)
- [ ] Backend redémarré
- [ ] Frontend mis à jour
- [ ] Test API : Liste des catégories fonctionne
- [ ] Test API : Mise à jour de catégorie fonctionne
- [ ] Test Interface : Édition de catégorie fonctionne
- [ ] Test Interface : Filtre par catégorie fonctionne
- [ ] Test Interface : Téléchargement fonctionne
- [ ] Bordereaux 2024 catégorisés automatiquement

---

## 🎉 Étape 6 : Confirmation

Une fois tous les tests réussis, la fonctionnalité est déployée en production !

### Fonctionnalités maintenant disponibles :

1. ✅ **Organisation par catégories** - Organiser les archives comme des sous-dossiers
2. ✅ **Édition inline** - Modifier la catégorie directement dans l'interface
3. ✅ **Filtrage** - Filtrer les archives par catégorie
4. ✅ **Téléchargement corrigé** - Le bouton "Télécharger" fonctionne correctement

---

## 📞 Support

En cas de problème :

1. **Vérifier les logs :**
   ```bash
   docker logs alliance-courtage-backend --tail 100
   ```

2. **Vérifier la base de données :**
   ```bash
   docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;"
   ```

3. **Restaurer le backup si nécessaire :**
   ```bash
   docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage < ~/backups/backup_before_categories_*.sql
   ```

---

## 📝 Notes Importantes

1. **Migration Production :** La colonne `category` doit être ajoutée avant d'utiliser cette fonctionnalité.

2. **Catégories par défaut :** Les catégories sont créées automatiquement lors de leur première utilisation.

3. **Rétrocompatibilité :** Les archives existantes sans catégorie auront la valeur "Non classé" par défaut.

4. **Performance :** Le filtrage par catégorie est optimisé avec un index sur la colonne `category` (à ajouter si nécessaire).

---

**Dernière mise à jour :** Décembre 2024

