#!/bin/bash

# Script de déploiement rapide pour la correction des notifications de formation
# Usage: ./deploy-notifications-fix.sh

set -e

echo "🚀 Déploiement de la correction des notifications de formation..."
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
    
    # Configuration serveur
    SERVER_USER="ubuntu"
    SERVER_HOST="15.237.254.31"  # Adresse IP du serveur
    
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

echo -e "${BLUE}🔄 Étape 2: Redémarrage du backend...${NC}"
docker restart alliance-courtage-backend

# Attendre que le backend soit prêt
echo "   → Attente du démarrage du backend..."
sleep 8

echo -e "${GREEN}✅ Backend redémarré${NC}"
echo ""

echo -e "${BLUE}📋 Étape 3: Vérification des logs...${NC}"
echo ""
echo "--- Backend logs (dernières 10 lignes) ---"
docker logs alliance-courtage-backend --tail 10

echo ""
echo -e "${GREEN}✅ Déploiement terminé avec succès !${NC}"
echo ""
echo -e "${BLUE}📝 Correction déployée :${NC}"
echo "   • Les notifications 'formation_pending' ne sont plus visibles par les utilisateurs non-admin"
echo "   • Seuls les admins peuvent voir les soumissions de formations des autres utilisateurs"
echo ""
echo -e "${YELLOW}⚠️  Actions recommandées :${NC}"
echo "   1. Tester avec un compte utilisateur normal (ex: mmosbahi@nerium-patrimoine.fr)"
echo "   2. Vérifier que les notifications de formation d'autres utilisateurs n'apparaissent plus"
echo "   3. Tester avec un compte admin pour confirmer que les admins voient toujours ces notifications"
echo ""

