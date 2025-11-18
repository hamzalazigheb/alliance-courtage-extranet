# 🔄 Guide de Redéploiement - Alliance Courtage

Ce guide explique comment redéployer l'application avec de nouvelles fonctionnalités sans toucher aux données de production.

## 📋 Prérequis

- Accès SSH au serveur de production
- Docker et Docker Compose installés
- Les 3 conteneurs en cours d'exécution :
  - `alliance-courtage-backend` (port 3001)
  - `alliance-courtage-extranet` (port 80)
  - `alliance-courtage` (MySQL, port 3306)

## 🚀 Redéploiement Rapide

### Option 1 : Script PowerShell (Windows)

```powershell
.\redeploy.ps1
```

Le script va :
1. ✅ Faire un backup de la base de données
2. ✅ Arrêter les conteneurs (sans supprimer les volumes)
3. ✅ Rebuild les images avec les nouvelles fonctionnalités
4. ✅ Redémarrer les conteneurs
5. ✅ Vérifier que tout fonctionne

### Option 2 : Commandes manuelles (Linux/Ubuntu)

```bash
# 1. Backup de la base de données
docker exec alliance-courtage mysqldump -u root -p alliance_courtage > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Arrêter les conteneurs (sans supprimer les volumes)
docker stop alliance-courtage-backend
docker stop alliance-courtage-extranet
# Ne PAS arrêter MySQL

# 3. Build des nouvelles images
cd backend
docker build -t alliance-courtage-backend:latest .
cd ..
docker build -t alliance-courtage-frontend:latest .

# 4. Redémarrer les conteneurs
docker start alliance-courtage-backend
docker start alliance-courtage-extranet

# 5. Vérifier l'état
docker ps
```

## 🔒 Protection des Données

### Ce qui est préservé

- ✅ **Base de données MySQL** : Toujours en cours d'exécution
- ✅ **Volumes Docker** : Aucun volume n'est supprimé
- ✅ **Uploads** : Tous les fichiers uploadés sont conservés
- ✅ **Configurations** : Les configurations existantes sont préservées

### Ce qui est mis à jour

- ✅ **Code backend** : Nouvelle version avec nouvelles fonctionnalités
- ✅ **Code frontend** : Nouvelle version avec nouvelles fonctionnalités
- ✅ **Images Docker** : Rebuild avec le nouveau code

## 📊 Vérification Post-Redéploiement

### 1. Vérifier les conteneurs

```bash
docker ps
```

Vous devriez voir les 3 conteneurs en cours d'exécution.

### 2. Vérifier les logs

```bash
# Logs backend
docker logs alliance-courtage-backend --tail 50

# Logs frontend
docker logs alliance-courtage-extranet --tail 50

# Logs MySQL
docker logs alliance-courtage --tail 50
```

### 3. Tester l'API

```bash
curl http://localhost:3001/api/health
```

Réponse attendue :
```json
{
  "status": "OK",
  "message": "Alliance Courtage API is running"
}
```

### 4. Tester le frontend

Ouvrez dans votre navigateur :
```
http://votre-serveur-ip
```

## 🔧 Dépannage

### Conteneur ne démarre pas

```bash
# Vérifier les logs d'erreur
docker logs alliance-courtage-backend

# Vérifier les images
docker images | grep alliance-courtage

# Recréer le conteneur si nécessaire
docker rm alliance-courtage-backend
docker run -d --name alliance-courtage-backend \
  --network bridge \
  -p 3001:3001 \
  -v $(pwd)/backend/uploads:/app/uploads \
  alliance-courtage-backend:latest
```

### Erreur de connexion à la base de données

Vérifiez que MySQL est toujours en cours d'exécution :
```bash
docker ps | grep alliance-courtage
```

Si MySQL n'est pas en cours d'exécution :
```bash
docker start alliance-courtage
```

### Les nouvelles fonctionnalités n'apparaissent pas

1. Videz le cache du navigateur (Ctrl+F5)
2. Vérifiez que les nouvelles images sont bien utilisées :
   ```bash
   docker images | grep alliance-courtage
   ```
3. Vérifiez que les conteneurs utilisent les bonnes images :
   ```bash
   docker inspect alliance-courtage-backend | grep Image
   ```

## 📝 Checklist de Redéploiement

- [ ] Backup de la base de données effectué
- [ ] Code mis à jour (git pull ou upload)
- [ ] Images Docker rebuildées
- [ ] Conteneurs redémarrés
- [ ] API accessible et fonctionnelle
- [ ] Frontend accessible et fonctionnel
- [ ] Nouvelles fonctionnalités testées
- [ ] Aucune donnée perdue

## ⚠️ Commandes Dangereuses à Éviter

**NE JAMAIS exécuter** :
- ❌ `docker rm -v` (supprime les volumes)
- ❌ `docker volume prune` (supprime les volumes non utilisés)
- ❌ `docker-compose down -v` (supprime les volumes)
- ❌ Scripts qui réinitialisent la base de données

## 🔄 Rollback en cas de problème

Si quelque chose ne fonctionne pas après le redéploiement :

```bash
# 1. Arrêter les conteneurs
docker stop alliance-courtage-backend alliance-courtage-extranet

# 2. Restaurer les images précédentes (si sauvegardées)
docker tag alliance-courtage-backend:previous alliance-courtage-backend:latest

# 3. Redémarrer
docker start alliance-courtage-backend alliance-courtage-extranet

# 4. Restaurer la base de données si nécessaire
docker exec -i alliance-courtage mysql -u root -p alliance_courtage < backup_YYYYMMDD_HHMMSS.sql
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs : `docker logs <container-name>`
2. Vérifiez l'état : `docker ps -a`
3. Vérifiez les volumes : `docker volume ls`
4. Consultez le backup créé avant le redéploiement


