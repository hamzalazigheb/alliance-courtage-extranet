#!/bin/bash
set -e

echo "🚀 Migration Base de Données Locale → Docker"
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier que le fichier de backup existe
BACKUP_FILE="backend/backup_local.sql"

if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Fichier backup_local.sql non trouvé dans backend/${NC}"
    echo ""
    echo -e "${YELLOW}💡 Étapes pour créer le fichier de backup:${NC}"
    echo ""
    echo "   Sur votre machine locale (Windows):"
    echo "   1. Ouvrir PowerShell"
    echo "   2. cd backend"
    echo "   3. mysqldump -u root -p alliance_courtage > backup_local.sql"
    echo ""
    echo "   Ou utiliser le script Node.js:"
    echo "   node scripts/exportLocalDatabase.js"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Fichier de backup trouvé: $BACKUP_FILE${NC}"
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}📦 Taille: $BACKUP_SIZE${NC}"
echo ""

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    exit 1
fi

# Vérifier que le container MySQL existe
cd backend

if ! docker ps -a | grep -q "alliance-courtage-mysql"; then
    echo -e "${YELLOW}🐳 Container MySQL non trouvé. Démarrage de Docker...${NC}"
    docker compose up -d
    echo -e "${YELLOW}⏳ Attente que MySQL soit prêt (30 secondes)...${NC}"
    sleep 30
else
    # Vérifier que le container est en cours d'exécution
    if ! docker ps | grep -q "alliance-courtage-mysql"; then
        echo -e "${YELLOW}🔄 Démarrage du container MySQL...${NC}"
        docker compose start mysql
        sleep 15
    fi
fi

# Lire le mot de passe root depuis docker-compose.yml
ROOT_PASSWORD=$(grep "MYSQL_ROOT_PASSWORD:" docker-compose.yml | awk '{print $2}' | tr -d '"' | tr -d "'")

if [ -z "$ROOT_PASSWORD" ]; then
    ROOT_PASSWORD="alliance2024"
    echo -e "${YELLOW}⚠️  Mot de passe root non trouvé dans docker-compose.yml, utilisation de la valeur par défaut${NC}"
fi

echo -e "${YELLOW}📥 Import des données dans Docker...${NC}"
echo ""

# Importer
if docker exec -i alliance-courtage-mysql mysql -u root -p"${ROOT_PASSWORD}" < ../backup_local.sql 2>/dev/null; then
    echo ""
    echo -e "${GREEN}✅ Import réussi !${NC}"
    echo ""
    
    # Vérification
    echo -e "${YELLOW}📊 Vérification des données importées...${NC}"
    
    # Afficher les tables
    TABLES=$(docker exec alliance-courtage-mysql mysql -u root -p"${ROOT_PASSWORD}" -e "USE alliance_courtage; SHOW TABLES;" 2>/dev/null | tail -n +2)
    
    if [ -n "$TABLES" ]; then
        TABLE_COUNT=$(echo "$TABLES" | wc -l)
        echo -e "${GREEN}✅ $TABLE_COUNT tables trouvées:${NC}"
        echo "$TABLES" | head -10
        if [ "$TABLE_COUNT" -gt 10 ]; then
            echo "... et $(($TABLE_COUNT - 10)) autres"
        fi
        echo ""
        
        # Compter quelques données
        echo -e "${YELLOW}📈 Nombre d'enregistrements:${NC}"
        
        if echo "$TABLES" | grep -q "users"; then
            USER_COUNT=$(docker exec alliance-courtage-mysql mysql -u root -p"${ROOT_PASSWORD}" -e "USE alliance_courtage; SELECT COUNT(*) as count FROM users;" 2>/dev/null | tail -1)
            echo "   👥 Users: $USER_COUNT"
        fi
        
        if echo "$TABLES" | grep -q "partners"; then
            PARTNER_COUNT=$(docker exec alliance-courtage-mysql mysql -u root -p"${ROOT_PASSWORD}" -e "USE alliance_courtage; SELECT COUNT(*) as count FROM partners;" 2>/dev/null | tail -1)
            echo "   🤝 Partners: $PARTNER_COUNT"
        fi
        
        if echo "$TABLES" | grep -q "structured_products"; then
            PRODUCT_COUNT=$(docker exec alliance-courtage-mysql mysql -u root -p"${ROOT_PASSWORD}" -e "USE alliance_courtage; SELECT COUNT(*) as count FROM structured_products;" 2>/dev/null | tail -1)
            echo "   📦 Products: $PRODUCT_COUNT"
        fi
    else
        echo -e "${RED}⚠️  Aucune table trouvée, l'import a peut-être échoué${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Migration terminée avec succès !${NC}"
    echo ""
    echo -e "${GREEN}🌐 Prochaines étapes:${NC}"
    echo "   1. Redémarrer le backend si nécessaire:"
    echo "      cd backend && docker compose restart backend"
    echo ""
    echo "   2. Tester l'application:"
    echo "      http://VOTRE_IP"
    echo ""
    echo "   3. Se connecter avec vos identifiants locaux"
    echo ""
    
else
    echo ""
    echo -e "${RED}❌ Erreur lors de l'import${NC}"
    echo ""
    echo -e "${YELLOW}💡 Solutions possibles:${NC}"
    echo ""
    echo "   1. Vérifier que le container MySQL est bien démarré:"
    echo "      docker ps | grep alliance-courtage-mysql"
    echo ""
    echo "   2. Vérifier les logs MySQL:"
    echo "      docker logs alliance-courtage-mysql"
    echo ""
    echo "   3. Vérifier le mot de passe dans docker-compose.yml"
    echo ""
    echo "   4. Essayer l'import manuellement:"
    echo "      docker exec -i alliance-courtage-mysql mysql -u root -p'VOTRE_PASSWORD' < backup_local.sql"
    echo ""
    exit 1
fi

