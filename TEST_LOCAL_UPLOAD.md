# 🧪 TEST LOCAL - Upload Image CMS

## ✅ Checklist Avant de Tester

1. **Backend démarré** sur `http://localhost:3001`
2. **Frontend démarré** sur `http://localhost:5173`
3. **Base de données MySQL** accessible
4. **Connecté en tant qu'admin**

## 📝 Étapes de Test

### 1. Démarrer le Backend

```powershell
cd backend
npm start
```

**Attendez de voir :**
```
✅ Connexion à la base de données MySQL réussie
🚀 Serveur Alliance Courtage démarré sur le port 3001
```

### 2. Démarrer le Frontend (nouveau terminal)

```powershell
cd ..
npm run dev
```

### 3. Tester dans le Navigateur

1. Ouvrir `http://localhost:5173`
2. Se connecter en tant qu'admin
3. Aller dans `#manage` ou `/manage`
4. Cliquer sur l'onglet **"CMS"**
5. Cliquer sur **"Rencontres"** ou **"Gamme Financière"**
6. Dans la section **"Image d'en-tête"** :
   - Cliquer sur **"Choisir un fichier"**
   - Sélectionner une image (JPEG, PNG, GIF, WebP)
   - Vérifier que "Upload..." apparaît brièvement
   - Vérifier que l'image s'affiche en prévisualisation
7. Cliquer sur **"Sauvegarder le contenu"**

### 4. Vérifier la Console du Navigateur (F12)

**Onglet Network :**
- Chercher la requête `POST /api/cms/upload-image`
- Vérifier le statut : devrait être `200 OK`
- Vérifier la réponse : devrait contenir `{ success: true, imageUrl: "data:image/..." }`

**Onglet Console :**
- Ne devrait pas avoir d'erreurs liées à l'upload
- Si erreur 404 : le serveur backend n'est pas démarré ou la route n'est pas chargée

### 5. Vérifier les Logs Backend

Dans le terminal backend, vous devriez voir :
```
POST /api/cms/upload-image 200
```

## 🔍 Debug si ça ne fonctionne pas

### Erreur 404
```bash
# Vérifier que le serveur tourne
curl http://localhost:3001/api/health

# Devrait retourner : {"status":"OK",...}
```

### Erreur 401/403
- Vérifier que vous êtes connecté en tant qu'admin
- Vérifier le token dans localStorage : `localStorage.getItem('token')`

### Erreur dans la Console
- Ouvrir F12 → Console
- Copier l'erreur complète
- Vérifier dans Network → Headers → Request URL

## 🎯 Test Rapide avec curl

Remplacez `YOUR_TOKEN` par un vrai token admin :

```bash
curl -X POST http://localhost:3001/api/cms/upload-image ^
  -H "x-auth-token: YOUR_TOKEN" ^
  -F "image=@public\alliance-courtage-logo.svg"
```

**Réponse attendue :**
```json
{
  "success": true,
  "imageUrl": "data:image/svg+xml;base64,...",
  "mimeType": "image/svg+xml",
  "size": 1234
}
```

## 📌 Notes Importantes

- ⚠️ **Le serveur backend DOIT être redémarré** après avoir ajouté la route
- ⚠️ Le frontend doit utiliser `buildAPIURL('/cms/upload-image')` qui pointe vers `http://localhost:3001/api/cms/upload-image` en local
- ⚠️ L'image est convertie en base64 et stockée directement dans le JSON CMS

