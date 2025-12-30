# 🔧 Résoudre le conflit Git sur le serveur

## Problème
Vous avez des modifications locales dans `backend/scripts/fix-database.sh` qui empêchent le pull.

## Solution : Sauvegarder et récupérer les nouvelles versions

Exécutez ces commandes sur le serveur :

```bash
cd ~/prod

# Option 1 : Sauvegarder vos modifications locales (recommandé)
git stash

# Puis récupérer les nouvelles modifications
git pull origin deploy-new-version

# Option 2 : Si vous voulez écraser vos modifications locales
# git reset --hard origin/deploy-new-version
```

Ensuite, continuez avec les étapes de vérification :

```bash
cd backend/scripts
chmod +x check-server-structure.sh
./check-server-structure.sh
```




