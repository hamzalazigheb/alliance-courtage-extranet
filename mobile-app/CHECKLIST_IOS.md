# Checklist - Test sur iPhone Physique

## ✅ Avant de commencer

- [ ] Mac avec Xcode installé
- [ ] iPhone connecté au même réseau WiFi que le Mac
- [ ] iPhone connecté via USB au Mac
- [ ] Compte Apple Developer (gratuit) configuré

## ✅ Configuration

### 1. Trouver l'IP de votre Mac
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
IP trouvée : `_________________`

### 2. Modifier `mobile-app/src/api/config.ts`
- [ ] Remplacer `192.168.1.XXX` par votre IP réelle
- [ ] Vérifier que la ligne utilise votre IP (pas localhost)

### 3. Vérifier le backend
- [ ] Backend démarré sur le port 3001
- [ ] Backend accessible depuis Safari sur iPhone : `http://VOTRE_IP:3001/api/health`

### 4. Configuration CORS (si nécessaire)
Si vous avez des erreurs CORS, modifier `backend/server.js` :
```javascript
const corsOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:5173', 'http://VOTRE_IP:5173'];
```
Ou temporairement en développement :
```javascript
app.use(cors({
  origin: '*', // ⚠️ Seulement en développement
  credentials: true,
}));
```

## ✅ Installation

- [ ] `cd mobile-app && npm install`
- [ ] `cd ios && pod install && cd ..`

## ✅ Xcode

- [ ] Projet ouvert : `mobile-app/ios/AllianceCourtageMobile.xcworkspace`
- [ ] iPhone sélectionné comme destination
- [ ] Signing configuré avec votre Team
- [ ] "Automatically manage signing" coché

## ✅ Démarrage

- [ ] Terminal 1 : `cd mobile-app && npm start` (Metro bundler)
- [ ] Terminal 2 : `cd backend && npm start` (Backend API)
- [ ] Xcode : Cliquer sur Play (▶️) ou `Cmd + R`

## ✅ Sur l'iPhone

- [ ] Accepter "Faire confiance à cet ordinateur" (si demandé)
- [ ] Réglages > Général > Gestion des appareils > Faire confiance au profil développeur
- [ ] Application lancée et écran de login visible

## ✅ Test de connexion

- [ ] Entrer email et mot de passe
- [ ] Connexion réussie
- [ ] Redirection vers l'écran d'accueil
- [ ] Données chargées (formations, produits, etc.)

## 🔧 Si ça ne fonctionne pas

### Erreur "Could not connect to development server"
- [ ] Secouer l'iPhone pour ouvrir le menu développeur
- [ ] Settings > Debug server host & port for device
- [ ] Entrer : `VOTRE_IP:8081`

### Erreur "Network request failed"
- [ ] Mac et iPhone sur le même WiFi ?
- [ ] IP correcte dans `src/api/config.ts` ?
- [ ] Backend accessible depuis Safari sur iPhone ?
- [ ] Firewall du Mac autorise Node.js ?

### Erreur de signature
- [ ] Team sélectionné dans Xcode ?
- [ ] Compte Apple Developer valide ?
- [ ] "Automatically manage signing" coché ?

## 📝 Notes

- IP du Mac : `_________________`
- Port backend : `3001`
- Port Metro : `8081`
- Date du test : `_________________`




