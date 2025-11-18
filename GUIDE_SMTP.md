# 📧 Guide de Configuration SMTP

Ce guide vous explique comment configurer le service SMTP pour l'envoi d'emails dans l'application Alliance Courtage.

## 🎯 Options disponibles

### Option 1 : Mailtrap (Recommandé pour développement/test)

**Avantages :**
- ✅ Gratuit (500 emails/mois)
- ✅ Parfait pour tester les emails
- ✅ Interface web pour voir les emails envoyés
- ✅ Pas besoin de configurer un domaine

**Étapes :**

1. **Créer un compte Mailtrap**
   - Allez sur https://mailtrap.io
   - Créez un compte gratuit
   - Confirmez votre email

2. **Obtenir les identifiants SMTP**
   - Connectez-vous à votre compte Mailtrap
   - Allez dans **"Inboxes"** (menu de gauche)
   - Cliquez sur votre inbox (ou créez-en une nouvelle)
   - Cliquez sur l'onglet **"SMTP Settings"**
   - Sélectionnez **"Nodemailer"** dans la liste déroulante
   - Vous verrez les identifiants :
     - **Host:** `sandbox.smtp.mailtrap.io`
     - **Port:** `587`
     - **Username:** (votre username)
     - **Password:** (votre password)

3. **Mettre à jour `backend/config.env`**
   ```ini
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=votre-username-mailtrap
   SMTP_PASSWORD=votre-password-mailtrap
   SMTP_FROM=noreply@alliance-courtage.fr
   ```

4. **Redémarrer le serveur**
   ```bash
   cd backend
   npm run dev
   ```

---

### Option 2 : Gmail (Pour production)

**Avantages :**
- ✅ Gratuit
- ✅ Fiable
- ✅ Limite élevée (2000 emails/jour)

**Étapes :**

1. **Activer l'authentification à deux facteurs**
   - Allez sur https://myaccount.google.com/security
   - Activez la "Validation en deux étapes"

2. **Créer un mot de passe d'application**
   - Allez sur https://myaccount.google.com/apppasswords
   - Sélectionnez "Mail" et "Autre (nom personnalisé)"
   - Entrez "Alliance Courtage"
   - Copiez le mot de passe généré (16 caractères)

3. **Mettre à jour `backend/config.env`**
   ```ini
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=votre-email@gmail.com
   SMTP_PASSWORD=votre-mot-de-passe-application-16-caracteres
   SMTP_FROM=votre-email@gmail.com
   ```

---

### Option 3 : SendGrid (Pour production)

**Avantages :**
- ✅ 100 emails/jour gratuits
- ✅ Très fiable
- ✅ API et SMTP disponibles

**Étapes :**

1. **Créer un compte SendGrid**
   - Allez sur https://sendgrid.com
   - Créez un compte gratuit
   - Vérifiez votre email

2. **Créer une API Key**
   - Allez dans **Settings** → **API Keys**
   - Cliquez sur **"Create API Key"**
   - Donnez-lui un nom (ex: "Alliance Courtage")
   - Copiez la clé générée

3. **Mettre à jour `backend/config.env`**
   ```ini
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASSWORD=votre-api-key-sendgrid
   SMTP_FROM=noreply@alliance-courtage.fr
   ```

---

### Option 4 : OVH / Autre hébergeur

Si vous avez un hébergement OVH ou similaire :

```ini
SMTP_HOST=ssl0.ovh.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@votre-domaine.com
SMTP_PASSWORD=votre-mot-de-passe-email
SMTP_FROM=votre-email@votre-domaine.com
```

---

## ✅ Vérifier la configuration

Après avoir mis à jour `backend/config.env`, redémarrez le serveur et vérifiez les logs :

```bash
cd backend
npm run dev
```

Vous devriez voir dans les logs :
```
📧 Configuration SMTP:
  host: sandbox.smtp.mailtrap.io
  port: 587
  secure: false
  user: ✅ Configuré
  password: ✅ Configuré
✅ Utilisation de SMTP réel (Mailtrap)
```

## 🔧 Dépannage

### Erreur "Invalid credentials"
- Vérifiez que les identifiants sont corrects dans `config.env`
- Pour Mailtrap : Vérifiez que vous utilisez les identifiants de l'onglet "SMTP Settings"
- Pour Gmail : Assurez-vous d'utiliser un mot de passe d'application, pas votre mot de passe Gmail

### Erreur "Connection timeout"
- Vérifiez votre connexion internet
- Vérifiez que le port n'est pas bloqué par un firewall
- Essayez avec `SMTP_SECURE=true` et `SMTP_PORT=465`

### Les emails ne sont pas envoyés
- Vérifiez les logs du serveur pour voir l'erreur exacte
- Pour Mailtrap : Vérifiez votre inbox pour voir si les emails arrivent
- Pour Gmail : Vérifiez les spams

## 📝 Notes importantes

- ⚠️ **Ne commitez JAMAIS** le fichier `config.env` avec des identifiants réels dans Git
- ⚠️ Pour la production, utilisez des variables d'environnement système ou Docker secrets
- ⚠️ Le plan gratuit Mailtrap a une limite de 500 emails/mois
- ⚠️ Gmail a une limite de 2000 emails/jour


