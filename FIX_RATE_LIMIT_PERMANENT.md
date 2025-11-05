# 🔧 Solution Définitive : Rate Limit 429

## ❌ Problème

Toutes les routes retournent 429 (Too Many Requests) car le rate limit est trop restrictif.

## ✅ Solutions

### Solution 1 : Redémarrer le Backend (Réinitialise le Compteur)

```bash
# Redémarrer le backend
docker restart alliance-courtage-backend

# Attendre 15 secondes
sleep 15

# Vérifier
docker logs alliance-courtage-backend --tail 20
```

### Solution 2 : Augmenter la Limite du Rate Limit (Permanent)

Pour que le client n'ait plus ce problème, modifiez `backend/server.js` :

```javascript
// Rate limiting (disabled in development for testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // Augmenter de 100 à 1000 requêtes par 15 minutes
});
```

Puis rebuild et redéployer.

### Solution 3 : Exclure les Routes d'Authentification du Rate Limit

```javascript
// Rate limiting pour toutes les routes SAUF /api/auth
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skip: (req) => {
    // Ne pas appliquer le rate limit sur les routes d'authentification et notifications
    return req.path.startsWith('/api/auth') || 
           req.path.startsWith('/api/admin-password-reset') ||
           req.path.startsWith('/api/notifications/unread-count');
  }
});
```

---

## 🚀 Solution Immédiate (Pour Débloquer Maintenant)

```bash
# Redémarrer le backend
docker restart alliance-courtage-backend

# Attendre 15 secondes
sleep 15

# Vérifier
docker logs alliance-courtage-backend --tail 10
curl http://localhost:3001/api/health
```

---

## 📝 Solution Permanente (Pour le Client)

1. Modifier `backend/server.js` pour augmenter la limite
2. Push sur GitHub
3. Pull sur le serveur
4. Rebuild le backend
5. Redémarrer

---

**Exécutez d'abord la Solution Immédiate pour débloquer maintenant ! 🚀**


