# Guide : Voir les fichiers uploadés via import en masse

Ce guide vous explique comment accéder au conteneur MySQL et voir tous les fichiers uploadés via import en masse.

## 📋 Prérequis

- Docker doit être en cours d'exécution
- Le conteneur `alliance-courtage-mysql` doit être actif

## 🔌 Connexion au conteneur MySQL

### Sur Windows (PowerShell)

```powershell
.\connect-mysql-container.ps1
```

Ou manuellement :
```powershell
docker exec -it alliance-courtage-mysql mysql -u root -p
# Mot de passe: alliance2024Secure
```

### Sur Linux/Mac

```bash
chmod +x connect-mysql-container.sh
./connect-mysql-container.sh
```

Ou manuellement :
```bash
docker exec -it alliance-courtage-mysql mysql -u root -p
# Mot de passe: alliance2024Secure
```

## 📊 Requêtes SQL pour voir les uploads en masse

Une fois connecté à MySQL, exécutez :

```sql
USE alliance_courtage;
```

### 1. Voir tous les bordereaux récents (100 derniers)

```sql
SELECT 
    b.id,
    b.title,
    b.user_id,
    u.nom as user_nom,
    u.prenom as user_prenom,
    u.email as user_email,
    b.period_month,
    b.period_year,
    b.file_size,
    b.file_type,
    CASE 
        WHEN b.file_content IS NOT NULL THEN 'Oui (Base64)' 
        WHEN b.file_path IS NOT NULL AND b.file_path != '' THEN 'Oui (Fichier)' 
        ELSE 'Non' 
    END as has_file,
    b.created_at,
    b.uploaded_by,
    admin.nom as uploaded_by_nom,
    admin.prenom as uploaded_by_prenom
FROM bordereaux b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN users admin ON b.uploaded_by = admin.id
ORDER BY b.created_at DESC
LIMIT 100;
```

### 2. Identifier les uploads en masse (groupés par date)

```sql
SELECT 
    DATE(b.created_at) as upload_date,
    COUNT(*) as nombre_fichiers,
    GROUP_CONCAT(b.title SEPARATOR ', ') as fichiers
FROM bordereaux b
GROUP BY DATE(b.created_at)
ORDER BY upload_date DESC
LIMIT 20;
```

### 3. Voir les bordereaux uploadés le même jour (probablement upload en masse)

```sql
SELECT 
    b.id,
    b.title,
    b.user_id,
    CONCAT(u.prenom, ' ', u.nom) as user_label,
    b.period_month,
    b.period_year,
    b.file_size,
    b.file_type,
    b.created_at,
    CONCAT(admin.prenom, ' ', admin.nom) as uploaded_by_label
FROM bordereaux b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN users admin ON b.uploaded_by = admin.id
WHERE DATE(b.created_at) = (
    SELECT DATE(created_at) 
    FROM bordereaux 
    ORDER BY created_at DESC 
    LIMIT 1
)
ORDER BY b.created_at DESC;
```

### 4. Statistiques générales

```sql
SELECT 
    COUNT(*) as total_bordereaux,
    COUNT(CASE WHEN file_content IS NOT NULL THEN 1 END) as avec_base64,
    COUNT(CASE WHEN file_path IS NOT NULL AND file_path != '' THEN 1 END) as avec_fichier,
    ROUND(SUM(file_size) / 1024 / 1024, 2) as taille_totale_mb,
    MIN(created_at) as premier_upload,
    MAX(created_at) as dernier_upload
FROM bordereaux;
```

### 5. Voir tous les fichiers (bordereaux + archives)

```sql
SELECT 
    'bordereau' as type,
    b.id,
    b.title,
    CONCAT(u.prenom, ' ', u.nom) as user_label,
    ROUND(b.file_size / 1024 / 1024, 2) as taille_mb,
    b.file_type,
    b.created_at
FROM bordereaux b
LEFT JOIN users u ON b.user_id = u.id
WHERE b.file_content IS NOT NULL OR (b.file_path IS NOT NULL AND b.file_path != '')
UNION ALL
SELECT 
    'archive' as type,
    a.id,
    a.title,
    CONCAT(u.prenom, ' ', u.nom) as user_label,
    ROUND(a.file_size / 1024 / 1024, 2) as taille_mb,
    a.file_type,
    a.created_at
FROM archives a
LEFT JOIN users u ON a.uploaded_by = u.id
WHERE a.file_content IS NOT NULL OR (a.file_path IS NOT NULL AND a.file_path != '')
ORDER BY created_at DESC
LIMIT 50;
```

## 📝 Notes importantes

1. **Stockage des fichiers** : Les fichiers sont stockés en base64 dans la colonne `file_content` des tables `bordereaux` et `archives`.

2. **Identification des uploads en masse** : Le flag `bulk_upload` n'est pas stocké en base de données. Pour identifier les uploads en masse, cherchez les fichiers uploadés le même jour (requête #2 et #3).

3. **Taille des fichiers** : Les fichiers sont stockés en base64, ce qui augmente leur taille d'environ 33% par rapport à la taille originale.

4. **Export des fichiers** : Pour exporter un fichier depuis la base de données, utilisez l'API :
   - Bordereaux : `GET /api/bordereaux/:id/download`
   - Archives : `GET /api/archives/:id/download`

## 🔍 Commandes MySQL utiles

```sql
-- Voir toutes les tables
SHOW TABLES;

-- Voir la structure de la table bordereaux
DESCRIBE bordereaux;

-- Voir la structure de la table archives
DESCRIBE archives;

-- Compter les enregistrements
SELECT COUNT(*) FROM bordereaux;
SELECT COUNT(*) FROM archives;

-- Quitter MySQL
EXIT;
```

