# 🔧 Guide de Débogage - Route /api/notifications/broadcast 404

## Problème
La route `POST /api/notifications/broadcast` retourne 404 même après rebuild.

## Vérifications à faire sur le serveur

### 1. Vérifier que le code est à jour

```bash
cd /var/www/alliance-courtage

# Pull les dernières modifications
git pull origin main

# Vérifier que la route existe dans le fichier
grep -n "router.post('/broadcast'" backend/routes/notifications.js
```

### 2. Vérifier que le fichier est dans le conteneur Docker

```bash
# Vérifier que le fichier existe dans le conteneur
docker exec alliance-courtage-backend cat /app/routes/notifications.js | grep -n "broadcast"

# Si la commande ci-dessus ne trouve rien, le fichier n'est pas dans le conteneur
```

### 3. Vérifier les logs du backend pour des erreurs de syntaxe

```bash
# Voir les logs complets du backend
docker logs alliance-courtage-backend --tail 100

# Chercher des erreurs spécifiques
docker logs alliance-courtage-backend 2>&1 | grep -i "error\|notifications\|broadcast\|syntax"
```

### 4. Vérifier que le serveur démarre correctement

```bash
# Tester que le backend répond
curl http://localhost:3001/api/health

# Vérifier que la route notifications de base fonctionne
curl http://localhost:3001/api/notifications -H "x-auth-token: YOUR_TOKEN"
```

### 5. Rebuild complet du backend

```bash
cd /var/www/alliance-courtage/backend

# Arrêter le conteneur
docker stop alliance-courtage-backend

# Rebuild l'image sans cache
docker compose build --no-cache backend

# Redémarrer le conteneur
docker start alliance-courtage-backend

# Attendre 10 secondes
sleep 10

# Vérifier les logs
docker logs alliance-courtage-backend --tail 50
```

### 6. Si le fichier n'est pas dans le conteneur, le copier manuellement

```bash
cd /var/www/alliance-courtage

# Copier le fichier dans le conteneur
docker cp backend/routes/notifications.js alliance-courtage-backend:/app/routes/notifications.js

# Redémarrer le backend
docker restart alliance-courtage-backend

# Vérifier les logs
docker logs alliance-courtage-backend --tail 30
```

### 7. Vérifier la syntaxe du fichier JavaScript

```bash
# Vérifier qu'il n'y a pas d'erreur de syntaxe dans le fichier
docker exec alliance-courtage-backend node -c /app/routes/notifications.js

# Si cette commande retourne une erreur, il y a un problème de syntaxe
```

## Solution Complète (à exécuter dans l'ordre)

```bash
cd /var/www/alliance-courtage && \
git pull origin main && \
cd backend && \
docker stop alliance-courtage-backend && \
docker compose build --no-cache backend && \
docker start alliance-courtage-backend && \
sleep 10 && \
docker logs alliance-courtage-backend --tail 50 && \
echo "✅ Backend rebuild complété!"
```

## Test après déploiement

```bash
# Tester avec curl (remplacer YOUR_TOKEN par un token admin valide)
curl -X POST \
  -H "x-auth-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","message":"Test message","type":"info"}' \
  http://localhost:3001/api/notifications/broadcast
```

## Si le problème persiste

1. Vérifier que le fichier `notifications.js` est bien exporté :
```bash
docker exec alliance-courtage-backend cat /app/routes/notifications.js | tail -5
# Devrait contenir: module.exports = router;
```

2. Vérifier que le fichier est bien chargé dans server.js :
```bash
docker exec alliance-courtage-backend cat /app/server.js | grep notifications
```

3. Vérifier qu'il n'y a pas d'erreur de syntaxe qui empêche le chargement :
```bash
docker logs alliance-courtage-backend 2>&1 | grep -i "cannot\|error\|failed\|syntax"
```

