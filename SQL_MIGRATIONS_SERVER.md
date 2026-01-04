# 🗄️ Migrations SQL pour le Serveur de Production

## ⚠️ À exécuter sur le serveur AVANT le déploiement

Date: 04/01/2026

---

## 1️⃣ Ajouter la colonne `date_strike` à la table `archives`

```sql
-- Vérifier si la colonne existe déjà
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'archives' 
AND COLUMN_NAME = 'date_strike';

-- Si elle n'existe pas, l'ajouter
ALTER TABLE archives ADD COLUMN date_strike DATE;
```

**Description:** Permet de stocker la date de strike des produits structurés.

---

## 2️⃣ Créer la table `structured_products` (si elle n'existe pas)

```sql
-- Vérifier si la table existe
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'structured_products';

-- Si elle n'existe pas, la créer
CREATE TABLE IF NOT EXISTS structured_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assurance TEXT,
  montant_enveloppe DECIMAL(15,2),
  date_strike DATE,
  category VARCHAR(100),
  file_path VARCHAR(500),
  file_size INT,
  file_type VARCHAR(50),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Description:** Table pour les produits structurés (alternative à `archives`).

---

## 3️⃣ Créer la table `product_files` (si elle n'existe pas)

```sql
-- Vérifier si la table existe
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'product_files';

-- Si elle n'existe pas, la créer
CREATE TABLE IF NOT EXISTS product_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_content LONGBLOB,
  file_size INT,
  file_type VARCHAR(50),
  display_order INT DEFAULT 0,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES archives(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Description:** Table pour stocker plusieurs fichiers par produit structuré.

---

## 4️⃣ Créer la table `product_reservations` (si elle n'existe pas)

```sql
-- Vérifier si la table existe
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'product_reservations';

-- Si elle n'existe pas, la créer
CREATE TABLE IF NOT EXISTS product_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  assurance_name VARCHAR(255),
  montant DECIMAL(15,2) NOT NULL,
  notes TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES archives(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Description:** Table pour gérer les réservations de produits structurés.

---

## 📋 Script complet à exécuter

### Option A: Via Docker (RECOMMANDÉ)

```bash
# Se connecter au conteneur MySQL
docker exec -it c4dbc8574704_alliance-courtage-mysql mysql -uroot -palliance2024Secure

# Puis exécuter les commandes SQL ci-dessus une par une
```

### Option B: Via fichier SQL

Copiez toutes les commandes SQL ci-dessus dans un fichier `migrations.sql`, puis:

```bash
docker exec -i c4dbc8574704_alliance-courtage-mysql mysql -uroot -palliance2024Secure alliance_courtage < migrations.sql
```

---

## ✅ Vérifications après migration

```sql
-- Vérifier la structure de archives
DESCRIBE archives;

-- Vérifier que date_strike est présent
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'archives' 
AND COLUMN_NAME = 'date_strike';

-- Vérifier les tables créées
SHOW TABLES LIKE '%product%';

-- Compter les produits
SELECT COUNT(*) as total_products FROM archives;
```

---

## 🚨 Important

1. **Faites une sauvegarde** de la base avant toute migration:
   ```bash
   docker exec c4dbc8574704_alliance-courtage-mysql mysqldump -uroot -palliance2024Secure alliance_courtage > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Testez** les requêtes une par une au lieu de tout exécuter d'un coup

3. **Vérifiez** après chaque commande avec `DESCRIBE table_name;`

---

## 📝 Notes

- La colonne `category` dans `archives` peut maintenant contenir du JSON: `["Épargne","Retraite"]`
- Les anciens produits avec catégorie simple continuent de fonctionner
- La date de strike est optionnelle (peut être NULL)

