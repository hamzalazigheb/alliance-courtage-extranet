#!/bin/bash
# Script pour sauvegarder tous les bordereaux puis les supprimer

DB_NAME="alliance_courtage"
DB_USER="root"
DB_PASSWORD="alliance2024Secure"
CONTAINER_NAME="alliance-courtage-mysql"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/bordereaux_backup_${TIMESTAMP}.sql"

# Créer le dossier de backup s'il n'existe pas
mkdir -p "$BACKUP_DIR"

echo "📦 Création du backup des bordereaux..."
echo ""

# Créer le backup avec mysqldump
docker exec ${CONTAINER_NAME} mysqldump -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} bordereaux > "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo "✅ Backup créé avec succès: ${BACKUP_FILE}"
    echo ""
    
    # Afficher la taille du fichier
    FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "📊 Taille du backup: ${FILE_SIZE}"
    echo ""
    
    # Demander confirmation avant suppression
    echo "⚠️  ATTENTION: Vous êtes sur le point de supprimer TOUS les bordereaux de la base de données!"
    echo "   Le backup a été créé dans: ${BACKUP_FILE}"
    echo ""
    read -p "Voulez-vous continuer et supprimer tous les bordereaux? (oui/non): " confirm
    
    if [ "$confirm" = "oui" ] || [ "$confirm" = "OUI" ] || [ "$confirm" = "o" ] || [ "$confirm" = "O" ]; then
        echo ""
        echo "🗑️  Suppression des bordereaux..."
        
        # Supprimer tous les bordereaux
        docker exec -i ${CONTAINER_NAME} mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} <<EOF
DELETE FROM bordereaux;
SELECT ROW_COUNT() as deleted_rows;
EOF
        
        echo ""
        echo "✅ Tous les bordereaux ont été supprimés!"
        echo "📦 Backup disponible dans: ${BACKUP_FILE}"
    else
        echo ""
        echo "❌ Suppression annulée. Les bordereaux sont toujours dans la base de données."
        echo "📦 Backup disponible dans: ${BACKUP_FILE}"
    fi
else
    echo "❌ Erreur lors de la création du backup!"
    exit 1
fi

