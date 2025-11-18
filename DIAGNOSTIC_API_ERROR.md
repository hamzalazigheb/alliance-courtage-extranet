# 🔍 Diagnostic des Erreurs API

## Problème

Erreurs API sans détails dans la console :
```
API Error: 
Erreur lors du chargement des fichiers: 
```

## Améliorations Apportées

✅ **Gestion d'erreurs améliorée** dans `src/api.js` :
- Affichage détaillé des erreurs dans la console
- Gestion des erreurs de parsing JSON
- Messages d'erreur plus clairs
- Retry automatique avec meilleure gestion

✅ **Messages d'erreur améliorés** dans `FileManagementPage.tsx` :
- Affichage du message d'erreur complet
- Détails dans la console pour le débogage

## Diagnostic

### Étape 1 : Vérifier la Console du Navigateur

Ouvrez la console (F12) et regardez les erreurs détaillées. Vous devriez maintenant voir :
- L'URL complète de la requête
- Le code de statut HTTP
- Le message d'erreur détaillé
- La configuration de la requête

### Étape 2 : Vérifier le Backend

```bash
# Sur le serveur
docker logs alliance-courtage-backend --tail 50

# Tester l'API directement
curl http://localhost:3001/api/archives
```

### Étape 3 : Vérifier nginx

```bash
# Vérifier que nginx fonctionne
docker ps | grep alliance-courtage-extranet

# Vérifier les logs nginx
docker logs alliance-courtage-extranet --tail 50

# Tester le proxy
curl http://localhost/api/archives
```

### Étape 4 : Vérifier la Connexion Backend-Frontend

Dans la console du navigateur, testez :

```javascript
// Tester l'API directement
fetch('/api/archives', {
  headers: {
    'x-auth-token': localStorage.getItem('token'),
    'Cache-Control': 'no-cache'
  },
  cache: 'no-store'
})
.then(r => {
  console.log('Status:', r.status);
  console.log('Headers:', [...r.headers.entries()]);
  return r.text();
})
.then(text => {
  console.log('Response:', text);
  try {
    const json = JSON.parse(text);
    console.log('Parsed JSON:', json);
  } catch (e) {
    console.error('Not JSON:', e);
  }
})
.catch(err => {
  console.error('Fetch error:', err);
});
```

## Causes Possibles

### 1. Backend non accessible

**Symptômes** : `Failed to fetch` ou `NetworkError`

**Solution** :
```bash
# Vérifier que le backend fonctionne
docker ps | grep backend
docker logs alliance-courtage-backend --tail 20
```

### 2. Problème de proxy nginx

**Symptômes** : Erreur 502, 503, ou timeout

**Solution** :
```bash
# Vérifier la configuration nginx
docker exec alliance-courtage-extranet cat /etc/nginx/conf.d/default.conf | grep -A 10 "location /api"

# Tester le proxy
curl -v http://localhost/api/archives
```

### 3. Problème de CORS

**Symptômes** : Erreur CORS dans la console

**Solution** : Vérifier les headers CORS dans le backend

### 4. Token d'authentification invalide

**Symptômes** : Erreur 401 Unauthorized

**Solution** :
```javascript
// Dans la console du navigateur
localStorage.getItem('token')
// Si null, se reconnecter
```

### 5. Réponse non-JSON

**Symptômes** : Erreur de parsing JSON

**Solution** : Vérifier que le backend retourne du JSON valide

## Commandes de Diagnostic Complètes

```bash
# 1. État des conteneurs
docker ps

# 2. Logs backend
docker logs alliance-courtage-backend --tail 50 | grep -i error

# 3. Logs nginx
docker logs alliance-courtage-extranet --tail 50

# 4. Test API directe
curl -H "x-auth-token: VOTRE_TOKEN" http://localhost:3001/api/archives

# 5. Test via nginx
curl http://localhost/api/archives

# 6. Vérifier la configuration nginx
docker exec alliance-courtage-extranet nginx -t
docker exec alliance-courtage-extranet cat /etc/nginx/conf.d/default.conf
```

## Après le Déploiement

1. **Rebuild le frontend** : `npm run build`
2. **Copier vers le serveur** : Utilisez WinSCP ou FileZilla
3. **Copier dans le conteneur** : `docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/`
4. **Vider le cache** : `Ctrl+Shift+R` dans le navigateur
5. **Vérifier la console** : Les erreurs devraient maintenant être détaillées

---

**Note** : Avec les améliorations, les erreurs dans la console devraient maintenant afficher beaucoup plus de détails pour faciliter le diagnostic.

