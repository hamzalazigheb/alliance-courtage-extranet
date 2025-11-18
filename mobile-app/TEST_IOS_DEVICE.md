# Tester sur Appareil iOS Physique

## Prérequis

⚠️ **Important** : Pour tester sur un appareil iOS, vous avez besoin d'un **Mac avec Xcode**. Si vous êtes sur Windows, vous avez plusieurs options :

### Option 1 : Utiliser un Mac (Recommandé)
- Mac avec macOS installé
- Xcode (via App Store)
- CocoaPods installé

### Option 2 : Utiliser un service cloud (si pas de Mac)
- [MacStadium](https://www.macstadium.com/) - Mac dans le cloud
- [AWS Device Farm](https://aws.amazon.com/device-farm/) - Test sur appareils réels
- [Appetize.io](https://appetize.io/) - Simulateur iOS dans le navigateur

## Configuration sur Mac

### 1. Installer les dépendances

```bash
cd mobile-app
npm install
```

### 2. Installer CocoaPods

```bash
cd ios
pod install
cd ..
```

### 3. Configurer l'URL de l'API pour l'appareil

Puisque vous testez sur un appareil physique, vous devez utiliser l'IP de votre Mac au lieu de `localhost`.

**Trouver l'IP de votre Mac :**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Ou allez dans : Préférences Système > Réseau > Sélectionner votre connexion > L'IP s'affiche

**Modifier `mobile-app/src/api/config.ts` :**

```typescript
const getApiBaseUrl = (): string => {
  // Pour appareil iOS physique, utiliser l'IP de votre Mac
  return 'http://192.168.1.XXX:3001/api'; // Remplacez XXX par votre IP
  
  // Exemple : return 'http://192.168.1.100:3001/api';
};
```

**Important** : Assurez-vous que votre Mac et votre iPhone sont sur le **même réseau WiFi**.

### 4. Configurer Xcode pour votre appareil

1. **Ouvrir le projet dans Xcode :**
```bash
cd mobile-app/ios
open AllianceCourtageMobile.xcworkspace
```
⚠️ Utilisez `.xcworkspace` et non `.xcodeproj`

2. **Connecter votre iPhone** via USB

3. **Sélectionner votre appareil** dans la barre d'outils Xcode (en haut, à côté du bouton Play)

4. **Configurer le Signing :**
   - Cliquer sur le projet "AllianceCourtageMobile" dans le navigateur de gauche
   - Sélectionner la cible "AllianceCourtageMobile"
   - Aller dans l'onglet "Signing & Capabilities"
   - Cocher "Automatically manage signing"
   - Sélectionner votre **Team** (votre compte Apple Developer)
   - Si vous n'avez pas de compte développeur, créez-en un gratuit sur [developer.apple.com](https://developer.apple.com)

5. **Faire confiance à votre Mac sur l'iPhone :**
   - Sur l'iPhone, quand vous le connectez, une alerte apparaît
   - Taper "Faire confiance" et entrer le code de l'iPhone

### 5. Démarrer le serveur Metro

Dans un terminal, démarrer le bundler Metro :

```bash
cd mobile-app
npm start
```

Laissez ce terminal ouvert.

### 6. Lancer l'application sur l'appareil

**Option A : Depuis Xcode**
- Cliquer sur le bouton **Play** (▶️) dans Xcode
- Ou appuyer sur `Cmd + R`

**Option B : Depuis la ligne de commande**
```bash
cd mobile-app
npm run ios -- --device
```

### 7. Autoriser l'application sur l'iPhone

La première fois :
1. Sur l'iPhone, aller dans : **Réglages > Général > Gestion des appareils**
2. Trouver votre profil développeur
3. Taper "Faire confiance" pour autoriser l'application

## Configuration du Backend

### Vérifier que le backend est accessible

Sur votre Mac, vérifiez que le backend écoute sur toutes les interfaces (pas seulement localhost) :

**Modifier `backend/server.js` ou votre fichier de démarrage :**

```javascript
// Au lieu de :
app.listen(3001, 'localhost', () => {
  console.log('Server running on port 3001');
});

// Utiliser :
app.listen(3001, '0.0.0.0', () => {
  console.log('Server running on port 3001');
});
```

Cela permet au backend d'être accessible depuis d'autres appareils sur le réseau.

### Démarrer le backend

```bash
cd backend
npm start
# ou
node server.js
```

Vérifiez que le backend est accessible depuis votre Mac :
```bash
curl http://localhost:3001/api/health
# ou
curl http://VOTRE_IP:3001/api/health
```

## Test de connexion

### 1. Vérifier la connexion réseau

Sur votre iPhone, ouvrir Safari et aller à :
```
http://VOTRE_IP:3001/api/health
```

Si cela fonctionne, l'API est accessible depuis l'iPhone.

### 2. Tester l'application

1. Lancer l'application sur l'iPhone
2. Vous devriez voir l'écran de login
3. Entrer vos identifiants
4. L'application devrait se connecter au backend

## Dépannage

### Erreur "Could not connect to development server"

1. **Vérifier que Metro est démarré :**
```bash
cd mobile-app
npm start
```

2. **Vérifier l'IP dans l'application :**
   - Secouer l'iPhone pour ouvrir le menu développeur
   - Aller dans "Settings" > "Debug server host & port for device"
   - Entrer : `VOTRE_IP:8081` (ex: `192.168.1.100:8081`)

3. **Vérifier le firewall :**
   - Sur Mac : Préférences Système > Sécurité > Pare-feu
   - Autoriser Node.js et Metro

### Erreur "No devices found"

1. Vérifier que l'iPhone est connecté via USB
2. Vérifier que vous avez fait confiance au Mac sur l'iPhone
3. Dans Xcode : Window > Devices and Simulators
4. Vérifier que l'iPhone apparaît dans la liste

### Erreur de signature (Code Signing)

1. Dans Xcode, aller dans Signing & Capabilities
2. Sélectionner votre Team
3. Si pas de Team, créer un compte Apple Developer gratuit
4. Xcode créera automatiquement un certificat de développement

### L'application ne se connecte pas à l'API

1. **Vérifier l'IP dans `src/api/config.ts`**
2. **Vérifier que le backend écoute sur `0.0.0.0` et non `localhost`**
3. **Tester l'API depuis Safari sur l'iPhone :**
   ```
   http://VOTRE_IP:3001/api/health
   ```
4. **Vérifier que Mac et iPhone sont sur le même WiFi**

### Erreur "Network request failed"

1. Vérifier que le backend est démarré
2. Vérifier l'URL dans `src/api/config.ts`
3. Vérifier que le port 3001 n'est pas bloqué
4. Tester avec Safari sur l'iPhone pour confirmer l'accessibilité

## Commandes rapides

```bash
# Démarrer Metro
cd mobile-app
npm start

# Lancer sur appareil iOS
npm run ios -- --device

# Voir les logs
# Dans Xcode : Window > Devices and Simulators > Sélectionner l'appareil > View Device Logs

# Nettoyer et reconstruire
cd ios
rm -rf build
pod deintegrate
pod install
cd ..
npm start -- --reset-cache
```

## Alternative : Test sans Mac (Windows)

Si vous n'avez pas de Mac, vous pouvez :

1. **Utiliser Expo** (nécessite de modifier le projet)
2. **Utiliser un Mac virtuel** (contre les conditions d'Apple)
3. **Utiliser un service cloud** comme MacStadium
4. **Tester uniquement sur Android** (fonctionne sur Windows)

## Prochaines étapes

Une fois que l'application fonctionne sur votre iPhone :
1. Tester toutes les fonctionnalités
2. Vérifier les performances
3. Tester sur différents modèles d'iPhone
4. Préparer pour la publication sur l'App Store




