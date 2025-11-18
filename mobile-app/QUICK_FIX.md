# Correction Rapide - Erreur "Property 'require' doesn't exist"

## ✅ Corrections appliquées

1. **`require()` remplacé par `import`** dans `config.ts`
2. **Import AsyncStorage** déplacé en haut du fichier
3. **`__DEV__`** vérifié pour compatibilité Expo

## 🚀 Redémarrer maintenant

```bash
cd mobile-app

# Nettoyer le cache et redémarrer
npx expo start --clear
```

## 📱 Sur votre iPhone

1. Ouvrir **Expo Go**
2. Scanner le **nouveau QR code** (après le redémarrage)
3. L'application devrait se charger sans erreur

## ⚙️ Configuration IP (Important)

Avant de tester, modifier `mobile-app/src/api/config.ts` :

1. Trouver l'IP de votre PC :
   ```cmd
   ipconfig
   ```
   Chercher "IPv4 Address" (ex: `192.168.1.100`)

2. Modifier la ligne dans `config.ts` :
   ```typescript
   const PC_IP = '192.168.1.100'; // Votre IP réelle
   ```

3. Redémarrer :
   ```bash
   npx expo start --clear
   ```

## ✅ C'est tout !

L'erreur `require` est corrigée. Il suffit de redémarrer avec `--clear` et l'application devrait fonctionner.




