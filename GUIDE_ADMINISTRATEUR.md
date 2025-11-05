# Guide Administrateur - Alliance Courtage Extranet

## 📋 Table des matières

1. [Introduction](#introduction)
2. [Accès administrateur](#accès-administrateur)
3. [Gestion des utilisateurs](#gestion-des-utilisateurs)
4. [Gestion du contenu](#gestion-du-contenu)
5. [Gestion des formations](#gestion-des-formations)
6. [Gestion des réservations](#gestion-des-réservations)
7. [Gestion des notifications](#gestion-des-notifications)
8. [Configuration système](#configuration-système)
9. [Maintenance](#maintenance)

---

## 🎯 Introduction

Ce guide est destiné aux administrateurs de la plateforme Alliance Courtage Extranet. Il décrit toutes les fonctionnalités administratives disponibles pour gérer les utilisateurs, le contenu et le système.

---

## 🔐 Accès administrateur

### Connexion

1. **Accédez à la page de connexion admin** : `/manage` ou via le lien "Espace Admin"

2. **Identifiants** :
   - **Email** : admin@alliance-courtage.fr (ou selon votre configuration)
   - **Mot de passe** : [Fourni lors de l'installation]

3. **Première connexion** :
   - Changez immédiatement le mot de passe par défaut
   - Configurez votre profil administrateur
   - Vérifiez les paramètres système

### Sécurité

- **Mot de passe fort** : Minimum 12 caractères, majuscules, minuscules, chiffres, caractères spéciaux
- **Authentification à deux facteurs** : Recommandé si disponible
- **Journalisation** : Toutes les actions administratives sont loggées

---

## 👥 Gestion des utilisateurs

### Créer un utilisateur

1. **Accès** : Menu Admin → "Gestion" → "Utilisateurs" → "Ajouter un utilisateur"

2. **Formulaire** :
   ```
   - Nom : Nom de famille
   - Prénom : Prénom
   - Email : Adresse email professionnelle
   - Mot de passe : Mot de passe temporaire (à changer à la première connexion)
   - Rôle : Utilisateur (par défaut)
   - Téléphone : (optionnel)
   - Adresse : (optionnel)
   ```

3. **Rôles disponibles** :
   - **Admin** : Accès complet à toutes les fonctionnalités
   - **Utilisateur** : Accès standard aux fonctionnalités utilisateur

4. **Après création** :
   - L'utilisateur recevra un email avec ses identifiants
   - Il devra changer son mot de passe à la première connexion

### Modifier un utilisateur

1. **Accès** : Menu Admin → "Gestion" → "Utilisateurs"
2. Trouvez l'utilisateur dans la liste
3. Cliquez sur "Modifier"
4. Mettez à jour les informations nécessaires
5. Sauvegardez

### Supprimer un utilisateur

**⚠️ Attention** : La suppression d'un utilisateur est irréversible et supprimera toutes ses données associées.

1. **Accès** : Menu Admin → "Gestion" → "Utilisateurs"
2. Trouvez l'utilisateur
3. Cliquez sur "Supprimer"
4. Confirmez la suppression

### Réinitialiser un mot de passe

1. **Accès** : Menu Admin → "Gestion" → "Utilisateurs"
2. Trouvez l'utilisateur
3. Cliquez sur "Réinitialiser mot de passe"
4. Un nouveau mot de passe temporaire sera généré et envoyé par email

---

## 📄 Gestion du contenu

### Documents Financiers

#### Ajouter un document financier

1. **Accès** : Menu Admin → "Gestion" → "Documents Financiers" → "Ajouter"

2. **Formulaire** :
   ```
   - Titre : Nom du document
   - Description : Description détaillée (optionnel)
   - Catégorie : Sélectionner parmi les catégories disponibles
   - Sous-catégorie : (optionnel)
   - Année : Année du document
   - Fichier : Sélectionner le fichier PDF (max 50MB)
   ```

3. **Processus** :
   - Remplissez le formulaire
   - Sélectionnez le fichier PDF
   - Cliquez sur "Uploader"
   - Une notification globale est automatiquement envoyée à tous les utilisateurs

### CMS (Content Management System)

#### Gérer le contenu des pages

1. **Accès** : Menu Admin → "CMS"

2. **Pages disponibles** :
   - **Accueil** : Contenu de la page d'accueil (titre, actualités, services)
   - **Gamme Produits** : Contenu de la page produits
   - **Gamme Financière** : Contenu de la page gamme financière
   - **Rencontres** : Gestion des rencontres (prochaines et historiques)
   - **Partenaires** : Contenu de la page partenaires
   - **Réglementaire** : Gestion du contenu réglementaire

3. **Upload d'images** :
   - Cliquez sur "Uploader une image" pour les bannières
   - Les images sont converties en base64 et stockées dans la base de données
   - Format accepté : JPEG, PNG, GIF, WebP (max 10MB)

4. **Sauvegarde** :
   - Modifiez le contenu dans l'éditeur
   - Cliquez sur "Sauvegarder"
   - Les modifications sont immédiatement visibles sur le site public

---

## 🎓 Gestion des formations

### Consulter toutes les formations

1. **Accès** : Menu Admin → "Gestion" → "Formations"

2. **Filtres disponibles** :
   - **Toutes** : Toutes les formations
   - **En attente** : Formations en attente de validation
   - **Approuvées** : Formations approuvées
   - **Rejetées** : Formations rejetées

### Approuver une formation

1. Trouvez la formation dans la liste (statut "En attente")
2. Cliquez sur "✅ Approuver"
3. La formation est immédiatement approuvée
4. L'utilisateur reçoit une notification de confirmation

### Rejeter une formation

1. Trouvez la formation dans la liste
2. Cliquez sur "❌ Rejeter"
3. Entrez une raison de rejet (optionnel mais recommandé)
4. Confirmez le rejet
5. L'utilisateur reçoit une notification avec la raison du rejet

### Télécharger le document d'une formation

1. Dans la liste des formations, cliquez sur "Télécharger" à côté du document
2. Le fichier PDF se télécharge automatiquement
3. Vous pouvez vérifier le contenu avant approbation

---

## 💼 Gestion des réservations de produits structurés

### Consulter les réservations

1. **Accès** : Menu Admin → "Gestion" → "Produits Réservés"

2. **Filtres disponibles** :
   - **Toutes** : Toutes les réservations
   - **En attente** : Réservations en attente d'approbation
   - **Approuvées** : Réservations approuvées
   - **Rejetées** : Réservations rejetées

### Approuver une réservation

1. Trouvez la réservation dans la liste (statut "En attente")
2. Vérifiez que le montant disponible est suffisant
3. Cliquez sur "✅ Approuver"
4. La réservation est approuvée
5. Le montant disponible est déduit automatiquement
6. L'utilisateur reçoit un email de confirmation

### Rejeter une réservation

1. Trouvez la réservation dans la liste
2. Cliquez sur "❌ Rejeter"
3. Entrez une raison de rejet (optionnel mais recommandé)
4. Confirmez le rejet
5. L'utilisateur reçoit un email avec la raison du rejet

---

## 📊 Gestion Comptabilité

### Upload de bordereaux

#### Upload en masse

1. **Accès** : Menu Admin → "Gestion" → "Comptabilité" → "Upload en masse"

2. **Processus** :
   - Sélectionnez plusieurs fichiers PDF
   - Sélectionnez la date d'affichage (pour tous les fichiers)
   - Les fichiers sont uploadés automatiquement
   - Chaque utilisateur reçoit un email pour son bordereau mensuel

3. **Convention de nommage recommandée** :
   ```
   Format : [Nom]_[Prenom]_[Mois]_[Annee].pdf
   Exemple : Dupont_Jean_01_2025.pdf
   ```

---

## 🔔 Gestion des notifications

### Envoyer une notification globale

1. **Accès** : Menu Admin → "CMS" → "Notifications"

2. **Formulaire** :
   ```
   - Type : Information, Succès, Avertissement, Erreur, Annonce
   - Titre : Titre de la notification
   - Message : Contenu de la notification
   - Lien : (optionnel) Lien externe ou interne (ex: #produits-structures)
   ```

3. **Types de liens** :
   - **Lien externe** : Commence par `http://` ou `https://`
   - **Lien interne** : Commence par `#` (ex: `#produits-structures`)

4. **Envoi** :
   - Cliquez sur "Envoyer à tous les utilisateurs"
   - La notification est immédiatement visible pour tous les utilisateurs

---

## 🔧 Maintenance

### Vider la base de données

**⚠️ ATTENTION** : Cette opération supprime toutes les données sauf les utilisateurs admin. Elle est irréversible !

1. **Script disponible** : `backend/scripts/emptyDatabase.js`

2. **Exécution** :
   ```bash
   docker exec -it alliance-courtage-backend node scripts/emptyDatabase.js
   ```

3. **Ce qui est supprimé** :
   - Tous les favoris
   - Toutes les notifications
   - Tous les documents financiers
   - Toutes les formations
   - Tous les bordereaux
   - Toutes les réservations
   - Toutes les archives
   - Tous les partenaires
   - Tout le contenu CMS
   - Tous les utilisateurs non-admin

4. **Ce qui est conservé** :
   - Les utilisateurs admin
   - La structure des tables (schéma de base de données)

### Backup de la base de données

1. **Commande de backup** :
   ```bash
   docker exec alliance-courtage-mysql mysqldump -u root -p[PASSWORD] alliance_courtage > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Restauration** :
   ```bash
   docker exec -i alliance-courtage-mysql mysql -u root -p[PASSWORD] alliance_courtage < backup_YYYYMMDD_HHMMSS.sql
   ```

---

## ✅ Checklist de maintenance mensuelle

- [ ] Vérifier les logs d'erreurs
- [ ] Faire un backup de la base de données
- [ ] Vérifier l'espace disque disponible
- [ ] Vérifier les formations en attente
- [ ] Vérifier les réservations en attente
- [ ] Envoyer les bordereaux mensuels
- [ ] Vérifier les notifications non lues
- [ ] Mettre à jour le contenu CMS si nécessaire
- [ ] Vérifier les utilisateurs inactifs
- [ ] Vérifier la sécurité (mots de passe, sessions)

---

**Dernière mise à jour** : [Date]

**Version du document** : 1.0

Pour toute question technique, consultez la documentation technique ou contactez le support développeur.

