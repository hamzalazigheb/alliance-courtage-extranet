# 📧 Configuration Email - Réinitialisation Mot de Passe Admin

## 🎯 Vue d'Ensemble

Le système envoie automatiquement un email avec un nouveau mot de passe généré lorsque un admin demande une réinitialisation pour accéder à `/manage`.

---

## ⚙️ Configuration SMTP

### Variables d'Environnement Requises

Ajoutez ces variables dans `backend/config.env` :

```env
# Configuration SMTP pour l'envoi d'emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=noreply@alliance-courtage.fr

# URL du frontend (pour les liens dans l'email)
FRONTEND_URL=http://localhost:5173
```

---

## 🔧 Configuration pour Différents Fournisseurs

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-application
```

**⚠️ Important pour Gmail :**
1. Activez l'**authentification à 2 facteurs** sur votre compte Gmail
2. Créez un **mot de passe d'application** :
   - Allez dans : Google Account → Sécurité → Mots de passe des applications
   - Créez un mot de passe d'application
   - Utilisez ce mot de passe (pas votre mot de passe Gmail normal)

### Outlook / Office 365

```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@outlook.com
SMTP_PASSWORD=votre-mot-de-passe
```

### Serveur SMTP Personnalisé

```env
SMTP_HOST=smtp.votre-domaine.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@votre-domaine.com
SMTP_PASSWORD=votre-mot-de-passe
SMTP_FROM=noreply@votre-domaine.com
```

### SendGrid

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASSWORD=votre-api-key-sendgrid
SMTP_FROM=noreply@alliance-courtage.fr
```

---

## 🧪 Mode Développement (Sans SMTP)

Si vous n'avez pas configuré SMTP, le système utilise un transporteur de test qui affiche les emails dans la console.

**Pour voir les emails en développement :**
1. Installez `ethereal.email` : `npm install -g ethereal-email`
2. Les emails seront affichés dans la console backend
3. Ou utilisez les identifiants de test fournis par nodemailer

**⚠️ Ne pas utiliser en production !**

---

## 📋 Fonctionnement

### Flux de Réinitialisation

1. **Admin oublie son mot de passe** → Clique sur "Mot de passe oublié ?"
2. **Entre son email** → Confirme la réinitialisation
3. **Système vérifie** → Si c'est un admin :
   - Génère un mot de passe aléatoire sécurisé (12 caractères)
   - Met à jour le mot de passe dans la base de données
   - Envoie un email avec le nouveau mot de passe
4. **Admin reçoit l'email** → Se connecte avec le nouveau mot de passe
5. **Change le mot de passe** → Après la première connexion

### Sécurité

- ✅ Le mot de passe généré est **aléatoire et sécurisé** (12 caractères : majuscules, minuscules, chiffres, symboles)
- ✅ Le mot de passe est **haché avec bcrypt** avant stockage
- ✅ **Aucune révélation** : Si l'email n'est pas un admin, même message générique
- ✅ **Email obligatoire** : Si l'envoi d'email échoue, on informe l'utilisateur

---

## 🧪 Tester la Configuration

### 1. Vérifier les Variables d'Environnement

```bash
cd backend
cat config.env | grep SMTP
```

### 2. Tester l'Envoi d'Email

Créez un script de test (`backend/scripts/testEmail.js`) :

```javascript
const { sendPasswordResetEmail } = require('../services/emailService');

async function testEmail() {
  try {
    await sendPasswordResetEmail(
      'votre-email@test.com',
      'TestPassword123!',
      'Test User'
    );
    console.log('✅ Email envoyé avec succès!');
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testEmail();
```

Exécutez :
```bash
node backend/scripts/testEmail.js
```

### 3. Tester la Réinitialisation Complète

1. Démarrez le serveur backend
2. Allez sur la page de login
3. Cliquez sur "Mot de passe oublié ?"
4. Entrez un email admin
5. Vérifiez votre boîte de réception

---

## 🔍 Dépannage

### Problème : "Erreur lors de l'envoi de l'email"

**Solutions :**
1. ✅ Vérifier que SMTP_USER et SMTP_PASSWORD sont corrects
2. ✅ Pour Gmail, utiliser un mot de passe d'application (pas le mot de passe normal)
3. ✅ Vérifier que le port SMTP est correct (587 pour TLS, 465 pour SSL)
4. ✅ Vérifier les paramètres de pare-feu
5. ✅ Vérifier les logs backend pour détails

### Problème : "Email non reçu"

**Solutions :**
1. ✅ Vérifier les spams/courrier indésirable
2. ✅ Vérifier que l'email de destination est correct
3. ✅ Vérifier les logs backend pour voir si l'email a été envoyé
4. ✅ Tester avec un autre fournisseur d'email

### Problème : "Erreur de connexion SMTP"

**Solutions :**
1. ✅ Vérifier SMTP_HOST et SMTP_PORT
2. ✅ Essayer SMTP_SECURE=true pour le port 465
3. ✅ Vérifier les credentials SMTP
4. ✅ Vérifier la connexion internet

---

## 📝 Format de l'Email Envoyé

L'email envoyé contient :

- ✅ **Sujet** : "🔐 Réinitialisation de votre mot de passe - Alliance Courtage"
- ✅ **Nouveau mot de passe** affiché clairement
- ✅ **Instructions** pour se connecter
- ✅ **Avertissements de sécurité**
- ✅ **Lien direct** vers la page de connexion
- ✅ **Design HTML** professionnel

---

## 🚀 Production

### Checklist Production

- [ ] SMTP configuré avec un service fiable (SendGrid, AWS SES, etc.)
- [ ] SMTP_USER et SMTP_PASSWORD sécurisés (pas en clair dans le code)
- [ ] SMTP_FROM configuré avec un email professionnel
- [ ] FRONTEND_URL pointant vers le domaine de production
- [ ] Tests effectués et emails reçus
- [ ] Logs d'erreur monitorés

### Recommandations

1. **Utiliser un service d'email professionnel** (SendGrid, AWS SES, Mailgun)
2. **Mettre en place un monitoring** des échecs d'envoi
3. **Limiter le taux de demandes** (rate limiting déjà en place)
4. **Logger les réinitialisations** pour sécurité/audit

---

## 📌 Résumé

| Aspect | Détails |
|--------|---------|
| **Fonctionnalité** | Réinitialisation automatique avec email pour admins |
| **Fichiers** | `backend/services/emailService.js`, `backend/routes/adminPasswordReset.js` |
| **Route API** | `POST /api/admin-password-reset/request` |
| **Variables env** | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, etc. |
| **Sécurité** | Mot de passe aléatoire sécurisé, haché avec bcrypt |

---

**⚠️ IMPORTANT** : Configurez SMTP avant d'utiliser en production ! Le mode test ne fonctionne qu'en développement.

