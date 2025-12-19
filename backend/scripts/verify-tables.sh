#!/bin/bash
# Script pour vérifier que toutes les tables existent

echo "🔍 Vérification des tables dans la base de données..."
echo ""

# Se connecter à MySQL et vérifier les tables
sudo docker exec -i alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage << 'SQL'
-- Vérifier les tables critiques
SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status,
  'simulator_usage' as table_name
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'simulator_usage'

UNION ALL

SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END,
  'product_reservations'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'product_reservations'

UNION ALL

SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END,
  'favoris'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'favoris'

UNION ALL

SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END,
  'formations'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'formations'

UNION ALL

SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END,
  'financial_documents'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'financial_documents'

UNION ALL

SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END,
  'assurances'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'assurances'

UNION ALL

SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END,
  'notifications'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'notifications';

-- Vérifier les colonnes dans users
SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END as status,
  CONCAT('users.', COLUMN_NAME) as column_name
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'denomination_sociale'

UNION ALL

SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END,
  CONCAT('users.', COLUMN_NAME)
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'telephone'

UNION ALL

SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END,
  CONCAT('users.', COLUMN_NAME)
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'code_postal'

UNION ALL

SELECT 
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '❌' END,
  CONCAT('users.', COLUMN_NAME)
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
  AND TABLE_NAME = 'users' 
  AND COLUMN_NAME = 'validite_date';

SQL

echo ""
echo "✅ Vérification terminée!"
echo ""
echo "Si vous voyez des ❌, exécutez: ./fix-database.sh"

