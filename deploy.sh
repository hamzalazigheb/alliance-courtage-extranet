#!/bin/bash
set -e

echo "🚀 Déploiement Alliance Courtage Extranet"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les erreurs
error_exit() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Fonction pour afficher les succès
success_msg() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher les infos
info_msg() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Fonction pour afficher les warnings
warn_msg() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    error_exit "Ce script doit être exécuté depuis la racine du projet"
fi

# ==========================================
# ÉTAPE 1: Vérification des prérequis
# ==========================================
echo -e "${BLUE}📋 Étape 1: Vérification des prérequis...${NC}"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    warn_msg "Docker n'est pas installé. Installation en cours..."
    
    # Installer Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo rm get-docker.sh
    
    # Ajouter l'utilisateur au groupe docker
    sudo usermod -aG docker $USER
    
    warn_msg "Docker installé. Application des permissions..."
    
    # Essayer d'appliquer les changements immédiatement avec newgrp
    if command -v newgrp &> /dev/null; then
        warn_msg "Application des permissions Docker (peut prendre quelques secondes)..."
        # Note: newgrp dans un script est complexe, on essaie une autre méthode
    fi
    
    # Vérifier si on peut utiliser Docker maintenant
    if ! groups | grep -q docker; then
        warn_msg "⚠️  Permissions Docker non appliquées automatiquement."
        warn_msg "💡 Solutions :"
        warn_msg "   1. Se déconnecter/reconnecter, puis relancer: ./deploy.sh"
        warn_msg "   2. Ou exécuter: sudo usermod -aG docker $USER && newgrp docker"
        warn_msg ""
        warn_msg "Essai de continuation avec sudo..."
        
        # Essayer avec sudo en dernier recours
        if ! docker ps &> /dev/null; then
            error_exit "Impossible d'utiliser Docker. Déconnectez-vous/reconnectez-vous et relancez le script."
        fi
    fi
else
    success_msg "Docker est installé"
    docker --version
fi

# Vérifier Docker Compose
if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    warn_msg "Docker Compose n'est pas installé. Installation en cours..."
    
    if command -v apt &> /dev/null; then
        sudo apt update
        sudo apt install -y docker-compose-plugin || sudo apt install -y docker-compose
    elif command -v yum &> /dev/null; then
        sudo yum install -y docker-compose
    else
        error_exit "Impossible d'installer Docker Compose automatiquement. Installez-le manuellement."
    fi
else
    success_msg "Docker Compose est installé"
    docker compose version 2>/dev/null || docker-compose --version
fi

echo ""

# ==========================================
# ÉTAPE 2: Configuration des variables d'environnement
# ==========================================
echo -e "${BLUE}📋 Étape 2: Configuration des variables d'environnement...${NC}"

cd backend

# Créer .env si n'existe pas
if [ ! -f ".env" ]; then
    info_msg "Création du fichier .env avec des valeurs par défaut..."
    cat > .env << 'EOF'
# Configuration Base de Données
DB_ROOT_PASSWORD=alliance2024Secure
DB_NAME=alliance_courtage
DB_USER=alliance_user
DB_PASSWORD=alliance_pass2024

# Configuration Backend
JWT_SECRET=alliance_courtage_secret_key_change_me_2024
JWT_EXPIRES_IN=24h
NODE_ENV=production
CORS_ORIGIN=http://localhost

# Configuration SMTP (optionnel - à configurer pour la production)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=http://localhost
EOF
    warn_msg "Fichier .env créé avec des valeurs par défaut"
    warn_msg "⚠️  IMPORTANT: Modifiez les mots de passe et JWT_SECRET pour la production!"
else
    success_msg "Fichier .env existe déjà"
fi

# Créer config.env si n'existe pas
if [ ! -f "config.env" ]; then
    info_msg "Création du fichier config.env..."
    
    # Lire les valeurs depuis .env
    source .env 2>/dev/null || true
    
    cat > config.env << EOF
# Configuration Base de Données
DB_HOST=mysql
DB_PORT=3306
DB_NAME=${DB_NAME:-alliance_courtage}
DB_USER=${DB_USER:-alliance_user}
DB_PASSWORD=${DB_PASSWORD:-alliance_pass2024}

# Configuration Serveur
PORT=3001
NODE_ENV=production

# Configuration JWT
JWT_SECRET=${JWT_SECRET:-alliance_courtage_secret_key_change_me_2024}
JWT_EXPIRES_IN=24h

# Configuration CORS
CORS_ORIGIN=${CORS_ORIGIN:-http://localhost}

# Configuration Uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Configuration SMTP
SMTP_HOST=${SMTP_HOST:-sandbox.smtp.mailtrap.io}
SMTP_PORT=${SMTP_PORT:-587}
SMTP_SECURE=${SMTP_SECURE:-false}
SMTP_USER=${SMTP_USER:-}
SMTP_PASSWORD=${SMTP_PASSWORD:-}
SMTP_FROM=${SMTP_FROM:-noreply@alliance-courtage.fr}
FRONTEND_URL=${FRONTEND_URL:-http://localhost}
EOF
    success_msg "Fichier config.env créé"
else
    success_msg "Fichier config.env existe déjà"
fi

# Créer les dossiers uploads si n'existent pas
info_msg "Création des dossiers uploads..."
mkdir -p uploads/structured-products
mkdir -p uploads/partners-logos
mkdir -p uploads/financial-documents
mkdir -p uploads/cms-content
success_msg "Dossiers uploads créés"

cd ..

echo ""

# ==========================================
# ÉTAPE 3: Arrêt des containers existants
# ==========================================
echo -e "${BLUE}📋 Étape 3: Arrêt des containers existants...${NC}"

# Arrêter et supprimer le frontend existant
if docker ps -a | grep -q "alliance-courtage-extranet"; then
    info_msg "Arrêt du container frontend existant..."
    docker stop alliance-courtage-extranet 2>/dev/null || true
    docker rm alliance-courtage-extranet 2>/dev/null || true
    success_msg "Container frontend arrêté"
fi

# Arrêter les services backend
cd backend
if docker compose ps | grep -q "Up"; then
    info_msg "Arrêt des services backend..."
    docker compose down
    success_msg "Services backend arrêtés"
else
    success_msg "Aucun service backend en cours d'exécution"
fi

cd ..
echo ""

# ==========================================
# ÉTAPE 4: Build et démarrage du backend
# ==========================================
echo -e "${BLUE}📋 Étape 4: Build et démarrage du backend...${NC}"

cd backend

info_msg "Build des images backend..."
docker compose build --no-cache

info_msg "Démarrage des services backend..."
docker compose up -d

success_msg "Services backend démarrés"

# Afficher le statut
echo ""
echo "📊 Statut des containers backend:"
docker compose ps

cd ..
echo ""

# ==========================================
# ÉTAPE 5: Attendre que MySQL soit prêt
# ==========================================
echo -e "${BLUE}📋 Étape 5: Attente que MySQL soit prêt...${NC}"

MAX_WAIT=60
WAIT_TIME=0

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if docker exec alliance-courtage-mysql mysqladmin ping -h localhost -u root -palliance2024Secure --silent 2>/dev/null; then
        success_msg "MySQL est prêt"
        break
    fi
    
    # Essayer aussi avec le mot de passe par défaut
    if docker exec alliance-courtage-mysql mysqladmin ping -h localhost -u root -palliance2024 --silent 2>/dev/null; then
        success_msg "MySQL est prêt"
        break
    fi
    
    WAIT_TIME=$((WAIT_TIME + 2))
    echo -ne "\r⏳ Attente... (${WAIT_TIME}s/${MAX_WAIT}s)"
    sleep 2
done

echo ""

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    warn_msg "MySQL a pris plus de temps que prévu à démarrer"
    warn_msg "Les migrations pourront échouer. Vérifiez les logs: docker logs alliance-courtage-mysql"
else
    success_msg "MySQL est opérationnel"
fi

echo ""

# ==========================================
# ÉTAPE 6: Initialisation de la base de données
# ==========================================
echo -e "${BLUE}📋 Étape 6: Initialisation de la base de données...${NC}"

cd backend

# Vérifier si la base de données existe déjà
DB_EXISTS=$(docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure -e "SHOW DATABASES LIKE 'alliance_courtage';" 2>/dev/null | grep -c alliance_courtage || echo "0")

if [ "$DB_EXISTS" = "0" ]; then
    # Essayer avec le mot de passe par défaut
    DB_EXISTS=$(docker exec alliance-courtage-mysql mysql -u root -palliance2024 -e "SHOW DATABASES LIKE 'alliance_courtage';" 2>/dev/null | grep -c alliance_courtage || echo "0")
fi

if [ "$DB_EXISTS" = "0" ]; then
    info_msg "Initialisation de la base de données..."
    
    # Essayer d'exécuter initDatabase.js
    if docker compose exec -T backend node scripts/initDatabase.js 2>/dev/null; then
        success_msg "Base de données initialisée"
    else
        warn_msg "Script d'initialisation non disponible ou échoué"
        warn_msg "La base sera créée automatiquement par docker-compose"
    fi
else
    success_msg "Base de données existe déjà"
fi

# Exécuter les migrations
info_msg "Exécution des migrations..."
if docker compose exec -T backend node scripts/runAllMigrations.js 2>/dev/null; then
    success_msg "Migrations exécutées"
else
    warn_msg "Certaines migrations ont pu échouer, mais ce n'est pas toujours grave"
    warn_msg "Vérifiez les logs: docker compose logs backend"
fi

cd ..
echo ""

# ==========================================
# ÉTAPE 7: Build du frontend
# ==========================================
echo -e "${BLUE}📋 Étape 7: Build du frontend...${NC}"

info_msg "Build de l'image frontend..."
docker build -t alliance-courtage-frontend:latest .

success_msg "Image frontend buildée"

echo ""

# ==========================================
# ÉTAPE 8: Démarrage du frontend
# ==========================================
echo -e "${BLUE}📋 Étape 8: Démarrage du frontend...${NC}"

# Récupérer le nom du réseau Docker
NETWORK_NAME=$(cd backend && docker compose config 2>/dev/null | grep -A 2 "networks:" | tail -1 | awk '{print $1}' | tr -d ':' || echo "backend_alliance-network")

if [ -z "$NETWORK_NAME" ] || [ "$NETWORK_NAME" = "backend_alliance-network" ]; then
    # Essayer de trouver le réseau créé par docker-compose
    NETWORK_NAME=$(docker network ls | grep backend | awk '{print $1}' | head -1)
    if [ -z "$NETWORK_NAME" ]; then
        NETWORK_NAME=$(docker inspect alliance-courtage-backend 2>/dev/null | grep -A 10 "Networks" | grep "NetworkID" | cut -d'"' -f4 | head -1)
    fi
fi

# Si toujours pas trouvé, utiliser le nom par défaut
if [ -z "$NETWORK_NAME" ]; then
    NETWORK_NAME="backend_alliance-network"
    # Créer le réseau s'il n'existe pas
    docker network create $NETWORK_NAME 2>/dev/null || true
fi

info_msg "Utilisation du réseau Docker: $NETWORK_NAME"

# Démarrer le frontend
info_msg "Démarrage du container frontend..."
docker run -d \
  --name alliance-courtage-extranet \
  --network $NETWORK_NAME \
  -p 80:80 \
  --restart unless-stopped \
  alliance-courtage-frontend:latest

success_msg "Container frontend démarré"

echo ""

# ==========================================
# ÉTAPE 9: Nettoyage
# ==========================================
echo -e "${BLUE}📋 Étape 9: Nettoyage...${NC}"

info_msg "Nettoyage des images inutilisées..."
docker image prune -f

success_msg "Nettoyage terminé"

echo ""

# ==========================================
# ÉTAPE 10: Vérification finale
# ==========================================
echo -e "${BLUE}📋 Étape 10: Vérification finale...${NC}"

echo ""
echo "📊 Statut des containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "alliance|NAMES"

echo ""
echo "🔍 Vérification de l'API backend..."
sleep 3

if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    success_msg "Backend API répond"
else
    warn_msg "Backend API ne répond pas encore (peut prendre quelques secondes)"
    info_msg "Vérifiez avec: curl http://localhost:3001/api/health"
fi

echo ""
echo "🌐 Informations de connexion:"
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "VOTRE_IP")
echo "   Frontend: http://${PUBLIC_IP}"
echo "   Backend API: http://${PUBLIC_IP}/api"
echo "   Local: http://localhost"

echo ""
echo -e "${GREEN}✅ Déploiement terminé avec succès!${NC}"
echo ""
echo "📝 Commandes utiles:"
echo "   Logs backend:  docker logs -f alliance-courtage-backend"
echo "   Logs frontend: docker logs -f alliance-courtage-extranet"
echo "   Logs MySQL:    docker logs -f alliance-courtage-mysql"
echo "   Status:        docker ps"
echo "   Redémarrer:    cd backend && docker compose restart"
echo ""
echo "🔐 Identifiants par défaut (si base vide):"
echo "   Email: admin@alliance-courtage.fr"
echo "   Password: password"
echo ""
echo "⚠️  IMPORTANT: Changez les mots de passe dans backend/.env et backend/config.env pour la production!"
echo ""
