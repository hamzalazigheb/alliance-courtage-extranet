# 🔧 Déploiement : Correction Rate Limit

## ✅ Modification Effectuée

Le rate limit a été augmenté de **100 à 1000** requêtes par 15 minutes en production.

## 🚀 Déploiement

### Sur Machine Locale

```bash
# Commit et push
git add backend/server.js
git commit -m "Increase rate limit to 1000 requests per 15 minutes"
git push origin main
```

### Sur Serveur (Termius)

```bash
# 1. Redémarrer le backend (pour débloquer maintenant)
docker restart alliance-courtage-backend
sleep 15

# 2. Pull le nouveau code
cd /var/www/alliance-courtage
git pull origin main

# 3. Rebuild le backend
docker build -t backend-backend ./backend

# 4. Redémarrer avec la nouvelle image
docker stop alliance-courtage-backend
docker rm alliance-courtage-backend
docker run -d \
  --name alliance-courtage-backend \
  --network backend_alliance-network \
  -p 3001:3001 \
  backend-backend

# 5. Vérifier
docker logs alliance-courtage-backend --tail 20
```

---

**Exécutez d'abord le redémarrage pour débloquer, puis déployez la correction ! 🚀**


