# Solutions pour le déploiement

## Option 1 : Copier le script dans le conteneur puis l'exécuter

```bash
cd /var/www/alliance-courtage

# Copier le script dans le conteneur
docker cp backend/scripts/addLinkToNotifications.js alliance-courtage-backend:/app/scripts/addLinkToNotifications.js

# Exécuter le script
docker exec -it alliance-courtage-backend node scripts/addLinkToNotifications.js
```

## Option 2 : Utiliser SQL direct (plus rapide)

```bash
# Ajouter la colonne link directement via SQL
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << EOF
-- Vérifier si la colonne existe déjà, sinon l'ajouter
SET @dbname = DATABASE();
SET @tablename = 'notifications';
SET @columnname = 'link';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(500) NULL AFTER related_type')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
EOF
```

## Option 3 : SQL simple (si la colonne n'existe pas encore)

```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "ALTER TABLE notifications ADD COLUMN link VARCHAR(500) NULL AFTER related_type;"
```

## Après la migration, continuer avec le frontend

```bash
# Rebuild le frontend
docker compose build --no-cache frontend

# Redémarrer le frontend
docker compose up -d frontend

# Vérifier que tout fonctionne
docker ps
docker logs alliance-courtage-backend --tail 30
```

## Vérifier que la colonne existe

```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE notifications;"
```

