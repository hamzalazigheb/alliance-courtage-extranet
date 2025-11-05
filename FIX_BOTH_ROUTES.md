# 🔧 Solution Rapide - Routes 404 (Notifications + Réservations)

## Problème
Les routes suivantes retournent 404 :
- `POST /api/notifications/broadcast`
- `GET /api/structured-products/reservations/all`

## Solution Rapide (Copier directement les fichiers)

```bash
cd /var/www/alliance-courtage

# 1. Pull les dernières modifications
git pull origin main

# 2. Copier les fichiers directement dans le conteneur
docker cp backend/routes/notifications.js alliance-courtage-backend:/app/routes/notifications.js
docker cp backend/routes/structuredProducts.js alliance-courtage-backend:/app/routes/structuredProducts.js

# 3. Redémarrer le backend
docker restart alliance-courtage-backend

# 4. Attendre quelques secondes
sleep 5

# 5. Vérifier les logs
docker logs alliance-courtage-backend --tail 30
```

## Version Tout-en-Un

```bash
cd /var/www/alliance-courtage && \
git pull origin main && \
docker cp backend/routes/notifications.js alliance-courtage-backend:/app/routes/notifications.js && \
docker cp backend/routes/structuredProducts.js alliance-courtage-backend:/app/routes/structuredProducts.js && \
docker restart alliance-courtage-backend && \
sleep 5 && \
docker logs alliance-courtage-backend --tail 20 && \
echo "✅ Fichiers copiés et backend redémarré!"
```

## Vérification

Après avoir exécuté ces commandes, vérifier que les routes existent :

```bash
# Vérifier la route broadcast
docker exec alliance-courtage-backend grep -n "broadcast" /app/routes/notifications.js

# Vérifier la route reservations/all
docker exec alliance-courtage-backend grep -n "reservations/all" /app/routes/structuredProducts.js
```

## Si le problème persiste - Rebuild Complet

```bash
cd /var/www/alliance-courtage

# 1. Pull les dernières modifications
git pull origin main

# 2. Rebuild complet du backend
cd backend
docker stop alliance-courtage-backend
docker compose build --no-cache backend
docker start alliance-courtage-backend

# 3. Attendre que le backend démarre
sleep 10

# 4. Vérifier les logs
docker logs alliance-courtage-backend --tail 50
```

## Test après correction

1. **Notifications** : Aller sur `/manage` → onglet "📢 Notifications"
   - Créer une notification avec un lien
   - Vérifier qu'il n'y a plus d'erreur 404

2. **Réservations** : Aller sur `/manage` → onglet "Produits Réservés"
   - Vérifier que les réservations se chargent sans erreur 404

## Diagnostic

Si les routes ne fonctionnent toujours pas après la copie :

```bash
# Vérifier la syntaxe des fichiers
docker exec alliance-courtage-backend node -c /app/routes/notifications.js
docker exec alliance-courtage-backend node -c /app/routes/structuredProducts.js

# Vérifier les logs d'erreur
docker logs alliance-courtage-backend 2>&1 | grep -i "error\|cannot\|failed"
```

