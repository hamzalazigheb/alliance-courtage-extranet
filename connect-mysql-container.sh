#!/bin/bash
# Script pour se connecter au conteneur MySQL

# Se connecter au conteneur MySQL
# Le conteneur s'appelle "alliance-courtage-mysql" d'après l'image

echo "🔌 Connexion au conteneur MySQL..."
echo ""

# Option 1: Se connecter directement avec mysql client
# Le mot de passe root par défaut est: alliance2024Secure
# La base de données s'appelle: alliance_courtage

docker exec -it alliance-courtage-mysql mysql -u root -p

# Option 2: Avec mot de passe directement (décommentez si vous préférez)
# docker exec -it alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage

# Option 2: Entrer dans le conteneur d'abord, puis se connecter
# docker exec -it alliance-courtage-mysql bash
# Puis dans le conteneur: mysql -u root -p

echo ""
echo "✅ Une fois connecté, vous pouvez exécuter les requêtes SQL du fichier view-bulk-uploads.sql"
echo "   Ou copier-coller les requêtes directement dans le terminal MySQL"

