#!/bin/bash

echo "🚀 Déploiement des mises à jour Gamme Produits"
echo "================================================"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
REMOTE_USER="ubuntu"
REMOTE_HOST="13.38.115.36"
REMOTE_DIR="~/alliance/alliance"
BACKEND_CONTAINER="alliance-courtage-backend"
MYSQL_CONTAINER="alliance-courtage-mysql"
MYSQL_PASSWORD="alliance2024Secure"

echo ""
echo -e "${BLUE}📦 Étape 1: Build du frontend${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du build frontend${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📤 Étape 2: Envoi des fichiers vers le serveur${NC}"
scp -r dist/ backend/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors de l'envoi des fichiers${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🗄️ Étape 3: Mise à jour de la base de données${NC}"

# Créer la table gamme_products si elle n'existe pas
echo -e "${YELLOW}📋 Création de la table gamme_products...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
CREATE TABLE IF NOT EXISTS gamme_products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_key VARCHAR(255) NOT NULL UNIQUE COMMENT 'Clé unique du produit: clientType_family_productName',
  client_type ENUM('particulier', 'professionnel', 'entreprise') NOT NULL,
  family VARCHAR(100) NOT NULL COMMENT 'Famille de produit (dynamique)',
  product_name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_client_type (client_type),
  INDEX idx_family (family),
  INDEX idx_product_name (product_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"
ENDSSH

echo -e "${GREEN}✅ Table gamme_products créée/vérifiée${NC}"

# Créer la table gamme_product_files si elle n'existe pas
echo -e "${YELLOW}📋 Création de la table gamme_product_files...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
CREATE TABLE IF NOT EXISTS gamme_product_files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_key VARCHAR(255) NOT NULL COMMENT 'Clé unique du produit: clientType_family_productName',
  file_name VARCHAR(500) NOT NULL,
  file_content LONGTEXT NOT NULL COMMENT 'Contenu en base64',
  file_size INT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_product_key (product_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"
ENDSSH

echo -e "${GREEN}✅ Table gamme_product_files créée/vérifiée${NC}"

# Modifier la colonne family pour accepter des valeurs dynamiques (si elle est encore en ENUM)
echo -e "${YELLOW}🔄 Mise à jour de la colonne family vers VARCHAR...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "
ALTER TABLE gamme_products 
MODIFY COLUMN family VARCHAR(100) NOT NULL 
COMMENT 'Famille de produit (dynamique)';
" 2>/dev/null || echo "Colonne family déjà en VARCHAR ou modification non nécessaire"
ENDSSH

echo -e "${GREEN}✅ Colonne family mise à jour${NC}"

echo ""
echo -e "${BLUE}🐳 Étape 4: Redémarrage des conteneurs${NC}"

# Arrêter le backend
echo -e "${YELLOW}🛑 Arrêt du backend...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker stop ${BACKEND_CONTAINER} 2>/dev/null || true"
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker rm ${BACKEND_CONTAINER} 2>/dev/null || true"

# Installer les dépendances backend
echo -e "${YELLOW}📦 Installation des dépendances backend...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} "cd ${REMOTE_DIR}/backend && npm install"

# Redémarrer le backend
echo -e "${YELLOW}🚀 Démarrage du backend...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
cd ~/alliance/alliance/backend
docker run -d \
  --name alliance-courtage-backend \
  --network alliance-network \
  -v $(pwd):/app \
  -w /app \
  -e NODE_ENV=production \
  -e DB_HOST=alliance-courtage-mysql \
  -e DB_USER=root \
  -e DB_PASSWORD=alliance2024Secure \
  -e DB_NAME=alliance_courtage \
  -p 3001:3001 \
  node:18 \
  sh -c "npm install && node server.js"
ENDSSH

echo -e "${GREEN}✅ Backend redémarré${NC}"

# Mettre à jour le frontend
echo -e "${YELLOW}🌐 Mise à jour du frontend...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker cp ${REMOTE_DIR}/dist/. alliance-courtage-extranet:/usr/share/nginx/html/"

echo -e "${GREEN}✅ Frontend mis à jour${NC}"

echo ""
echo -e "${BLUE}⏳ Attente du démarrage du backend (30s)...${NC}"
sleep 30

echo ""
echo -e "${BLUE}🔍 Vérification des conteneurs${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker ps | grep alliance"

echo ""
echo -e "${BLUE}📋 Derniers logs du backend${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} "docker logs --tail 20 ${BACKEND_CONTAINER}"

echo ""
echo -e "${GREEN}✅ Déploiement terminé !${NC}"
echo ""
echo "🌐 Site: http://13.38.115.36"
echo "📊 Vérifiez que tout fonctionne correctement"
echo ""

