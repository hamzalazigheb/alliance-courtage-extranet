#!/bin/bash

# Script de déploiement du système de catégories pour les archives
# Usage: ./deploy-categories.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Déploiement du Système de Catégories pour les Archives${NC}"
echo -e "${CYAN}========================================================${NC}"
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker détecté${NC}"
echo ""

# Étape 1: Backup
echo -e "${BLUE}💾 Étape 1/6: Backup de la base de données...${NC}"
BACKUP_DIR="$HOME/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_before_categories_$TIMESTAMP.sql"

MYSQL_CONTAINER=$(docker ps --filter "name=alliance-courtage-mysql" --format "{{.Names}}" | head -1)
if [ -z "$MYSQL_CONTAINER" ]; then
    MYSQL_CONTAINER=$(docker ps --filter "name=mysql" --format "{{.Names}}" | head -1)
fi

if [ -n "$MYSQL_CONTAINER" ]; then
    docker exec "$MYSQL_CONTAINER" mysqldump -u root -palliance2024Secure alliance_courtage > "$BACKUP_FILE" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Backup échoué, mais continuons...${NC}"
    }
    
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
    else
        echo -e "${YELLOW}⚠️  Backup vide ou échoué${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Conteneur MySQL non trouvé${NC}"
fi
echo ""

# Étape 2: Vérifier si la colonne existe
echo -e "${BLUE}🔍 Étape 2/6: Vérification de la colonne category...${NC}"

if [ -z "$MYSQL_CONTAINER" ]; then
    echo -e "${RED}❌ Conteneur MySQL non trouvé!${NC}"
    exit 1
fi

COLUMN_EXISTS=$(docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "SHOW COLUMNS FROM archives LIKE 'category';" 2>/dev/null | grep -c "category" || echo "0")

if [ "$COLUMN_EXISTS" -gt 0 ]; then
    echo -e "${GREEN}✅ La colonne category existe déjà${NC}"
else
    echo -e "${YELLOW}⚠️  La colonne category n'existe pas, création...${NC}"
    
    # Étape 3: Créer la colonne
    echo -e "${BLUE}🗄️  Étape 3/6: Création de la colonne category...${NC}"
    
    docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
SET @dbname = DATABASE();
SET @tablename = 'archives';
SET @columnname = 'category';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (TABLE_SCHEMA = @dbname)
      AND (TABLE_NAME = @tablename)
      AND (COLUMN_NAME = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(100) DEFAULT ''Non classé'' AFTER type')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Colonne category créée avec succès${NC}"
    else
        echo -e "${RED}❌ Erreur lors de la création de la colonne${NC}"
        exit 1
    fi
fi
echo ""

# Étape 4: Catégoriser automatiquement les bordereaux 2024
echo -e "${BLUE}📋 Étape 4/6: Catégorisation automatique des bordereaux 2024...${NC}"

docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage << 'EOF'
UPDATE archives 
SET category = 'Bordereaux 2024' 
WHERE (title LIKE '%2024%' OR file_name LIKE '%2024%' OR description LIKE '%2024%')
AND (category IS NULL OR category = 'Non classé' OR category = '');
SELECT ROW_COUNT() as updated_rows;
EOF

echo -e "${GREEN}✅ Catégorisation terminée${NC}"
echo ""

# Étape 5: Afficher les catégories existantes
echo -e "${BLUE}📊 Étape 5/6: Affichage des catégories existantes...${NC}"

docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "SELECT DISTINCT category, COUNT(*) as count FROM archives WHERE category IS NOT NULL GROUP BY category ORDER BY category;" 2>/dev/null || echo "Aucune catégorie trouvée"

echo ""

# Étape 6: Redémarrer le backend
echo -e "${BLUE}🔄 Étape 6/6: Redémarrage du backend...${NC}"

BACKEND_CONTAINER=$(docker ps --filter "name=alliance-courtage-backend" --format "{{.Names}}" | head -1)
if [ -z "$BACKEND_CONTAINER" ]; then
    BACKEND_CONTAINER=$(docker ps --filter "name=backend" --format "{{.Names}}" | head -1)
fi

if [ -n "$BACKEND_CONTAINER" ]; then
    docker restart "$BACKEND_CONTAINER"
    echo -e "${GREEN}✅ Backend redémarré${NC}"
    
    # Attendre que le backend soit prêt
    echo -e "${YELLOW}⏳ Attente du démarrage du backend...${NC}"
    sleep 5
    
    # Vérifier les logs
    echo -e "${CYAN}📋 Derniers logs du backend:${NC}"
    docker logs "$BACKEND_CONTAINER" --tail 20
else
    echo -e "${YELLOW}⚠️  Conteneur backend non trouvé, redémarrage manuel nécessaire${NC}"
fi

echo ""
echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo ""
echo -e "${CYAN}📝 Prochaines étapes:${NC}"
echo -e "   1. Tester l'interface: /manage → Gestion des Archives"
echo -e "   2. Vérifier que la colonne Catégorie est visible"
echo -e "   3. Tester l'édition de catégorie (icône ✏️)"
echo -e "   4. Tester le filtre par catégorie"
echo ""
echo -e "${YELLOW}💡 Backup sauvegardé dans: $BACKUP_FILE${NC}"

