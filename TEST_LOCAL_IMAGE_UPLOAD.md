# 🧪 Guide de Test Local - Upload d'Image CMS

## Étape 1: Démarrer le Backend

```bash
cd backend
npm start
```

Le serveur devrait démarrer sur `http://localhost:3001`

## Étape 2: Démarrer le Frontend

Dans un autre terminal :
```bash
npm run dev
```

Le frontend devrait démarrer sur `http://localhost:5173`

## Étape 3: Tester l'Upload d'Image

1. **Ouvrir le navigateur** : `http://localhost:5173`
2. **Se connecter** en tant qu'admin
3. **Aller dans** `/manage` ou `#manage`
4. **Onglet CMS** → **Rencontres** ou **Gamme Financière**
5. **Cliquer sur "Choisir un fichier"** dans la section "Image d'en-tête"
6. **Sélectionner une image** (JPEG, PNG, GIF, WebP)
7. **Vérifier** que l'image s'affiche en prévisualisation
8. **Sauvegarder** le contenu

## Étape 4: Vérifier les Logs

Dans le terminal backend, vous devriez voir :
- `✅ Email envoyé avec succès` (si SMTP configuré)
- Ou les logs de l'email en mode développement
- `✅ Connexion à la base de données MySQL réussie`

## Vérification de la Route

Testez la route directement avec curl (remplacez YOUR_TOKEN) :

```bash
curl -X POST http://localhost:3001/api/cms/upload-image \
  -H "x-auth-token: YOUR_TOKEN" \
  -F "image=@C:\Users\Hamza\Desktop\saveweb2zip-com-www-extranet-gnca-fr\public\alliance-courtage-logo.svg"
```

## Problèmes Courants

### Erreur 404
- ✅ Vérifier que le backend tourne sur le port 3001
- ✅ Vérifier que la route est bien chargée dans `server.js`
- ✅ Vérifier les logs du backend pour des erreurs

### Erreur 401/403
- ✅ Vérifier que vous êtes connecté en tant qu'admin
- ✅ Vérifier que le token est valide

### Erreur "Cannot read properties of null"
- ✅ Le JSON est peut-être corrompu dans la base de données
- ✅ Utiliser les valeurs par défaut (corrigé dans le code)

## Debug

Ouvrir la console du navigateur (F12) et vérifier :
- Les requêtes réseau vers `/api/cms/upload-image`
- Les erreurs JavaScript
- Les réponses du serveur

