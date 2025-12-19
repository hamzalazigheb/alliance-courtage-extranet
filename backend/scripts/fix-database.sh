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

SELECT '✅ Migration terminée!' as status;
SQL

echo ""
echo "✅ Script terminé!"

