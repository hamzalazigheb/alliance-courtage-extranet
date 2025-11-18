#!/bin/bash

# Script pour récupérer le mot de passe MySQL depuis le conteneur
# Usage: ./getMySQLPassword.sh

CONTAINER_NAME="alliance-courtage-mysql"

echo "🔑 Récupération du mot de passe MySQL"
echo "======================================"
echo ""

# Vérifier que le conteneur existe
if ! docker ps --format "{{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ Conteneur $CONTAINER_NAME non trouvé!"
    echo ""
    echo "Conteneurs MySQL disponibles:"
    docker ps --filter "name=mysql" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
    exit 1
fi

echo "✅ Conteneur trouvé: $CONTAINER_NAME"
echo ""

# Récupérer toutes les variables d'environnement
echo "📋 Variables d'environnement MySQL:"
echo "-----------------------------------"
docker inspect $CONTAINER_NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep -i mysql

echo ""
echo "🔑 Mot de passe root:"
echo "---------------------"

# Essayer MYSQL_ROOT_PASSWORD
MYSQL_ROOT_PASSWORD=$(docker inspect $CONTAINER_NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep "^MYSQL_ROOT_PASSWORD=" | cut -d'=' -f2)

if [ -n "$MYSQL_ROOT_PASSWORD" ]; then
    echo "MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD"
else
    # Essayer MYSQL_PASSWORD
    MYSQL_PASSWORD=$(docker inspect $CONTAINER_NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep "^MYSQL_PASSWORD=" | cut -d'=' -f2)
    if [ -n "$MYSQL_PASSWORD" ]; then
        echo "MYSQL_PASSWORD=$MYSQL_PASSWORD"
        MYSQL_ROOT_PASSWORD="$MYSQL_PASSWORD"
    else
        echo "⚠️  Aucun mot de passe trouvé dans les variables d'environnement"
        echo ""
        echo "💡 Le mot de passe peut être défini dans:"
        echo "   - docker-compose.yml"
        echo "   - Fichier .env"
        echo "   - Variables d'environnement système"
        exit 1
    fi
fi

echo ""
echo "✅ Mot de passe récupéré!"
echo ""
echo "💡 Utilisez ce mot de passe dans vos commandes:"
echo "   docker exec -it $CONTAINER_NAME mysql -u root -p$MYSQL_ROOT_PASSWORD alliance_courtage -e \"SHOW TABLES;\""
echo ""


