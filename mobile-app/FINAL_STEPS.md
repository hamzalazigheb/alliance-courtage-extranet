# 🎯 Étapes Finales - Test sur iPhone (Sans Mac)

## ✅ Installation Automatique

Double-cliquer sur : `mobile-app/install.bat`

Ou manuellement :
```bash
cd mobile-app
npm install
npm install -g expo-cli
npm install expo
npx expo install
```

---

## 📱 Étapes Finales

### 1. Installer Expo Go sur iPhone
- Ouvrir App Store
- Chercher "Expo Go"
- Installer

### 2. Trouver l'IP de votre PC Windows

Ouvrir CMD et taper :
```cmd
ipconfig
```

Chercher "IPv4 Address" (ex: `192.168.1.100`)

### 3. Configurer l'API

Ouvrir `mobile-app/src/api/config.ts`

Remplacer :
```typescript
const MAC_IP = '192.168.1.XXX';
```

Par votre IP réelle :
```typescript
const MAC_IP = '192.168.1.100'; // Votre IP
```

Et modifier la ligne de retour :
```typescript
return `http://${MAC_IP}:3001/api`;
```

### 4. Démarrer le Backend

Dans un terminal :
```bash
cd backend
npm start
```

Vérifier que le backend écoute sur `0.0.0.0` (toutes les interfaces).

### 5. Démarrer Expo

Dans un autre terminal :
```bash
cd mobile-app
npx expo start
```

Un QR code apparaîtra dans le terminal.

### 6. Scanner avec Expo Go

- Ouvrir **Expo Go** sur votre iPhone
- Appuyer sur "Scan QR Code"
- Scanner le QR code du terminal
- L'application se chargera sur votre iPhone

### 7. Tester

- L'écran de login devrait apparaître
- Se connecter avec vos identifiants
- Tester les fonctionnalités

---

## ⚠️ Important

- **PC et iPhone doivent être sur le même réseau WiFi**
- **Le backend doit être démarré**
- **L'IP doit être correcte dans config.ts**

---

## 🔧 Si ça ne fonctionne pas

### Erreur "Unable to connect"
- Vérifier que PC et iPhone sont sur le même WiFi
- Vérifier l'IP dans config.ts
- Vérifier que le backend est démarré

### Erreur "Network request failed"
- Tester l'API depuis Safari sur iPhone : `http://VOTRE_IP:3001/api/health`
- Vérifier le firewall Windows (autoriser Node.js)

### Expo Go ne charge pas l'app
- Vérifier que vous avez scanné le bon QR code
- Redémarrer Expo : `npx expo start --clear`

---

## ✅ C'est tout !

Une fois ces étapes terminées, vous pourrez tester l'application sur votre iPhone sans avoir besoin d'un Mac.




