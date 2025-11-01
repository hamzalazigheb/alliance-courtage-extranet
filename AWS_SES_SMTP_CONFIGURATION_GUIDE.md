# 📧 Guide Complet : Configuration SMTP avec AWS SES - De A à Z

## 📋 Table des Matières

1. [Création du Compte AWS](#1-création-du-compte-aws)
2. [Accès à Amazon SES](#2-accès-à-amazon-ses)
3. [Vérification d'Email ou Domaine](#3-vérification-demail-ou-domaine)
4. [Configuration SMTP](#4-configuration-smtp)
5. [Sortir du Sandbox (Production)](#5-sortir-du-sandbox-production)
6. [Configuration dans l'Application](#6-configuration-dans-lapplication)
7. [Test et Vérification](#7-test-et-vérification)
8. [Dépannage](#8-dépannage)

---

## 1. Création du Compte AWS

### Étape 1.1 : Créer un Compte AWS

1. **Allez sur** : https://aws.amazon.com
2. **Cliquez** sur "Create an AWS Account" ou "S'inscrire" (en haut à droite)
3. **Remplissez le formulaire** :
   - Email
   - Mot de passe (12 caractères minimum, majuscules, minuscules, chiffres, symboles)
   - Nom du compte AWS
4. **Informations de contact** :
   - Nom complet
   - Numéro de téléphone
   - Pays/Région
5. **Informations de paiement** :
   - Carte bancaire (AWS facture uniquement ce que vous utilisez)
   - **Note** : SES offre 62,000 emails/mois GRATUITS la première année
6. **Vérification** :
   - AWS vous appellera pour vérifier votre numéro de téléphone
   - Entrez le code reçu
7. **Choisissez un plan** :
   - Sélectionnez "Basic Support - Free"
8. **Confirmez** : Votre compte AWS est créé !

### Étape 1.2 : Se Connecter à la Console AWS

1. **Allez sur** : https://console.aws.amazon.com
2. **Connectez-vous** avec votre email et mot de passe
3. Vous arriverez sur le **AWS Management Console**

---

## 2. Accès à Amazon SES

### Étape 2.1 : Localiser Amazon SES

**Méthode 1 : Via la Barre de Recherche**
1. En haut de la console AWS, dans la barre de recherche, tapez : **"SES"** ou **"Simple Email Service"**
2. Cliquez sur **"Simple Email Service"** dans les résultats

**Méthode 2 : Via le Menu Services**
1. Cliquez sur **"Services"** (en haut à gauche)
2. Dans "Customer Engagement", cliquez sur **"Simple Email Service"**

**Méthode 3 : URL Directe**
- Allez directement sur : https://console.aws.amazon.com/ses/

### Étape 2.2 : Choisir une Région

**⚠️ IMPORTANT : Choisissez une région et RESTEZ-Y !**

Les régions recommandées :
- **EU (Paris)** : `eu-west-3` - Pour les utilisateurs européens
- **EU (Ireland)** : `eu-west-1` - Alternative européenne
- **US East (N. Virginia)** : `us-east-1` - Par défaut, souvent moins cher

**Comment changer la région :**
1. En haut à droite de la console, cliquez sur le menu déroulant de région
2. Sélectionnez votre région (ex: **EU (Paris)**)
3. **Notez bien cette région** - vous en aurez besoin plus tard !

---

## 3. Vérification d'Email ou Domaine

Vous devez vérifier soit un **email** soit un **domaine** pour pouvoir envoyer des emails.

### Option A : Vérifier un Email (Recommandé pour Débuter)

#### Étape 3.1 : Créer une Identité Email

1. Dans la console SES, dans le menu de gauche, cliquez sur **"Verified identities"**
2. Cliquez sur le bouton **"Create identity"** (orange, en haut à droite)
3. **Type d'identité** :
   - Sélectionnez **"Email address"**
4. **Email address** :
   - Entrez votre email (ex: `noreply@alliance-courtage.fr`)
   - Ou utilisez un email Gmail/Outlook pour tester
5. **Cliquez** sur **"Create identity"**

#### Étape 3.2 : Vérifier l'Email

1. AWS va envoyer un email à l'adresse que vous avez saisie
2. **Ouvrez votre boîte de réception** (vérifiez aussi les spams)
3. **Ouvrez l'email** d'Amazon SES
4. **Cliquez sur le lien** dans l'email
   - Ou copiez le lien et collez-le dans votre navigateur
5. **Confirmation** : Vous verrez "Email address verified successfully"
6. **Retournez dans la console SES** : L'email apparaît maintenant comme "Verified" ✅

**Avantages** :
- ✅ Rapide et simple
- ✅ Pas besoin d'accès DNS
- ✅ Parfait pour tester

**Inconvénients** :
- ❌ Vous devez vérifier chaque email individuellement
- ❌ En mode Sandbox, vous ne pouvez envoyer qu'aux emails vérifiés

---

### Option B : Vérifier un Domaine (Recommandé pour Production)

#### Étape 3.1 : Créer une Identité Domaine

1. Dans la console SES, cliquez sur **"Verified identities"**
2. Cliquez sur **"Create identity"**
3. **Type d'identité** :
   - Sélectionnez **"Domain"**
4. **Domain** :
   - Entrez votre domaine (ex: `alliance-courtage.fr`)
   - **⚠️ N'incluez PAS** `www.` ou `http://` - juste le domaine nu
5. **Configuration options** :
   - ✅ Cochez "Use a default DKIM signing key" (recommandé)
6. **Cliquez** sur **"Create identity"**

#### Étape 3.2 : Configurer les Enregistrements DNS

AWS va vous fournir plusieurs enregistrements DNS à ajouter à votre domaine.

**1. Enregistrements de Vérification**

Vous verrez quelque chose comme :
```
Type: TXT
Name: _amazonses.alliance-courtage.fr
Value: abc123def456ghi789...
```

**Comment les Ajouter :**

**Si vous utilisez votre propre serveur DNS :**
1. Connectez-vous à votre panneau de contrôle DNS
2. Ajoutez un nouvel enregistrement TXT
3. Nom : `_amazonses` (ou `_amazonses.alliance-courtage.fr`)
4. Valeur : Copiez la valeur fournie par AWS
5. TTL : 3600 (ou laissez par défaut)

**Si vous utilisez un hébergeur (OVH, GoDaddy, Cloudflare, etc.) :**

**Exemple : OVH**
1. Connectez-vous à votre compte OVH
2. Allez dans "Domaines" → "Zone DNS"
3. Cliquez sur "Ajouter une entrée"
4. Type : TXT
5. Sous-domaine : `_amazonses`
6. Valeur : Copiez depuis AWS
7. Validez

**Exemple : Cloudflare**
1. Connectez-vous à Cloudflare
2. Sélectionnez votre domaine
3. Allez dans "DNS" → "Records"
4. Cliquez "Add record"
5. Type : TXT
6. Name : `_amazonses`
7. Content : Copiez depuis AWS
8. Save

**2. Enregistrements DKIM (3 enregistrements)**

AWS génère 3 clés DKIM. Pour chaque clé :
- Type : CNAME
- Name : `xxx._domainkey.alliance-courtage.fr`
- Value : `xxx.dkim.amazonses.com`

**Exemple :**
```
Type: CNAME
Name: abc123._domainkey.alliance-courtage.fr
Value: abc123.dkim.amazonses.com
```

Répétez pour les 3 clés DKIM.

#### Étape 3.3 : Vérifier le Domaine

1. **Attendez 5-10 minutes** après avoir ajouté les enregistrements DNS
2. Dans la console SES, revenez à **"Verified identities"**
3. **Actualisez la page** (F5)
4. Le statut devrait passer à **"Verified"** ✅

**Si ce n'est pas vérifié :**
- Vérifiez que les enregistrements DNS sont corrects
- Utilisez un outil comme `nslookup` ou `dig` pour vérifier
- Attendez jusqu'à 48h (généralement c'est plus rapide)

**Commandes de Vérification :**
```bash
# Windows PowerShell
nslookup -type=TXT _amazonses.alliance-courtage.fr

# Linux/Mac
dig TXT _amazonses.alliance-courtage.fr
```

---

## 4. Configuration SMTP

### Étape 4.1 : Accéder aux Paramètres SMTP

1. Dans la console SES, dans le menu de gauche, cliquez sur **"SMTP settings"**
2. Vous verrez votre région actuelle (ex: "EU (Paris)")

### Étape 4.2 : Créer des Identifiants SMTP

1. **Cliquez** sur **"Create SMTP credentials"** (bouton orange)
2. **IAM User Name** :
   - Laissez par défaut (ex: `ses-smtp-user.20250111`) ou donnez un nom personnalisé
   - Exemple : `alliance-courtage-smtp`
3. **Cliquez** sur **"Create"**
4. **⚠️ IMPORTANT : Copiez immédiatement !**
   
   AWS va afficher :
   - **SMTP User Name** : `AKIAIOSFODNN7EXAMPLE`
   - **SMTP Password** : `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
   
   **⚠️ Vous ne pourrez plus voir le mot de passe après !**
   
   **Options :**
   - Cliquez sur "Download credentials" pour sauvegarder dans un fichier
   - Ou copiez manuellement dans un endroit sûr (NotePad, gestionnaire de mots de passe)
   - **⚠️ NE PARTAGEZ JAMAIS** ces identifiants publiquement !

5. **Cliquez** sur **"Close"**

### Étape 4.3 : Noter les Informations SMTP

Dans la page "SMTP settings", notez :

1. **Server Name** :
   - Format : `email-smtp.REGION.amazonaws.com`
   - Exemples :
     - EU (Paris) : `email-smtp.eu-west-3.amazonaws.com`
     - EU (Ireland) : `email-smtp.eu-west-1.amazonaws.com`
     - US East : `email-smtp.us-east-1.amazonaws.com`

2. **Port** :
   - **587** : TLS (Recommandé)
   - **465** : SSL (Alternatif)
   - **25** : Non recommandé (souvent bloqué)

3. **SMTP Username** : Celui que vous venez de créer (ex: `AKIAIOSFODNN7EXAMPLE`)
4. **SMTP Password** : Celui que vous avez copié (ex: `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

---

## 5. Sortir du Sandbox (Production)

### Qu'est-ce que le Sandbox ?

Par défaut, AWS SES est en **mode Sandbox** :
- ❌ Vous ne pouvez envoyer qu'aux emails vérifiés
- ❌ Maximum 200 emails/jour
- ❌ Maximum 1 email/seconde

### Étape 5.1 : Demander l'Accès Production

1. Dans la console SES, dans le menu de gauche, cliquez sur **"Account dashboard"**
2. En haut, vous verrez **"Account status"** : "Sandbox" (en rouge/orange)
3. **Cliquez** sur **"Request production access"** (bouton orange)

### Étape 5.2 : Remplir le Formulaire

**Use case type** : Sélectionnez **"Transactional"** (pour réinitialisation de mot de passe)

**Website URL** : URL de votre site (ex: `https://alliance-courtage.fr`)

**Use case description** : Description détaillée, par exemple :
```
We need to send transactional emails to users of our insurance brokerage platform:
- Password reset emails when users forget their password
- Account verification emails
- Notification emails for administrative actions

We expect to send approximately 100-500 emails per month for password resets and notifications to our internal admin users.
```

**Contact information** :
- Votre email
- Votre numéro de téléphone
- Pays

**Additional contact emails** : Email de contact supplémentaire (optionnel)

**Acknowledge AWS Service Terms** : Cochez la case

**Cliquez** sur **"Submit request"**

### Étape 5.3 : Attendre l'Approbation

- ⏱️ **Temps d'attente** : Généralement 24-48 heures
- 📧 **Email de confirmation** : AWS vous enverra un email
- ✅ **Approbation automatique** : Souvent approuvé automatiquement pour les petits volumes
- 🔍 **Vérification** : Allez dans "Account dashboard" pour vérifier le statut

**Après Approbation :**
- Statut passe à **"Production"** (en vert)
- Vous pouvez envoyer à n'importe quelle adresse email
- Limites augmentées (par défaut : 50,000 emails/jour)

---

## 6. Configuration dans l'Application

### Étape 6.1 : Créer/Modifier le Fichier config.env

Dans `backend/config.env`, ajoutez/modifiez :

```env
# Configuration SMTP AWS SES
SMTP_HOST=email-smtp.eu-west-3.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASSWORD=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SMTP_FROM=noreply@alliance-courtage.fr

# URL du frontend (pour les liens dans les emails)
FRONTEND_URL=http://localhost:5173
```

### Étape 6.2 : Remplacez les Valeurs

**SMTP_HOST** :
- Remplacez par votre Server Name depuis AWS SES
- Exemple : `email-smtp.eu-west-3.amazonaws.com`

**SMTP_PORT** :
- `587` pour TLS (recommandé)
- Ou `465` pour SSL

**SMTP_SECURE** :
- `false` pour le port 587 (TLS)
- `true` pour le port 465 (SSL)

**SMTP_USER** :
- Votre SMTP Username depuis AWS
- Exemple : `AKIAIOSFODNN7EXAMPLE`

**SMTP_PASSWORD** :
- Votre SMTP Password depuis AWS
- Exemple : `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

**SMTP_FROM** :
- L'email vérifié dans AWS SES
- Exemple : `noreply@alliance-courtage.fr`
- ⚠️ Doit correspondre à un email/domaine vérifié dans SES !

**FRONTEND_URL** :
- URL de votre application frontend
- Développement : `http://localhost:5173`
- Production : `https://votre-domaine.com`

### Étape 6.3 : Exemple de Configuration Complète

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

# Configuration SMTP AWS SES
SMTP_HOST=email-smtp.eu-west-3.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASSWORD=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=http://localhost:5173
```

### Étape 6.4 : Sécurité - Ne Pas Commiter les Credentials

**⚠️ IMPORTANT : Sécurité !**

1. **Vérifiez** que `config.env` est dans `.gitignore` :
   ```
   backend/.gitignore
   ```
   Ajoutez :
   ```
   config.env
   .env
   ```

2. **NE PARTAGEZ JAMAIS** vos identifiants SMTP publiquement

3. **Pour la production**, utilisez des variables d'environnement système au lieu d'un fichier `.env`

---

## 7. Test et Vérification

### Étape 7.1 : Redémarrer le Serveur Backend

```bash
cd backend
# Arrêtez le serveur actuel (Ctrl+C)
npm start
# ou
npm run dev
```

### Étape 7.2 : Tester avec le Script

```bash
cd backend
node scripts/testEmailReset.js admin@alliance-courtage.fr
```

**Résultat attendu :**
```
✅ Configuration SMTP détectée
✅ Email envoyé avec succès!
```

### Étape 7.3 : Tester via l'Interface

1. Allez sur `http://localhost:5173`
2. Cliquez sur "Mot de passe oublié ?"
3. Entrez un email admin
4. Vérifiez votre boîte de réception !

### Étape 7.4 : Vérifier les Logs AWS SES

1. Dans la console AWS SES, allez dans **"Sending statistics"**
2. Vous verrez :
   - **Sends** : Nombre d'emails envoyés
   - **Bounces** : Emails rejetés
   - **Complaints** : Spam signalé
   - **Delivery** : Taux de livraison

3. **Email sending events** : Pour voir les détails de chaque email envoyé

---

## 8. Dépannage

### Problème : "Authentication failed" ou "535 Authentication failed"

**Causes possibles :**
1. ✅ SMTP_USER incorrect
2. ✅ SMTP_PASSWORD incorrect
3. ✅ SMTP_HOST incorrect (mauvaise région)
4. ✅ Port incorrect

**Solutions :**
1. Vérifiez que vous avez copié exactement les identifiants depuis AWS
2. Vérifiez la région dans SMTP_HOST correspond à votre région SES
3. Essayez le port 465 avec SMTP_SECURE=true
4. Vérifiez les espaces/tabulations dans config.env

### Problème : "Email address not verified"

**Cause :** Vous essayez d'envoyer depuis un email non vérifié

**Solution :**
1. Vérifiez que `SMTP_FROM` correspond à un email/domaine vérifié dans SES
2. Vérifiez dans SES → Verified identities que l'email est bien "Verified"

### Problème : "Sandbox account - cannot send to unverified email"

**Cause :** Vous êtes toujours en mode Sandbox

**Solution :**
1. Vérifiez que vous avez demandé l'accès production
2. Attendez l'approbation AWS
3. Ou vérifiez l'email de destination dans SES

### Problème : "Email non reçu"

**Vérifications :**
1. ✅ Vérifiez les spams/courrier indésirable
2. ✅ Vérifiez que l'email de destination est correct
3. ✅ Vérifiez les logs backend pour erreurs
4. ✅ Vérifiez dans SES → Sending statistics
5. ✅ Vérifiez que le domaine de destination n'a pas bloqué AWS SES

### Problème : "Rate limit exceeded"

**Cause :** Vous dépassez les limites d'envoi

**En Sandbox :**
- Maximum 200 emails/jour
- Maximum 1 email/seconde

**Solution :**
- Demandez l'accès production
- Ou réduisez la fréquence d'envoi

---

## 📊 Checklist Complète

- [ ] Compte AWS créé et vérifié
- [ ] Accès à Amazon SES
- [ ] Région choisie et notée
- [ ] Email ou Domaine vérifié dans SES
- [ ] Identifiants SMTP créés et copiés
- [ ] Server name, port, username, password notés
- [ ] Configuration ajoutée dans `backend/config.env`
- [ ] Serveur backend redémarré
- [ ] Test d'envoi réussi
- [ ] Email reçu dans la boîte de réception
- [ ] (Optionnel) Demande d'accès production soumise
- [ ] (Optionnel) Accès production approuvé

---

## 💰 Coûts AWS SES

### Tarifs (hors taxes)

**Première année (Gratuit) :**
- 62,000 emails/mois GRATUITS
- Au-delà : 0.10$ pour 1000 emails

**Après la première année :**
- 0.10$ pour 1000 emails (dans la même région AWS)
- Pas de frais mensuels
- Pas de frais pour les bounces/complaints

**Exemple de coût mensuel :**
- 1000 emails = 0.10$
- 10,000 emails = 1.00$
- 100,000 emails = 10.00$

**💡 Astuce :** Avec 62,000 emails/mois gratuits, c'est largement suffisant pour la plupart des applications !

---

## 🔒 Sécurité et Bonnes Pratiques

### ✅ À FAIRE :

1. **Utiliser IAM** : Créez des utilisateurs IAM séparés pour SMTP (pas le compte root)
2. **Restreindre les permissions** : Donnez uniquement les permissions SES nécessaires
3. **Rotation des mots de passe** : Changez régulièrement les credentials SMTP
4. **Monitoring** : Configurez CloudWatch pour surveiller les envois
5. **Bounces/Complaints** : Surveillez les taux de rebond et plaintes
6. **SPF/DKIM** : Configurez correctement pour éviter les spams

### ❌ À ÉVITER :

1. ❌ Partager les credentials publiquement
2. ❌ Commiter config.env dans Git
3. ❌ Utiliser le compte root AWS pour SMTP
4. ❌ Ignorer les bounces/complaints
5. ❌ Envoyer à des listes d'emails non vérifiées (spam)

---

## 📞 Support AWS

Si vous avez des problèmes :

1. **Documentation AWS SES** : https://docs.aws.amazon.com/ses/
2. **Forum AWS** : https://forums.aws.amazon.com/forum.jspa?forumID=90
3. **Support AWS** : Via la console AWS → Support
4. **Statut des Services AWS** : https://status.aws.amazon.com/

---

## ✅ Configuration Finale Résumée

Une fois tout configuré, votre `backend/config.env` devrait ressembler à :

```env
SMTP_HOST=email-smtp.eu-west-3.amazonaws.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASSWORD=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=http://localhost:5173
```

**Redémarrez le backend** et testez ! 🚀

---

**🎉 Félicitations ! Votre configuration SMTP AWS SES est prête !**

