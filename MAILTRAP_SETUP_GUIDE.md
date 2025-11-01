# 📧 Configuration Mailtrap - Guide Complet

## 🎯 Vue d'Ensemble

Mailtrap est un service de test d'emails parfait pour le développement. Il capture tous les emails envoyés sans vraiment les envoyer, ce qui permet de tester sans risquer d'envoyer des emails à de vraies personnes.

---

## 📋 Étape par Étape

### Étape 1 : Créer un Compte Mailtrap

1. **Allez sur** : https://mailtrap.io
2. **Cliquez** sur **"Sign Up"** (en haut à droite)
3. **Choisissez votre méthode** :
   - **Google** : Se connecter avec Google
   - **GitHub** : Se connecter avec GitHub
   - **Email** : Créer un compte avec email/password
4. **Complétez l'inscription** :
   - Email
   - Mot de passe
   - Confirmez votre email

### Étape 2 : Accéder à Votre Inbox

Une fois connecté :

1. Vous êtes automatiquement dans votre **"Inbox"**
2. Vous verrez quelque chose comme : **"My Inbox"** ou **"Inbox #1"**
3. **Si vous avez plusieurs inboxes**, sélectionnez celle que vous voulez utiliser

### Étape 3 : Récupérer les Identifiants SMTP

1. Dans votre inbox, cherchez la section **"SMTP Settings"** ou **"Integration"**
2. Vous verrez quelque chose comme :

```
SMTP Settings:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Host:     sandbox.smtp.mailtrap.io
Port:     587 (or 2525)
Username: abc123def456
Password: xyz789uvw012
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

3. **⚠️ COPIEZ ces informations** :
   - **Host** : `sandbox.smtp.mailtrap.io`
   - **Port** : `587` (ou `2525` si 587 ne fonctionne pas)
   - **Username** : Votre username Mailtrap
   - **Password** : Votre password Mailtrap

4. **Alternative** : Cliquez sur **"Show credentials"** ou **"Copy"** pour copier facilement

### Étape 4 : Noter vos Identifiants

Exemple de ce que vous devriez avoir :

```
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=abc123def456
SMTP_PASSWORD=xyz789uvw012
```

---

## ⚙️ Configuration dans l'Application

### Étape 1 : Modifier config.env

Ouvrez `backend/config.env` et ajoutez/modifiez :

```env
# Configuration SMTP Mailtrap (pour développement/test)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-username-mailtrap
SMTP_PASSWORD=votre-password-mailtrap
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=http://localhost:5173
```

**Remplacez :**
- `votre-username-mailtrap` → Votre Username depuis Mailtrap
- `votre-password-mailtrap` → Votre Password depuis Mailtrap

### Étape 2 : Redémarrer le Backend

```bash
cd backend
# Arrêtez le serveur actuel (Ctrl+C)
npm start
```

---

## 🧪 Tester la Configuration

### Méthode 1 : Script de Test Automatique

```bash
cd backend
node scripts/testEmailReset.js admin@alliance-courtage.fr
```

Vous devriez voir :
```
✅ Configuration SMTP détectée
✅ Email envoyé avec succès!
```

### Méthode 2 : Test via l'Interface

1. Allez sur `http://localhost:5173`
2. Cliquez sur "Mot de passe oublié ?"
3. Entrez un email admin
4. L'email sera capturé par Mailtrap !

### Méthode 3 : Vérifier dans Mailtrap

1. Allez sur https://mailtrap.io
2. Ouvrez votre inbox
3. **L'email devrait apparaître** dans la liste !
4. **Cliquez dessus** pour voir :
   - Le contenu HTML
   - Le contenu texte
   - Les headers
   - Le nouveau mot de passe généré

---

## ✅ Vérification

### Checklist

- [ ] Compte Mailtrap créé
- [ ] Inbox sélectionnée
- [ ] Identifiants SMTP copiés (Host, Port, Username, Password)
- [ ] Configuration ajoutée dans `backend/config.env`
- [ ] Backend redémarré
- [ ] Test d'envoi effectué
- [ ] Email visible dans Mailtrap inbox

---

## 🔍 Exemple d'Email dans Mailtrap

Quand vous ouvrez un email dans Mailtrap, vous verrez :

- **From** : noreply@alliance-courtage.fr
- **To** : admin@alliance-courtage.fr
- **Subject** : 🔐 Réinitialisation de votre mot de passe
- **Body HTML** : Le template complet avec le nouveau mot de passe
- **Body Text** : Version texte
- **Headers** : Tous les en-têtes techniques

**Le nouveau mot de passe sera visible dans le contenu HTML !**

---

## 🐛 Dépannage

### Problème : "Authentication failed"

**Solutions :**
1. ✅ Vérifiez que SMTP_USER et SMTP_PASSWORD sont corrects (copiés depuis Mailtrap)
2. ✅ Vérifiez qu'il n'y a pas d'espaces avant/après
3. ✅ Essayez le port 2525 au lieu de 587

### Problème : "Connection timeout"

**Solutions :**
1. ✅ Vérifiez votre connexion internet
2. ✅ Vérifiez que le firewall n'est pas bloqué
3. ✅ Essayez le port 2525

### Problème : "Email non visible dans Mailtrap"

**Solutions :**
1. ✅ Vérifiez que vous regardez la bonne inbox
2. ✅ Actualisez la page Mailtrap (F5)
3. ✅ Vérifiez les logs backend pour erreurs
4. ✅ Vérifiez que SMTP_FROM n'a pas d'importance pour Mailtrap (peut être n'importe quoi)

---

## 💡 Astuces

### Astuce 1 : Plusieurs Inboxes

Vous pouvez créer plusieurs inboxes pour :
- Tests de réinitialisation de mot de passe
- Tests de notifications
- Tests différents environnements

### Astuce 2 : Email Forwarding (Version Payante)

La version payante de Mailtrap permet de :
- Forwarder les emails vers de vraies adresses
- Tester avec de vrais emails

### Astuce 3 : API Mailtrap

Mailtrap a aussi une API pour :
- Vérifier programmatiquement les emails reçus
- Automatiser les tests

---

## 📊 Limites Mailtrap Free

- **Emails capturés** : Illimité
- **Inboxes** : Plusieurs
- **Rétention** : 30 jours
- **Forwarding** : ❌ Non (version payante)

---

## 🔄 Changer de Mailtrap vers AWS SES

Quand vous voulez passer en production :

1. **Gardez** la configuration Mailtrap pour le développement
2. **Créez** un fichier `config.prod.env` avec AWS SES
3. **Utilisez** des variables d'environnement système en production
4. **Ou** modifiez `config.env` selon l'environnement

---

## ✅ Configuration Finale

Votre `backend/config.env` devrait ressembler à :

```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=alliance_courtage
DB_USER=root
DB_PASSWORD=

# Serveur
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=alliance_courtage_secret_key_2024
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# Uploads
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Configuration SMTP Mailtrap (Développement)
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=abc123def456
SMTP_PASSWORD=xyz789uvw012
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=http://localhost:5173
```

**Redémarrez le backend et testez !** 🚀

---

**🎉 C'est tout ! Mailtrap est configuré et prêt à capturer vos emails de test !**

