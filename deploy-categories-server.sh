#!/bin/bash

# Script de déploiement du système de catégories sur le serveur
# Vérifie et déploie si nécessaire

set -e

echo "🚀 Déploiement du système de catégories pour les archives..."
echo ""

cd ~/alliance/alliance

# 1. Vérifier si la colonne category existe
echo "🔍 Vérification de la colonne category..."
COLUMN_EXISTS=$(docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SHOW COLUMNS FROM archives LIKE 'category';" 2>/dev/null | grep -c "category" || echo "0")

if [ "$COLUMN_EXISTS" -eq "0" ]; then
    echo "⚠️  La colonne category n'existe pas, création..."
    
    docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
SET @dbname = DATABASE();
SET @tablename = 'archives';
SET @columnname = 'category';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) DEFAULT ''Non classé'' AFTER type')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
EOF

    echo "✅ Colonne category créée"
else
    echo "✅ La colonne category existe déjà"
fi

# 2. Catégoriser automatiquement les bordereaux 2024
echo ""
echo "📋 Catégorisation automatique des bordereaux 2024..."
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
UPDATE archives 
SET category = 'Bordereaux 2024' 
WHERE (title LIKE '%2024%' OR file_name LIKE '%2024%' OR description LIKE '%2024%')
AND (category IS NULL OR category = 'Non classé' OR category = '');
SELECT ROW_COUNT() as updated_rows;
EOF

# 3. Afficher les catégories existantes
echo ""
echo "📊 Catégories existantes :"
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "SELECT DISTINCT category, COUNT(*) as count FROM archives WHERE category IS NOT NULL GROUP BY category ORDER BY category;" 2>/dev/null

# 4. Vérifier que le backend a les routes nécessaires
echo ""
echo "🔍 Vérification des routes API..."
if docker exec alliance-courtage-backend grep -q "PUT.*archives.*category" /app/routes/archives.js 2>/dev/null; then
    echo "✅ Route PUT /api/archives/:id/category trouvée"
else
    echo "⚠️  Route PUT /api/archives/:id/category non trouvée - redémarrage nécessaire"
fi

# 5. Redémarrer le backend pour appliquer les changements
echo ""
echo "🔄 Redémarrage du backend..."
docker restart alliance-courtage-backend

# 6. Attendre que le backend soit prêt
echo "⏳ Attente du démarrage du backend..."
sleep 5

# 7. Vérifier les logs
echo ""
echo "📋 Vérification des logs..."
docker logs alliance-courtage-backend --tail 10

echo ""
echo "✅ Déploiement terminé !"
echo ""
echo "📝 Fonctionnalités disponibles :"
echo "   - Modification de catégorie : Cliquez sur ✏️ à côté d'une archive"
echo "   - Filtrage par catégorie : Utilisez le filtre en haut de la page"
echo "   - Catégories par défaut : Bordereaux 2024, Protocoles, Conventions, etc."

