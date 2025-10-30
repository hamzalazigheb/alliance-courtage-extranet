#!/bin/bash

echo "🚀 Alliance Courtage Backend Setup"
echo "=================================="

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ Node.js détecté: $(node --version)"

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de l'installation des dépendances"
    exit 1
fi

echo "✅ Dépendances installées"

# Vérifier si MySQL est accessible
echo "🔍 Vérification de la connexion MySQL..."
mysql -u root -e "SELECT 1;" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  MySQL n'est pas accessible. Assurez-vous que XAMPP est démarré."
    echo "   Vous pouvez continuer et configurer la base de données manuellement."
else
    echo "✅ MySQL accessible"
    
    # Créer la base de données
    echo "🗄️  Création de la base de données..."
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS alliance_courtage CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    if [ $? -eq 0 ]; then
        echo "✅ Base de données créée"
        
        # Initialiser la base de données
        echo "🔄 Initialisation de la base de données..."
        npm run init-db
        
        if [ $? -eq 0 ]; then
            echo "✅ Base de données initialisée"
            
            # Migrer les données
            echo "📊 Migration des données existantes..."
            node scripts/migrateData.js
            
            if [ $? -eq 0 ]; then
                echo "✅ Données migrées"
            else
                echo "⚠️  Erreur lors de la migration des données"
            fi
        else
            echo "⚠️  Erreur lors de l'initialisation de la base de données"
        fi
    else
        echo "⚠️  Erreur lors de la création de la base de données"
    fi
fi

echo ""
echo "🎉 Setup terminé !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Démarrer le serveur : npm run dev"
echo "2. L'API sera disponible sur : http://localhost:3001"
echo "3. Utilisateur admin : admin@alliance-courtage.fr / password"
echo ""
echo "📚 Documentation : README.md"



