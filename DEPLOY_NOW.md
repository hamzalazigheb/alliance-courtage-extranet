# Déploiement rapide - Corrections bordereaux

## 🚀 Déploiement en 3 étapes

### Option 1: Script automatique (recommandé)

**⚠️ IMPORTANT: Modifiez d'abord `deploy-now.sh` avec vos informations serveur**

```bash
# 1. Éditer le script avec vos infos
nano deploy-now.sh
# Modifier:
# - SERVER_USER="ubuntu"
# - SERVER_HOST="votre-serveur.com"
# - SERVER_PATH="/chemin/vers/projet"

# 2. Rendre exécutable et lancer
chmod +x deploy-now.sh
./deploy-now.sh
```

### Option 2: Commandes manuelles

#### 1. Commit et push

```bash
git add .
git commit -m "fix: correction ouverture fichiers bordereaux + suppression individuelle"
git push origin main
```

#### 2. Sur le serveur - Mettre à jour

```bash
# Se connecter au serveur
ssh ubuntu@votre-serveur.com

# Aller dans le dossier du projet
cd /chemin/vers/projet

# Pull les changements
git pull origin main
```

#### 3. Backend - Redémarrer

```bash
cd backend

# Installer les dépendances si nécessaire
npm install --production

# Redémarrer (choisir selon votre configuration)
# Option A: PM2
pm2 restart alliance-courtage-backend

# Option B: Docker
docker-compose restart backend

# Option C: systemd
sudo systemctl restart alliance-backend
```

#### 4. Frontend - Build et déployer

```bash
# Retour à la racine
cd ..

# Installer les dépendances
npm install

# Build
npm run build

# Copier vers nginx (adapter selon votre configuration)
sudo cp -r dist/* /var/www/html/
# ou
sudo cp -r dist/* /usr/share/nginx/html/

# Recharger nginx
sudo nginx -t && sudo systemctl reload nginx
```

## ✅ Vérification

### 1. Vérifier le backend

```bash
# Sur le serveur ou en local
curl https://votre-domaine.com/api/bordereaux/recent \
  -H "x-auth-token: VOTRE_TOKEN"
```

### 2. Vérifier le frontend

1. Ouvrir https://votre-domaine.com
2. Se connecter en admin
3. Aller dans **Gestion Comptabilité**
4. Tester le bouton "Ouvrir" - doit télécharger le fichier
5. Tester le bouton "Supprimer" - doit supprimer le fichier

### 3. Vérifier les logs

```bash
# Backend logs
pm2 logs alliance-courtage-backend

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

## 🔍 Dépannage

### Le backend ne redémarre pas
```bash
# Vérifier le statut
pm2 status
# ou
docker ps
# ou
sudo systemctl status alliance-backend
```

### Le frontend ne se met pas à jour
```bash
# Vider le cache du navigateur (Ctrl+Shift+R)
# Vérifier que les fichiers sont bien copiés
ls -la /var/www/html/
```

### Erreur 404 sur /api/bordereaux/recent
- Vérifier que le backend est bien redémarré
- Vérifier les logs du backend
- Vérifier la configuration nginx pour les routes /api

## 📝 Fichiers modifiés

- `backend/routes/bordereaux.js` - Route `/recent` corrigée
- `src/pages/GestionComptabilitePage.tsx` - Bouton "Ouvrir" et "Supprimer" ajoutés

## ⚡ Déploiement ultra-rapide (si vous connaissez votre config)

```bash
# Local
git add . && git commit -m "fix: bordereaux" && git push

# Serveur (une seule commande)
ssh ubuntu@serveur "cd /projet && git pull && cd backend && npm install && pm2 restart backend && cd .. && npm install && npm run build && sudo cp -r dist/* /var/www/html/ && sudo systemctl reload nginx"
```

