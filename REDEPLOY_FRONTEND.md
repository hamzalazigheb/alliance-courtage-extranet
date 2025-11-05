# 🔄 Redéploiement Frontend - Solution

## ❌ Problème

L'interface affiche l'ancienne version car :
- Le frontend n'a pas été rebuildé
- Les fichiers frontend dans le conteneur ne sont pas à jour
- Le cache du navigateur peut aussi causer le problème

## ✅ Solution : Rebuild et Redéployer

### Option 1 : Rebuild Docker (Recommandé)

```bash
# Arrêter les conteneurs
docker-compose down
# ou
docker stop alliance-courtage-backend alliance-courtage-extranet alliance-courtage-mysql

# Rebuild les images (surtout le frontend)
docker-compose build --no-cache

# Redémarrer
docker-compose up -d

# Vérifier
docker ps
```

### Option 2 : Rebuild Frontend et Copier dans le Conteneur

```bash
# 1. Build le frontend localement sur le serveur
cd /var/www/alliance-courtage
npm install
npm run build

# 2. Copier les fichiers buildés dans le conteneur frontend
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/

# 3. Redémarrer le conteneur frontend
docker restart alliance-courtage-extranet
```

### Option 3 : Si le Frontend est dans un Volume

```bash
# Vérifier les volumes
docker inspect alliance-courtage-extranet | grep -A 10 Mounts

# Si le frontend est monté depuis le serveur, rebuild localement
cd /var/www/alliance-courtage
npm install
npm run build

# Puis redémarrer
docker restart alliance-courtage-extranet
```

---

## 🔍 Vérifier la Configuration

```bash
# Voir docker-compose.yml
cat docker-compose.yml

# Voir comment le frontend est configuré
cat docker-compose.yml | grep -A 10 frontend
cat docker-compose.yml | grep -A 10 extranet
```

---

## 🚀 Solution Rapide (Recommandée)

```bash
cd /var/www/alliance-courtage

# 1. Arrêter
docker-compose down

# 2. Rebuild (sans cache pour forcer le rebuild)
docker-compose build --no-cache

# 3. Redémarrer
docker-compose up -d

# 4. Vérifier les logs
docker-compose logs -f
```

---

## 🧹 Nettoyer le Cache du Navigateur

Après le redéploiement :
1. Ouvrir le navigateur en mode incognito
2. Ou vider le cache (Ctrl+Shift+Delete)
3. Ou faire un hard refresh (Ctrl+F5)

---

**Exécutez l'Option 1 ou la Solution Rapide ! 🚀**


