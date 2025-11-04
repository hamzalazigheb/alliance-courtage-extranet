#!/bin/bash

# =====================================================
# Commandes Rapides pour Déploiement via Termius
# =====================================================
# Copiez-collez ces commandes dans Termius
# =====================================================

# 1. Navigation vers le projet
cd ~/alliance-courtage
# ou
cd /var/www/alliance-courtage

# 2. Backup de la base de données
mkdir -p ~/backups
mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Mise à jour du code (si Git)
git pull origin main

# 4. Installer les dépendances
cd backend && npm install && cd ..

# 5. Migration de la base de données
cd backend && node scripts/addFavorisTable.js && cd ..

# 6. Redémarrer (choisir selon votre configuration)

# PM2
pm2 restart all && pm2 save

# Docker
docker-compose restart

# Systemd
sudo systemctl restart alliance-courtage-backend

# 7. Vérification
curl http://localhost:3001/api/health
pm2 logs --lines 20

# =====================================================
# Commandes de Diagnostic
# =====================================================

# Vérifier les fichiers
ls -la backend/routes/favoris.js
ls -la src/FavorisPage.tsx

# Vérifier la table
mysql -u root -p -e "USE alliance_courtage; SHOW TABLES LIKE 'favoris';"

# Vérifier les logs
pm2 logs --lines 50
# ou
docker-compose logs --tail 50

# Vérifier les processus
ps aux | grep node
docker ps

# =====================================================

