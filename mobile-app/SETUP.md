# Guide de configuration - Alliance Courtage Mobile

## Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn
- Pour iOS : Xcode et CocoaPods
- Pour Android : Android Studio et JDK

## Installation

1. Installer les dépendances :
```bash
cd mobile-app
npm install
# ou
yarn install
```

2. Pour iOS, installer les pods :
```bash
cd ios
pod install
cd ..
```

## Configuration de l'API

1. Créer un fichier `.env` à la racine de `mobile-app/` :
```
API_BASE_URL=http://localhost:3001/api
```

Pour la production, remplacer par l'URL de votre serveur :
```
API_BASE_URL=https://votre-domaine.com/api
```

2. Modifier `src/api/config.ts` si nécessaire pour ajuster la logique de détection de l'environnement.

## Exécution

### iOS
```bash
npm run ios
# ou
yarn ios
```

### Android
```bash
npm run android
# ou
yarn android
```

## Structure du projet

- `src/api/` - Client API pour toutes les routes backend
- `src/components/` - Composants réutilisables (Button, Input, Card, etc.)
- `src/screens/` - Écrans de l'application
- `src/navigation/` - Configuration de la navigation
- `src/context/` - Context API (AuthContext)
- `src/utils/` - Utilitaires (theme, fileUtils)

## Fonctionnalités implémentées

✅ Authentification (login/logout)
✅ Écran d'accueil avec notifications
✅ Formations (liste, filtres, téléchargement)
✅ Produits structurés (liste, réservation)
✅ Comptabilité (bordereaux)
✅ Simulateurs (accès et logging)
✅ Profil (informations, changement de mot de passe)

## Notes importantes

- L'application se connecte à la même API backend que l'application web
- Le token JWT est stocké de manière sécurisée avec AsyncStorage
- Les fichiers peuvent être téléchargés et ouverts avec react-native-file-viewer
- Le design utilise un thème cohérent défini dans `src/utils/theme.ts`

## Prochaines étapes

1. Installer les dépendances
2. Configurer l'URL de l'API
3. Tester sur simulateur/émulateur
4. Tester sur appareils physiques
5. Ajuster le design si nécessaire
6. Implémenter les fonctionnalités de simulation complètes
7. Ajouter les écrans CMS (Gamme Produits, Partenaires, Rencontres, Réglementaire)




