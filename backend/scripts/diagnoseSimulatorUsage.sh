#!/bin/bash

# Script de diagnostic pour l'erreur 500 sur /api/simulators/usage
# Usage: ./diagnoseSimulatorUsage.sh

echo "🔍 Diagnostic de l'erreur 500 sur /api/simulators/usage"
echo "======================================================"
echo ""

MYSQL_CONTAINER=$(docker ps --filter "name=alliance-courtage-mysql" --format "{{.Names}}" | head -1)
BACKEND_CONTAINER=$(docker ps --filter "name=alliance-courtage-backend" --format "{{.Names}}" | head -1)

if [ -z "$MYSQL_CONTAINER" ]; then
    echo "❌ Conteneur MySQL non trouvé!"
    exit 1
fi

if [ -z "$BACKEND_CONTAINER" ]; then
    echo "❌ Conteneur backend non trouvé!"
    exit 1
fi

echo "✅ Conteneurs trouvés:"
echo "   MySQL: $MYSQL_CONTAINER"
echo "   Backend: $BACKEND_CONTAINER"
echo ""

# 1. Vérifier si la table existe
echo "📋 Étape 1: Vérification de la table simulator_usage..."
TABLE_EXISTS=$(docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES LIKE 'simulator_usage';" 2>/dev/null | grep -c "simulator_usage" || echo "0")

if [ "$TABLE_EXISTS" -eq 0 ]; then
    echo "❌ La table simulator_usage n'existe pas!"
    echo ""
    echo "🔧 Création de la table..."
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
else
    echo "✅ La table simulator_usage existe"
fi
echo ""

# 2. Vérifier la structure de la table
echo "📋 Étape 2: Structure de la table..."
docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE simulator_usage;" 2>/dev/null
echo ""

# 3. Vérifier les logs du backend pour les erreurs récentes
echo "📋 Étape 3: Dernières erreurs dans les logs du backend..."
echo "=========================================================="
docker logs "$BACKEND_CONTAINER" --tail 50 2>&1 | grep -i "simulator\|error\|500\|ER_" | tail -20 || echo "Aucune erreur récente trouvée"
echo ""

# 4. Vérifier la connexion à la base de données
echo "📋 Étape 4: Test de connexion à la base de données..."
docker exec "$BACKEND_CONTAINER" node -e "
const mysql = require('mysql2/promise');
(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'alliance-courtage-mysql',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'alliance2024Secure',
      database: process.env.DB_NAME || 'alliance_courtage'
    });
    const [rows] = await conn.execute('SELECT COUNT(*) as count FROM simulator_usage');
    console.log('✅ Connexion OK - Nombre d\'enregistrements:', rows[0].count);
    await conn.end();
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  }
})();
" 2>&1 || echo "⚠️  Impossible de tester la connexion depuis le conteneur"
echo ""

# 5. Vérifier les permissions
echo "📋 Étape 5: Vérification des permissions..."
docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  CREATE_TIME
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'simulator_usage';
" 2>/dev/null
echo ""

# 6. Suggestions
echo "💡 Suggestions:"
echo "==============="
echo ""
echo "1. Si la table n'existait pas, elle a été créée. Redémarrez le backend:"
echo "   docker restart $BACKEND_CONTAINER"
echo ""
echo "2. Vérifiez les logs du backend en temps réel:"
echo "   docker logs -f $BACKEND_CONTAINER"
echo ""
echo "3. Testez l'API directement:"
echo "   curl -H 'x-auth-token: VOTRE_TOKEN' http://localhost:3001/api/simulators/usage?limit=10"
echo ""
echo "4. Si l'erreur persiste, vérifiez que le backend utilise le bon code:"
echo "   docker exec $BACKEND_CONTAINER cat /app/routes/simulators.js | grep -A 5 'ER_NO_SUCH_TABLE'"
echo ""

echo "✅ Diagnostic terminé!"


