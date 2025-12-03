# Guide : Test et déploiement de la suppression de bordereaux

## ✅ Fonctionnalité ajoutée

- **Bouton "Supprimer"** dans la liste des fichiers récents uploadés
- **Confirmation avant suppression** pour éviter les erreurs
- **Indicateur de chargement** pendant la suppression
- **Mise à jour automatique** de la liste après suppression

## 🧪 Test en local

### 1. Démarrer le backend

```bash
cd backend
npm run dev
```

Le backend doit être accessible sur `http://localhost:3001`

### 2. Démarrer le frontend

```bash
# Dans un autre terminal, à la racine du projet
npm run dev
```

Le frontend doit être accessible sur `http://localhost:5173`

### 3. Tester la fonctionnalité

1. **Se connecter en tant qu'admin**
   - Aller sur `http://localhost:5173`
   - Se connecter avec un compte admin

2. **Aller dans Gestion Comptabilité**
   - Menu Admin → Gestion → Comptabilité
   - Ou directement : `http://localhost:5173#gestion-comptabilite`

3. **Uploader des fichiers en masse**
   - Cliquer sur "📤 Upload en masse"
   - Sélectionner plusieurs fichiers
   - Les fichiers apparaissent dans "Derniers fichiers uploadés"

4. **Tester la suppression**
   - Cliquer sur "🗑️ Supprimer" à côté d'un fichier
   - Confirmer la suppression
   - Vérifier que le fichier disparaît de la liste

### 4. Vérifier dans la base de données

```bash
# Se connecter à MySQL
docker exec -it alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage

# Vérifier que le bordereau a été supprimé
SELECT id, title, user_id FROM bordereaux ORDER BY created_at DESC LIMIT 10;
```

## 🚀 Déploiement

### Option 1 : Déploiement automatique (si vous avez configuré deploy-feature.sh)

```bash
# Adapter le script avec vos informations serveur
chmod +x deploy-feature.sh
./deploy-feature.sh
```

### Option 2 : Déploiement manuel

#### 1. Commit et push les changements

```bash
git add src/pages/GestionComptabilitePage.tsx
git commit -m "feat: ajout suppression individuelle des bordereaux après upload en masse"
git push origin main
```

#### 2. Sur le serveur - Mettre à jour le code

```bash
# Se connecter au serveur
ssh ubuntu@votre-serveur.com

# Aller dans le dossier du projet
cd /chemin/vers/projet

# Pull les derniers changements
git pull origin main
```

#### 3. Build et déployer le frontend

```bash
# Installer les dépendances si nécessaire
npm install

# Build le frontend
npm run build

# Copier vers nginx (adapter selon votre configuration)
sudo cp -r dist/* /var/www/html/
# ou
sudo cp -r dist/* /usr/share/nginx/html/
```

#### 4. Redémarrer le backend (si nécessaire)

```bash
# Avec PM2
pm2 restart alliance-courtage-backend

# Ou avec Docker
cd backend
docker-compose restart backend

# Ou avec systemd
sudo systemctl restart alliance-backend
```

## ✅ Vérification en production

1. **Se connecter au site en production**
2. **Aller dans Gestion Comptabilité**
3. **Vérifier que les boutons "Supprimer" apparaissent**
4. **Tester la suppression d'un fichier**
5. **Vérifier que le fichier disparaît de la liste**

## 🔍 Dépannage

### Le bouton ne s'affiche pas
- Vérifier que vous êtes connecté en tant qu'admin
- Vérifier la console du navigateur pour les erreurs
- Vérifier que le build frontend a bien été déployé

### La suppression ne fonctionne pas
- Vérifier les logs du backend : `pm2 logs alliance-courtage-backend`
- Vérifier la console du navigateur (F12)
- Vérifier que le token d'authentification est valide

### Erreur 404 lors de la suppression
- Vérifier que la route DELETE existe dans `backend/routes/bordereaux.js`
- Vérifier que le backend est bien redémarré

## 📝 Notes

- La suppression est **irréversible** - assurez-vous de confirmer avant de supprimer
- Seuls les **admins** peuvent supprimer les bordereaux
- La suppression supprime aussi le fichier de la base de données (base64)
- Les utilisateurs ne verront plus le fichier après suppression

