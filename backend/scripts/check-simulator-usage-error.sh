#!/bin/bash
# Script pour diagnostiquer l'erreur sur /api/simulators/usage

echo "🔍 Diagnostic de l'erreur /api/simulators/usage..."
echo ""

# 1. Vérifier que la table existe
echo "📊 1. Vérification de la table simulator_usage..."
TABLE_EXISTS=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'simulator_usage';" 2>/dev/null)

if [ "$TABLE_EXISTS" = "1" ]; then
  echo "  ✅ Table simulator_usage existe"
else
  echo "  ❌ Table simulator_usage N'EXISTE PAS"
  echo "  🔧 Création de la table..."
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
  echo "  ✅ Table créée!"
fi

# 2. Vérifier la structure
echo ""
echo "📋 2. Structure de la table:"
sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE simulator_usage;" 2>/dev/null

# 3. Vérifier les données
echo ""
echo "📈 3. Nombre de lignes:"
ROWS=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM simulator_usage;" 2>/dev/null)
echo "   $ROWS lignes"

# 4. Vérifier les logs du backend pour cette erreur spécifique
echo ""
echo "🔍 4. Dernières erreurs dans les logs du backend (simulator_usage):"
sudo docker logs --tail 200 alliance-courtage-backend 2>&1 | grep -A 20 "simulator_usage\|simulators/usage" | tail -40

# 5. Tester la requête SQL directement
echo ""
echo "🧪 5. Test de la requête SQL directement dans MySQL:"
sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
SELECT 
  su.*,
  u.nom,
  u.prenom,
  u.email
FROM simulator_usage su
LEFT JOIN users u ON su.user_id = u.id
ORDER BY su.created_at DESC
LIMIT 5;
" 2>&1 | head -20

echo ""
echo "✅ Diagnostic terminé!"

