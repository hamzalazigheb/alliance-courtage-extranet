# 🔧 Solution : Encore Ancienne Version Après Rebuild

## ❌ Problème

Le frontend affiche encore l'ancienne version malgré le rebuild.

## ✅ Solutions

### Solution 1 : Recréer le Conteneur (Pas Juste Restart)

```bash
# Arrêter et supprimer le conteneur frontend
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# Recréer le conteneur avec la nouvelle image
docker run -d \
  --name alliance-courtage-extranet \
  --network alliance-courtage_default \
  -p 80:80 \
  alliance-courtage-frontend:latest

# Vérifier
docker ps
```

### Solution 2 : Vérifier les Volumes Montés

```bash
# Vérifier si des volumes sont montés qui écrasent les fichiers
docker inspect alliance-courtage-extranet | grep -A 10 Mounts

# Si des volumes sont montés, les supprimer ou les mettre à jour
```

### Solution 3 : Vérifier docker-compose.yml et Recréer

```bash
# Voir la configuration
cat docker-compose.yml

# Recréer le conteneur via docker-compose
docker compose down alliance-courtage-extranet
docker compose up -d alliance-courtage-extranet

# OU si vous utilisez docker-compose (avec tiret)
docker-compose down alliance-courtage-extranet
docker-compose up -d alliance-courtage-extranet
```

### Solution 4 : Forcer le Rebuild Sans Cache et Recréer

```bash
# Rebuild sans cache
docker build --no-cache -t alliance-courtage-frontend:latest .

# Arrêter et supprimer
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# Recréer
docker run -d \
  --name alliance-courtage-extranet \
  -p 80:80 \
  alliance-courtage-frontend:latest
```

### Solution 5 : Vérifier le Cache Nginx

```bash
# Entrer dans le conteneur
docker exec -it alliance-courtage-extranet sh

# Vérifier les fichiers
ls -la /usr/share/nginx/html/

# Vérifier la date des fichiers
ls -la /usr/share/nginx/html/ | head -20

# Sortir
exit
```

### Solution 6 : Vérifier le Réseau Docker

```bash
# Voir le réseau
docker network ls

# Voir comment le conteneur est connecté
docker inspect alliance-courtage-extranet | grep -A 10 NetworkSettings
```

---

## 🚀 Solution Complète (Recommandée)

```bash
cd /var/www/alliance-courtage

# 1. Arrêter et supprimer le conteneur
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# 2. Rebuild sans cache
docker build --no-cache -t alliance-courtage-frontend:latest .

# 3. Vérifier docker-compose.yml pour voir la configuration réseau
cat docker-compose.yml | grep -A 10 extranet

# 4. Recréer le conteneur avec la bonne configuration
# Si vous utilisez docker-compose:
docker compose up -d alliance-courtage-extranet

# OU manuellement (ajuster selon votre config):
docker run -d \
  --name alliance-courtage-extranet \
  -p 80:80 \
  alliance-courtage-frontend:latest

# 5. Vérifier
docker ps
docker logs alliance-courtage-extranet
```

---

## 🔍 Diagnostic

```bash
# Vérifier quelle image est utilisée
docker inspect alliance-courtage-extranet | grep Image

# Vérifier les fichiers dans le conteneur
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/ | head -10

# Vérifier la date de création des fichiers
docker exec alliance-courtage-extranet find /usr/share/nginx/html -type f -exec ls -lh {} \; | head -10
```

---

## 🧹 Nettoyer et Recréer Tout

```bash
cd /var/www/alliance-courtage

# Arrêter tout
docker stop alliance-courtage-extranet alliance-courtage-backend alliance-courtage-mysql

# Supprimer le conteneur frontend
docker rm alliance-courtage-extranet

# Rebuild sans cache
docker build --no-cache -t alliance-courtage-frontend:latest .

# Redémarrer tout
docker start alliance-courtage-mysql
sleep 5
docker start alliance-courtage-backend
docker run -d --name alliance-courtage-extranet -p 80:80 alliance-courtage-frontend:latest

# Vérifier
docker ps
```

---

**Exécutez la Solution Complète d'abord ! 🚀**


