# 🔧 Déploiement sur Serveur - Commandes Corrigées

## Problèmes rencontrés

1. ❌ nginx n'est pas dans `/etc/nginx/sites-available/`
2. ❌ nginx command not found (probablement dans Docker)
3. ❌ npm not found (probablement dans Docker)
4. ❌ docker-compose not found

## Solution : Vérifier l'environnement Docker

### Étape 1 : Vérifier les conteneurs Docker

```bash
# Vérifier les conteneurs en cours
docker ps

# Vérifier tous les conteneurs (y compris arrêtés)
docker ps -a

# Vérifier les images
docker images
```

### Étape 2 : Trouver nginx

```bash
# Si nginx est dans Docker
docker ps | grep nginx

# Vérifier la configuration nginx actuelle
docker exec <container-nginx> cat /etc/nginx/nginx.conf
# ou
docker exec <container-nginx> ls -la /etc/nginx/
```

### Étape 3 : Mettre à jour nginx (si dans Docker)

```bash
# Option A : Si nginx est un conteneur séparé
docker cp nginx-production.conf <container-nginx>:/etc/nginx/conf.d/default.conf
docker restart <container-nginx>

# Option B : Si nginx est monté via volume
# Trouver le volume
docker inspect <container-nginx> | grep -A 10 Mounts
# Puis copier le fichier dans le volume
```

### Étape 4 : Rebuild du frontend

**Option A : Si vous avez npm localement**

```bash
# Installer npm si nécessaire (mais pas recommandé sur serveur)
# Mieux : utiliser Docker

# Ou build depuis votre machine locale et copier
```

**Option B : Utiliser Docker pour build (Recommandé)**

```bash
# Si vous avez un Dockerfile pour le frontend
docker build -t alliance-frontend .
docker run --rm -v $(pwd)/dist:/app/dist alliance-frontend npm run build

# Ou si vous avez docker-compose
docker-compose run --rm frontend npm run build
```

**Option C : Build depuis votre machine locale**

```bash
# Sur votre machine locale (Windows)
npm run build

# Puis copier dist/ vers le serveur
scp -r dist/ ubuntu@13.38.115.36:~/alliance/alliance/
```

### Étape 5 : Redémarrer les services

```bash
# Si vous utilisez docker-compose
cd ~/alliance/alliance
docker-compose restart

# Ou redémarrer individuellement
docker restart <container-backend>
docker restart <container-nginx>  # si nginx est dans Docker
docker restart <container-frontend>  # si frontend est dans Docker

# Si vous utilisez docker directement
docker restart alliance-courtage-backend
```

---

## Commandes Adaptées selon votre Configuration

### Si nginx est dans Docker

```bash
cd ~/alliance/alliance

# 1. Trouver le conteneur nginx
NGINX_CONTAINER=$(docker ps --format "{{.Names}}" | grep -i nginx | head -1)
echo "Nginx container: $NGINX_CONTAINER"

# 2. Copier la configuration
docker cp nginx-production.conf $NGINX_CONTAINER:/etc/nginx/conf.d/default.conf

# 3. Tester la configuration
docker exec $NGINX_CONTAINER nginx -t

# 4. Recharger nginx
docker exec $NGINX_CONTAINER nginx -s reload
# ou
docker restart $NGINX_CONTAINER
```

### Si nginx est sur l'hôte (mais pas trouvé)

```bash
# Trouver nginx
which nginx
# ou
whereis nginx

# Si nginx est installé mais pas dans PATH
/usr/sbin/nginx -t
/usr/sbin/nginx -s reload

# Trouver le fichier de config
find /etc -name "*nginx*" -type f 2>/dev/null
find /usr -name "*nginx*" -type f 2>/dev/null
```

### Si vous utilisez docker-compose

```bash
# Vérifier si docker-compose est disponible
docker compose version  # Nouvelle syntaxe
# ou
docker-compose version  # Ancienne syntaxe

# Si docker-compose n'est pas trouvé, utiliser la nouvelle syntaxe
cd ~/alliance/alliance
docker compose restart
```

---

## Solution Rapide (Diagnostic)

```bash
# 1. Voir tous les conteneurs
docker ps -a

# 2. Voir la structure du projet
cd ~/alliance/alliance
ls -la
cat docker-compose.yml  # si existe
cat Dockerfile  # si existe

# 3. Voir comment nginx est configuré
docker ps | grep nginx
docker inspect $(docker ps -q --filter "name=nginx") | grep -A 20 Mounts

# 4. Voir comment le frontend est servi
ls -la dist/  # si existe
ls -la build/  # si existe
```

---

## Solution Alternative : Mise à jour manuelle

### 1. Mettre à jour nginx dans Docker

```bash
# Trouver le conteneur nginx
docker ps --format "table {{.Names}}\t{{.Image}}" | grep -i nginx

# Si vous trouvez un conteneur, par exemple "alliance-nginx"
docker cp nginx-production.conf alliance-nginx:/etc/nginx/conf.d/default.conf
docker exec alliance-nginx nginx -t
docker exec alliance-nginx nginx -s reload
```

### 2. Rebuild frontend (si nécessaire)

```bash
# Si le frontend est dans un conteneur
docker exec <container-frontend> npm run build

# Ou build depuis votre machine et copier
# (depuis votre machine Windows)
npm run build
scp -r dist/* ubuntu@13.38.115.36:~/alliance/alliance/dist/
```

### 3. Redémarrer backend

```bash
# Trouver le conteneur backend
docker ps --format "table {{.Names}}\t{{.Image}}" | grep -i backend

# Redémarrer
docker restart <container-backend>
# ou
docker restart alliance-courtage-backend
```

---

## Commandes de Diagnostic

```bash
# Voir tous les conteneurs
docker ps -a

# Voir les volumes
docker volume ls

# Voir les réseaux
docker network ls

# Voir la configuration docker-compose (si existe)
cat docker-compose.yml

# Voir les logs
docker logs <container-name> --tail 50
```

---

## Solution Recommandée

1. **Identifier votre configuration** : Docker ou hôte ?
2. **Adapter les commandes** selon votre setup
3. **Tester étape par étape**

Envoyez-moi la sortie de `docker ps` et je vous donnerai les commandes exactes pour votre configuration.

