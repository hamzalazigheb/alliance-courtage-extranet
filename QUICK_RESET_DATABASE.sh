#!/bin/bash

# Script rapide pour vider la base de données et garder uniquement l'admin

echo "⚠️  ATTENTION: Cette opération va SUPPRIMER TOUTES LES DONNÉES !"
echo "Appuyez sur Ctrl+C pour annuler, ou Entrée pour continuer..."
read

# Backup
echo "📦 Création du backup..."
mkdir -p ~/backups
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_before_reset_$(date +%Y%m%d_%H%M%S).sql

# Script SQL
cat > /tmp/reset_database.sql << 'EOF'
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `favoris`;
TRUNCATE TABLE notifications;
TRUNCATE TABLE reglementaire_documents;
TRUNCATE TABLE reglementaire_folders;
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

DELETE FROM users WHERE role != 'admin';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Reset terminé!' as status;
SELECT id, email, nom, prenom, role FROM users;
EOF

echo "🗑️  Vidage de la base de données..."
docker cp /tmp/reset_database.sql alliance-courtage-mysql:/tmp/reset_database.sql
docker exec -i alliance-courtage-mysql mysql -u root -p alliance_courtage < /tmp/reset_database.sql

echo "✅ Base de données réinitialisée!"
echo "📋 Utilisateurs restants:"
docker exec -it alliance-courtage-mysql mysql -u root -p -e "USE alliance_courtage; SELECT id, email, nom, prenom, role FROM users;"


