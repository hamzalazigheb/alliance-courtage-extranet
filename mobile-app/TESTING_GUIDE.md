# Guide de Test - Alliance Courtage Mobile

## Prérequis

### Pour Android (Recommandé sur Windows)
1. **Node.js** (version 18+) - [Télécharger](https://nodejs.org/)
2. **Java JDK 17** - [Télécharger](https://adoptium.net/)
3. **Android Studio** - [Télécharger](https://developer.android.com/studio)
4. **Android SDK** (via Android Studio)
5. **Émulateur Android** ou appareil physique avec USB debugging activé

### Pour iOS (Nécessite Mac)
1. **Xcode** (via App Store)
2. **CocoaPods** - `sudo gem install cocoapods`
3. **Simulateur iOS** (via Xcode)

## Installation

### 1. Installer les dépendances Node.js

```bash
cd mobile-app
npm install
```

### 2. Configuration de l'API

Créer un fichier `.env` à la racine de `mobile-app/` :

```env
API_BASE_URL=http://localhost:3001/api
```

**Important** : 
- Pour tester avec un appareil physique, remplacez `localhost` par l'IP de votre machine (ex: `http://192.168.1.100:3001/api`)
- Pour la production, utilisez l'URL de votre serveur (ex: `https://api.alliance-courtage.fr/api`)

### 3. Modifier la configuration API

Ouvrir `mobile-app/src/api/config.ts` et ajuster si nécessaire :

```typescript
const getApiBaseUrl = (): string => {
  // Pour développement local
  return 'http://localhost:3001/api';
  
  // Pour appareil physique, utiliser votre IP :
  // return 'http://192.168.1.100:3001/api';
  
  // Pour production :
  // return 'https://votre-domaine.com/api';
};
```

## Test sur Android

### Option 1 : Émulateur Android

1. **Démarrer Android Studio**
2. **Ouvrir AVD Manager** (Android Virtual Device Manager)
3. **Créer un nouvel émulateur** si nécessaire :
   - Cliquer sur "Create Virtual Device"
   - Choisir un appareil (ex: Pixel 5)
   - Choisir une version d'Android (API 33+ recommandé)
   - Cliquer sur "Finish"
4. **Démarrer l'émulateur** depuis AVD Manager

5. **Lancer l'application** :
```bash
cd mobile-app
npm run android
```

### Option 2 : Appareil physique Android

1. **Activer le mode développeur** sur votre appareil :
   - Aller dans Paramètres > À propos du téléphone
   - Taper 7 fois sur "Numéro de build"
2. **Activer USB Debugging** :
   - Paramètres > Options développeur > USB Debugging
3. **Connecter l'appareil** via USB
4. **Autoriser le débogage USB** quand demandé
5. **Vérifier la connexion** :
```bash
adb devices
```
Vous devriez voir votre appareil listé.

6. **Lancer l'application** :
```bash
cd mobile-app
npm run android
```

### Option 3 : Appareil physique via WiFi (sans USB)

1. Connecter l'appareil et l'ordinateur au même réseau WiFi
2. Obtenir l'IP de votre ordinateur :
   - Windows : `ipconfig` (chercher IPv4)
   - Mac/Linux : `ifconfig` ou `ip addr`
3. Modifier `mobile-app/src/api/config.ts` :
```typescript
return 'http://VOTRE_IP:3001/api'; // Ex: http://192.168.1.100:3001/api
```
4. Démarrer le serveur Metro :
```bash
cd mobile-app
npm start
```
5. Sur l'appareil, ouvrir l'app React Native et secouer l'appareil pour ouvrir le menu développeur
6. Choisir "Settings" > "Debug server host & port for device"
7. Entrer : `VOTRE_IP:8081` (ex: `192.168.1.100:8081`)

## Test sur iOS (Mac uniquement)

### 1. Installer CocoaPods

```bash
cd mobile-app/ios
pod install
cd ..
```

### 2. Lancer sur simulateur iOS

```bash
cd mobile-app
npm run ios
```

### 3. Lancer sur appareil physique iOS

1. Ouvrir `mobile-app/ios/AllianceCourtageMobile.xcworkspace` dans Xcode
2. Sélectionner votre appareil dans la liste des destinations
3. Configurer le Signing & Capabilities avec votre compte Apple Developer
4. Cliquer sur "Run" ou utiliser :
```bash
npm run ios -- --device
```

## Démarrer le serveur Metro (Bundler)

Le serveur Metro est nécessaire pour charger le code JavaScript :

```bash
cd mobile-app
npm start
```

Ou dans un terminal séparé :
```bash
npx react-native start
```

## Vérifier que le backend fonctionne

Avant de tester l'app mobile, assurez-vous que votre backend est démarré :

```bash
cd backend
npm start
# ou
node server.js
```

Le backend doit être accessible sur `http://localhost:3001`

## Tests à effectuer

### 1. Test de connexion
- [ ] Ouvrir l'application
- [ ] Voir l'écran de login
- [ ] Se connecter avec un compte utilisateur valide
- [ ] Vérifier la redirection vers l'écran d'accueil

### 2. Test de navigation
- [ ] Naviguer entre les onglets (Accueil, Formations, Produits, Comptabilité, Profil)
- [ ] Vérifier que chaque écran se charge correctement

### 3. Test des formations
- [ ] Voir la liste des formations
- [ ] Filtrer par année
- [ ] Voir les détails d'une formation
- [ ] Télécharger un fichier (si disponible)

### 4. Test des produits structurés
- [ ] Voir la liste des produits
- [ ] Voir les montants disponibles
- [ ] Créer une réservation
- [ ] Vérifier la confirmation

### 5. Test de la comptabilité
- [ ] Voir la liste des bordereaux
- [ ] Télécharger un bordereau

### 6. Test du profil
- [ ] Voir les informations utilisateur
- [ ] Modifier le mot de passe
- [ ] Se déconnecter

### 7. Test des notifications
- [ ] Voir les notifications sur l'écran d'accueil
- [ ] Vérifier le compteur de notifications non lues

## Dépannage

### Erreur "Unable to resolve module"
```bash
cd mobile-app
rm -rf node_modules
npm install
npm start -- --reset-cache
```

### Erreur "Metro bundler not found"
```bash
cd mobile-app
npm start
```
Laissez ce terminal ouvert et lancez l'app dans un autre terminal.

### Erreur de connexion API
1. Vérifier que le backend est démarré
2. Vérifier l'URL dans `src/api/config.ts`
3. Pour appareil physique, utiliser l'IP au lieu de localhost
4. Vérifier que le port 3001 n'est pas bloqué par le firewall

### Erreur Android "SDK location not found"
1. Ouvrir Android Studio
2. File > Settings > Appearance & Behavior > System Settings > Android SDK
3. Noter le "Android SDK Location"
4. Créer un fichier `mobile-app/android/local.properties` :
```properties
sdk.dir=C:\\Users\\VOTRE_NOM\\AppData\\Local\\Android\\Sdk
```

### Erreur iOS "Pod install failed"
```bash
cd mobile-app/ios
pod deintegrate
pod install
```

## Commandes utiles

```bash
# Nettoyer le cache
npm start -- --reset-cache

# Nettoyer le build Android
cd android
./gradlew clean
cd ..

# Nettoyer le build iOS
cd ios
rm -rf build
pod deintegrate
pod install
cd ..

# Voir les logs Android
adb logcat

# Voir les logs iOS
# Dans Xcode : Window > Devices and Simulators > Votre appareil > View Device Logs
```

## Prochaines étapes

Une fois les tests de base réussis :
1. Implémenter les simulateurs complets
2. Ajouter les écrans CMS (Gamme Produits, Partenaires, etc.)
3. Améliorer la gestion des fichiers
4. Ajouter les notifications push
5. Optimiser les performances
6. Préparer pour la publication (App Store / Google Play)




