#!/bin/bash

# Script pour configurer Git sur le serveur de production
# Usage: ./setup-git-production.sh

set -e

echo "🔧 Configuration Git pour la production"
echo "======================================="
echo ""

# Vérifier si Git est installé
if ! command -v git &> /dev/null; then
    echo "❌ Git n'est pas installé!"
    echo "   Installation..."
    sudo apt update
    sudo apt install -y git
fi

echo "✅ Git installé"
echo ""

# Vérifier le dossier actuel
CURRENT_DIR=$(pwd)
echo "📁 Dossier actuel: $CURRENT_DIR"
echo ""

# Vérifier si c'est un dépôt Git
if [ -d ".git" ]; then
    echo "✅ Dépôt Git détecté"
    echo ""
    echo "📋 Remote actuel:"
    git remote -v
    echo ""
    
    # Vérifier si origin existe
    if git remote | grep -q "origin"; then
        echo "✅ Remote 'origin' configuré"
        REMOTE_URL=$(git remote get-url origin)
        echo "   URL: $REMOTE_URL"
        echo ""
        
        read -p "Voulez-vous récupérer les dernières modifications? (O/N): " pull_confirm
        if [ "$pull_confirm" = "O" ] || [ "$pull_confirm" = "o" ] || [ "$pull_confirm" = "Y" ] || [ "$pull_confirm" = "y" ]; then
            echo ""
            echo "📥 Récupération des modifications..."
            git pull origin main || git pull origin master
            echo "✅ Code mis à jour"
        fi
    else
        echo "⚠️  Remote 'origin' non configuré"
        echo ""
        read -p "Voulez-vous ajouter le remote GitHub? (O/N): " add_remote
        if [ "$add_remote" = "O" ] || [ "$add_remote" = "o" ] || [ "$add_remote" = "Y" ] || [ "$add_remote" = "y" ]; then
            git remote add origin https://github.com/hamzalazigheb/alliance-courtage-extranet.git
            echo "✅ Remote ajouté"
            echo ""
            echo "📥 Récupération des modifications..."
            git pull origin main || git pull origin master
        fi
    fi
else
    echo "⚠️  Ce dossier n'est pas un dépôt Git"
    echo ""
    echo "Options:"
    echo "  1. Initialiser Git ici"
    echo "  2. Cloner depuis GitHub"
    echo ""
    read -p "Votre choix (1 ou 2): " choice
    
    if [ "$choice" = "1" ]; then
        echo ""
        echo "📦 Initialisation de Git..."
        git init
        git remote add origin https://github.com/hamzalazigheb/alliance-courtage-extranet.git
        echo "✅ Git initialisé"
        echo ""
        echo "📥 Récupération du code..."
        git fetch origin
        git checkout -b main origin/main 2>/dev/null || git checkout main
        echo "✅ Code récupéré"
    elif [ "$choice" = "2" ]; then
        echo ""
        read -p "Dans quel dossier voulez-vous cloner? (défaut: ~/alliance-courtage): " clone_dir
        if [ -z "$clone_dir" ]; then
            clone_dir="$HOME/alliance-courtage"
        fi
        
        if [ -d "$clone_dir" ]; then
            echo "⚠️  Le dossier $clone_dir existe déjà"
            read -p "Voulez-vous le supprimer et cloner à nouveau? (O/N): " remove_confirm
            if [ "$remove_confirm" = "O" ] || [ "$remove_confirm" = "o" ]; then
                rm -rf "$clone_dir"
            else
                echo "❌ Annulé"
                exit 0
            fi
        fi
        
        echo ""
        echo "📥 Clonage depuis GitHub..."
        git clone https://github.com/hamzalazigheb/alliance-courtage-extranet.git "$clone_dir"
        echo "✅ Dépôt cloné dans $clone_dir"
        echo ""
        echo "💡 Pour aller dans le dossier:"
        echo "   cd $clone_dir"
    else
        echo "❌ Choix invalide"
        exit 1
    fi
fi

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Créer les tables manquantes: cd backend/scripts && ./migrateProduction.sh"
echo "   2. Redéployer: ./redeploy.sh"
echo ""


