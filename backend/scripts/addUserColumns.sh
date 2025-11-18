#!/bin/bash

# Script pour ajouter les colonnes manquantes à la table users
# Usage: ./addUserColumns.sh

echo "🔧 Ajout des colonnes manquantes à la table users"
echo "================================================="
echo ""

MYSQL_CONTAINER=$(docker ps --filter "name=alliance-courtage-mysql" --format "{{.Names}}" | head -1)

if [ -z "$MYSQL_CONTAINER" ]; then
    echo "❌ Conteneur MySQL non trouvé!"
    exit 1
fi

echo "✅ Conteneur MySQL trouvé: $MYSQL_CONTAINER"
echo ""

# Vérifier si les colonnes existent déjà
echo "📋 Vérification des colonnes existantes..."
EXISTING_COLS=$(docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users'
AND COLUMN_NAME IN ('denomination_sociale', 'telephone', 'code_postal');
" 2>/dev/null | grep -v "COLUMN_NAME" | tr '\n' ' ')

echo "Colonnes existantes: $EXISTING_COLS"
echo ""

# Ajouter les colonnes une par une
echo "📦 Ajout des colonnes manquantes..."

# denomination_sociale
if [[ ! "$EXISTING_COLS" =~ "denomination_sociale" ]]; then
    echo "   Ajout de denomination_sociale..."
    docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "
    ALTER TABLE users ADD COLUMN denomination_sociale VARCHAR(255) NULL;
    " 2>/dev/null && echo "   ✅ denomination_sociale ajoutée" || echo "   ⚠️  Erreur lors de l'ajout de denomination_sociale"
else
    echo "   ✅ denomination_sociale existe déjà"
fi

# telephone
if [[ ! "$EXISTING_COLS" =~ "telephone" ]]; then
    echo "   Ajout de telephone..."
    docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "
    ALTER TABLE users ADD COLUMN telephone VARCHAR(20) NULL;
    " 2>/dev/null && echo "   ✅ telephone ajoutée" || echo "   ⚠️  Erreur lors de l'ajout de telephone"
else
    echo "   ✅ telephone existe déjà"
fi

# code_postal
if [[ ! "$EXISTING_COLS" =~ "code_postal" ]]; then
    echo "   Ajout de code_postal..."
    docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "
    ALTER TABLE users ADD COLUMN code_postal VARCHAR(10) NULL;
    " 2>/dev/null && echo "   ✅ code_postal ajoutée" || echo "   ⚠️  Erreur lors de l'ajout de code_postal"
else
    echo "   ✅ code_postal existe déjà"
fi

echo ""

# Vérification finale
echo "📋 Vérification finale de la structure de la table:"
echo "==================================================="
docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'alliance_courtage' 
AND TABLE_NAME = 'users'
AND COLUMN_NAME IN ('denomination_sociale', 'telephone', 'code_postal')
ORDER BY COLUMN_NAME;
" 2>/dev/null

echo ""
echo "✅ Terminé!"


