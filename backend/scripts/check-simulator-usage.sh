#!/bin/bash
# Script pour vérifier la table simulator_usage

echo "🔍 Vérification de la table simulator_usage..."
echo ""

# Vérifier si la table existe
TABLE_EXISTS=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'simulator_usage';" 2>/dev/null)

if [ "$TABLE_EXISTS" = "1" ]; then
  echo "✅ Table simulator_usage existe"
  echo ""
  echo "📊 Structure de la table:"
  sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE simulator_usage;" 2>/dev/null
  echo ""
  echo "📈 Nombre de lignes:"
  ROWS=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM simulator_usage;" 2>/dev/null)
  echo "   $ROWS lignes"
else
  echo "❌ Table simulator_usage N'EXISTE PAS"
  echo ""
  echo "🔧 Création de la table..."
  sudo docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'SQL'
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
SQL
  echo "✅ Table créée!"
fi

echo ""
echo "✅ Vérification terminée!"

