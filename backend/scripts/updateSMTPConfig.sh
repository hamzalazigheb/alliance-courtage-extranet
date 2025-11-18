#!/bin/bash

# Script pour mettre à jour la configuration SMTP sur le serveur
# Usage: ./updateSMTPConfig.sh

echo "🔧 Mise à jour de la configuration SMTP"
echo "========================================"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "backend" ]; then
    echo "❌ Le dossier 'backend' n'existe pas dans le répertoire actuel."
    echo "📂 Répertoire actuel: $(pwd)"
    echo ""
    echo "💡 Essayez:"
    echo "   cd ~/alliance"
    echo "   ou"
    echo "   cd /path/to/your/project"
    exit 1
fi

# Vérifier si le fichier config.env existe
if [ ! -f "backend/config.env" ]; then
    echo "⚠️  Le fichier backend/config.env n'existe pas."
    echo "📝 Création du fichier..."
    
    # Créer le fichier avec la configuration de base
    cat > backend/config.env << 'EOF'
# Configuration de la base de données MySQL pour Alliance Courtage

# Configuration de base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alliance_courtage
DB_USER=root
DB_PASSWORD=alliance2024Secure

# Configuration du serveur
PORT=3001
NODE_ENV=production

# Configuration JWT
JWT_SECRET=alliance_courtage_secret_key_2024
JWT_EXPIRES_IN=24h

# Configuration CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:5178

# Configuration uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Configuration SMTP Mailtrap
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=5b05acc25d7ca2
SMTP_PASSWORD=fb65ba99981fa1
SMTP_FROM=noreply@alliance-courtage.fr

FRONTEND_URL=http://localhost:5173
EOF
    
    echo "✅ Fichier backend/config.env créé avec la configuration par défaut."
else
    echo "✅ Le fichier backend/config.env existe déjà."
fi

echo ""
echo "📝 Mise à jour de la configuration SMTP..."
echo ""

# Mettre à jour les variables SMTP
sed -i 's|^SMTP_HOST=.*|SMTP_HOST=sandbox.smtp.mailtrap.io|' backend/config.env
sed -i 's|^SMTP_PORT=.*|SMTP_PORT=587|' backend/config.env
sed -i 's|^SMTP_SECURE=.*|SMTP_SECURE=false|' backend/config.env
sed -i 's|^SMTP_USER=.*|SMTP_USER=5b05acc25d7ca2|' backend/config.env
sed -i 's|^SMTP_PASSWORD=.*|SMTP_PASSWORD=fb65ba99981fa1|' backend/config.env
sed -i 's|^SMTP_FROM=.*|SMTP_FROM=noreply@alliance-courtage.fr|' backend/config.env

# Si les lignes n'existent pas, les ajouter
if ! grep -q "^SMTP_HOST=" backend/config.env; then
    echo "" >> backend/config.env
    echo "# Configuration SMTP Mailtrap" >> backend/config.env
    echo "SMTP_HOST=sandbox.smtp.mailtrap.io" >> backend/config.env
    echo "SMTP_PORT=587" >> backend/config.env
    echo "SMTP_SECURE=false" >> backend/config.env
    echo "SMTP_USER=5b05acc25d7ca2" >> backend/config.env
    echo "SMTP_PASSWORD=fb65ba99981fa1" >> backend/config.env
    echo "SMTP_FROM=noreply@alliance-courtage.fr" >> backend/config.env
fi

echo "✅ Configuration SMTP mise à jour:"
echo ""
grep "^SMTP_" backend/config.env
echo ""

echo "🔄 Redémarrage du backend Docker..."
docker restart alliance-courtage-backend

echo ""
echo "✅ Terminé! Vérifiez les logs avec:"
echo "   docker logs alliance-courtage-backend --tail 30"
echo ""


