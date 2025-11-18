#!/bin/bash

# Script pour afficher toutes les tables et leurs données
# Usage: ./showAllTables.sh

CONTAINER_NAME="alliance-courtage-mysql"

echo "🔍 Affichage de toutes les tables et données"
echo "=============================================="
echo ""

# Vérifier que le conteneur existe
if ! docker ps --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"; then
    echo "❌ Conteneur $CONTAINER_NAME non trouvé!"
    echo ""
    echo "Conteneurs disponibles:"
    docker ps --format "table {{.Names}}\t{{.Image}}"
    exit 1
fi

echo "✅ Conteneur trouvé: $CONTAINER_NAME"
echo ""

# Récupérer le mot de passe depuis les variables d'environnement
echo "🔑 Récupération du mot de passe..."
MYSQL_ROOT_PASSWORD=$(docker inspect $CONTAINER_NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep "^MYSQL_ROOT_PASSWORD=" | cut -d'=' -f2)

# Si pas trouvé, essayer MYSQL_PASSWORD
if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    MYSQL_ROOT_PASSWORD=$(docker inspect $CONTAINER_NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep "^MYSQL_PASSWORD=" | cut -d'=' -f2)
fi

# Si toujours pas trouvé, essayer les mots de passe par défaut
if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    echo "⚠️  Mot de passe non trouvé dans les variables d'environnement"
    echo "   Essai avec les mots de passe par défaut..."
    
    # Essayer les mots de passe courants
    for PASSWORD in "alliance2024Secure" "alliance_pass2024" ""; do
        if docker exec $CONTAINER_NAME mysql -u root -p"$PASSWORD" -e "SELECT 1;" 2>/dev/null | grep -q "1"; then
            MYSQL_ROOT_PASSWORD="$PASSWORD"
            echo "✅ Mot de passe trouvé!"
            break
        fi
    done
fi

# Si toujours pas trouvé, demander
if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    read -sp "Entrez le mot de passe MySQL root: " MYSQL_ROOT_PASSWORD
    echo ""
fi

echo ""

# Lister toutes les tables avec statistiques
echo "📊 LISTE DES TABLES:"
echo "===================="
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
    echo "❌ Erreur de connexion!"
    echo ""
    echo "💡 Essayez de vous connecter manuellement:"
    echo "   docker exec -it $CONTAINER_NAME mysql -u root -p"
    echo ""
    exit 1
fi

echo ""
echo "✅ Tables affichées avec succès!"
echo ""


