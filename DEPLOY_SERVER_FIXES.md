# 🔧 Corrections pour le Déploiement Serveur

## ✅ État Actuel

- ✅ Git pull a réussi (mais conflit avec `test-all.sh`)
- ✅ Conteneurs Docker sont en cours d'exécution
- ✅ API fonctionne (`http://localhost:3001/api/health` OK)
- ❌ Conflit Git avec `test-all.sh`
- ❌ `npm` et `node` ne sont pas installés (mais pas nécessaire avec Docker)
- ❌ `docker-compose` pas trouvé (utiliser `docker compose`)

---

## 🔧 Solutions

### 1. Résoudre le Conflit Git

```bash
# Stash les changements locaux de test-all.sh
git stash

# Ou supprimer le fichier (il est déjà supprimé dans le repo)
git rm test-all.sh

# Ensuite pull à nouveau
git pull origin main
```

### 2. Migration de la Base de Données (via Docker)

Comme `node` n'est pas installé sur le serveur, exécuter le script dans le conteneur backend :

```bash
# Exécuter le script à l'intérieur du conteneur backend
docker exec -it alliance-courtage-backend node scripts/addFavorisTable.js
```

### 3. Backup MySQL (Corriger le Mot de Passe)

```bash
# Option 1: Utiliser la variable d'environnement depuis docker-compose
docker exec alliance-courtage-mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} alliance_courtage > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Option 2: Entrer le mot de passe interactivement
docker exec -it alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Option 3: Vérifier le mot de passe dans docker-compose.yml
cat docker-compose.yml | grep MYSQL_ROOT_PASSWORD
```

### 4. Redémarrer avec `docker compose` (sans tiret)

```bash
# Utiliser docker compose (sans tiret, version récente)
docker compose up -d

# OU redémarrer les conteneurs individuellement
docker restart alliance-courtage-backend
docker restart alliance-courtage-mysql
docker restart alliance-courtage-extranet
```

---

## 📋 Commandes Corrigées (À Exécuter)

```bash
# 1. Résoudre le conflit Git
git rm test-all.sh
git pull origin main

# 2. Backup (avec mot de passe correct)
docker exec -it alliance-courtage-mysql mysqldump -u root -p alliance_courtage > ~/backups/backup_$(date +%Y%m%d_%H%M%S).sql
# Entrer le mot de passe MySQL quand demandé

# 3. Migration (dans le conteneur Docker)
docker exec -it alliance-courtage-backend node scripts/addFavorisTable.js

# 4. Redémarrer (si nécessaire)
docker restart alliance-courtage-backend

# 5. Vérifier
docker ps
curl http://localhost:3001/api/health

# Vérifier la table favoris
docker exec -it alliance-courtage-mysql mysql -u root -p -e "USE alliance_courtage; SHOW TABLES LIKE 'favoris';"
```

---

## 🔍 Vérifier le Mot de Passe MySQL

```bash
# Vérifier dans docker-compose.yml
cat docker-compose.yml | grep -A 5 MYSQL

# Ou voir les variables d'environnement du conteneur
docker exec alliance-courtage-mysql env | grep MYSQL
```

---

## ✅ Checklist Finale

- [ ] Résoudre le conflit Git (`git rm test-all.sh`)
- [ ] Pull réussi (`git pull origin main`)
- [ ] Backup créé (avec mot de passe correct)
- [ ] Migration exécutée (`docker exec -it alliance-courtage-backend node scripts/addFavorisTable.js`)
- [ ] Conteneurs redémarrés (si nécessaire)
- [ ] Table `favoris` vérifiée
- [ ] API fonctionne (`curl http://localhost:3001/api/health`)
- [ ] Interface testée (favoris fonctionnent)

---

**Exécutez ces commandes corrigées dans Termius ! 🚀**


