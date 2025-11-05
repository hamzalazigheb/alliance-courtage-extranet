# 🔧 Solution Définitive : Rate Limit 429

## ❌ Problème

```
POST http://13.38.115.36/api/auth/login 429 (Too Many Requests)
```

Le rate limiting bloque trop de tentatives de connexion.

## ✅ Solutions

### Solution 1 : Redémarrer le Backend (Réinitialise le Compteur)

```bash
# Redémarrer le backend
docker restart alliance-courtage-backend

# Attendre quelques secondes
sleep 5

# Vérifier les logs
docker logs alliance-courtage-backend --tail 20
```

### Solution 2 : Augmenter Temporairement la Limite

Si vous voulez augmenter la limite pour le client, modifiez `backend/server.js` :

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500 // Augmenter de 100 à 500
});
```

Puis rebuild et redéployer.

### Solution 3 : Désactiver le Rate Limit pour /api/auth/login

Modifiez `backend/server.js` pour exclure les routes d'authentification :

```javascript
// Rate limiting pour toutes les routes SAUF /api/auth
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => {
    // Ne pas appliquer le rate limit sur les routes d'authentification
    return req.path.startsWith('/api/auth') || req.path.startsWith('/api/admin-password-reset');
  }
});
```

---

## 🚀 Solution Immédiate (Pour Débloquer Maintenant)

```bash
# Redémarrer le backend
docker restart alliance-courtage-backend

# Attendre 10 secondes
sleep 10

# Vérifier
docker logs alliance-courtage-backend --tail 10
curl http://localhost:3001/api/health
```

---

## ⏱️ Alternative : Attendre 15 Minutes

Le rate limit se réinitialise automatiquement après 15 minutes.

---

**Exécutez la Solution Immédiate pour débloquer maintenant ! 🚀**


