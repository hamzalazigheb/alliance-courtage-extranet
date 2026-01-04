# 🧪 Guide de Tests Avant Déploiement

Ce guide vous permet de tester **TOUTES** les fonctionnalités du projet avant de déployer en production.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Tests Automatisés](#tests-automatisés)
3. [Tests Manuels](#tests-manuels)
4. [Checklist de Déploiement](#checklist-de-déploiement)

---

## Prérequis

### 1. Démarrer le serveur backend

```bash
cd backend
npm start
```

Le serveur doit être accessible sur `http://localhost:3001`

### 2. Démarrer le frontend (optionnel pour tests manuels)

```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

---

## Tests Automatisés

### 🚀 Lancer TOUS les tests

**Windows (PowerShell):**
```powershell
cd backend
.\test-all.ps1
```

**Linux/Mac:**
```bash
cd backend
chmod +x test-all.sh
./test-all.sh
```

### 📊 Tests individuels

#### 1. Tests des APIs

```bash
cd backend
node test-all-apis.js
```

Ce script teste:
- ✅ Health check
- ✅ Authentification (login admin)
- ✅ Utilisateurs (liste, profil)
- ✅ Produits (liste, détails)
- ✅ Actualités
- ✅ Archives et catégories
- ✅ Partenaires
- ✅ Produits structurés et fichiers
- ✅ Documents financiers
- ✅ Formations
- ✅ Assurances
- ✅ Bordereaux
- ✅ Réglementaire
- ✅ Simulateurs
- ✅ Notifications
- ✅ Dashboard et statistiques
- ✅ CMS (homepage, présentation)

#### 2. Tests des Uploads

```bash
cd backend
node test-file-uploads.js
```

Ce script teste:
- ✅ Upload d'actualité avec image
- ✅ Upload d'archive avec PDF
- ✅ Upload de produit structuré (multiple fichiers)
- ✅ Upload de document financier
- ✅ Upload de formation avec image
- ✅ Upload de document réglementaire

### 📄 Rapport de tests

Après l'exécution, un rapport JSON est généré:
```
backend/test-results.json
```

Ce fichier contient:
- Date et heure des tests
- Nombre total de tests
- Tests réussis/échoués
- Taux de réussite
- Détails de chaque test

---

## Tests Manuels

### 1. Tests Frontend

#### Page de Login (`/manage`)
- [ ] Login avec email admin: `admin@alliance.com`
- [ ] Login avec mot de passe: `admin123`
- [ ] Vérifier que le label est "Identifiant" (pas "Email Administrateur")
- [ ] Placeholder du champ email est "Votre email"
- [ ] Redirection vers `/manage` après login réussi

#### Dashboard Admin (`/manage`)
- [ ] Statistiques affichées correctement
- [ ] Graphiques chargés
- [ ] Onglets fonctionnels:
  - [ ] Dashboard
  - [ ] Archives
  - [ ] Partenaires
  - [ ] Documents Financiers
  - [ ] CMS
  - [ ] Produits Structurés
  - [ ] Produits Réservés
  - [ ] Simulateurs
  - [ ] Utilisateurs

### 2. Tests des Uploads CMS

#### Actualités
- [ ] Cliquer sur "CMS" > "Actualités"
- [ ] Ajouter une nouvelle actualité
- [ ] Uploader une image
- [ ] Sauvegarder et vérifier l'affichage

#### Archives
- [ ] Cliquer sur "Archives"
- [ ] Ajouter une nouvelle archive
- [ ] Sélectionner une catégorie
- [ ] Uploader un fichier PDF
- [ ] Vérifier le téléchargement

#### Produits Structurés
- [ ] Cliquer sur "Produits Structurés"
- [ ] Ajouter un nouveau produit
- [ ] Ajouter plusieurs assurances avec montants
- [ ] Entrer le montant total enveloppe **manuellement**
- [ ] Uploader **plusieurs fichiers** (2-3 fichiers)
- [ ] Vérifier que les fichiers sont affichés
- [ ] **Tester le bouton "Modifier"** (orange):
  - [ ] Cliquer sur modifier pour un fichier
  - [ ] Sélectionner un nouveau fichier
  - [ ] Confirmer le remplacement
  - [ ] Vérifier que le fichier est mis à jour
- [ ] **Tester le bouton "Télécharger"** (bleu)
- [ ] **Tester le bouton "Supprimer"** (rouge)
- [ ] Vérifier l'encodage UTF-8 des noms (accents, caractères spéciaux)

#### Documents Financiers
- [ ] Ajouter un document financier
- [ ] Sélectionner un mois
- [ ] Uploader un PDF
- [ ] Vérifier l'affichage et le téléchargement

#### Formations
- [ ] Ajouter une formation
- [ ] Remplir tous les champs
- [ ] Uploader une image
- [ ] Sauvegarder

#### Réglementaire
- [ ] Ajouter un document
- [ ] Sélectionner une catégorie
- [ ] Uploader un fichier
- [ ] Vérifier le téléchargement

### 3. Tests Côté Utilisateur

#### Page Produits Structurés (User)
- [ ] Se connecter en tant qu'utilisateur
- [ ] Accéder aux produits structurés
- [ ] Vérifier l'affichage des cartes produits
- [ ] Vérifier les montants: Montant, Réservé, Disponible
- [ ] **Vérifier l'affichage des fichiers multiples**
- [ ] **Télécharger les fichiers**
- [ ] Tester la réservation:
  - [ ] Cliquer sur "Réserver"
  - [ ] Sélectionner une assurance
  - [ ] Entrer un montant
  - [ ] Soumettre la réservation
  - [ ] Vérifier que le "Disponible" diminue

#### Page Bordereaux (User)
- [ ] Accéder à la page bordereaux
- [ ] Créer un bordereau
- [ ] Uploader des documents
- [ ] Soumettre le bordereau

### 4. Tests Encodage UTF-8

- [ ] Uploader un fichier avec nom accentué: `RÉSUMÉ.pdf`
- [ ] Vérifier que le nom s'affiche correctement (pas `RÃSUMÃ`)
- [ ] Télécharger le fichier
- [ ] Vérifier que le nom téléchargé est correct

### 5. Tests Modifications Récentes

#### Produits Structurés - Multiples Fichiers
- [ ] Créer un produit avec 3 fichiers
- [ ] Vérifier que les 3 fichiers sont affichés
- [ ] Modifier le 2ème fichier
- [ ] Vérifier que seul ce fichier est remplacé
- [ ] Supprimer le 3ème fichier
- [ ] Vérifier qu'il reste 2 fichiers

#### Assurances - Réservations
- [ ] Créer 2 assurances: "hamza" et "test"
- [ ] Associer les 2 au même produit
- [ ] Réserver pour "hamza"
- [ ] **Vérifier que seul "hamza" diminue**
- [ ] Réserver pour "test"
- [ ] **Vérifier que seul "test" diminue**

#### Tableau Récapitulatif CMS
- [ ] Aller sur page CMS Produits Structurés
- [ ] Scroller vers le bas
- [ ] Vérifier le tableau récapitulatif:
  - [ ] Nom du produit
  - [ ] Total Réservé
  - [ ] Disponible
  - [ ] Ligne "TOTAL" en bas

---

## Checklist de Déploiement

### ✅ Avant de Déployer

- [ ] Tous les tests automatisés passent (100% de réussite)
- [ ] Les uploads de fichiers fonctionnent
- [ ] L'encodage UTF-8 est correct
- [ ] Les multiples fichiers par produit fonctionnent
- [ ] Les modifications de fichiers fonctionnent
- [ ] Les réservations par assurance sont correctes
- [ ] Le tableau récapitulatif s'affiche
- [ ] Aucune erreur console dans le navigateur
- [ ] Aucune erreur dans les logs backend

### 📊 Scripts de Déploiement

Si tous les tests passent, vous pouvez déployer:

```bash
# 1. Commiter les changements
git add .
git commit -m "feat: multiple file uploads and UTF-8 fixes"

# 2. Pousser vers le serveur
git push origin main

# 3. Sur le serveur, exécuter le script de déploiement
ssh user@server
cd ~/prod
./deploy-frontend-zero-downtime.sh
```

### 🔧 En cas d'échec

Si des tests échouent:

1. **Consulter les logs détaillés**
   ```bash
   cat backend/test-results.json
   ```

2. **Vérifier les logs du serveur**
   ```bash
   # Backend logs
   tail -f backend/logs/app.log
   ```

3. **Corriger les erreurs**
   - Lire les messages d'erreur
   - Corriger le code
   - Relancer les tests

4. **Ne PAS déployer tant que tous les tests ne passent pas**

---

## 🚨 Problèmes Courants

### Serveur non accessible

```bash
# Vérifier si le serveur tourne
curl http://localhost:3001/api/health

# Si non, le démarrer
cd backend
npm start
```

### Tests échouent avec "Unauthorized"

```bash
# Vérifier les credentials admin dans config.env
cat backend/config.env | grep ADMIN_EMAIL
```

### Erreur "Cannot find module"

```bash
# Installer les dépendances
cd backend
npm install
```

### Erreur encodage fichiers

```bash
# Exécuter le script de correction
cd backend
node scripts/fixFileNameEncoding.js
```

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Consultez les logs: `backend/test-results.json`
2. Vérifiez les erreurs console du navigateur (F12)
3. Vérifiez les logs backend

---

## 🎉 Félicitations!

Si tous les tests passent, votre application est prête pour la production! 🚀

