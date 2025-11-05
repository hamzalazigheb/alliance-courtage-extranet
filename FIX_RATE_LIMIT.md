# 🔧 Solution : Erreur 429 Too Many Requests

## ❌ Problème

```
POST http://13.38.115.36/api/auth/login 429 (Too Many Requests)
```

Le rate limiting bloque trop de tentatives de connexion.

## ✅ Solutions

### Solution 1 : Vérifier le Rate Limiting dans le Backend

```bash
# Voir la configuration du rate limiting dans server.js
docker exec alliance-courtage-backend cat /app/server.js | grep -A 10 rateLimit
```

### Solution 2 : Désactiver Temporairement le Rate Limiting

```bash
# Entrer dans le conteneur backend
docker exec -it alliance-courtage-backend sh

# Voir la configuration
cat /app/server.js | grep -A 10 rateLimit

# OU modifier temporairement (si vous avez accès en écriture)
# Augmenter la limite ou désactiver
```

### Solution 3 : Redémarrer le Backend (Réinitialise le Compteur)

```bash
# Redémarrer le conteneur backend pour réinitialiser le rate limit
docker restart alliance-courtage-backend

# Vérifier les logs
docker logs alliance-courtage-backend --tail 20
```

### Solution 4 : Vérifier le Rate Limiting dans Nginx (si configuré)

```bash
# Voir la configuration nginx
docker exec alliance-courtage-extranet cat /etc/nginx/conf.d/default.conf | grep -i limit

# OU voir nginx.conf sur le serveur
cat nginx.conf | grep -i limit
```

### Solution 5 : Attendre Quelques Minutes

Le rate limit se réinitialise généralement après quelques minutes (15 minutes par défaut).

---

## 🔍 Diagnostic

```bash
# Voir les logs du backend
docker logs alliance-courtage-backend --tail 50 | grep -i "rate\|limit\|429"

# Voir la configuration complète
docker exec alliance-courtage-backend cat /app/server.js | grep -B 5 -A 15 rateLimit
```

---

## 🚀 Solution Rapide

### Option A : Redémarrer le Backend

```bash
docker restart alliance-courtage-backend
sleep 5
docker logs alliance-courtage-backend --tail 20
```

### Option B : Modifier le Rate Limit (Si Possible)

Il faut modifier `backend/server.js` et rebuild, ou modifier directement dans le conteneur si monté en volume.

---

## 📋 Configuration Actuelle du Rate Limit

Dans `backend/server.js`, le rate limit est probablement configuré comme :

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // 100 requêtes par fenêtre
});
```

Pour le développement ou après reset, vous pouvez :
- Augmenter `max` à 10000
- Ou désactiver en mode développement
- Ou réduire `windowMs`

---

**Exécutez d'abord la Solution 3 (Redémarrer le Backend) ! 🚀**


