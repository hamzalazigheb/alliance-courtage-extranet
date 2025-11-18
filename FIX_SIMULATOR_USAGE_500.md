# 🔧 Fix : Erreur 500 sur /api/simulators/usage

## 🔍 Problème

```
GET http://13.38.115.36/api/simulators/usage?limit=50 500 (Internal Server Error)
GET http://13.38.115.36/api/simulators/usage/stats 500 (Internal Server Error)
```

L'erreur 500 est probablement due à la table `simulator_usage` qui n'existe pas en production.

## ✅ Solution : Créer la table en production

### Option 1 : Via Docker exec (Recommandé)

```bash
# Sur votre serveur de production
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
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
EOF

# Vérifier que la table a été créée
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;" | grep simulator
```

### Option 2 : Via le script Node.js

```bash
# Sur votre serveur de production
cd ~/alliance/alliance/backend

# Exécuter le script
docker exec alliance-courtage-backend node scripts/addSimulatorUsageTable.js
```

### Option 3 : Vérifier d'abord si la table existe

```bash
# Vérifier si la table existe
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES LIKE 'simulator_usage';"

# Si la table n'existe pas, la créer avec l'Option 1
```

## 🔍 Diagnostic : Vérifier les logs du backend

```bash
# Voir les logs du backend pour l'erreur exacte
docker logs alliance-courtage-backend --tail 100 | grep -i "simulator\|error\|500"
```

## ✅ Vérification après création

```bash
# 1. Vérifier que la table existe
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE simulator_usage;"

# 2. Tester l'API
curl -H "x-auth-token: VOTRE_TOKEN" http://localhost:3001/api/simulators/usage?limit=10

# 3. Vérifier les logs du backend
docker logs alliance-courtage-backend --tail 20
```

## 🚀 Solution Rapide (Tout en une fois)

```bash
# Sur votre serveur
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
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
"

# Vérifier
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;" | grep simulator
```

## 📝 Notes

- La table `simulator_usage` stocke les statistiques d'utilisation des simulateurs
- Elle est nécessaire pour la page "Statistiques des Simulateurs"
- Si la table n'existe pas, toutes les requêtes vers `/api/simulators/usage` retourneront une erreur 500


