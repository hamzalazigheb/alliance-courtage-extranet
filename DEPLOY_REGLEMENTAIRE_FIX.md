# 🔧 Déploiement : Correction reglementaire.js

## ✅ Correction Effectuée

Ajout de l'import manquant `notifyAdmins` dans `backend/routes/reglementaire.js`.

## 🚀 Déploiement sur le Serveur

### Sur le Serveur (Termius)

```bash
# 1. Pull le nouveau code
cd /var/www/alliance-courtage
git pull origin main

# 2. Copier le fichier corrigé dans le conteneur
docker cp backend/routes/reglementaire.js alliance-courtage-backend:/app/routes/reglementaire.js

# 3. Redémarrer le backend
docker restart alliance-courtage-backend

# 4. Vérifier les logs
sleep 5
docker logs alliance-courtage-backend --tail 20
```

### Alternative : Rebuild le Backend

```bash
# Rebuild l'image backend
docker build -t backend-backend ./backend

# Redémarrer
docker stop alliance-courtage-backend
docker rm alliance-courtage-backend
docker run -d \
  --name alliance-courtage-backend \
  --network backend_alliance-network \
  -p 3001:3001 \
  backend-backend
```

---

**Exécutez ces commandes sur le serveur ! 🚀**


