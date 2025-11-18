# Installation et Test sur iPhone (Sans Mac)

## ⚠️ Problème : Pas de Mac

Pour tester une app React Native sur iPhone, vous avez normalement besoin d'un **Mac avec Xcode**. Mais il existe des solutions :

## Option 1 : Utiliser Expo (Recommandé - Pas besoin de Mac)

Expo permet de tester sur iPhone sans Mac en utilisant Expo Go.

### Installation Expo

```bash
cd mobile-app
npm install -g expo-cli
npm install expo
npx expo install
```

### Modifier le projet pour Expo

Créer `mobile-app/app.json` :
```json
{
  "expo": {
    "name": "Alliance Courtage",
    "slug": "alliance-courtage",
    "version": "1.0.0",
    "platforms": ["ios", "android"],
    "ios": {
      "bundleIdentifier": "com.alliancecourtage"
    }
  }
}
```

### Lancer avec Expo

```bash
cd mobile-app
npx expo start
```

Puis scanner le QR code avec l'app **Expo Go** sur votre iPhone.

## Option 2 : Mac dans le Cloud (Payant)

Services qui fournissent un Mac dans le cloud :
- **MacStadium** : https://www.macstadium.com/
- **AWS Device Farm** : https://aws.amazon.com/device-farm/
- **MacinCloud** : https://www.macincloud.com/

## Option 3 : Tester sur Android pour l'instant (Gratuit)

Android fonctionne parfaitement sur Windows. Vous pouvez tester toutes les fonctionnalités sur Android, puis tester sur iOS plus tard.

## Option 4 : Utiliser un Mac emprunté/partagé

Si vous avez accès à un Mac (même temporairement), vous pouvez :
1. Configurer le projet sur le Mac
2. Tester sur votre iPhone
3. Continuer le développement sur Windows

---

## 🚀 Installation Rapide (Toutes les dépendances)

### Étape 1 : Installer Node.js
Télécharger depuis : https://nodejs.org/ (version 18+)

### Étape 2 : Installer les dépendances du projet

```bash
cd mobile-app
npm install
```

### Étape 3 : Pour Android (si vous voulez tester sur Android)

```bash
# Installer Android Studio
# Télécharger depuis : https://developer.android.com/studio

# Configurer les variables d'environnement
# Ajouter dans les variables système :
# ANDROID_HOME = C:\Users\VOTRE_NOM\AppData\Local\Android\Sdk
# PATH += %ANDROID_HOME%\platform-tools
```

### Étape 4 : Pour iOS avec Expo

```bash
cd mobile-app
npm install -g expo-cli
npm install expo
npx expo install
```

---

## 📱 Test Final avec Expo (Sans Mac)

### 1. Installer Expo Go sur votre iPhone
- Aller sur l'App Store
- Chercher "Expo Go"
- Installer l'application

### 2. Démarrer le serveur Expo

```bash
cd mobile-app
npx expo start
```

### 3. Scanner le QR code
- Ouvrir Expo Go sur votre iPhone
- Scanner le QR code affiché dans le terminal
- L'application se chargera sur votre iPhone

### 4. Configurer l'API

Modifier `mobile-app/src/api/config.ts` :
```typescript
const getApiBaseUrl = (): string => {
  // Trouver l'IP de votre PC Windows
  // Ouvrir CMD et taper : ipconfig
  // Chercher "IPv4 Address" (ex: 192.168.1.100)
  const PC_IP = '192.168.1.XXX'; // ⚠️ REMPLACER PAR VOTRE IP
  
  return `http://${PC_IP}:3001/api`;
};
```

### 5. Démarrer le backend

```bash
cd backend
npm start
```

Assurez-vous que le backend écoute sur `0.0.0.0` (toutes les interfaces).

---

## ✅ Checklist Finale

- [ ] Node.js installé
- [ ] `cd mobile-app && npm install` exécuté
- [ ] Expo Go installé sur iPhone
- [ ] Backend démarré sur PC
- [ ] IP du PC configurée dans `src/api/config.ts`
- [ ] PC et iPhone sur le même WiFi
- [ ] `npx expo start` lancé
- [ ] QR code scanné avec Expo Go
- [ ] Application chargée sur iPhone

---

## 🔧 Si Expo ne fonctionne pas

Vous pouvez toujours :
1. **Tester sur Android** (fonctionne parfaitement sur Windows)
2. **Utiliser un service cloud Mac** (payant mais efficace)
3. **Attendre d'avoir accès à un Mac** pour tester iOS nativement

L'application fonctionnera de la même manière sur Android et iOS une fois configurée.




