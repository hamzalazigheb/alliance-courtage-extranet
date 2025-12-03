#!/bin/bash
# Script pour restaurer le backup des bordereaux

BACKUP_FILE="backups/bordereaux_backup_20251203_220451.sql"
DB_USER="root"
DB_PASSWORD="alliance2024Secure"
DB_NAME="alliance_courtage"
CONTAINER_NAME="alliance-courtage-mysql"

echo "🔄 Restauration du backup: ${BACKUP_FILE}"
echo ""

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Erreur: Le fichier de backup n'existe pas: ${BACKUP_FILE}"
    exit 1
fi

# Afficher la taille du fichier
FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📦 Taille du backup: ${FILE_SIZE}"
echo ""

# Restaurer le backup
echo "⏳ Restauration en cours..."
docker exec -i ${CONTAINER_NAME} mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} < "${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Backup restauré avec succès!"
    echo ""
    
    # Vérifier le nombre de bordereaux restaurés
    echo "📊 Vérification..."
    docker exec -i ${CONTAINER_NAME} mysql -u ${DB_USER} -p${DB_PASSWORD} ${DB_NAME} -e "SELECT COUNT(*) as total_bordereaux FROM bordereaux;"
else
    echo ""
    echo "❌ Erreur lors de la restauration!"
    exit 1
fi

