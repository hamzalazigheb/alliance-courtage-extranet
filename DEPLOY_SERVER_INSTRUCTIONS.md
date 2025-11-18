# 🚀 Instructions de Déploiement sur le Serveur

## Problème : Conflits Git

Si vous voyez cette erreur :
```
error: Your local changes to the following files would be overwritten by merge:
```

## Solution : Gérer les changements locaux

### Option 1 : Sauvegarder les changements locaux (Recommandé)

```bash
# Sauvegarder les changements locaux
git stash

# Faire le pull
git pull origin main

# Appliquer les changements locaux si nécessaire
git stash pop
```

### Option 2 : Commiter les changements locaux

```bash
# Voir les changements
git status

# Ajouter les fichiers modifiés
git add backend/scripts/createSimulatorUsageTable.sh deploy-new-features.sh fix-nginx-network.sh redeploy.sh

# Commiter
git commit -m "chore: Local server changes"

# Faire le pull
git pull origin main

# Résoudre les conflits si nécessaire
```

### Option 3 : Ignorer les changements locaux (ATTENTION : Perte de données)

```bash
# ⚠️ ATTENTION : Cela supprimera les changements locaux
git reset --hard origin/main
git pull origin main
```

---

## Déploiement Complet

### Étape 1 : Résoudre les conflits Git

```bash
# Sur le serveur
cd ~/alliance/alliance

# Option recommandée : Stash
git stash
git pull origin main
```

### Étape 2 : Rendre le script exécutable

```bash
chmod +x deploy-categories.sh
```

### Étape 3 : Exécuter le script de déploiement

```bash
./deploy-categories.sh
```

---

## Déploiement Manuel (si le script ne fonctionne pas)

### Étape 1 : Backup

```bash
mkdir -p ~/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec alliance-courtage-mysql mysqldump -u root -palliance2024Secure alliance_courtage > ~/backups/backup_categories_$TIMESTAMP.sql
```

### Étape 2 : Ajouter la colonne category

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
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

### Étape 3 : Catégoriser les bordereaux 2024

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
UPDATE archives 
SET category = 'Bordereaux 2024' 
WHERE (title LIKE '%2024%' OR file_name LIKE '%2024%' OR description LIKE '%2024%')
AND (category IS NULL OR category = 'Non classé' OR category = '');
EOF
```

### Étape 4 : Redémarrer le backend

```bash
docker-compose restart backend
# ou
docker restart alliance-courtage-backend
```

### Étape 5 : Vérifier

```bash
# Vérifier la colonne
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;" | grep category

# Vérifier les catégories
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SELECT DISTINCT category, COUNT(*) as count FROM archives WHERE category IS NOT NULL GROUP BY category;"
```

---

## Commandes Rapides (Copier-Coller)

```bash
# 1. Résoudre les conflits
cd ~/alliance/alliance
git stash
git pull origin main

# 2. Rendre le script exécutable
chmod +x deploy-categories.sh

# 3. Exécuter le déploiement
./deploy-categories.sh
```

---

## En cas de problème

### Vérifier les logs
```bash
docker logs alliance-courtage-backend --tail 100
```

### Vérifier la base de données
```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;"
```

### Restaurer le backup
```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage < ~/backups/backup_categories_*.sql
```

