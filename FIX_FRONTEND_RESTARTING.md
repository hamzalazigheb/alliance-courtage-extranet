# 🔧 Fix : Conteneur Frontend en Redémarrage Continu

## Problème

Le conteneur `alliance-courtage-extranet` est en état `Restarting (1)`, ce qui signifie qu'il redémarre en boucle à cause d'une erreur.

## Diagnostic

### Étape 1 : Vérifier les logs

```bash
# Voir les logs du conteneur
docker logs alliance-courtage-extranet --tail 50

# Voir les logs en temps réel
docker logs -f alliance-courtage-extranet
```

### Étape 2 : Vérifier la configuration nginx

```bash
# Tester la configuration nginx dans le conteneur
docker exec alliance-courtage-extranet nginx -t
```

### Étape 3 : Vérifier les fichiers dans le conteneur

```bash
# Vérifier que les fichiers sont présents
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/

# Vérifier la configuration nginx
docker exec alliance-courtage-extranet cat /etc/nginx/conf.d/default.conf
```

## Solutions

### Solution 1 : Restaurer la configuration nginx originale

Si la configuration nginx est corrompue :

```bash
# Arrêter le conteneur
docker stop alliance-courtage-extranet

# Vérifier l'image originale
docker inspect alliance-courtage-frontend:latest

# Redémarrer avec la configuration par défaut
docker start alliance-courtage-extranet
```

### Solution 2 : Vérifier et corriger la configuration

```bash
# Entrer dans le conteneur (si possible)
docker exec -it alliance-courtage-extranet sh

# Vérifier la configuration
nginx -t

# Si erreur, corriger
exit
```

### Solution 3 : Recréer le conteneur

```bash
# Arrêter et supprimer le conteneur
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# Recréer le conteneur (selon votre docker-compose ou commande originale)
# Exemple :
docker run -d \
  --name alliance-courtage-extranet \
  -p 80:80 \
  -v $(pwd)/dist:/usr/share/nginx/html:ro \
  alliance-courtage-frontend:latest
```

### Solution 4 : Vérifier les volumes

```bash
# Voir les volumes montés
docker inspect alliance-courtage-extranet | grep -A 10 Mounts

# Vérifier que le volume dist/ existe et contient des fichiers
ls -la ~/alliance/alliance/dist/
```

## Solution Rapide

```bash
# 1. Arrêter le conteneur
docker stop alliance-courtage-extranet

# 2. Vérifier les logs pour identifier l'erreur
docker logs alliance-courtage-extranet --tail 100

# 3. Si c'est un problème de configuration nginx, restaurer
docker cp nginx-production.conf alliance-courtage-extranet:/etc/nginx/conf.d/default.conf

# 4. Tester la configuration
docker exec alliance-courtage-extranet nginx -t

# 5. Redémarrer
docker start alliance-courtage-extranet

# 6. Vérifier
docker ps | grep alliance-courtage-extranet
```

## Erreurs Communes

### Erreur : "nginx: [emerg] open() /etc/nginx/conf.d/default.conf failed"

**Solution** : Le fichier de configuration n'existe pas ou est corrompu.

```bash
# Vérifier que le fichier existe
docker exec alliance-courtage-extranet ls -la /etc/nginx/conf.d/

# Copier la configuration
docker cp nginx-production.conf alliance-courtage-extranet:/etc/nginx/conf.d/default.conf
```

### Erreur : "nginx: [emerg] bind() to 0.0.0.0:80 failed"

**Solution** : Le port 80 est déjà utilisé.

```bash
# Vérifier ce qui utilise le port 80
sudo netstat -tulpn | grep :80

# Arrêter le processus ou changer le port
```

### Erreur : "index.html not found"

**Solution** : Les fichiers du frontend ne sont pas dans le conteneur.

```bash
# Vérifier
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/

# Si vide, copier les fichiers
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/
```

## Commandes de Diagnostic Complètes

```bash
# 1. Voir l'état du conteneur
docker ps -a | grep alliance-courtage-extranet

# 2. Voir les logs
docker logs alliance-courtage-extranet --tail 100

# 3. Voir la configuration
docker inspect alliance-courtage-extranet

# 4. Vérifier les fichiers
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/
docker exec alliance-courtage-extranet ls -la /etc/nginx/conf.d/

# 5. Tester nginx
docker exec alliance-courtage-extranet nginx -t
```

---

**Note** : Après avoir corrigé le problème, vérifiez que le conteneur fonctionne avec `docker ps` et que le site est accessible.
