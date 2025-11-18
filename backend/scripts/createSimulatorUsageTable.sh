#!/bin/bash

# Script pour créer la table simulator_usage en production
# Usage: ./createSimulatorUsageTable.sh

echo "🔧 Création de la table simulator_usage"
echo "========================================"
echo ""

MYSQL_CONTAINER=$(docker ps --filter "name=alliance-courtage-mysql" --format "{{.Names}}" | head -1)

if [ -z "$MYSQL_CONTAINER" ]; then
    echo "❌ Conteneur MySQL non trouvé!"
    exit 1
fi

echo "✅ Conteneur MySQL trouvé: $MYSQL_CONTAINER"
echo ""

echo "📦 Création de la table simulator_usage..."
docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
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

if [ $? -eq 0 ]; then
    echo "✅ Table simulator_usage créée avec succès"
else
    echo "❌ Erreur lors de la création de la table"
    exit 1
fi

echo ""
echo "🔍 Vérification..."
docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES LIKE 'simulator_usage';"
docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE simulator_usage;"

echo ""
echo "✅ Terminé!"

