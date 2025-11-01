# 🚀 Alliance Courtage - Déploiement Automatique

## ⚡ Déploiement en 1 Commande

Sur un **nouveau serveur Ubuntu**, clonez le projet et exécutez :

```bash
chmod +x deploy.sh
./deploy.sh
```

Le script va tout installer et configurer automatiquement ! ✅

---

## 📋 Ce qui est Installé Automatiquement

- ✅ Docker
- ✅ Docker Compose
- ✅ MySQL 8.0 (dans Docker)
- ✅ Backend Node.js (dans Docker)
- ✅ Frontend React/Nginx (dans Docker)

---

## 📁 Structure du Projet

```
alliance-courtage/
├── deploy.sh                 # Script de déploiement principal
├── Dockerfile                # Frontend Docker
├── package.json              # Frontend dependencies
├── backend/
│   ├── docker-compose.yml    # Services backend (MySQL + API)
│   ├── Dockerfile            # Backend Docker
│   ├── .env                   # Variables Docker (auto-créé)
│   ├── config.env             # Variables application (auto-créé)
│   ├── server.js              # Serveur Express
│   └── scripts/               # Scripts d'initialisation
└── src/                       # Code React frontend
```

---

## 🔧 Configuration

### Fichiers Auto-Créés par deploy.sh

#### `backend/.env`
Variables pour Docker Compose (MySQL, Backend)

#### `backend/config.env`
Variables pour l'application Node.js

### Modifier après Premier Déploiement

```bash
cd backend
nano .env       # Modifier les mots de passe
nano config.env # Même chose
cd ..
./deploy.sh    # Redéployer
```

---

## 🌐 Accès

Après déploiement :

- **Frontend** : `http://VOTRE_IP`
- **Backend API** : `http://VOTRE_IP/api`
- **Admin Login** : `http://VOTRE_IP/#manage`

### Identifiants par Défaut

- Email: `admin@alliance-courtage.fr`
- Password: `password`

⚠️ **Changez le mot de passe après la première connexion !**

---

## 📝 Commandes Utiles

```bash
# Voir les containers
docker ps

# Logs backend
docker logs -f alliance-courtage-backend

# Logs frontend
docker logs -f alliance-courtage-extranet

# Redémarrer
cd backend && docker compose restart

# Arrêter
cd backend && docker compose down
docker stop alliance-courtage-extranet
```

---

## 🔄 Mise à Jour

```bash
# Récupérer les dernières modifications
git pull origin main

# Redéployer
./deploy.sh
```

---

## 📚 Documentation

- `QUICK_DEPLOY.md` - Guide de démarrage rapide
- `DOCKER_DEPLOYMENT_FROM_SCRATCH.md` - Guide complet Docker
- `MIGRATE_LOCAL_DB_TO_DOCKER.md` - Migration de données

---

**🎉 Prêt à déployer ! Juste `./deploy.sh` et c'est parti !**

