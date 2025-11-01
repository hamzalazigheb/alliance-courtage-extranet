# 🧪 Guide de Test - Réinitialisation Mot de Passe avec Email

## 📋 Vue d'Ensemble

Ce guide vous explique comment tester la fonctionnalité de réinitialisation automatique de mot de passe avec envoi d'email pour les admins.

---

## 🚀 Méthode 1 : Test Automatique (Script)

### Étape 1 : Exécuter le Script de Test

```bash
cd backend
node scripts/testEmailReset.js admin@alliance-courtage.fr
```

**Remplacez** `admin@alliance-courtage.fr` par l'email admin que vous voulez tester.

### Ce que fait le script :

1. ✅ Vérifie la connexion à la base de données
2. ✅ Vérifie que l'utilisateur existe et est admin
3. ✅ Vérifie la configuration SMTP
4. ✅ Génère un mot de passe de test
5. ✅ Envoie un email de test
6. ✅ Affiche les résultats

### Résultat attendu :

```
✅ Connecté à la base de données
✅ Utilisateur trouvé: Admin User
✅ Utilisateur est un admin
✅ Configuration SMTP détectée
✅ Email envoyé avec succès!
```

---

## 🧪 Méthode 2 : Test Manuel (Interface)

### Prérequis

1. ✅ Serveur backend démarré : `npm start` (dans `backend/`)
2. ✅ Frontend démarré : `npm run dev` (dans la racine)
3. ✅ Configuration SMTP dans `backend/config.env` (ou mode test)

### Étapes de Test

#### Étape 1 : Vérifier la Configuration SMTP

```bash
cd backend
cat config.env | grep SMTP
```

**Ou créez `config.env` si nécessaire :**

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=noreply@alliance-courtage.fr
FRONTEND_URL=http://localhost:5173
```

#### Étape 2 : Démarrer le Backend

```bash
cd backend
npm start
```

**Ou en mode développement :**

```bash
npm run dev
```

#### Étape 3 : Accéder à la Page de Login

1. Ouvrez votre navigateur
2. Allez sur : `http://localhost:5173`
3. La page de login devrait s'afficher

#### Étape 4 : Tester la Réinitialisation

1. **Entrez un email admin** dans le champ email (ex: `admin@alliance-courtage.fr`)
2. **Cliquez sur "Mot de passe oublié ?"**
3. **Confirmez** dans la boîte de dialogue
4. **Attendez** le message de confirmation

#### Étape 5 : Vérifier l'Email

- ✅ Ouvrez votre boîte de réception
- ✅ Vérifiez aussi les **spams/courrier indésirable**
- ✅ Vous devriez recevoir un email avec :
  - Un nouveau mot de passe généré
  - Des instructions pour se connecter
  - Un lien vers la page de connexion

#### Étape 6 : Tester la Connexion

1. **Utilisez le nouveau mot de passe** reçu par email
2. **Connectez-vous** avec :
   - Email : celui que vous avez utilisé
   - Mot de passe : celui reçu par email
3. **Changez le mot de passe** après connexion (recommandé)

---

## 🔧 Méthode 3 : Test avec API Directe (cURL/Postman)

### Test avec cURL

```bash
curl -X POST http://localhost:3001/api/admin-password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alliance-courtage.fr"}'
```

### Test avec Postman

1. **Méthode** : POST
2. **URL** : `http://localhost:3001/api/admin-password-reset/request`
3. **Headers** :
   - `Content-Type: application/json`
4. **Body** (JSON) :
```json
{
  "email": "admin@alliance-courtage.fr"
}
```

### Réponse Attendue

```json
{
  "message": "Un email avec votre nouveau mot de passe a été envoyé à admin@alliance-courtage.fr. Vérifiez votre boîte de réception (et les spams)."
}
```

---

## 🧪 Méthode 4 : Test Sans SMTP (Mode Développement)

Si vous n'avez pas configuré SMTP, le système fonctionne en mode test :

### Comment ça fonctionne :

1. Les emails ne sont **pas réellement envoyés**
2. Les détails de l'email sont **affichés dans la console backend**
3. Vous pouvez copier le contenu pour tester

### Tester en Mode Dev :

1. **Ne configurez PAS** SMTP_USER et SMTP_PASSWORD
2. **Démarrez le backend** : `npm start`
3. **Utilisez l'interface** ou l'API
4. **Regardez la console backend** pour voir l'email généré

### Exemple de Sortie Console :

```
✅ Email envoyé avec succès: <test-message-id>
📧 Email généré (mode test):
   To: admin@alliance-courtage.fr
   Subject: Réinitialisation de votre mot de passe
   ...
```

---

## ✅ Checklist de Test

### Test de Base

- [ ] Le script de test s'exécute sans erreur
- [ ] L'utilisateur admin est trouvé dans la base
- [ ] La configuration SMTP est détectée (ou mode test)
- [ ] L'email est envoyé avec succès

### Test Interface

- [ ] La page de login s'affiche correctement
- [ ] Le bouton "Mot de passe oublié ?" est visible
- [ ] La confirmation s'affiche après clic
- [ ] Le message de succès s'affiche

### Test Email

- [ ] L'email est reçu (ou affiché en console en mode test)
- [ ] L'email contient le nouveau mot de passe
- [ ] L'email contient les instructions
- [ ] Le design HTML est correct

### Test Fonctionnel

- [ ] Le nouveau mot de passe fonctionne pour se connecter
- [ ] L'ancien mot de passe ne fonctionne plus
- [ ] La connexion est possible avec le nouveau mot de passe

---

## 🐛 Dépannage

### Problème : "Aucun utilisateur trouvé"

**Solution :**
```bash
# Vérifier que l'admin existe
cd backend
node scripts/viewUsers.js
```

### Problème : "SMTP non configuré"

**Solution :**
- En développement : C'est normal, utilisez le mode test
- En production : Configurez SMTP dans `config.env`

### Problème : "Email non reçu"

**Solutions :**
1. ✅ Vérifier les spams
2. ✅ Vérifier que SMTP est correctement configuré
3. ✅ Vérifier les logs backend pour erreurs
4. ✅ Tester avec un autre fournisseur d'email

### Problème : "Erreur de connexion SMTP"

**Solutions :**
1. ✅ Vérifier SMTP_HOST et SMTP_PORT
2. ✅ Pour Gmail, utiliser un mot de passe d'application
3. ✅ Vérifier les credentials
4. ✅ Essayer SMTP_SECURE=true pour le port 465

---

## 📊 Test avec Plusieurs Scénarios

### Scénario 1 : Email Admin Valide

**Action :** Demande de reset avec email admin valide  
**Résultat attendu :** Email reçu avec nouveau mot de passe

### Scénario 2 : Email Non-Admin

**Action :** Demande de reset avec email utilisateur normal  
**Résultat attendu :** Message générique (sécurité), pas d'email envoyé

### Scénario 3 : Email Inexistant

**Action :** Demande de reset avec email qui n'existe pas  
**Résultat attendu :** Message générique (sécurité), pas d'email envoyé

### Scénario 4 : Email Admin sans SMTP Configuré

**Action :** Demande de reset en mode développement  
**Résultat attendu :** Email affiché dans la console backend

---

## 🔍 Vérification des Logs

### Logs Backend à Surveiller

```
✅ Email envoyé avec succès: <message-id>
✅ Mot de passe réinitialisé et email envoyé pour: admin@alliance-courtage.fr
```

### Erreurs Possibles

```
❌ ERREUR: Erreur lors de l'envoi de l'email: ...
❌ ERREUR: Erreur admin password reset: ...
```

---

## 📝 Résumé des Commandes

```bash
# 1. Test automatique
cd backend
node scripts/testEmailReset.js admin@alliance-courtage.fr

# 2. Vérifier la config SMTP
cat backend/config.env | grep SMTP

# 3. Démarrer le backend
cd backend
npm start

# 4. Test API directe
curl -X POST http://localhost:3001/api/admin-password-reset/request \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@alliance-courtage.fr"}'

# 5. Vérifier les utilisateurs
cd backend
node scripts/viewUsers.js
```

---

**✅ Une fois les tests réussis, la fonctionnalité est opérationnelle !**

