# 🚀 Déploiement Rapide - Fix Cache Error

## Problème résolu

- ✅ Gestion des erreurs `ERR_CACHE_WRITE_FAILURE`
- ✅ Gestion des réponses `304 (Not Modified)`
- ✅ Retry automatique en cas d'erreur réseau
- ✅ Headers anti-cache dans nginx
- ✅ Désactivation du cache proxy

## Déploiement sur le serveur

### Étape 1 : Pull des modifications

```bash
cd ~/alliance/alliance
git stash  # Si vous avez des changements locaux
git pull origin main
```

### Étape 2 : Mettre à jour nginx

```bash
# Copier la nouvelle configuration
sudo cp nginx-production.conf /etc/nginx/sites-available/alliance-courtage
# ou selon votre configuration
sudo cp nginx-production.conf /etc/nginx/conf.d/alliance-courtage.conf

# Tester la configuration
sudo nginx -t

# Recharger nginx
sudo systemctl reload nginx
# ou
sudo systemctl restart nginx
```

### Étape 3 : Rebuild du frontend

```bash
cd ~/alliance/alliance

# Rebuild
npm run build

# Si vous utilisez un serveur statique, copier les fichiers
# Sinon, nginx servira automatiquement depuis le dossier dist/
```

### Étape 4 : Redémarrer le backend

```bash
docker-compose restart backend
# ou
docker restart alliance-courtage-backend
```

### Étape 5 : Vérifier

```bash
# Vérifier nginx
sudo systemctl status nginx

# Vérifier le backend
docker ps | grep backend

# Tester l'API
curl -H "Cache-Control: no-cache" http://localhost/api/archives
```

## Pour les utilisateurs

**Vider le cache du navigateur :**
- **Chrome/Edge** : Ctrl+Shift+R (Windows) ou Cmd+Shift+R (Mac)
- **Firefox** : Ctrl+F5 ou Ctrl+Shift+R
- **Safari** : Cmd+Option+E puis Cmd+R

**Ou via les DevTools :**
1. Ouvrir les DevTools (F12)
2. Clic droit sur le bouton de rafraîchissement
3. Sélectionner "Vider le cache et effectuer une actualisation forcée"

## Commandes complètes (Copier-Coller)

```bash
# Sur le serveur
cd ~/alliance/alliance
git stash
git pull origin main
sudo cp nginx-production.conf /etc/nginx/sites-available/alliance-courtage
sudo nginx -t && sudo systemctl reload nginx
npm run build
docker-compose restart backend
```

## Vérification finale

1. **Tester l'API** : `curl http://localhost/api/archives`
2. **Vérifier les logs** : `docker logs alliance-courtage-backend --tail 20`
3. **Tester dans le navigateur** : Ouvrir la console (F12) et vérifier qu'il n'y a plus d'erreurs

---

**Note :** Après le déploiement, demandez aux utilisateurs de vider leur cache (Ctrl+Shift+R)

