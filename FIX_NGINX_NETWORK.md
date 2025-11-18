# 🔧 Fix : Nginx ne peut pas résoudre "alliance-courtage-backend"

## 🔍 Problème

```
nginx: [emerg] host not found in upstream "alliance-courtage-backend" in /etc/nginx/conf.d/default.conf:26
```

Le frontend (Nginx) ne peut pas résoudre le nom du backend car ils ne sont pas sur le même réseau Docker.

## ✅ Solution : Mettre les conteneurs sur le même réseau

### Étape 1 : Trouver le réseau du backend

```bash
# Trouver le réseau utilisé par le backend
docker inspect alliance-courtage-backend --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}'
```

### Étape 2 : Arrêter le frontend

```bash
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet
```

### Étape 3 : Redémarrer le frontend sur le même réseau

```bash
# Option A : Si le backend est sur "alliance-network"
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  --network alliance-network \
  -p 80:80 \
  alliance-courtage-frontend:latest

# Option B : Si le backend est sur un autre réseau (détecter automatiquement)
BACKEND_NETWORK=$(docker inspect alliance-courtage-backend --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  --network "$BACKEND_NETWORK" \
  -p 80:80 \
  alliance-courtage-frontend:latest
```

### Étape 4 : Vérifier

```bash
# Vérifier que les conteneurs sont sur le même réseau
docker network inspect alliance-network | grep -A 5 "Containers"

# Vérifier les logs du frontend
docker logs alliance-courtage-extranet --tail 20
```

## 🔄 Solution Alternative : Modifier Nginx pour utiliser localhost

Si vous ne pouvez pas mettre les conteneurs sur le même réseau, modifiez la configuration Nginx pour utiliser `host.docker.internal:3001` ou l'IP du backend.

### Modifier nginx.conf

```nginx
# Au lieu de :
proxy_pass http://alliance-courtage-backend:3001;

# Utiliser :
proxy_pass http://host.docker.internal:3001;
# OU
proxy_pass http://172.17.0.1:3001;  # IP par défaut de Docker bridge
```

Puis reconstruire l'image frontend.

## ✅ Solution Recommandée (Automatique)

```bash
# Script complet
cd ~/alliance/alliance

# Arrêter le frontend
docker stop alliance-courtage-extranet 2>/dev/null || true
docker rm alliance-courtage-extranet 2>/dev/null || true

# Trouver le réseau du backend
BACKEND_NETWORK=$(docker inspect alliance-courtage-backend --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' | head -1)

# Si aucun réseau trouvé, créer alliance-network
if [ -z "$BACKEND_NETWORK" ]; then
    docker network create alliance-network 2>/dev/null || true
    BACKEND_NETWORK="alliance-network"
    # Mettre le backend sur ce réseau aussi
    docker network connect "$BACKEND_NETWORK" alliance-courtage-backend 2>/dev/null || true
fi

echo "Réseau détecté: $BACKEND_NETWORK"

# Redémarrer le frontend sur le même réseau
docker run -d \
  --name alliance-courtage-extranet \
  --restart unless-stopped \
  --network "$BACKEND_NETWORK" \
  -p 80:80 \
  alliance-courtage-frontend:latest

# Vérifier
sleep 3
docker logs alliance-courtage-extranet --tail 20
docker ps | grep alliance-courtage
```

