# 🔄 Redéploiement Sans npm Local - Solution Docker

## ✅ Solution 1 : Utiliser `docker compose` (Version Moderne)

```bash
cd /var/www/alliance-courtage

# Rebuild et redémarrer
docker compose down
docker compose build --no-cache
docker compose up -d

# Vérifier
docker ps
```

## ✅ Solution 2 : Builder le Frontend dans un Conteneur Temporaire

```bash
cd /var/www/alliance-courtage

# Créer un conteneur Node.js temporaire pour builder
docker run --rm -v $(pwd):/app -w /app node:18 npm install
docker run --rm -v $(pwd):/app -w /app node:18 npm run build

# Ensuite rebuild le conteneur frontend
docker compose build alliance-courtage-extranet
docker compose up -d alliance-courtage-extranet
```

## ✅ Solution 3 : Rebuild Tous les Conteneurs (Recommandé)

```bash
cd /var/www/alliance-courtage

# Vérifier si docker compose existe
docker compose version

# Si oui, utiliser :
docker compose down
docker compose build --no-cache
docker compose up -d

# Si docker compose n'existe pas, utiliser docker directement
docker stop alliance-courtage-backend alliance-courtage-extranet alliance-courtage-mysql
docker rm alliance-courtage-backend alliance-courtage-extranet

# Rebuild les images
docker build -t alliance-courtage-frontend:latest .
docker build -t backend-backend ./backend

# Redémarrer
docker-compose up -d
# ou si vous avez un script de démarrage
```

## ✅ Solution 4 : Utiliser le Dockerfile (Si le Frontend est Buildé dans l'Image)

```bash
cd /var/www/alliance-courtage

# Vérifier le Dockerfile
cat Dockerfile

# Rebuild l'image frontend
docker build -t alliance-courtage-frontend:latest .

# Redémarrer le conteneur
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet
docker run -d --name alliance-courtage-extranet -p 80:80 alliance-courtage-frontend:latest
```

---

## 🔍 Vérifier la Configuration

```bash
# Voir docker-compose.yml
cat docker-compose.yml

# Voir comment le frontend est configuré
cat docker-compose.yml | grep -A 15 "extranet\|frontend"

# Voir le Dockerfile
cat Dockerfile
```

---

## 🚀 Solution Rapide (Essayez dans cet ordre)

### Essai 1 : docker compose (sans tiret)
```bash
docker compose build --no-cache
docker compose up -d
```

### Essai 2 : Vérifier docker-compose.yml et rebuild manuellement
```bash
cat docker-compose.yml
docker-compose build --no-cache
docker-compose up -d
```

### Essai 3 : Rebuild les images individuellement
```bash
docker build -t alliance-courtage-frontend:latest .
docker restart alliance-courtage-extranet
```

---

**Exécutez d'abord la Solution 1 (docker compose sans tiret) ! 🚀**


