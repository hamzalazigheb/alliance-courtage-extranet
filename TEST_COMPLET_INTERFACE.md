# 🧪 Test Complet via l'Interface - Guide Étape par Étape

## ✅ Prérequis Vérifiés

- ✅ Backend est en cours d'exécution sur `http://localhost:3001`
- ✅ Service email configuré (mode développement - affiche dans console)

---

## 📋 Étape par Étape pour Tester

### Étape 1 : Ouvrir le Frontend

1. **Ouvrez votre navigateur** (Chrome, Firefox, Edge)
2. **Allez sur** : `http://localhost:5173`
3. Vous devriez voir la **page de connexion**

### Étape 2 : Tester la Réinitialisation

1. **Entrez un email admin** dans le champ email :
   - Par exemple : `admin@alliance-courtage.fr`
   - (Utilisez un email admin qui existe dans votre base)

2. **Cliquez sur "Mot de passe oublié ?"** (lien en bas à droite du formulaire)

3. **Confirmez** dans la boîte de dialogue :
   ```
   Réinitialiser le mot de passe pour admin@alliance-courtage.fr?
   
   📧 Si c'est un compte ADMIN, vous recevrez un email avec le nouveau mot de passe.
   
   Cliquez sur OK pour continuer.
   ```

### Étape 3 : Vérifier le Résultat

**Option A : Mode Développement (SMTP non configuré)**
- ✅ Un message de succès s'affiche
- ✅ **Regardez la console backend** - l'email complet s'affiche là !
- ✅ Copiez le nouveau mot de passe affiché dans la console

**Option B : Mode Production (SMTP configuré)**
- ✅ Un message de succès s'affiche
- ✅ **Vérifiez votre boîte de réception** (et les spams)
- ✅ Le nouvel email contient le nouveau mot de passe

### Étape 4 : Se Connecter avec le Nouveau Mot de Passe

1. **Utilisez le nouveau mot de passe** que vous avez reçu (email ou console)
2. **Entrez** :
   - Email : celui que vous avez utilisé
   - Mot de passe : le nouveau mot de passe généré
3. **Cliquez sur "Se connecter"**
4. ✅ Vous devriez être connecté !

### Étape 5 : Changer le Mot de Passe (Recommandé)

1. Une fois connecté, allez dans votre profil
2. Changez le mot de passe temporaire par un mot de passe personnel

---

## 📊 Ce qui se Passe en Arrière-Plan

1. **Frontend** → Envoie une requête à `POST /api/admin-password-reset/request`
2. **Backend** → 
   - Vérifie que l'email est un admin
   - Génère un mot de passe aléatoire sécurisé (12 caractères)
   - Met à jour le mot de passe dans la base de données
   - Envoie l'email (ou l'affiche en console en mode dev)
3. **Utilisateur** → Reçoit le nouveau mot de passe

---

## 🔍 Vérifier la Console Backend

Pendant le test, regardez la **console où tourne le backend**. Vous devriez voir :

```
⚠️  SMTP non configuré. Mode développement activé.

======================================================================
📧 EMAIL DE TEST (Mode Développement)
======================================================================
From: noreply@alliance-courtage.fr
To: admin@alliance-courtage.fr
Subject: 🔐 Réinitialisation de votre mot de passe - Alliance Courtage

--- CONTENU TEXT ---
[... le contenu de l'email ...]

Votre nouveau mot de passe : [MOT_DE_PASSE_GENERÉ]

--- CONTENU HTML ---
[... le contenu HTML de l'email ...]
======================================================================

✅ Email envoyé avec succès: <test-...>
✅ Mot de passe réinitialisé et email envoyé pour: admin@alliance-courtage.fr
```

**Copiez le mot de passe** affiché dans cette section !

---

## 🧪 Scénarios de Test

### Test 1 : Email Admin Valide ✅
- **Email** : `admin@alliance-courtage.fr`
- **Résultat attendu** : Email reçu (ou affiché en console) avec nouveau mot de passe

### Test 2 : Email Non-Admin ⚠️
- **Email** : `user@alliance-courtage.fr` (utilisateur normal)
- **Résultat attendu** : Message générique (sécurité), pas d'email envoyé

### Test 3 : Email Inexistant ⚠️
- **Email** : `inexistant@test.com`
- **Résultat attendu** : Message générique (sécurité), pas d'email envoyé

---

## 📝 Checklist de Test

- [ ] Page de login s'affiche correctement
- [ ] Le bouton "Mot de passe oublié ?" est visible et cliquable
- [ ] La boîte de confirmation s'affiche
- [ ] Le message de succès s'affiche après confirmation
- [ ] L'email s'affiche dans la console backend (ou est reçu)
- [ ] Le nouveau mot de passe est visible dans l'email
- [ ] La connexion fonctionne avec le nouveau mot de passe
- [ ] L'ancien mot de passe ne fonctionne plus

---

## 🐛 En Cas de Problème

### Problème : "Backend not running"
**Solution** : Démarrez le backend
```bash
cd backend
npm start
```

### Problème : "Email non affiché dans la console"
**Solution** : 
- Vérifiez que vous regardez la bonne console (celle où tourne le backend)
- Vérifiez les logs pour erreurs

### Problème : "Erreur lors de la demande"
**Solution** :
- Vérifiez que l'email existe dans la base de données
- Vérifiez que l'utilisateur est un admin
- Regardez les logs backend pour détails

---

## ✅ Test Réussi Quand

1. ✅ Le message de succès s'affiche
2. ✅ L'email est visible dans la console backend (avec le mot de passe)
3. ✅ La connexion fonctionne avec le nouveau mot de passe
4. ✅ Le design de l'email est correct (visible dans le HTML)

---

**🚀 Prêt à tester ? Ouvrez `http://localhost:5173` et suivez les étapes ci-dessus !**

