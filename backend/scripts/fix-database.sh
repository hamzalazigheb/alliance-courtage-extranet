#!/bin/bash
# Script pour corriger les colonnes et tables manquantes

echo "🔧 Correction de la base de données..."

# Se connecter à MySQL et exécuter les commandes
sudo docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'SQL'
-- 1. Ajouter validite_date si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'validite_date';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN validite_date DATE DEFAULT NULL', 
  'SELECT "Colonne validite_date existe déjà" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Créer l'index si la colonne existe
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users' 
AND INDEX_NAME = 'idx_users_validite_date';

SET @sql = IF(@index_exists = 0 AND @col_exists > 0, 
  'CREATE INDEX idx_users_validite_date ON users(validite_date)', 
  'SELECT "Index existe déjà ou colonne n\'existe pas" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.1. Ajouter denomination_sociale à users si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'denomination_sociale';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN denomination_sociale VARCHAR(255) NULL AFTER prenom', 
  'SELECT "Colonne denomination_sociale existe déjà" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.2. Ajouter telephone à users si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'telephone';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN telephone VARCHAR(20) NULL AFTER denomination_sociale', 
  'SELECT "Colonne telephone existe déjà" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2.3. Ajouter code_postal à users si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'code_postal';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE users ADD COLUMN code_postal VARCHAR(10) NULL AFTER telephone', 
  'SELECT "Colonne code_postal existe déjà" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Créer user_sessions si elle n'existe pas
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Créer password_reset_requests si elle n'existe pas
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  status ENUM('pending', 'completed', 'expired') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Ajouter logo_content à partners si elle n'existe pas
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'alliance_courtage' 
  AND TABLE_NAME = 'partners' 
  AND COLUMN_NAME = 'logo_content');

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE partners ADD COLUMN logo_content LONGTEXT NULL AFTER logo_url', 
  'SELECT "Colonne logo_content existe déjà" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. Créer la table notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  type ENUM('info', 'warning', 'error', 'success', 'reservation', 'reservation_public') DEFAULT 'info',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  related_id INT NULL,
  related_type VARCHAR(100) NULL,
  link VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_type (type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Créer la table partner_contacts
CREATE TABLE IF NOT EXISTS partner_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  fonction VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  service VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  INDEX idx_partner_id (partner_id),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Créer la table partner_documents
CREATE TABLE IF NOT EXISTS partner_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  partner_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_content LONGTEXT,
  file_size INT,
  file_type VARCHAR(255),
  document_type VARCHAR(100) DEFAULT 'convention',
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_partner_id (partner_id),
  INDEX idx_document_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Créer la table favoris
CREATE TABLE IF NOT EXISTS `favoris` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  item_type VARCHAR(50) NOT NULL COMMENT 'Type: document, product, archive, etc.',
  item_id INT NOT NULL COMMENT 'ID de l element favori',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  metadata TEXT COMMENT 'JSON pour stocker des infos supplémentaires',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_item_type (item_type),
  INDEX idx_item_id (item_id),
  INDEX idx_created_at (created_at),
  UNIQUE KEY unique_user_item (user_id, item_type, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Créer la table simulator_usage
CREATE TABLE IF NOT EXISTS simulator_usage (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  simulator_type VARCHAR(50) NOT NULL,
  parameters JSON,
  result_summary TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_simulator_type (simulator_type),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Créer la table product_reservations
CREATE TABLE IF NOT EXISTS product_reservations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  montant DECIMAL(15, 2) NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_product_id (product_id),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Créer la table formations
CREATE TABLE IF NOT EXISTS formations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  nom_document VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  heures DECIMAL(10, 2) DEFAULT 0,
  categories TEXT COMMENT 'JSON array of categories',
  delivree_par VARCHAR(255),
  file_path VARCHAR(500) DEFAULT '',
  file_content LONGTEXT,
  file_size INT,
  file_type VARCHAR(255),
  year INT NOT NULL,
  statut ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_year (year),
  INDEX idx_statut (statut),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Créer la table financial_documents
CREATE TABLE IF NOT EXISTS financial_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500) DEFAULT '',
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  subcategory VARCHAR(100),
  year INT,
  uploaded_by INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_subcategory (subcategory),
  INDEX idx_year (year),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Créer la table assurances
CREATE TABLE IF NOT EXISTS assurances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  montant_enveloppe DECIMAL(15, 2) DEFAULT 0,
  color VARCHAR(50),
  icon VARCHAR(10),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Ajouter colonne assurance à archives si elle n'existe pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'archives' 
AND COLUMN_NAME = 'assurance';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE archives ADD COLUMN assurance VARCHAR(255) NULL AFTER category', 
  'SELECT "Colonne assurance existe déjà" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 16. Ajouter colonnes uploaded_by_prenom et uploaded_by_nom à archives si elles n'existent pas
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'archives' 
AND COLUMN_NAME = 'uploaded_by_prenom';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE archives ADD COLUMN uploaded_by_prenom VARCHAR(100) NULL AFTER uploaded_by', 
  'SELECT "Colonne uploaded_by_prenom existe déjà" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'archives' 
AND COLUMN_NAME = 'uploaded_by_nom';

SET @sql = IF(@col_exists = 0, 
  'ALTER TABLE archives ADD COLUMN uploaded_by_nom VARCHAR(100) NULL AFTER uploaded_by_prenom', 
  'SELECT "Colonne uploaded_by_nom existe déjà" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 17. Créer la table cms_content
CREATE TABLE IF NOT EXISTS cms_content (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page VARCHAR(100) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_page (page)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Créer la table file_permissions
CREATE TABLE IF NOT EXISTS file_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_id INT NOT NULL,
  file_type VARCHAR(50) NOT NULL COMMENT 'Type: archive, document, bordereau, etc.',
  user_id INT,
  role VARCHAR(50),
  permission_type ENUM('read', 'write', 'delete') DEFAULT 'read',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_file (file_id, file_type),
  INDEX idx_user_id (user_id),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Créer la table reglementaire_folders
CREATE TABLE IF NOT EXISTS reglementaire_folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id INT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES reglementaire_folders(id) ON DELETE CASCADE,
  INDEX idx_parent_id (parent_id),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Créer la table reglementaire_documents
CREATE TABLE IF NOT EXISTS reglementaire_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  folder_id INT,
  name VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  file_path VARCHAR(500),
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  display_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES reglementaire_folders(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_folder_id (folder_id),
  INDEX idx_name (name),
  INDEX idx_is_active (is_active),
  INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Créer la table bordereaux
CREATE TABLE IF NOT EXISTS bordereaux (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  period_month INT,
  period_year INT,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_period (period_year, period_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Migration terminée!' as status;
SQL

echo ""
echo "✅ Script terminé!"

