# 🔧 Déploiement : Correction bordereaux/recent

## ✅ Correction Effectuée

Le problème était que `LIMIT ?` avec un paramètre préparé ne fonctionne pas correctement avec MySQL. J'ai changé pour utiliser l'interpolation directe `LIMIT ${limit}` (sécurisé car `limit` est validé et limité à 100).

## 🚀 Déploiement sur le Serveur

### Sur le Serveur (Termius)

```bash
# 1. Pull le nouveau code
cd /var/www/alliance-courtage
git pull origin main

# 2. Copier le fichier corrigé dans le conteneur
docker cp backend/routes/bordereaux.js alliance-courtage-backend:/app/routes/bordereaux.js

# 3. Redémarrer le backend
docker restart alliance-courtage-backend

# 4. Vérifier les logs
sleep 5
docker logs alliance-courtage-backend --tail 20
```

---

**Exécutez ces commandes sur le serveur ! 🚀**


