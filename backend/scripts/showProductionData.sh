#!/bin/bash

# Script pour afficher les tables et données de production
# Usage: ./showProductionData.sh

echo "🔍 Affichage des tables et données de production"
echo "================================================"
echo ""

# Vérifier que le conteneur MySQL est en cours d'exécution
MYSQL_CONTAINER=$(docker ps --filter "name=alliance-courtage" --format "{{.Names}}" | head -1)

if [ -z "$MYSQL_CONTAINER" ]; then
    echo "❌ Conteneur MySQL non trouvé!"
    echo "   Cherchez avec: docker ps | grep mysql"
    exit 1
fi

echo "✅ Conteneur MySQL trouvé: $MYSQL_CONTAINER"
echo ""

# Demander le mot de passe
read -sp "Mot de passe MySQL root (ou Entrée si vide): " MYSQL_PASSWORD
echo ""

if [ -z "$MYSQL_PASSWORD" ]; then
    MYSQL_PASSWORD="alliance2024Secure"
fi

echo ""
echo "📊 Liste des tables:"
echo "===================="
echo ""

# Lister les tables
docker exec $MYSQL_CONTAINER mysql -u root -p"$MYSQL_PASSWORD" alliance_courtage -e "SHOW TABLES;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Erreur de connexion. Vérifiez le mot de passe."
    exit 1
fi

echo ""
echo "📈 Nombre de lignes par table:"
echo "==============================="
echo ""

# Compter les lignes pour chaque table
TABLES=$(docker exec $MYSQL_CONTAINER mysql -u root -p"$MYSQL_PASSWORD" alliance_courtage -e "SHOW TABLES;" -s -N 2>/dev/null)

for TABLE in $TABLES; do
    COUNT=$(docker exec $MYSQL_CONTAINER mysql -u root -p"$MYSQL_PASSWORD" alliance_courtage -e "SELECT COUNT(*) FROM $TABLE;" -s -N 2>/dev/null)
    printf "%-40s %10s lignes\n" "$TABLE" "$COUNT"
done

echo ""
echo "💡 Pour voir les données d'une table spécifique:"
echo "   docker exec -it $MYSQL_CONTAINER mysql -u root -p alliance_courtage -e \"SELECT * FROM nom_table LIMIT 10;\""
echo ""
echo "💡 Pour voir la structure d'une table:"
echo "   docker exec -it $MYSQL_CONTAINER mysql -u root -p alliance_courtage -e \"DESCRIBE nom_table;\""
echo ""

