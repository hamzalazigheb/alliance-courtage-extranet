# 🔧 Solution Rapide - Route /api/notifications/broadcast 404

## Option 1 : Script Automatique (RECOMMANDÉ)

```bash
cd /var/www/alliance-courtage

# Télécharger et exécuter le script de correction
chmod +x fix-broadcast-route.sh
./fix-broadcast-route.sh
```

## Option 2 : Commandes Manuelles

```bash
cd /var/www/alliance-courtage

# 1. Pull les dernières modifications
git pull origin main

# 2. Copier directement le fichier dans le conteneur (SOLUTION RAPIDE)
docker cp backend/routes/notifications.js alliance-courtage-backend:/app/routes/notifications.js

# 3. Redémarrer le backend
docker restart alliance-courtage-backend

# 4. Attendre quelques secondes
sleep 5

# 5. Vérifier les logs
docker logs alliance-courtage-backend --tail 30
```

## Option 3 : Rebuild Complet (si Option 2 ne fonctionne pas)

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

## Vérification

Après l'une des options ci-dessus, tester la route :

```bash
# Vérifier que la route existe dans le conteneur
docker exec alliance-courtage-backend grep -n "broadcast" /app/routes/notifications.js

# Tester avec curl (remplacer YOUR_TOKEN par un token admin)
curl -X POST \
  -H "x-auth-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Test message","type":"info"}' \
  http://localhost:3001/api/notifications/broadcast
```

## Solution la Plus Rapide

Si vous voulez une solution immédiate sans rebuild :

```bash
cd /var/www/alliance-courtage && \
git pull origin main && \
docker cp backend/routes/notifications.js alliance-courtage-backend:/app/routes/notifications.js && \
docker restart alliance-courtage-backend && \
sleep 5 && \
docker logs alliance-courtage-backend --tail 20 && \
echo "✅ Fichier copié et backend redémarré!"
```

Cette solution copie directement le fichier dans le conteneur sans rebuild, ce qui est plus rapide mais nécessite un redémarrage du conteneur.

