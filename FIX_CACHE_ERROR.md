# 🔧 Fix : Erreur ERR_CACHE_WRITE_FAILURE et Failed to fetch

## Problème

```
GET http://13.38.115.36/api/archives? net::ERR_CACHE_WRITE_FAILURE 304 (Not Modified)
API Error: TypeError: Failed to fetch
```

## Causes possibles

1. **Cache du navigateur** : Le navigateur essaie d'utiliser un cache corrompu
2. **URL absolue au lieu de relative** : L'API utilise l'IP directe au lieu de `/api`
3. **Backend non accessible** : Le backend ne répond pas correctement
4. **Problème de CORS ou de proxy nginx**

## Solutions

### Solution 1 : Vider le cache du navigateur (Client)

**Pour l'utilisateur :**
1. Ouvrir les outils de développement (F12)
2. Clic droit sur le bouton de rafraîchissement
3. Sélectionner "Vider le cache et effectuer une actualisation forcée"
   - Ou : Ctrl+Shift+R (Windows/Linux)
   - Ou : Cmd+Shift+R (Mac)

**Ou via la console :**
```javascript
// Dans la console du navigateur
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### Solution 2 : Vérifier le backend (Serveur)

```bash
# Vérifier que le backend fonctionne
docker ps | grep backend

# Vérifier les logs
docker logs alliance-courtage-backend --tail 50

# Tester l'API directement
curl http://localhost:3001/api/archives

# Redémarrer le backend si nécessaire
docker-compose restart backend
```

### Solution 3 : Vérifier nginx (Serveur)

```bash
# Vérifier la configuration nginx
sudo nginx -t

# Vérifier les logs nginx
sudo tail -f /var/log/nginx/alliance-courtage-error.log

# Redémarrer nginx
sudo systemctl restart nginx
# ou
docker restart nginx
```

### Solution 4 : Vérifier la configuration API

Le code a été mis à jour pour :
- ✅ Utiliser des chemins relatifs (`/api`) au lieu d'URLs absolues
- ✅ Désactiver le cache avec les headers appropriés
- ✅ Gérer les réponses 304 (Not Modified)
- ✅ Retry automatique en cas d'erreur réseau

### Solution 5 : Rebuild du frontend (Serveur)

Si le problème persiste, rebuilder le frontend :

```bash
cd ~/alliance/alliance

# Rebuild
npm run build

# Redémarrer nginx ou copier les fichiers selon votre configuration
```

## Vérification

### Test 1 : API directe

```bash
# Sur le serveur
curl -H "x-auth-token: VOTRE_TOKEN" http://localhost:3001/api/archives
```

### Test 2 : Via nginx

```bash
# Depuis le serveur
curl http://localhost/api/archives
```

### Test 3 : Depuis le navigateur

Ouvrir la console (F12) et tester :
```javascript
fetch('/api/archives', {
  headers: {
    'x-auth-token': localStorage.getItem('token'),
    'Cache-Control': 'no-cache'
  },
  cache: 'no-store'
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

## Prévention

### Headers nginx pour éviter le cache API

Ajouter dans `nginx-production.conf` :

```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    
    # Headers pour éviter le cache
    add_header Cache-Control "no-cache, no-store, must-revalidate" always;
    add_header Pragma "no-cache" always;
    add_header Expires "0" always;
    
    # Headers proxy
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    
    # Cache bypass
    proxy_cache_bypass $http_upgrade;
}
```

Puis redémarrer nginx :
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Commandes de diagnostic

```bash
# 1. Vérifier le backend
docker logs alliance-courtage-backend --tail 100 | grep -i error

# 2. Vérifier nginx
sudo tail -50 /var/log/nginx/alliance-courtage-error.log

# 3. Tester la connectivité
curl -v http://localhost:3001/api/archives

# 4. Vérifier les ports
netstat -tulpn | grep -E '3001|80|443'

# 5. Vérifier les processus
ps aux | grep -E 'node|nginx'
```

## Solution rapide (Copier-Coller)

```bash
# Sur le serveur
cd ~/alliance/alliance

# 1. Redémarrer le backend
docker-compose restart backend

# 2. Vérifier nginx
sudo nginx -t && sudo systemctl reload nginx

# 3. Vérifier les logs
docker logs alliance-courtage-backend --tail 20
```

**Pour l'utilisateur :**
- Vider le cache : Ctrl+Shift+R
- Ou : Ouvrir en navigation privée

---

**Dernière mise à jour :** Décembre 2024

