#!/bin/bash
# Script pour corriger l'ENUM du rôle pour accepter 'user'

echo "🔧 Correction de l'ENUM du rôle dans la table users..."
echo ""

echo "📋 ENUM actuel:"
sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
SELECT COLUMN_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME = 'role';
" 2>/dev/null

echo ""
echo "🔧 Modification de l'ENUM pour inclure 'user'..."
sudo docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'SQL'
-- Modifier l'ENUM pour inclure 'user' (force la modification)
ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'broker', 'client', 'user') DEFAULT 'user';
SQL

if [ $? -eq 0 ]; then
  echo "✅ ENUM modifié avec succès!"
  echo ""
  echo "📋 ENUM après modification:"
  sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
  SELECT COLUMN_TYPE 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_SCHEMA = 'alliance_courtage' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'role';
  " 2>/dev/null
else
  echo "❌ Erreur lors de la modification de l'ENUM"
  exit 1
fi

echo ""
echo "✅ Script terminé!"

