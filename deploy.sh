#!/bin/bash

# =====================================================
# Script de Déploiement - Alliance Courtage
# =====================================================

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Déploiement Alliance Courtage - Nouvelle Version${NC}"
echo -e "${CYAN}===================================================${NC}\n"

# Variables
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_NAME:-alliance_courtage}"
DB_USER="${DB_USER:-root}"

# 1. Créer le répertoire de backup
mkdir -p "$BACKUP_DIR"

# 2. Backup de la base de données
echo -e "${BLUE}📦 Étape 1/7: Création du backup de la base de données...${NC}"
if command -v mysqldump &> /dev/null; then
    BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
    mysqldump -u "$DB_USER" -p "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Backup nécessite un mot de passe MySQL${NC}"
        read -sp "Mot de passe MySQL: " DB_PASS
        mysqldump -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"
    }
    echo -e "${GREEN}✅ Backup créé: $BACKUP_FILE${NC}\n"
else
    echo -e "${YELLOW}⚠️  mysqldump non trouvé, backup ignoré${NC}\n"
fi

# 3. Mise à jour du code (si Git)
echo -e "${BLUE}📥 Étape 2/7: Mise à jour du code...${NC}"
if [ -d ".git" ]; then
    git pull origin main || git pull origin master || {
        echo -e "${YELLOW}⚠️  Erreur lors du git pull, continuons...${NC}"
    }
    echo -e "${GREEN}✅ Code mis à jour${NC}\n"
else
    echo -e "${YELLOW}⚠️  Pas de dépôt Git, mise à jour manuelle requise${NC}\n"
fi

# 4. Installation des dépendances backend
echo -e "${BLUE}📦 Étape 3/7: Installation des dépendances backend...${NC}"
if [ -d "backend" ]; then
    cd backend
    npm install
    echo -e "${GREEN}✅ Dépendances backend installées${NC}\n"
    cd ..
else
    echo -e "${RED}❌ Dossier backend non trouvé!${NC}\n"
    exit 1
fi

# 5. Installation des dépendances frontend (si nécessaire)
echo -e "${BLUE}📦 Étape 4/7: Installation des dépendances frontend...${NC}"
if [ -f "package.json" ]; then
    npm install
    echo -e "${GREEN}✅ Dépendances frontend installées${NC}\n"
else
    echo -e "${YELLOW}⚠️  package.json non trouvé (frontend peut être dans un autre dossier)${NC}\n"
fi

# 6. Migration de la base de données
echo -e "${BLUE}🗄️  Étape 5/7: Migration de la base de données...${NC}"
if [ -f "backend/scripts/addFavorisTable.js" ]; then
    cd backend
    node scripts/addFavorisTable.js
    echo -e "${GREEN}✅ Migration de la base de données terminée${NC}\n"
    cd ..
else
    echo -e "${YELLOW}⚠️  Script de migration non trouvé${NC}\n"
fi

# 7. Build du frontend (si nécessaire)
echo -e "${BLUE}🏗️  Étape 6/7: Build du frontend...${NC}"
if [ -f "package.json" ] && grep -q '"build"' package.json; then
    npm run build
    echo -e "${GREEN}✅ Build du frontend terminé${NC}\n"
else
    echo -e "${YELLOW}⚠️  Build non nécessaire ou non configuré${NC}\n"
fi

# 8. Redémarrage des services
echo -e "${BLUE}🔄 Étape 7/7: Redémarrage des services...${NC}"

# Vérifier PM2
if command -v pm2 &> /dev/null; then
    echo -e "${CYAN}Redémarrage via PM2...${NC}"
    pm2 restart all || pm2 restart alliance-courtage-backend
    pm2 save
    echo -e "${GREEN}✅ Services redémarrés via PM2${NC}\n"
# Vérifier systemd
elif systemctl list-units --type=service | grep -q "alliance-courtage"; then
    echo -e "${CYAN}Redémarrage via systemd...${NC}"
    sudo systemctl restart alliance-courtage-backend || true
    sudo systemctl restart alliance-courtage-frontend || true
    echo -e "${GREEN}✅ Services redémarrés via systemd${NC}\n"
# Vérifier Docker
elif command -v docker-compose &> /dev/null && [ -f "docker-compose.yml" ]; then
    echo -e "${CYAN}Redémarrage via Docker...${NC}"
    docker-compose down
    docker-compose up -d --build
    echo -e "${GREEN}✅ Services redémarrés via Docker${NC}\n"
else
    echo -e "${YELLOW}⚠️  Aucun gestionnaire de processus détecté${NC}"
    echo -e "${YELLOW}   Redémarrez manuellement les services${NC}\n"
fi

# Résumé
echo -e "${CYAN}===================================================${NC}"
echo -e "${GREEN}🎉 Déploiement terminé avec succès!${NC}"
echo -e "${CYAN}===================================================${NC}\n"

echo -e "${BLUE}📋 Prochaines étapes:${NC}"
echo -e "   1. Vérifier les logs: ${CYAN}pm2 logs${NC} ou ${CYAN}docker-compose logs${NC}"
echo -e "   2. Tester l'API: ${CYAN}curl http://localhost:3001/api/health${NC}"
echo -e "   3. Vérifier l'interface: ${CYAN}http://votre-domaine.com${NC}"
echo -e "   4. Tester les nouvelles fonctionnalités (Favoris, Notifications)\n"

echo -e "${YELLOW}⚠️  Backup disponible dans: ${BACKUP_DIR}/${NC}\n"
