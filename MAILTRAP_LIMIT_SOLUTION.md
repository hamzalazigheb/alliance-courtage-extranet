# 📧 Solution : Limite Mailtrap Atteinte

## ⚠️ Situation

Vous avez atteint la limite d'emails de votre plan Mailtrap gratuit (500 emails/mois).

**IMPORTANT** : Le mot de passe a été réinitialisé avec succès, même si l'email n'a pas été envoyé !

## 🔑 Récupérer le Mot de Passe

Le mot de passe est disponible dans les logs du serveur. Cherchez cette section :

```
🔐 RÉINITIALISATION DE MOT DE PASSE ADMIN
================================================================================
👤 Utilisateur: [Nom] [Prénom] ([email])
🆔 ID: [ID]
📅 Date: [Date]

🔑 NOUVEAU MOT DE PASSE:
   ────────────────────────────────────────────────────────────────────────────
   [VOTRE_MOT_DE_PASSE_ICI]
   ────────────────────────────────────────────────────────────────────────────
```

### Sur votre serveur Ubuntu

```bash
# Voir les logs du conteneur backend
docker logs alliance-courtage-backend --tail 100 | grep -A 20 "RÉINITIALISATION"

# Ou voir tous les logs récents
docker logs alliance-courtage-backend --tail 200
```

## ✅ Solutions pour Résoudre la Limite Mailtrap

### Option 1 : Mettre à Niveau Mailtrap (Recommandé pour développement)

1. Allez sur https://mailtrap.io/billing/plans/testing
2. Mettez à niveau votre plan
3. Les nouveaux identifiants seront disponibles dans votre compte

### Option 2 : Utiliser Gmail (Gratuit, 2000 emails/jour)

1. **Activer l'authentification à deux facteurs** sur votre compte Gmail
2. **Créer un mot de passe d'application** :
   - Allez sur https://myaccount.google.com/apppasswords
   - Sélectionnez "Mail" et "Autre (nom personnalisé)"
   - Entrez "Alliance Courtage"
   - Copiez le mot de passe généré (16 caractères)

3. **Mettre à jour `backend/config.env`** :
   ```ini
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=votre-email@gmail.com
   SMTP_PASSWORD=votre-mot-de-passe-application-16-caracteres
   SMTP_FROM=votre-email@gmail.com
   ```

4. **Redémarrer le serveur** :
   ```bash
   docker restart alliance-courtage-backend
   ```

### Option 3 : Utiliser SendGrid (100 emails/jour gratuits)

1. Créez un compte sur https://sendgrid.com
2. Créez une API Key dans Settings → API Keys
3. Mettez à jour `backend/config.env` :
   ```ini
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASSWORD=votre-api-key-sendgrid
   SMTP_FROM=noreply@alliance-courtage.fr
   ```

### Option 4 : Mode Développement (Pas d'envoi réel)

Si vous êtes en développement et n'avez pas besoin d'envoyer de vrais emails :

1. **Commenter les identifiants SMTP** dans `backend/config.env` :
   ```ini
   # SMTP_USER=votre-username
   # SMTP_PASSWORD=votre-password
   ```

2. Les emails seront affichés dans la console au lieu d'être envoyés

## 🔄 Après Avoir Configuré un Nouveau SMTP

1. **Redémarrer le conteneur backend** :
   ```bash
   docker restart alliance-courtage-backend
   ```

2. **Vérifier les logs** :
   ```bash
   docker logs alliance-courtage-backend --tail 50 | grep SMTP
   ```

   Vous devriez voir :
   ```
   ✅ Utilisation de SMTP réel (Mailtrap/Gmail/SendGrid)
   ```

3. **Tester l'envoi d'email** :
   - Utilisez la fonction de réinitialisation de mot de passe admin
   - Vérifiez que l'email est bien envoyé

## 📝 Notes Importantes

- ✅ **Le mot de passe est toujours réinitialisé** même si l'email échoue
- ✅ **Le mot de passe est dans les logs** du serveur
- ✅ **Vous pouvez vous connecter** avec le nouveau mot de passe
- ⚠️ **Changez le mot de passe** après la première connexion

## 🔍 Vérifier les Logs

Pour voir le mot de passe réinitialisé :

```bash
# Sur votre serveur
docker logs alliance-courtage-backend 2>&1 | grep -A 15 "RÉINITIALISATION"
```

Ou consultez les logs complets :
```bash
docker logs alliance-courtage-backend --tail 500
```

