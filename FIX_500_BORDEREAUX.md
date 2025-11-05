# 🔧 Solution : Erreur 500 sur /api/bordereaux

## ❌ Problème

```
GET http://13.38.115.36/api/bordereaux/recent?limit=20 500 (Internal Server Error)
POST http://13.38.115.36/api/bordereaux 500 (Internal Server Error)
```

Erreur serveur interne sur les routes bordereaux.

## ✅ Solutions

### Solution 1 : Vérifier les Logs du Backend

```bash
# Voir les logs récents pour identifier l'erreur
docker logs alliance-courtage-backend --tail 50

# Voir les logs en temps réel
docker logs -f alliance-courtage-backend
```

### Solution 2 : Vérifier la Connexion à la Base de Données

```bash
# Tester la connexion MySQL depuis le backend
docker exec alliance-courtage-backend node -e "const db = require('./config/database'); db.query('SELECT 1').then(() => console.log('DB OK')).catch(e => console.error('DB Error:', e));"
```

### Solution 3 : Vérifier que la Table bordereaux Existe

```bash
# Vérifier que la table existe
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SHOW TABLES LIKE 'bordereaux';"
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; DESCRIBE bordereaux;"
```

### Solution 4 : Vérifier les Erreurs de Syntaxe dans bordereaux.js

```bash
# Vérifier que le fichier est valide
docker exec alliance-courtage-backend node -c /app/routes/bordereaux.js

# Voir les premières lignes du fichier
docker exec alliance-courtage-backend head -50 /app/routes/bordereaux.js
```

### Solution 5 : Vérifier les Dépendances

```bash
# Vérifier que multer est installé
docker exec alliance-courtage-backend cat /app/package.json | grep multer

# Vérifier node_modules
docker exec alliance-courtage-backend ls -la /app/node_modules | grep multer
```

---

## 🔍 Diagnostic Complet

```bash
# 1. Voir les logs d'erreur
docker logs alliance-courtage-backend --tail 100 | grep -i "error\|bordereaux\|500"

# 2. Tester la route directement
curl -X GET http://localhost:3001/api/bordereaux/recent?limit=20

# 3. Vérifier la table
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SELECT COUNT(*) FROM bordereaux;"

# 4. Vérifier la configuration
docker exec alliance-courtage-backend cat /app/config.env | grep DB_
```

---

## 🚀 Solution Rapide

```bash
# 1. Voir les logs pour identifier l'erreur
docker logs alliance-courtage-backend --tail 100

# 2. Vérifier la table bordereaux
docker exec -it alliance-courtage-mysql mysql -u root -palliance2024Secure -e "USE alliance_courtage; SHOW TABLES LIKE 'bordereaux';"

# 3. Redémarrer le backend si nécessaire
docker restart alliance-courtage-backend
docker logs alliance-courtage-backend --tail 20
```

---

**Exécutez d'abord la Solution 1 pour voir les logs et identifier l'erreur exacte ! 🚀**


