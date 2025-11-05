# 🔍 Vérifier la Table bordereaux

## Commande à Exécuter

```bash
# Vérifier la structure actuelle de la table bordereaux
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE bordereaux;"

# Voir toutes les colonnes
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SHOW COLUMNS FROM bordereaux;"
```

---

## Si la Table a Encore l'Ancienne Structure

Si la table a encore `archive_id` et `label` au lieu de `title`, `description`, `file_path`, etc., il faut la recréer :

```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS bordereaux;
CREATE TABLE bordereaux (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  period_month INT COMMENT 'Month (1-12)',
  period_year INT COMMENT 'Year (e.g., 2024)',
  uploaded_by INT NOT NULL COMMENT 'Admin who uploaded the file',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_uploaded_by (uploaded_by),
  INDEX idx_period (period_year, period_month),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
SET FOREIGN_KEY_CHECKS = 1;
DESCRIBE bordereaux;
EOF
```

---

**Exécutez d'abord la vérification pour voir la structure actuelle ! 🔍**


