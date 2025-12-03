# Vérification du déploiement - Les nouvelles fonctionnalités sont-elles déployées ?

## 🔍 Comment vérifier

### Méthode 1: Vérification manuelle dans le navigateur

1. **Ouvrir votre site en production**
   - Aller sur https://votre-domaine.com

2. **Se connecter en tant qu'admin**

3. **Aller dans Gestion Comptabilité**
   - Menu Admin → Gestion → Comptabilité

4. **Vérifier les fonctionnalités:**

   ✅ **Bouton "Ouvrir" corrigé:**
   - Cliquer sur "👁️ Ouvrir" à côté d'un fichier
   - Le fichier doit se télécharger/ouvrir
   - ❌ NE DOIT PAS rediriger vers l'accueil

   ✅ **Bouton "Supprimer" présent:**
   - Vous devez voir un bouton "🗑️ Supprimer" à côté de chaque fichier
   - Cliquer dessus doit afficher une confirmation
   - Après confirmation, le fichier doit disparaître de la liste

### Méthode 2: Vérification dans le code (serveur)

#### Vérifier le backend

```bash
# Se connecter au serveur
ssh ubuntu@ip-172-31-26-58

# Vérifier la route /bordereaux/recent
curl http://localhost:3001/api/bordereaux/recent \
  -H "x-auth-token: VOTRE_TOKEN" | jq '.[0]'

# Vous devriez voir "hasFileContent" dans la réponse
```

#### Vérifier le frontend

```bash
# Vérifier dans le conteneur frontend
docker exec alliance-courtage-extranet grep -l "handleOpenBordereau" /usr/share/nginx/html/assets/*.js

# Vérifier le bouton Supprimer
docker exec alliance-courtage-extranet grep -l "Supprimer" /usr/share/nginx/html/assets/*.js
```

### Méthode 3: Vérifier les fichiers sources

```bash
# Sur le serveur
cd /chemin/vers/projet

# Vérifier le backend
grep -n "has_file_content" backend/routes/bordereaux.js
# Devrait afficher la ligne avec has_file_content

# Vérifier le frontend
grep -n "handleOpenBordereau" src/pages/GestionComptabilitePage.tsx
grep -n "handleDeleteBordereau" src/pages/GestionComptabilitePage.tsx
# Devrait afficher les lignes avec ces fonctions
```

## ✅ Checklist de vérification

- [ ] Le bouton "Ouvrir" télécharge le fichier (ne redirige plus vers l'accueil)
- [ ] Le bouton "Supprimer" est visible à côté de chaque fichier
- [ ] La suppression demande une confirmation
- [ ] Après suppression, le fichier disparaît de la liste
- [ ] La route `/api/bordereaux/recent` retourne `hasFileContent` dans la réponse

## 🐛 Si les fonctionnalités ne sont pas présentes

### Le frontend n'a pas été mis à jour

```bash
# Rebuild complet du frontend
docker stop alliance-courtage-extranet
docker rm alliance-courtage-extranet
docker build -t alliance-courtage-frontend:latest .
docker run -d -p 80:80 --name alliance-courtage-extranet alliance-courtage-frontend:latest
```

### Le backend n'a pas été mis à jour

```bash
cd backend
docker-compose build backend
docker-compose restart backend
```

### Vider le cache du navigateur

- Chrome/Edge: `Ctrl + Shift + R` ou `Ctrl + F5`
- Firefox: `Ctrl + Shift + R`
- Safari: `Cmd + Shift + R`

## 📝 Résumé des fonctionnalités déployées

1. **Correction bouton "Ouvrir"**
   - Fichier: `src/pages/GestionComptabilitePage.tsx`
   - Fonction: `handleOpenBordereau`
   - Backend: Route `/bordereaux/recent` corrigée

2. **Bouton "Supprimer"**
   - Fichier: `src/pages/GestionComptabilitePage.tsx`
   - Fonction: `handleDeleteBordereau`
   - Backend: Route `DELETE /bordereaux/:id` (déjà existante)

