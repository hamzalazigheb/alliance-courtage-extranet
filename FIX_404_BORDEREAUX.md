# 🔧 Solution : Erreur 404 sur /api/bordereaux

## ❌ Problème

```
Failed to load resource: the server responded with a status of 404 (Not Found)
/api/bordereaux
```

La route `/api/bordereaux` n'est pas trouvée.

## ✅ Solutions

### Solution 1 : Vérifier si le Fichier Existe dans le Conteneur

```bash
# Vérifier que le fichier bordereaux.js existe
docker exec alliance-courtage-backend ls -la /app/routes/bordereaux.js

# Vérifier que server.js inclut la route
docker exec alliance-courtage-backend cat /app/server.js | grep bordereaux
```

### Solution 2 : Copier le Fichier dans le Conteneur

Si le fichier n'existe pas :

```bash
# Copier le fichier depuis le serveur vers le conteneur
docker cp backend/routes/bordereaux.js alliance-courtage-backend:/app/routes/bordereaux.js

# Redémarrer le backend
docker restart alliance-courtage-backend

# Vérifier les logs
docker logs alliance-courtage-backend --tail 50
```

### Solution 3 : Vérifier les Logs du Backend

```bash
# Voir les logs pour des erreurs de chargement
docker logs alliance-courtage-backend --tail 100 | grep -i "error\|bordereaux\|cannot find"
```

### Solution 4 : Rebuild le Backend

Si le code n'a pas été mis à jour dans l'image Docker :

```bash
# Rebuild l'image backend
cd /var/www/alliance-courtage
docker build -t backend-backend ./backend

# Redémarrer le conteneur
docker stop alliance-courtage-backend
docker rm alliance-courtage-backend

# Recréer avec le bon réseau
docker run -d \
  --name alliance-courtage-backend \
  --network backend_alliance-network \
  -p 3001:3001 \
  backend-backend
```

### Solution 5 : Vérifier que le Backend Démarre Correctement

```bash
# Vérifier les logs au démarrage
docker logs alliance-courtage-backend --tail 50

# Vérifier que toutes les routes sont chargées
docker exec alliance-courtage-backend cat /app/server.js | grep "app.use('/api"
```

---

## 🔍 Diagnostic Complet

```bash
# 1. Vérifier que le fichier existe sur le serveur
ls -la backend/routes/bordereaux.js

# 2. Vérifier dans le conteneur
docker exec alliance-courtage-backend ls -la /app/routes/ | grep bordereaux

# 3. Vérifier les erreurs de chargement
docker logs alliance-courtage-backend 2>&1 | grep -i "bordereaux\|error\|cannot find"

# 4. Tester l'API directement
curl http://localhost:3001/api/health
curl http://localhost:3001/api/bordereaux
```

---

## 🚀 Solution Rapide

```bash
# 1. Vérifier le fichier
docker exec alliance-courtage-backend ls -la /app/routes/bordereaux.js

# 2. Si le fichier n'existe pas, le copier
docker cp backend/routes/bordereaux.js alliance-courtage-backend:/app/routes/bordereaux.js

# 3. Redémarrer
docker restart alliance-courtage-backend

# 4. Vérifier
docker logs alliance-courtage-backend --tail 20
curl http://localhost:3001/api/health
```

---

**Exécutez d'abord la Solution Rapide ! 🚀**


