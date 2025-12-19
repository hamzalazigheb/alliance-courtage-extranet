#!/bin/bash
# Script de configuration automatique pour le déploiement
# Ce script crée tous les fichiers de configuration nécessaires

set -e

echo "🔧 Configuration automatique du déploiement..."
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Aller dans le dossier backend
cd "$(dirname "$0")"
BACKEND_DIR=$(pwd)

echo "📁 Dossier backend: $BACKEND_DIR"
echo ""

# 1. Créer config.env si il n'existe pas
if [ ! -f "config.env" ]; then
    echo -e "${YELLOW}📝 Création du fichier config.env...${NC}"
    cat > config.env << 'EOF'
# Configuration Base de données
DB_HOST=mysql
DB_PORT=3306
DB_NAME=alliance_courtage
DB_USER=alliance_user
DB_PASSWORD=alliance_pass2024
DB_ROOT_PASSWORD=alliance2024Secure

# Configuration JWT
JWT_SECRET=alliance_courtage_secret_key_change_me_2024
JWT_EXPIRES_IN=24h

# Configuration CORS
CORS_ORIGIN=http://localhost

# Configuration Frontend
FRONTEND_URL=http://localhost:5173

# Configuration SMTP (Mailtrap pour développement)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=5b05acc25d7ca2
SMTP_PASSWORD=fb65ba99981fa1
SMTP_FROM=noreply@alliance-courtage.fr

# Configuration Node
NODE_ENV=production
PORT=3001
EOF
    echo -e "${GREEN}✅ Fichier config.env créé${NC}"
else
    echo -e "${GREEN}✅ Fichier config.env existe déjà${NC}"
fi

# 2. Créer .env si il n'existe pas (fichier optionnel)
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Création du fichier .env (optionnel)...${NC}"
    cat > .env << 'EOF'
# Fichier .env optionnel
# Les valeurs principales sont dans config.env
# Vous pouvez ajouter ici des variables d'environnement supplémentaires si nécessaire
EOF
    echo -e "${GREEN}✅ Fichier .env créé${NC}"
else
    echo -e "${GREEN}✅ Fichier .env existe déjà${NC}"
fi

# 3. Créer le dossier uploads s'il n'existe pas
if [ ! -d "uploads" ]; then
    echo -e "${YELLOW}📁 Création du dossier uploads...${NC}"
    mkdir -p uploads
    chmod 755 uploads
    echo -e "${GREEN}✅ Dossier uploads créé${NC}"
else
    echo -e "${GREEN}✅ Dossier uploads existe déjà${NC}"
fi

# 4. Vérifier Docker
echo ""
echo "🐳 Vérification de Docker..."
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker est installé${NC}"
    docker --version 2>/dev/null || sudo docker --version
else
    echo -e "${RED}❌ Docker n'est pas installé${NC}"
    echo "   Installation de Docker..."
    sudo apt update
    sudo apt install -y docker.io docker-compose
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}⚠️  Vous devez vous déconnecter et reconnecter pour que les changements prennent effet${NC}"
fi

# Vérifier les permissions Docker
if docker ps &> /dev/null; then
    echo -e "${GREEN}✅ Permissions Docker OK${NC}"
else
    echo -e "${YELLOW}⚠️  Permissions Docker manquantes, ajout de l'utilisateur au groupe docker...${NC}"
    sudo usermod -aG docker $USER
    echo -e "${YELLOW}⚠️  Vous devez vous déconnecter et reconnecter, ou utiliser 'newgrp docker'${NC}"
    echo -e "${YELLOW}   Ou utilisez 'sudo' avec les commandes docker${NC}"
fi

if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
    echo -e "${GREEN}✅ Docker Compose est installé${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose n'est pas installé, installation...${NC}"
    sudo apt install -y docker-compose
fi

echo ""
echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo ""
echo "📋 Fichiers créés:"
echo "   - config.env"
echo "   - .env"
echo ""
echo "🚀 Vous pouvez maintenant déployer avec:"
echo "   docker-compose down"
echo "   docker-compose up -d --build"

