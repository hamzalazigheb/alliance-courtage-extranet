# 🔧 Migration dans Docker - Solution

## ❌ Problème

Le fichier `addFavorisTable.js` n'est pas dans le conteneur Docker (`/app/scripts/addFavorisTable.js`).

## ✅ Solutions

### Solution 1 : Copier le fichier dans le conteneur (Rapide)

```bash
# Copier le fichier depuis le serveur vers le conteneur
docker cp backend/scripts/addFavorisTable.js alliance-courtage-backend:/app/scripts/addFavorisTable.js

# Ensuite exécuter
docker exec -it alliance-courtage-backend node scripts/addFavorisTable.js
```

### Solution 2 : Exécuter directement depuis le serveur (Si Node.js est disponible)

```bash
# Installer Node.js temporairement OU
# Utiliser nvm si disponible
cd backend
node scripts/addFavorisTable.js
```

### Solution 3 : Créer le script SQL directement dans MySQL

```bash
# Créer la table directement via MySQL
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage
```

Puis exécuter ce SQL :

```sql
CREATE TABLE IF NOT EXISTS `favoris` (
  id INT PRIMARY KEY AUTO_INCREMENT,
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
```

---

## 🎯 Solution Recommandée (Solution 1)

```bash
# 1. Vérifier que le fichier existe sur le serveur
ls -la backend/scripts/addFavorisTable.js

# 2. Vérifier la structure du conteneur
docker exec alliance-courtage-backend ls -la /app/scripts/

# 3. Créer le répertoire scripts s'il n'existe pas
docker exec alliance-courtage-backend mkdir -p /app/scripts

# 4. Copier le fichier
docker cp backend/scripts/addFavorisTable.js alliance-courtage-backend:/app/scripts/addFavorisTable.js

# 5. Copier aussi le fichier config.env si nécessaire
# (Vérifier d'abord si le conteneur a besoin du config.env)
docker exec alliance-courtage-backend ls -la /app/config.env

# 6. Exécuter le script
docker exec -it alliance-courtage-backend node scripts/addFavorisTable.js
```

---

## 🔍 Vérifier la Structure du Conteneur

```bash
# Voir la structure du conteneur
docker exec alliance-courtage-backend ls -la /app/

# Voir si scripts existe
docker exec alliance-courtage-backend ls -la /app/scripts/ 2>/dev/null || echo "Scripts directory does not exist"

# Voir où sont les fichiers backend
docker exec alliance-courtage-backend find /app -name "*.js" -type f | head -10
```

---

## ✅ Solution Alternative (SQL Direct)

Si la copie ne fonctionne pas, utilisez directement SQL :

```bash
docker exec -it alliance-courtage-mysql mysql -u root -p alliance_courtage << 'EOF'
CREATE TABLE IF NOT EXISTS `favoris` (
  id INT PRIMARY KEY AUTO_INCREMENT,
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
EOF
```

---

**Exécutez la Solution 1 d'abord ! 🚀**


