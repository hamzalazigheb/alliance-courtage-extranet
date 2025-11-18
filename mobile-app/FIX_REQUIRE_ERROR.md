# Correction de l'erreur "Property 'require' doesn't exist"

## Problème

L'erreur vient de l'utilisation de `require()` dans un fichier TypeScript avec Expo. Expo/React Native moderne utilise ES6 `import` au lieu de `require()`.

## Solution appliquée

Le fichier `mobile-app/src/api/config.ts` a été corrigé :
- ❌ Avant : `const AsyncStorage = require('@react-native-async-storage/async-storage').default;`
- ✅ Après : `import AsyncStorage from '@react-native-async-storage/async-storage';`

## Redémarrer l'application

```bash
cd mobile-app

# Nettoyer le cache et redémarrer
npx expo start --clear

# Ou si vous utilisez npm start
npm run start:clear
```

## Vérifications

1. ✅ `require()` remplacé par `import` dans `config.ts`
2. ✅ Import placé en haut du fichier
3. ✅ Cache nettoyé avec `--clear`

## Si l'erreur persiste

1. **Vérifier qu'il n'y a pas d'autres `require()` dans le code** :
```bash
cd mobile-app
grep -r "require(" src/
```

2. **Réinstaller les dépendances** :
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

3. **Vérifier la configuration Babel** :
Le fichier `babel.config.js` doit utiliser la fonction avec `api.cache(true)` (déjà fait).

## Test

Après avoir redémarré avec `--clear`, l'application devrait se charger correctement sur votre iPhone.




