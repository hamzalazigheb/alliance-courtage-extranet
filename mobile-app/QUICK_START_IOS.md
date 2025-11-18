# Guide Rapide - Tester sur iPhone Physique

## Étapes Rapides

### 1. Sur votre Mac

**Trouver l'IP de votre Mac :**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Notez l'IP (ex: `192.168.1.100`)

### 2. Modifier la configuration API

Ouvrir `mobile-app/src/api/config.ts` et remplacer :

```typescript
const MAC_IP = '192.168.1.XXX'; // ⚠️ REMPLACER PAR L'IP DE VOTRE MAC
```

Par votre IP réelle :
```typescript
const MAC_IP = '192.168.1.100'; // Votre IP
```

### 3. Configurer le backend pour accepter les connexions externes

Vérifier que votre backend écoute sur `0.0.0.0` et non `localhost`.

Dans `backend/server.js` ou votre fichier de démarrage :
```javascript
app.listen(3001, '0.0.0.0', () => {
  console.log('Server running on port 3001');
});
```

### 4. Installer les dépendances (si pas déjà fait)

```bash
cd mobile-app
npm install
cd ios
pod install
cd ..
```

### 5. Connecter votre iPhone

- Connecter l'iPhone via USB
- Sur l'iPhone : Accepter "Faire confiance à cet ordinateur"

### 6. Ouvrir dans Xcode

```bash
cd mobile-app/ios
open AllianceCourtageMobile.xcworkspace
```

### 7. Configurer dans Xcode

1. Sélectionner votre iPhone dans la barre d'outils (en haut)
2. Cliquer sur le projet "AllianceCourtageMobile" (à gauche)
3. Onglet "Signing & Capabilities"
4. Cocher "Automatically manage signing"
5. Sélectionner votre **Team** (votre compte Apple)

### 8. Démarrer le serveur Metro

Dans un terminal :
```bash
cd mobile-app
npm start
```

### 9. Démarrer le backend

Dans un autre terminal :
```bash
cd backend
npm start
```

### 10. Lancer l'application

Dans Xcode, cliquer sur le bouton **Play** (▶️) ou `Cmd + R`

### 11. Autoriser l'application sur l'iPhone

Sur l'iPhone :
- Réglages > Général > Gestion des appareils
- Trouver votre profil développeur
- Taper "Faire confiance"

## Vérification

### Tester la connexion API depuis l'iPhone

Sur l'iPhone, ouvrir Safari et aller à :
```
http://VOTRE_IP:3001/api/health
```

Si cela fonctionne, l'API est accessible ✅

## Dépannage Rapide

**"Could not connect to development server"**
- Secouer l'iPhone pour ouvrir le menu développeur
- Settings > Debug server host & port for device
- Entrer : `VOTRE_IP:8081` (ex: `192.168.1.100:8081`)

**"Network request failed"**
- Vérifier que Mac et iPhone sont sur le même WiFi
- Vérifier l'IP dans `src/api/config.ts`
- Vérifier que le backend écoute sur `0.0.0.0`

**L'application ne se lance pas**
- Vérifier la signature dans Xcode
- Vérifier que vous avez sélectionné votre iPhone comme destination

## Commandes Utiles

```bash
# Démarrer Metro
cd mobile-app && npm start

# Lancer sur iPhone
cd mobile-app && npm run ios -- --device

# Voir les logs
# Dans Xcode : Window > Devices and Simulators > Votre iPhone > View Device Logs
```




