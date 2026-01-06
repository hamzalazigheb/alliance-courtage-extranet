#!/bin/bash

# Script de déploiement pour les mises à jour du thème financier professionnel
# et les améliorations UX

set -e

echo "🚀 Déploiement des mises à jour du thème et UX..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier si on est sur le serveur ou en local
if [ -d "/home/ubuntu/alliance" ]; then
    # On est sur le serveur
    echo -e "${BLUE}📍 Exécution sur le serveur${NC}"
    PROJECT_PATH="/home/ubuntu/alliance/alliance"
else
    # On est en local - se connecter au serveur
    echo -e "${BLUE}📍 Exécution en local - connexion au serveur...${NC}"
    
    # Configuration serveur (à adapter si nécessaire)
    SERVER_USER="ubuntu"
    SERVER_HOST="15.237.254.31"  # Adresse IP du serveur de test
    
    echo -e "${YELLOW}⚠️  Ce script va se connecter au serveur et déployer les changements.${NC}"
    read -p "Continuer? (o/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
        echo "Déploiement annulé."
        exit 0
    fi
    
    # Se connecter au serveur et exécuter le script
    ssh ${SERVER_USER}@${SERVER_HOST} 'bash -s' < "$0"
    exit 0
fi

# === À partir d'ici, on est sur le serveur ===

cd ${PROJECT_PATH}

echo -e "${BLUE}📥 Étape 1: Pull des derniers changements depuis GitHub...${NC}"
git fetch origin
git checkout deploy-new-version
git pull origin deploy-new-version

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du pull Git${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Code mis à jour${NC}"
echo ""

echo -e "${BLUE}📦 Étape 2: Installation des dépendances...${NC}"

# Backend dependencies
echo "   → Backend dependencies..."
cd ${PROJECT_PATH}
docker exec alliance-courtage-backend bash -c "cd /app && npm install"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Avertissement: Erreur lors de l'installation des dépendances backend${NC}"
fi

# Frontend dependencies
echo "   → Frontend dependencies..."
docker exec alliance-courtage-extranet bash -c "npm install"

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Avertissement: Erreur lors de l'installation des dépendances frontend${NC}"
fi

echo -e "${GREEN}✅ Dépendances installées${NC}"
echo ""

echo -e "${BLUE}🔨 Étape 3: Build du frontend...${NC}"
docker exec alliance-courtage-extranet bash -c "npm run build"

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Erreur lors du build frontend${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Frontend buildé${NC}"
echo ""

echo -e "${BLUE}🔄 Étape 4: Redémarrage des services...${NC}"

# Redémarrer le backend
echo "   → Redémarrage du backend..."
docker restart alliance-courtage-backend

# Attendre que le backend soit prêt
echo "   → Attente du démarrage du backend..."
sleep 8

# Redémarrer nginx dans le frontend
echo "   → Rechargement de nginx..."
docker exec alliance-courtage-extranet nginx -s reload

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Avertissement: Erreur lors du rechargement nginx${NC}"
fi

echo -e "${GREEN}✅ Services redémarrés${NC}"
echo ""

echo -e "${BLUE}📋 Étape 5: Vérification des logs...${NC}"

echo ""
echo "--- Backend logs (dernières 15 lignes) ---"
docker logs alliance-courtage-backend --tail 15

echo ""
echo "--- Frontend/Nginx logs (dernières 10 lignes) ---"
docker logs alliance-courtage-extranet --tail 10

echo ""
echo -e "${GREEN}✅ Déploiement terminé avec succès !${NC}"
echo ""
echo -e "${BLUE}📝 Changements déployés :${NC}"
echo "   • Thème financier professionnel appliqué à toutes les pages produits"
echo "   • Suppression de la phrase statique dans Gamme Produits"
echo "   • Message de sauvegarde amélioré dans le CMS"
echo "   • Nouveaux gradients, ombres et styles de boutons"
echo "   • Amélioration des cartes avec effets hover"
echo "   • Scripts de migration pour les fichiers gamme produits"
echo ""
echo -e "${YELLOW}⚠️  Actions recommandées :${NC}"
echo "   1. Vider le cache du navigateur (Ctrl+Shift+R)"
echo "   2. Tester les pages suivantes :"
echo "      - Produits Structurés (USER & MANAGE)"
echo "      - Gamme Produits"
echo "      - Documents Financiers"
echo "   3. Vérifier que le nouveau thème s'affiche correctement"
echo "   4. Tester l'upload de fichiers dans Gamme Produits"
echo ""

