#!/bin/bash

# Script pour afficher les tables et données de production
# Usage: ./viewProductionTables.sh

CONTAINER_NAME="alliance-courtage-mysql"

echo "🔍 Affichage des tables et données de production"
echo "================================================"
echo ""

# Vérifier que le conteneur existe
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Conteneur $CONTAINER_NAME non trouvé!"
    echo ""
    echo "Conteneurs MySQL disponibles:"
    docker ps --filter "name=mysql" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    echo ""
    read -p "Entrez le nom du conteneur MySQL: " CONTAINER_NAME
fi

echo "✅ Utilisation du conteneur: $CONTAINER_NAME"
echo ""

# Essayer de récupérer le mot de passe depuis les variables d'environnement du conteneur
echo "🔑 Récupération du mot de passe depuis les variables d'environnement..."
MYSQL_ROOT_PASSWORD=$(docker inspect $CONTAINER_NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep MYSQL_ROOT_PASSWORD | cut -d'=' -f2)

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    # Essayer MYSQL_PASSWORD
    MYSQL_PASSWORD=$(docker inspect $CONTAINER_NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep "^MYSQL_PASSWORD=" | cut -d'=' -f2)
    if [ -n "$MYSQL_PASSWORD" ]; then
        MYSQL_ROOT_PASSWORD="$MYSQL_PASSWORD"
    fi
fi

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    echo "⚠️  Mot de passe non trouvé dans les variables d'environnement"
    echo ""
    read -sp "Entrez le mot de passe MySQL root: " MYSQL_ROOT_PASSWORD
    echo ""
else
    echo "✅ Mot de passe trouvé dans les variables d'environnement"
fi

echo ""

# Lister toutes les tables avec le nombre de lignes
echo "📊 TABLES ET NOMBRE DE LIGNES:"
echo "==============================="
echo ""

docker exec $CONTAINER_NAME mysql -u root -p"$MYSQL_ROOT_PASSWORD" alliance_courtage -e "
SELECT 
    TABLE_NAME as 'Table',
    TABLE_ROWS as 'Lignes',
    ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) as 'Taille (MB)'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'alliance_courtage'
ORDER BY TABLE_NAME;
" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "❌ Erreur de connexion. Le mot de passe est peut-être incorrect."
    echo ""
    echo "💡 Essayez manuellement:"
    echo "   docker exec -it $CONTAINER_NAME mysql -u root -p"
    echo ""
    exit 1
fi

echo ""
echo "💡 Commandes utiles:"
echo ""
echo "Voir toutes les données d'une table:"
echo "  docker exec -it $CONTAINER_NAME mysql -u root -p$MYSQL_ROOT_PASSWORD alliance_courtage -e \"SELECT * FROM nom_table;\""
echo ""
echo "Voir la structure d'une table:"
echo "  docker exec -it $CONTAINER_NAME mysql -u root -p$MYSQL_ROOT_PASSWORD alliance_courtage -e \"DESCRIBE nom_table;\""
echo ""
echo "Voir les 10 premières lignes d'une table:"
echo "  docker exec -it $CONTAINER_NAME mysql -u root -p$MYSQL_ROOT_PASSWORD alliance_courtage -e \"SELECT * FROM nom_table LIMIT 10;\""
echo ""
