#!/bin/bash

# Script pour vérifier l'erreur exacte lors de la mise à jour d'un utilisateur
# Usage: ./checkUserUpdateError.sh

echo "🔍 Vérification de l'erreur PUT /api/users/:id"
echo "=============================================="
echo ""

BACKEND_CONTAINER=$(docker ps --filter "name=alliance-courtage-backend" --format "{{.Names}}" | head -1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo "❌ Conteneur backend non trouvé!"
    exit 1
fi

echo "✅ Conteneur backend trouvé: $BACKEND_CONTAINER"
echo ""

# 1. Voir les dernières erreurs liées à la mise à jour d'utilisateur
echo "📋 Dernières erreurs de mise à jour d'utilisateur:"
echo "==================================================="
docker logs "$BACKEND_CONTAINER" --tail 200 2>&1 | grep -i -A 10 -B 5 "update user\|error\|500\|ER_" | tail -50
echo ""

# 2. Voir toutes les erreurs récentes
echo "📋 Toutes les erreurs récentes:"
echo "==============================="
docker logs "$BACKEND_CONTAINER" --tail 100 2>&1 | grep -i "error\|exception\|failed" | tail -30
echo ""

# 3. Voir les logs en temps réel (optionnel)
echo "💡 Pour voir les logs en temps réel, exécutez:"
echo "   docker logs -f $BACKEND_CONTAINER"
echo ""

# 4. Vérifier la structure de la table users
echo "📋 Structure de la table users:"
echo "==============================="
MYSQL_CONTAINER=$(docker ps --filter "name=alliance-courtage-mysql" --format "{{.Names}}" | head -1)
if [ -n "$MYSQL_CONTAINER" ]; then
    docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE users;" 2>/dev/null
else
    echo "⚠️  Conteneur MySQL non trouvé"
fi
echo ""

# 5. Vérifier les colonnes optionnelles
echo "📋 Vérification des colonnes optionnelles:"
echo "=========================================="
if [ -n "$MYSQL_CONTAINER" ]; then
    docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "
    SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'alliance_courtage' 
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME IN ('denomination_sociale', 'telephone', 'code_postal')
    ORDER BY COLUMN_NAME;
    " 2>/dev/null || echo "Aucune colonne optionnelle trouvée"
fi
echo ""

echo "✅ Diagnostic terminé!"
echo ""
echo "💡 Si vous voyez une erreur 'Unknown column', créez la colonne manquante:"
echo "   docker exec $MYSQL_CONTAINER mysql -u root -palliance2024Secure alliance_courtage -e \"ALTER TABLE users ADD COLUMN [nom_colonne] VARCHAR(255) NULL;\""
echo ""


