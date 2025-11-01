# 🔧 Correction Erreur Docker Build (ETXTBSY)

## ⚡ Solution Rapide

L'erreur `ETXTBSY` avec esbuild est souvent causée par le cache Docker. Voici comment corriger :

### Option 1 : Nettoyer et Rebuilder (Recommandé)

Dans Termius, exécutez :

```bash
cd ~/alliance/backend

# Nettoyer le cache Docker
docker builder prune -f

# Supprimer les images existantes
docker compose down
docker rmi $(docker images -q "alliance-courtage*" 2>/dev/null) 2>/dev/null || true

# Rebuilder sans cache
docker compose build --no-cache

# Redémarrer
docker compose up -d
```

### Option 2 : Utiliser la Version Corrigée du Dockerfile

Le Dockerfile a été mis à jour pour utiliser `npm ci` au lieu de `npm install`. 

```bash
cd ~/alliance
git pull origin main

cd backend
docker compose build --no-cache
docker compose up -d
```

### Option 3 : Solution Alternative (si ça persiste)

```bash
cd ~/alliance/backend

# Arrêter tout
docker compose down

# Supprimer tous les volumes et images
docker system prune -a --volumes -f

# Rebuilder
docker compose build --no-cache --pull

# Démarrer
docker compose up -d
```

---

## 🔍 Vérification

Après le rebuild :

```bash
# Vérifier que le build a réussi
docker images | grep alliance-courtage-backend

# Vérifier les containers
docker compose ps

# Voir les logs si problème
docker compose logs backend
```

---

## 📝 Note sur l'Erreur

L'erreur `ETXTBSY` (Text file busy) avec esbuild survient quand :
- Le cache Docker est corrompu
- Un binaire est en cours d'utilisation pendant le build
- Conflit de fichiersystem dans Docker

La solution est généralement de nettoyer le cache et rebuilder.

---

**💡 Après correction, relancez :**
```bash
cd ~/alliance
./deploy.sh
```

