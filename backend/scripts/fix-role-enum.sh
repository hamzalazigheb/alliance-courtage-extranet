#!/bin/bash
# Script pour corriger l'ENUM du rôle pour accepter 'user'

echo "🔧 Correction de l'ENUM du rôle dans la table users..."
echo ""

sudo docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'SQL'
-- Vérifier l'ENUM actuel
SELECT COLUMN_TYPE as 'ENUM actuel' 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'role';

-- Modifier l'ENUM pour inclure 'user'
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'broker', 'client', 'user') DEFAULT 'user';

-- Vérifier l'ENUM après modification
SELECT COLUMN_TYPE as 'ENUM après modification' 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'role';

SELECT '✅ ENUM du rôle corrigé!' as status;
SQL

echo ""
echo "✅ Script terminé!"

