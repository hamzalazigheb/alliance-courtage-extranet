# 🔧 Guide de Déploiement - Routes Manquantes (404)

## Problème
Les routes suivantes retournent 404 :
- `GET /api/structured-products/reservations/all`
- `POST /api/notifications/broadcast`

## Solution : Déploiement Complet

### Sur le serveur, exécuter ces commandes :

```bash
cd /var/www/alliance-courtage

# 1. Pull les dernières modifications depuis GitHub
git pull origin main

# 2. Vérifier que les routes existent dans les fichiers
echo "=== Vérification route reservations/all ==="
grep -n "reservations/all" backend/routes/structuredProducts.js

echo "=== Vérification route broadcast ==="
grep -n "broadcast" backend/routes/notifications.js

# 3. Si les routes n'existent pas, les fichiers ne sont pas à jour
# Vérifier le dernier commit
git log --oneline -3

# 4. Rebuild le backend pour s'assurer que les modifications sont dans l'image Docker
cd backend
docker compose build --no-cache backend

# 5. Redémarrer le backend
docker restart alliance-courtage-backend

# 6. Attendre que le backend démarre
sleep 10

# 7. Vérifier les logs
docker logs alliance-courtage-backend --tail 50

# 8. Tester que le backend répond
curl http://localhost:3001/api/health
```

## Version Rapide (si les fichiers sont déjà à jour)

```bash
cd /var/www/alliance-courtage && \
git pull origin main && \
cd backend && \
docker compose build --no-cache backend && \
docker restart alliance-courtage-backend && \
sleep 10 && \
docker logs alliance-courtage-backend --tail 30 && \
echo "✅ Backend rebuild et redémarré!"
```

## Vérification

Après le rebuild, vérifier que les routes fonctionnent :

```bash
# Tester avec curl (remplacer YOUR_TOKEN par un token admin valide)
# Test 1: Route reservations/all
curl -H "x-auth-token: YOUR_TOKEN" http://localhost:3001/api/structured-products/reservations/all

# Test 2: Route broadcast
curl -X POST \
  -H "x-auth-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Test message","type":"info"}' \
  http://localhost:3001/api/notifications/broadcast
```

## Si le problème persiste

1. Vérifier que les fichiers sont bien dans le conteneur :
```bash
docker exec alliance-courtage-backend cat /app/routes/structuredProducts.js | grep "reservations/all"
docker exec alliance-courtage-backend cat /app/routes/notifications.js | grep "broadcast"
```

2. Si les fichiers ne sont pas dans le conteneur, copier les fichiers :
```bash
docker cp backend/routes/structuredProducts.js alliance-courtage-backend:/app/routes/structuredProducts.js
docker cp backend/routes/notifications.js alliance-courtage-backend:/app/routes/notifications.js
docker restart alliance-courtage-backend
```

3. Vérifier que le serveur démarre correctement :
```bash
docker logs alliance-courtage-backend 2>&1 | grep -i "error\|route\|server"
```

