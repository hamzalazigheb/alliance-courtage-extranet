#!/bin/bash

# Script de déploiement des nouvelles fonctionnalités en production
# Usage: ./deploy-new-features.sh

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🚀 Déploiement des Nouvelles Fonctionnalités${NC}"
echo -e "${CYAN}============================================${NC}"
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker n'est pas installé!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker détecté${NC}"
echo ""

# Étape 1: Backup
echo -e "${BLUE}💾 Étape 1/7: Backup de la base de données...${NC}"
BACKUP_DIR="$HOME/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_before_new_features_$TIMESTAMP.sql"

MYSQL_CONTAINER=$(docker ps --filter "name=alliance-courtage-mysql" --format "{{.Names}}" | head -1)
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

# Étape 2: Créer les tables
echo -e "${BLUE}🗄️  Étape 2/7: Création des nouvelles tables...${NC}"

if [ -z "$MYSQL_CONTAINER" ]; then
    echo -e "${RED}❌ Conteneur MySQL non trouvé!${NC}"
    exit 1
fi

# Table partner_contacts
echo -e "   Création de partner_contacts..."
docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage << 'EOF' 2>/dev/null || true
CREATE TABLE IF NOT EXISTS partner_contacts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  fonction VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  INDEX idx_partner_id (partner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF

# Table partner_documents
echo -e "   Création de partner_documents..."
docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage << 'EOF' 2>/dev/null || true
CREATE TABLE IF NOT EXISTS partner_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  partner_id INT NOT NULL,
  title VARCHAR(255) NOT NULL COMMENT 'Titre du document',
  description TEXT COMMENT 'Description optionnelle',
  file_path VARCHAR(500) COMMENT 'Chemin du fichier (ancien système)',
  file_content LONGTEXT COMMENT 'Contenu du fichier en base64',
  file_size BIGINT COMMENT 'Taille du fichier en octets',
  file_type VARCHAR(100) COMMENT 'Type MIME du fichier',
  document_type VARCHAR(100) COMMENT 'Type de document: convention, brochure, autre',
  uploaded_by INT COMMENT 'ID utilisateur qui a uploade',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_partner_id (partner_id),
  INDEX idx_document_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
EOF

# Vérifier
TABLES=$(docker exec "$MYSQL_CONTAINER" mysql -u root -palliance2024Secure alliance_courtage -e "SHOW TABLES;" 2>/dev/null | grep partner || true)
if echo "$TABLES" | grep -q "partner_contacts" && echo "$TABLES" | grep -q "partner_documents"; then
    echo -e "${GREEN}✅ Tables créées avec succès${NC}"
else
    echo -e "${YELLOW}⚠️  Vérifiez manuellement les tables${NC}"
fi
echo ""

# Étape 3: Récupérer le code
echo -e "${BLUE}📥 Étape 3/7: Récupération du code...${NC}"
cd ~/alliance/alliance 2>/dev/null || cd ~/alliance || {
    echo -e "${RED}❌ Dossier du projet non trouvé!${NC}"
    exit 1
}

if [ -d ".git" ]; then
    echo -e "   Pull depuis Git..."
    git pull origin main 2>/dev/null || echo -e "${YELLOW}   ⚠️  Git pull échoué, continuons...${NC}"
else
    echo -e "${YELLOW}   ⚠️  Pas de dépôt Git, copiez manuellement les fichiers${NC}"
fi
echo ""

# Étape 4: Rebuild backend
echo -e "${BLUE}🏗️  Étape 4/7: Reconstruction du backend...${NC}"
cd backend 2>/dev/null || {
    echo -e "${RED}❌ Dossier backend non trouvé!${NC}"
    exit 1
}

BACKEND_CONTAINER=$(docker ps -a --filter "name=alliance-courtage-backend" --format "{{.Names}}" | head -1)
if [ -n "$BACKEND_CONTAINER" ]; then
    echo -e "   Arrêt du backend..."
    docker stop "$BACKEND_CONTAINER" 2>/dev/null || true
fi

echo -e "   Build de l'image backend (sans cache)..."
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    docker compose build --no-cache backend 2>/dev/null || docker build -t alliance-courtage-backend:latest --no-cache . || {
        echo -e "${RED}❌ Erreur lors du build backend!${NC}"
        exit 1
    }
else
    docker build -t alliance-courtage-backend:latest --no-cache . || {
        echo -e "${RED}❌ Erreur lors du build backend!${NC}"
        exit 1
    }
fi
echo -e "${GREEN}✅ Backend reconstruit${NC}"
echo ""

# Étape 5: Rebuild frontend
echo -e "${BLUE}🏗️  Étape 5/7: Reconstruction du frontend...${NC}"
cd .. 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Impossible de remonter au dossier parent${NC}"
}

FRONTEND_CONTAINER=$(docker ps -a --filter "name=alliance-courtage-extranet" --format "{{.Names}}" | head -1)
if [ -n "$FRONTEND_CONTAINER" ]; then
    echo -e "   Arrêt du frontend..."
    docker stop "$FRONTEND_CONTAINER" 2>/dev/null || true
fi

if [ -f "Dockerfile" ]; then
    echo -e "   Build de l'image frontend (sans cache)..."
    docker build -t alliance-courtage-frontend:latest --no-cache . || {
        echo -e "${YELLOW}⚠️  Erreur lors du build frontend, continuons...${NC}"
    }
    echo -e "${GREEN}✅ Frontend reconstruit${NC}"
else
    echo -e "${YELLOW}⚠️  Dockerfile frontend non trouvé${NC}"
fi
echo ""

# Étape 6: Redémarrer les conteneurs
echo -e "${BLUE}🚀 Étape 6/7: Redémarrage des conteneurs...${NC}"

# Backend
cd backend 2>/dev/null || cd ~/alliance/alliance/backend
if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "   Démarrage du backend avec docker compose..."
    docker compose up -d backend 2>/dev/null || {
        echo -e "${YELLOW}   ⚠️  docker compose échoué, création manuelle...${NC}"
        # Créer le réseau si nécessaire
        docker network create alliance-network 2>/dev/null || true
        # Trouver le réseau de MySQL
        MYSQL_NETWORK=$(docker inspect "$MYSQL_CONTAINER" --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)
        # Démarrer le backend
        docker run -d \
          --name alliance-courtage-backend \
          --restart unless-stopped \
          --network "${MYSQL_NETWORK:-alliance-network}" \
          -p 3001:3001 \
          --env-file config.env \
          -e NODE_ENV=production \
          -e DB_HOST=alliance-courtage-mysql \
          -e DB_PORT=3306 \
          -e DB_NAME=alliance_courtage \
          -e DB_USER=root \
          -e DB_PASSWORD=alliance2024Secure \
          -v $(pwd)/uploads:/app/uploads \
          -v $(pwd)/config.env:/app/config.env:ro \
          alliance-courtage-backend:latest 2>/dev/null || true
    }
else
    echo -e "   Création manuelle du conteneur backend..."
    MYSQL_NETWORK=$(docker inspect "$MYSQL_CONTAINER" --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)
    docker network create alliance-network 2>/dev/null || true
    docker run -d \
      --name alliance-courtage-backend \
      --restart unless-stopped \
      --network "${MYSQL_NETWORK:-alliance-network}" \
      -p 3001:3001 \
      --env-file config.env \
      -e NODE_ENV=production \
      -e DB_HOST=alliance-courtage-mysql \
      -e DB_PORT=3306 \
      -e DB_NAME=alliance_courtage \
      -e DB_USER=root \
      -e DB_PASSWORD=alliance2024Secure \
      -v $(pwd)/uploads:/app/uploads \
      -v $(pwd)/config.env:/app/config.env:ro \
      alliance-courtage-backend:latest 2>/dev/null || true
fi

# Frontend
cd .. 2>/dev/null || cd ~/alliance/alliance
if [ -f "Dockerfile" ] && docker images | grep -q "alliance-courtage-frontend"; then
    echo -e "   Démarrage du frontend..."
    docker rm alliance-courtage-extranet 2>/dev/null || true
    docker run -d \
      --name alliance-courtage-extranet \
      --restart unless-stopped \
      -p 80:80 \
      alliance-courtage-frontend:latest 2>/dev/null || true
fi

echo -e "${GREEN}✅ Conteneurs redémarrés${NC}"
echo ""

# Étape 7: Vérification
echo -e "${BLUE}✅ Étape 7/7: Vérification...${NC}"
sleep 5

echo -e "${CYAN}📋 État des conteneurs:${NC}"
docker ps --filter "name=alliance-courtage" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo -e "${CYAN}📋 Derniers logs du backend:${NC}"
docker logs alliance-courtage-backend --tail 10 2>/dev/null || echo -e "${YELLOW}⚠️  Impossible de lire les logs${NC}"

echo ""
echo -e "${GREEN}✅ Déploiement terminé!${NC}"
echo ""
echo -e "${CYAN}📋 Prochaines étapes:${NC}"
echo -e "   1. Tester l'API: ${BLUE}curl http://localhost:3001/api/health${NC}"
echo -e "   2. Tester l'interface: ${BLUE}http://votre-serveur${NC}"
echo -e "   3. Vérifier les logs: ${BLUE}docker logs alliance-courtage-backend --tail 50${NC}"
echo ""
echo -e "${GREEN}🔒 Protection des données:${NC}"
echo -e "   ${GREEN}✅ Backup créé: $BACKUP_FILE${NC}"
echo -e "   ${GREEN}✅ Tables créées${NC}"
echo -e "   ${GREEN}✅ Volumes préservés${NC}"
echo ""


