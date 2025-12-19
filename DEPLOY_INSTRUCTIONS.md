# 🚀 Instructions de Déploiement - Version Complète

## Déploiement Automatique (Recommandé)

Sur le serveur, exécutez simplement :

```bash
cd ~/prod
chmod +x deploy-complete.sh
./deploy-complete.sh
```

Ce script va :
1. ✅ Vérifier la branche `deploy-new-version`
2. ✅ Récupérer les derniers changements
3. ✅ Créer automatiquement `config.env` et `.env` si nécessaire
4. ✅ Déployer le backend avec Docker
5. ✅ Déployer le frontend avec Docker
6. ✅ Vérifier que tout fonctionne

## Déploiement Manuel

### Étape 1 : Configuration

```bash
cd ~/prod/backend
chmod +x setup-deployment.sh
./setup-deployment.sh
```

### Étape 2 : Déployer le Backend

```bash
cd ~/prod/backend
docker-compose down
docker-compose up -d --build
```

### Étape 3 : Déployer le Frontend

```bash
cd ~/prod
docker stop alliance-courtage-extranet 2>/dev/null || true
docker rm alliance-courtage-extranet 2>/dev/null || true
docker build -t alliance-courtage-frontend:latest .
docker run -d -p 80:80 --name alliance-courtage-extranet alliance-courtage-frontend:latest
```

### Étape 4 : Vérification

```bash
# Vérifier tous les conteneurs
docker ps

# Tester l'API
curl http://localhost:3001/api/health

# Voir les logs
cd ~/prod/backend
docker-compose logs -f
```

## Fichiers de Configuration

### config.env (Obligatoire)

Le fichier `config.env` est créé automatiquement par `setup-deployment.sh` avec les valeurs par défaut.

Pour le personnaliser :
```bash
cd ~/prod/backend
nano config.env
```

Variables importantes à modifier en production :
- `JWT_SECRET` : Changez-le pour plus de sécurité
- `CORS_ORIGIN` : Ajoutez votre domaine de production
- `FRONTEND_URL` : URL de votre frontend en production
- `SMTP_*` : Configuration email pour la production

### .env (Optionnel)

Le fichier `.env` est optionnel. Il est créé automatiquement vide par `setup-deployment.sh`.

## Dépannage

### Erreur : "Couldn't find env file: .env"

Le fichier `.env` est optionnel. Créez-le vide :
```bash
cd ~/prod/backend
touch .env
```

### Erreur : "config.env not found"

Exécutez le script de configuration :
```bash
cd ~/prod/backend
./setup-deployment.sh
```

### Les conteneurs ne démarrent pas

Vérifiez les logs :
```bash
cd ~/prod/backend
docker-compose logs
```

### Port déjà utilisé

Vérifiez ce qui utilise les ports :
```bash
sudo lsof -i :80
sudo lsof -i :3001
```

## Structure des Conteneurs

Après le déploiement, vous devriez avoir 3 conteneurs :

1. **alliance-courtage-mysql** : Base de données (port 3306)
2. **alliance-courtage-backend** : API Backend (port 3001)
3. **alliance-courtage-extranet** : Frontend Nginx (port 80)

## Commandes Utiles

```bash
# Voir tous les conteneurs
docker ps

# Voir les logs en temps réel
cd ~/prod/backend
docker-compose logs -f

# Redémarrer un conteneur
docker-compose restart backend

# Arrêter tous les conteneurs
docker-compose down

# Rebuild complet
docker-compose down
docker-compose up -d --build
```

