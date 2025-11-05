#!/bin/bash

# Script SQL sécurisé qui ne tronque que les tables existantes

cat > /tmp/reset_database_safe.sql << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;

-- Tables principales (toujours présentes)
TRUNCATE TABLE `favoris`;
TRUNCATE TABLE notifications;
TRUNCATE TABLE password_reset_requests;
TRUNCATE TABLE financial_documents;
TRUNCATE TABLE formations;
TRUNCATE TABLE bordereaux;
TRUNCATE TABLE product_reservations;
TRUNCATE TABLE structured_products;
TRUNCATE TABLE assurances;
TRUNCATE TABLE cms_content;
TRUNCATE TABLE archives;
TRUNCATE TABLE partners;
TRUNCATE TABLE product_performances;
TRUNCATE TABLE financial_products;
TRUNCATE TABLE news;
TRUNCATE TABLE user_sessions;

-- Tables optionnelles (avec vérification si nécessaire)
-- Si ces commandes échouent, elles seront ignorées
SET @sql = NULL;
SELECT GROUP_CONCAT(CONCAT('TRUNCATE TABLE ', table_name, ';') SEPARATOR ' ')
INTO @sql
FROM information_schema.tables
WHERE table_schema = 'alliance_courtage'
AND table_name IN ('reglementaire_documents', 'reglementaire_folders');

SET @sql = IFNULL(@sql, 'SELECT 1;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Supprimer tous les utilisateurs sauf les admins
DELETE FROM users WHERE role != 'admin';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Reset terminé!' as status;
SELECT id, email, nom, prenom, role FROM users;
EOF

echo "📋 Script SQL créé"
echo "🔄 Exécution du script..."

docker cp /tmp/reset_database_safe.sql alliance-courtage-mysql:/tmp/reset_database_safe.sql
docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage < /tmp/reset_database_safe.sql

echo "✅ Terminé!"


