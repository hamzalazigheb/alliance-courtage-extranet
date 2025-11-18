# Correction des Erreurs Expo

## Problèmes identifiés

1. **Erreur 500** : Le serveur Metro ne répond pas correctement
2. **Erreur MIME type** : Expo essaie de charger le bundle comme JSON au lieu de JavaScript

## Solutions appliquées

### 1. Configuration Expo correcte

Les fichiers suivants ont été mis à jour :
- `app.json` : Configuration Expo complète
- `index.js` : Utilise `registerRootComponent` d'Expo
- `metro.config.js` : Configuration Metro pour Expo

### 2. Commandes à exécuter

```bash
cd mobile-app

# Nettoyer le cache
npx expo start --clear

# Ou si ça ne fonctionne pas :
rm -rf node_modules
npm install
npx expo start --clear
```

### 3. Si l'erreur persiste

**Option A : Utiliser React Native standard (sans Expo)**

Si vous avez un Mac, vous pouvez utiliser React Native standard :

```bash
cd mobile-app
npm run ios
```

**Option B : Créer les assets manquants**

Expo nécessite des images. Créer un dossier `assets` :

```bash
cd mobile-app
mkdir assets
```

Puis créer des images placeholder ou utiliser des images temporaires.

**Option C : Désactiver le mode web**

Forcer Expo à utiliser uniquement iOS/Android :

```bash
npx expo start --ios
# ou
npx expo start --android
```

## Commandes de test

```bash
# 1. Nettoyer et redémarrer
cd mobile-app
npx expo start --clear

# 2. Sur iPhone, ouvrir Expo Go et scanner le QR code

# 3. Si erreur, vérifier que le backend est démarré
cd ../backend
npm start
```

## Vérifications

- [ ] `app.json` contient la configuration Expo
- [ ] `index.js` utilise `registerRootComponent`
- [ ] `metro.config.js` utilise la config Expo
- [ ] Cache nettoyé avec `--clear`
- [ ] Backend démarré sur le port 3001




