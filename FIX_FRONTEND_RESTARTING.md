# 🔧 Résolution du Problème Frontend qui Redémarre en Boucle

## 🔍 Diagnostic

Le conteneur `alliance-courtage-extranet` est en état `Restarting (1)`, ce qui indique qu'il crash au démarrage.

## 📋 Commandes de Diagnostic

### 1. Vérifier les logs du frontend

```bash
docker logs alliance-courtage-extranet --tail 50
```

### 2. Vérifier les logs en temps réel

```bash
docker logs -f alliance-courtage-extranet
```

### 3. Vérifier la configuration du conteneur

```bash
docker inspect alliance-courtage-extranet
```

## 🔧 Solutions Communes

### Solution 1 : Problème de build

Si l'image n'a pas été correctement construite :

```bash
# Arrêter le conteneur
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# Reconstruire l'image frontend
cd ~/alliance/alliance
docker build -t alliance-courtage-frontend:latest --no-cache .

# Redémarrer
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  -p 80:80 \
  alliance-courtage-frontend:latest
```

### Solution 2 : Problème de port déjà utilisé

Si le port 80 est déjà utilisé :

```bash
# Vérifier ce qui utilise le port 80
sudo lsof -i :80
# ou
sudo netstat -tulpn | grep :80

# Si nécessaire, arrêter le service qui utilise le port
# Puis redémarrer le conteneur
```

### Solution 3 : Problème de Dockerfile

Vérifier que le Dockerfile frontend existe et est correct :

```bash
cd ~/alliance/alliance
cat Dockerfile
```

### Solution 4 : Vérifier les variables d'environnement

Si le frontend nécessite des variables d'environnement :

```bash
# Vérifier le Dockerfile pour voir quelles variables sont nécessaires
# Puis créer le conteneur avec les variables appropriées
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  -p 80:80 \
  -e API_URL=http://localhost:3001 \
  alliance-courtage-frontend:latest
```

## 🚀 Solution Rapide

```bash
# 1. Arrêter et supprimer le conteneur
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# 2. Vérifier les logs pour identifier l'erreur
# (avant de recréer, regardez les logs précédents)

# 3. Reconstruire et redémarrer
cd ~/alliance/alliance
docker build -t alliance-courtage-frontend:latest .
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  -p 80:80 \
  alliance-courtage-frontend:latest

# 4. Vérifier les logs immédiatement
docker logs -f alliance-courtage-extranet
```

## 📝 Erreurs Communes

### Erreur : "Cannot find module"
- **Cause** : Dépendances npm non installées
- **Solution** : Vérifier que `npm install` est exécuté dans le Dockerfile

### Erreur : "Port already in use"
- **Cause** : Un autre service utilise le port 80
- **Solution** : Arrêter le service ou changer le port

### Erreur : "ENOENT: no such file or directory"
- **Cause** : Fichiers manquants dans l'image
- **Solution** : Vérifier que tous les fichiers sont copiés dans le Dockerfile

### Erreur : "Failed to start server"
- **Cause** : Erreur de configuration
- **Solution** : Vérifier les variables d'environnement et la configuration

## ✅ Vérification

Après avoir appliqué une solution :

```bash
# Vérifier l'état
docker ps | grep alliance-courtage-extranet

# Devrait afficher "Up" au lieu de "Restarting"
```


