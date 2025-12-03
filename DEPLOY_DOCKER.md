# Déploiement avec Docker - Guide rapide

## 🐳 Vous avez 3 conteneurs Docker

1. **alliance-courtage-backend** - Backend API (port 3001)
2. **alliance-courtage-extranet** - Frontend Nginx (port 80)
3. **alliance-courtage-mysql** - Base de données MySQL (port 3306)

## 🚀 Déploiement en 3 étapes

### Étape 1: Local - Commit et push

```bash
git add .
git commit -m "fix: correction ouverture fichiers bordereaux + suppression individuelle"
git push origin main
```

### Étape 2: Sur le serveur - Pull et rebuild

```bash
# Se connecter au serveur
ssh ubuntu@ip-172-31-26-58

# Aller dans le projet
cd /chemin/vers/projet

# Pull les changements
git pull origin main
```

### Étape 3: Rebuild et restart les conteneurs

#### Option A: Avec docker-compose (si vous avez un docker-compose.yml)

```bash
# Backend
cd backend
docker-compose build backend
docker-compose restart backend

# Frontend (si dans docker-compose à la racine)
cd ..
docker-compose build frontend
docker-compose restart frontend
```

#### Option B: Sans docker-compose (rebuild manuel)

```bash
# Backend
cd backend
docker build -t backend-backend .
docker restart alliance-courtage-backend

# Frontend
cd ..
docker build -t alliance-courtage-frontend:latest .
docker restart alliance-courtage-extranet
```

## ⚡ Version rapide (une seule commande)

```bash
# Sur le serveur, après git pull:
cd /chemin/vers/projet && git pull && cd backend && docker-compose build backend && docker-compose restart backend && cd .. && docker build -t alliance-courtage-frontend:latest . && docker restart alliance-courtage-extranet
```

## 🔍 Vérification

### Vérifier que les conteneurs sont actifs

```bash
docker ps
```

Vous devriez voir les 3 conteneurs avec status "Up".

### Vérifier les logs

```bash
# Backend
docker logs alliance-courtage-backend --tail 50

# Frontend
docker logs alliance-courtage-extranet --tail 50
```

### Tester l'API

```bash
curl http://localhost:3001/api/bordereaux/recent \
  -H "x-auth-token: VOTRE_TOKEN"
```

## 📝 Notes importantes

1. **Backend** : Les changements dans `backend/routes/bordereaux.js` nécessitent un rebuild
2. **Frontend** : Les changements dans `src/` nécessitent un rebuild du conteneur frontend
3. **MySQL** : Pas besoin de redémarrer, les changements de données sont persistants

## 🐛 Si ça ne fonctionne pas

### Le backend ne se met pas à jour

```bash
# Vérifier les logs
docker logs alliance-courtage-backend

# Rebuild complet
cd backend
docker-compose down
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Le frontend ne se met pas à jour

```bash
# Vérifier les logs
docker logs alliance-courtage-extranet

# Rebuild complet
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet
docker build -t alliance-courtage-frontend:latest .
docker run -d -p 80:80 --name alliance-courtage-extranet alliance-courtage-frontend:latest
```

### Vérifier les volumes (si vous utilisez des volumes)

```bash
# Voir les volumes montés
docker inspect alliance-courtage-backend | grep -A 10 Mounts
```

## 🎯 Commandes utiles

```bash
# Voir tous les conteneurs (actifs et arrêtés)
docker ps -a

# Redémarrer un conteneur
docker restart alliance-courtage-backend

# Voir les logs en temps réel
docker logs -f alliance-courtage-backend

# Entrer dans un conteneur
docker exec -it alliance-courtage-backend bash

# Voir l'utilisation des ressources
docker stats
```

