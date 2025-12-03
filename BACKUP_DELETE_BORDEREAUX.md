# Backup et suppression des bordereaux - Commandes rapides

## Option 1: Script automatique (recommandé)

```bash
chmod +x backup-and-delete-bordereaux.sh
./backup-and-delete-bordereaux.sh
```

## Option 2: Commandes manuelles

### 1. Créer le backup

```bash
# Créer le dossier de backup
mkdir -p backups

# Exporter tous les bordereaux
docker exec alliance-courtage-mysql mysqldump -u root -p'alliance2024Secure' alliance_courtage bordereaux > backups/bordereaux_backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Vérifier le backup

```bash
# Voir la taille du fichier
ls -lh backups/bordereaux_backup_*.sql

# Voir le contenu (premières lignes)
head -20 backups/bordereaux_backup_*.sql
```

### 3. Supprimer tous les bordereaux

```bash
# Se connecter et supprimer
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage <<EOF
DELETE FROM bordereaux;
SELECT ROW_COUNT() as deleted_rows;
EOF
```

## Option 3: Commandes SQL directes

```bash
# Se connecter à MySQL
docker exec -it alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage
```

Puis dans MySQL :

```sql
-- Vérifier le nombre avant
SELECT COUNT(*) FROM bordereaux;

-- Supprimer tous les bordereaux
DELETE FROM bordereaux;

-- Vérifier après
SELECT COUNT(*) FROM bordereaux;
```

## Restauration du backup

Si vous devez restaurer :

```bash
docker exec -i alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage < backups/bordereaux_backup_YYYYMMDD_HHMMSS.sql
```

## ⚠️ ATTENTION

- Cette opération est **IRRÉVERSIBLE** sans le backup
- Assurez-vous que le backup a été créé avec succès avant de supprimer
- Vérifiez la taille du fichier de backup (ne doit pas être 0)

