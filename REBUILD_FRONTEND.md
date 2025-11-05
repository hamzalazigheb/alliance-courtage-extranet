# Commandes pour rebuild le frontend

## Option 1 : Build direct avec Docker (RECOMMANDÉ)

```bash
cd /var/www/alliance-courtage

# Build l'image frontend
docker build -t alliance-courtage-frontend:latest -f Dockerfile .

# Redémarrer le conteneur frontend
docker restart alliance-courtage-extranet

# Vérifier que le conteneur démarre correctement
docker logs alliance-courtage-extranet --tail 30
```

## Option 2 : Si vous avez un docker-compose.yml à la racine

```bash
cd /var/www/alliance-courtage

# Chercher le docker-compose.yml
ls -la docker-compose.yml

# Si trouvé, utiliser docker compose
docker compose build --no-cache frontend
docker compose up -d frontend
```

## Option 3 : Vérifier comment le frontend est configuré

```bash
cd /var/www/alliance-courtage

# Voir le Dockerfile frontend
cat Dockerfile

# Voir comment le conteneur est configuré
docker inspect alliance-courtage-extranet | grep -A 10 "Image\|Config"

# Voir le répertoire de travail du conteneur
docker exec alliance-courtage-extranet pwd
```

## Vérification après rebuild

```bash
# Vérifier que l'image a été rebuild
docker images | grep alliance-courtage-frontend

# Vérifier que le conteneur fonctionne
docker ps | grep alliance-courtage-extranet

# Vérifier les logs
docker logs alliance-courtage-extranet --tail 50
```

