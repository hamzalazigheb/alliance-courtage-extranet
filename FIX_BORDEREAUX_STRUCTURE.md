# 🔧 Solution : Restructurer la Table bordereaux

## ❌ Problème

La table `bordereaux` a une structure différente de ce qui est attendu :
- Structure actuelle : `id, user_id, archive_id, label, period_month, period_year, created_at`
- Structure attendue : `id, title, user_id, description, file_path, file_content, file_size, file_type, period_month, period_year, uploaded_by, created_at, updated_at`

## ✅ Solution : Recréer la Table avec la Bonne Structure

### Option 1 : Recréer la Table (Si Pas de Données Importantes)

```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
-- Supprimer l'ancienne table
DROP TABLE IF EXISTS bordereaux;

-- Créer la nouvelle table avec la bonne structure
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
EOF
```

### Option 2 : Migrer les Données (Si Vous Avez des Données)

```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
-- Créer une table temporaire avec les anciennes données
CREATE TABLE bordereaux_backup AS SELECT * FROM bordereaux;

-- Supprimer l'ancienne table
DROP TABLE bordereaux;

-- Créer la nouvelle table
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

-- Migrer les données (si nécessaire)
-- INSERT INTO bordereaux (id, user_id, title, period_month, period_year, uploaded_by, created_at)
-- SELECT id, user_id, label, period_month, period_year, user_id, created_at FROM bordereaux_backup;
EOF
```

---

## 🚀 Solution Recommandée (Table Vide)

Puisque vous avez vidé la base de données pour le client, recréons simplement la table :

```bash
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
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

DESCRIBE bordereaux;
EOF
```

---

**Exécutez la Solution Recommandée pour recréer la table avec la bonne structure ! 🚀**


