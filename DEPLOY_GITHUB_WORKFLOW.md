# 🚀 Déploiement via GitHub - Workflow Complet

## 📋 Étape 1 : Push sur GitHub (Machine Locale)

### 1.1 Vérifier les changements

```bash
# Dans votre machine locale (Windows)
cd C:\Users\Hamza\Desktop\saveweb2zip-com-www-extranet-gnca-fr

# Vérifier les fichiers modifiés
git status

# Voir les différences
git diff
```

### 1.2 Ajouter les fichiers

```bash
# Ajouter tous les nouveaux fichiers et modifications
git add .

# OU ajouter spécifiquement les nouveaux fichiers
git add backend/routes/favoris.js
git add backend/scripts/addFavorisTable.js
git add src/FavorisPage.tsx
git add src/components/FavoriteButton.tsx
git add src/App.tsx
git add src/api.js
git add backend/server.js
git add backend/scripts/freshDatabase.js
git add backend/scripts/installDatabase.sql
git add *.md
```

### 1.3 Commit

```bash
# Commit avec message descriptif
git commit -m "Add favoris system and deployment scripts

- Add favoris table and API routes
- Add FavorisPage and FavoriteButton components
- Add bulk upload date configuration
- Add database installation scripts
- Add deployment documentation"
```

### 1.4 Push sur GitHub

```bash
# Push vers la branche principale
git push origin main
# ou
git push origin master
```

**Vérification:**
- Aller sur GitHub et vérifier que les fichiers sont bien pushés

---

## 📋 Étape 2 : Pull sur le Serveur (Via Termius)

### 2.1 Se connecter au serveur

Dans Termius, connectez-vous à votre serveur (ubuntu@ip-172-31-26-58)

### 2.2 Aller dans le répertoire du projet

```bash
cd /var/www/alliance-courtage
```

### 2.3 Backup (IMPORTANT avant pull)

```bash
# Démarrer MySQL
docker start alliance-courtage-mysql
sleep 5

# Backup
mkdir -p ~/backups
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Vérifier
ls -lh ~/backups/
```

### 2.4 Pull depuis GitHub

```bash
# Vérifier que c'est un repo Git
git status

# Si pas encore un repo Git, initialiser et connecter:
# git init
# git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
# git pull origin main

# Si c'est déjà un repo Git, simplement pull:
git pull origin main
# ou
git pull origin master
```

**Si conflit:**
```bash
# Voir les conflits
git status

# Résoudre les conflits manuellement ou
git stash
git pull origin main
git stash pop
```

### 2.5 Vérifier les fichiers

```bash
# Vérifier que les nouveaux fichiers sont là
ls -la backend/routes/favoris.js
ls -la backend/scripts/addFavorisTable.js
ls -la src/FavorisPage.tsx
ls -la src/components/FavoriteButton.tsx
```

---

## 📋 Étape 3 : Exécuter les Scripts de Migration

### 3.1 Installer les dépendances (si nécessaire)

```bash
# Backend
cd backend
npm install
cd ..
```

### 3.2 Créer la table `favoris`

```bash
# S'assurer que MySQL est démarré
docker start alliance-courtage-mysql
sleep 5

# Exécuter le script de migration
cd backend
node scripts/addFavorisTable.js
cd ..
```

**Vérification:**
```bash
docker exec alliance-courtage-mysql mysql -u root -p -e "USE alliance_courtage; SHOW TABLES LIKE 'favoris';"
```

---

## 📋 Étape 4 : Redémarrer les Services

### 4.1 Rebuild Docker (si nécessaire)

```bash
# Rebuild les images (si Dockerfile modifié)
docker-compose build

# OU simplement redémarrer
docker-compose up -d
```

### 4.2 OU démarrer les conteneurs un par un

```bash
# Démarrer MySQL
docker start alliance-courtage-mysql
sleep 5

# Démarrer Backend
docker start alliance-courtage-backend

# Démarrer Frontend
docker start alliance-courtage-extranet
```

### 4.3 Vérifier les conteneurs

```bash
docker ps
```

**Tous doivent être "Up" (pas "Exited")**

---

## 📋 Étape 5 : Vérification Finale

### 5.1 Vérifier les logs

```bash
# Logs backend
docker logs alliance-courtage-backend --tail 50

# Chercher:
# ✅ "Server running on port 3001"
# ❌ Pas d'erreurs "Cannot find module"
# ❌ Pas d'erreurs "Table doesn't exist"
```

### 5.2 Tester l'API

```bash
# Test de santé
curl http://localhost:3001/api/health

# Réponse attendue:
# {"status":"OK","message":"Alliance Courtage API is running",...}
```

### 5.3 Vérifier la base de données

```bash
docker exec -it alliance-courtage-mysql mysql -u root -p
```

```sql
USE alliance_courtage;
SHOW TABLES LIKE 'favoris';
DESCRIBE favoris;
SELECT COUNT(*) FROM favoris;
EXIT;
```

---

## 🔄 Script Automatique Complet

Créez un fichier `deploy-from-github.sh` sur le serveur:

```bash
#!/bin/bash

echo "🚀 Déploiement depuis GitHub..."

# 1. Backup
echo "📦 Backup de la base de données..."
docker start alliance-courtage-mysql
sleep 5
mkdir -p ~/backups
docker exec alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull
echo "📥 Pull depuis GitHub..."
cd /var/www/alliance-courtage
git pull origin main

# 3. Installer dépendances
echo "📦 Installation des dépendances..."
cd backend && npm install && cd ..

# 4. Migration
echo "🗄️  Migration de la base de données..."
docker start alliance-courtage-mysql
sleep 5
cd backend && node scripts/addFavorisTable.js && cd ..

# 5. Redémarrer
echo "🔄 Redémarrage des services..."
docker-compose up -d

# 6. Vérification
echo "✅ Vérification..."
sleep 5
docker ps
curl http://localhost:3001/api/health

echo "🎉 Déploiement terminé !"
```

**Rendre exécutable:**
```bash
chmod +x deploy-from-github.sh
```

**Exécuter:**
```bash
./deploy-from-github.sh
```

---

## 📋 Checklist Complète

### Sur Machine Locale:
- [ ] `git status` - Vérifier les changements
- [ ] `git add .` - Ajouter les fichiers
- [ ] `git commit -m "message"` - Commit
- [ ] `git push origin main` - Push sur GitHub
- [ ] Vérifier sur GitHub que les fichiers sont pushés

### Sur Serveur (Termius):
- [ ] Backup de la base de données
- [ ] `git pull origin main` - Pull depuis GitHub
- [ ] Vérifier que les fichiers sont présents
- [ ] `npm install` dans backend
- [ ] `node scripts/addFavorisTable.js` - Migration
- [ ] `docker-compose up -d` - Redémarrer
- [ ] Vérifier `docker ps` - Tous les conteneurs "Up"
- [ ] Tester `curl http://localhost:3001/api/health`
- [ ] Tester l'interface web

---

## ⚠️ Problèmes Courants

### Erreur: "git pull" demande un mot de passe

**Solution:** Configurer SSH ou utiliser un token:
```bash
# Configurer SSH
ssh-keygen -t rsa
cat ~/.ssh/id_rsa.pub
# Ajouter cette clé sur GitHub Settings > SSH Keys
```

### Erreur: "Table 'favoris' already exists"

**Solution:** C'est normal, la table existe déjà. Continuez.

### Erreur: "Cannot find module"

**Solution:**
```bash
cd backend
rm -rf node_modules
npm install
```

---

**Workflow complet prêt ! 🚀**

