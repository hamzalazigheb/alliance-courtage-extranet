# ⚡ Déploiement Rapide via GitHub

## 🖥️ Machine Locale (Push)

```bash
cd C:\Users\Hamza\Desktop\saveweb2zip-com-www-extranet-gnca-fr
git add .
git commit -m "Add favoris system and deployment scripts"
git push origin main
```

---

## 🖥️ Serveur via Termius (Pull + Deploy)

```bash
# 1. Backup
docker start alliance-courtage-mysql
sleep 5
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d).sql

# 2. Pull
cd /var/www/alliance-courtage
git pull origin main

# 3. Migration
cd backend
npm install
node scripts/addFavorisTable.js
cd ..

# 4. Redémarrer
docker-compose up -d

# 5. Vérifier
docker ps
curl http://localhost:3001/api/health
```

---

**C'est tout ! 🚀**

