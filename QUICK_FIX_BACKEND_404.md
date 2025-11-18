# 🔧 Correction rapide : Erreur 404 sur PUT /api/archives/:id/category

## Problème
L'erreur 404 persiste après `git pull` car le code est intégré dans l'image Docker lors du build.

## Solution : Rebuild le backend

### Option 1 : Script automatique (recommandé)

```bash
cd ~/alliance/alliance

# 1. Pull des modifications
git pull origin main

# 2. Rebuild et redémarrer le backend
chmod +x rebuild-backend.sh
./rebuild-backend.sh
```

### Option 2 : Commandes manuelles

```bash
cd ~/alliance/alliance/backend

# 1. Arrêter le backend
docker stop alliance-courtage-backend

# 2. Rebuild l'image
docker-compose build backend
# OU si docker-compose n'est pas installé :
docker build -t alliance-courtage-backend .

# 3. Redémarrer
docker-compose up -d backend
# OU :
docker start alliance-courtage-backend

# 4. Vérifier les logs
docker logs alliance-courtage-backend --tail 30
```

### Option 3 : Depuis le dossier backend

```bash
cd ~/alliance/alliance/backend

# Pull des modifications
cd ..
git pull origin main
cd backend

# Rebuild et restart
docker-compose stop backend
docker-compose build backend
docker-compose up -d backend

# Vérifier
docker logs alliance-courtage-backend --tail 30
```

## Vérification

Après le rebuild, vous devriez voir dans les logs :
- ✅ `Connexion à la base de données MySQL réussie`
- ✅ `Serveur Alliance Courtage démarré sur le port 3001`

Testez ensuite la modification de catégorie dans l'interface. L'erreur 404 devrait être résolue.

## Pourquoi un rebuild est nécessaire ?

Le Dockerfile copie le code avec `COPY . .` lors du build, donc le code est intégré dans l'image Docker. Un simple `docker restart` ne charge pas les nouveaux fichiers du système de fichiers local.

