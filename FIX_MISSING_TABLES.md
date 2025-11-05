# 🔧 Solution : Tables Manquantes et Problèmes CMS

## ❌ Problèmes Identifiés

1. **Table `assurances` n'existe pas**
2. **Table `cms_content` : colonne `section` NOT NULL sans valeur par défaut**

## ✅ Solutions

### Solution 1 : Créer la Table assurances

```bash
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
CREATE TABLE IF NOT EXISTS assurances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  montant_enveloppe DECIMAL(15, 2) DEFAULT 0,
  color VARCHAR(50),
  icon VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DESCRIBE assurances;
EOF
```

### Solution 2 : Corriger la Table cms_content

Option A : Ajouter une valeur par défaut à `section`

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE cms_content MODIFY COLUMN section VARCHAR(100) DEFAULT 'default' NOT NULL;"
```

Option B : Permettre NULL (si acceptable)

```bash
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE cms_content MODIFY COLUMN section VARCHAR(100) NULL;"
```

---

## 🚀 Solution Complète (Copier-Coller)

```bash
# 1. Créer la table assurances
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
CREATE TABLE IF NOT EXISTS assurances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  montant_enveloppe DECIMAL(15, 2) DEFAULT 0,
  color VARCHAR(50),
  icon VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF

# 2. Corriger cms_content (ajouter valeur par défaut à section)
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; ALTER TABLE cms_content MODIFY COLUMN section VARCHAR(100) DEFAULT 'default' NOT NULL;"

# 3. Vérifier
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE assurances;"
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE cms_content;"
```

---

**Exécutez la Solution Complète ! 🚀**


