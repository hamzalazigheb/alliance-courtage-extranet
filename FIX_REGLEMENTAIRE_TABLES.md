# 🔧 Solution : Erreur 500 sur /api/reglementaire

## ❌ Problème

```
GET http://13.38.115.36/api/reglementaire/documents 500 (Internal Server Error)
GET http://13.38.115.36/api/reglementaire/folders 500 (Internal Server Error)
```

Les tables `reglementaire_folders` et `reglementaire_documents` n'existent probablement pas.

## ✅ Solution : Créer les Tables Réglementaire

```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
-- Créer la table reglementaire_folders
CREATE TABLE IF NOT EXISTS reglementaire_folders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id INT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES reglementaire_folders(id) ON DELETE CASCADE,
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Créer la table reglementaire_documents
CREATE TABLE IF NOT EXISTS reglementaire_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  folder_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES reglementaire_folders(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_folder_id (folder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vérifier
DESCRIBE reglementaire_folders;
DESCRIBE reglementaire_documents;
EOF
```

---

## 🔍 Vérification

```bash
# Vérifier que les tables existent
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SHOW TABLES LIKE 'reglementaire%';"

# Vérifier les structures
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE reglementaire_folders;"
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE reglementaire_documents;"
```

---

**Exécutez la commande pour créer les tables ! 🚀**


