# 🔧 Solution : Problème de Réseau Docker

## ❌ Problème

```
host not found in upstream "alliance-courtage-backend"
```

Le conteneur frontend n'est pas sur le même réseau que le backend.

## ✅ Solution : Recréer avec le Bon Réseau

### Étape 1 : Vérifier le Réseau

```bash
# Voir les réseaux Docker
docker network ls

# Voir sur quel réseau est le backend
docker inspect alliance-courtage-backend | grep -A 10 NetworkSettings

# Voir le nom du réseau
docker inspect alliance-courtage-backend | grep NetworkMode
```

### Étape 2 : Recréer le Conteneur avec le Bon Réseau

```bash
# Arrêter et supprimer le conteneur actuel
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# Trouver le nom du réseau (probablement alliance-courtage_default ou alliance-courtage-default)
NETWORK_NAME=$(docker inspect alliance-courtage-backend | grep -oP '(?<="NetworkMode": ")[^"]+' | head -1)
echo "Network: $NETWORK_NAME"

# OU vérifier manuellement
docker network ls | grep alliance

# Recréer avec le réseau
docker run -d \
  --name alliance-courtage-extranet \
  --network alliance-courtage_default \
  -p 80:80 \
  alliance-courtage-frontend:latest
```

### Solution Alternative : Utiliser le Réseau du Backend

```bash
# Arrêter et supprimer
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# Voir le réseau du backend
docker inspect alliance-courtage-backend | grep -A 5 Networks

# Recréer avec le même réseau (remplacer NETWORK_NAME par le vrai nom)
docker run -d \
  --name alliance-courtage-extranet \
  --network alliance-courtage_default \
  -p 80:80 \
  alliance-courtage-frontend:latest
```

---

## 🚀 Solution Complète

```bash
# 1. Arrêter et supprimer
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet

# 2. Trouver le réseau
docker network ls

# 3. Voir le réseau du backend
docker inspect alliance-courtage-backend | grep -A 10 Networks

# 4. Recréer avec le réseau (remplacer par le vrai nom de réseau)
docker run -d \
  --name alliance-courtage-extranet \
  --network alliance-courtage_default \
  -p 80:80 \
  alliance-courtage-frontend:latest

# 5. Vérifier
docker ps
docker logs alliance-courtage-extranet --tail 20
```

---

## 🔍 Si le Réseau n'Existe Pas

```bash
# Créer le réseau
docker network create alliance-courtage_default

# Connecter le backend au réseau (si nécessaire)
docker network connect alliance-courtage_default alliance-courtage-backend

# Créer le frontend
docker run -d \
  --name alliance-courtage-extranet \
  --network alliance-courtage_default \
  -p 80:80 \
  alliance-courtage-frontend:latest
```

---

**Exécutez la Solution Complète ! 🚀**


