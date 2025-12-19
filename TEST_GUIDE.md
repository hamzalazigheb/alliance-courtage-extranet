# Guide de Test - Fonctionnalités Implémentées

## ✅ Fonctionnalités à Tester

### 1. Upload en Masse des Bordereaux

#### Test 1.1 : Upload fichiers PDF
- [ ] Accéder à `/gestion-comptabilite`
- [ ] Sélectionner plusieurs fichiers PDF
- [ ] Vérifier que tous sont acceptés
- [ ] Uploader et vérifier le succès

#### Test 1.2 : Upload fichiers XLS/XLSX
- [ ] Sélectionner un fichier `.xls`
- [ ] Vérifier qu'il est accepté (pas d'erreur)
- [ ] Sélectionner un fichier `.xlsx`
- [ ] Vérifier qu'il est accepté
- [ ] Uploader et vérifier le succès

#### Test 1.3 : Upload mixte (PDF + XLS)
- [ ] Sélectionner plusieurs fichiers PDF et XLS mélangés
- [ ] Vérifier que tous sont acceptés
- [ ] Uploader et vérifier le succès

### 2. Matching Automatique

#### Test 2.1 : Matching par dénomination sociale (format correct)
- [ ] Créer fichier : `NERIUM_PATRIMOINE_janvier_2025.pdf`
- [ ] Uploader en mode automatique
- [ ] Vérifier qu'il est associé à "NERIUM PATRIMOINE" (score 100%)

#### Test 2.2 : Matching avec "Bordereau" au début (NOUVEAU)
- [ ] Créer fichier : `Bordereau NERIUM PATRIMOINE 01 25.pdf`
- [ ] Uploader en mode automatique
- [ ] Vérifier qu'il est associé à "NERIUM PATRIMOINE" (score 98%)
- [ ] Vérifier qu'il n'est PAS associé à "BONFAIT Julien"

#### Test 2.3 : Matching par nom/prénom
- [ ] Créer fichier : `Julien_BONFAIT_janvier_2025.pdf`
- [ ] Uploader
- [ ] Vérifier qu'il est associé à "BONFAIT Julien"

### 3. Gestion des Utilisateurs

#### Test 3.1 : Pagination 50 utilisateurs
- [ ] Accéder à la page utilisateurs
- [ ] Vérifier que 50 utilisateurs sont affichés par défaut (au lieu de 10)

#### Test 3.2 : Tri par dénomination sociale
- [ ] Vérifier que les utilisateurs sont triés par dénomination sociale
- [ ] Vérifier que ceux sans dénomination sociale sont triés par nom

#### Test 3.3 : Filtre Actif/Inactif
- [ ] Cliquer sur "Tous" → Vérifier tous les utilisateurs
- [ ] Cliquer sur "Actifs" → Vérifier seulement les actifs
- [ ] Cliquer sur "Inactifs" → Vérifier seulement les inactifs

#### Test 3.4 : Code couleur utilisateur inactif
- [ ] Trouver un utilisateur inactif
- [ ] Vérifier que sa ligne est grise avec opacité réduite

#### Test 3.5 : Confirmation avant mise en inactif
- [ ] Cliquer sur "Inactif" pour un utilisateur actif
- [ ] Vérifier qu'un message de confirmation apparaît
- [ ] Vérifier que le message contient le nom de l'utilisateur
- [ ] Confirmer et vérifier que l'utilisateur devient inactif

#### Test 3.6 : Confirmation avant suppression
- [ ] Cliquer sur "Supprimer" pour un utilisateur
- [ ] Vérifier qu'un message de confirmation apparaît
- [ ] Vérifier que le message contient le nom de l'utilisateur
- [ ] Vérifier le message d'avertissement sur l'irréversibilité

#### Test 3.7 : Colonnes Téléphone et Code postal
- [ ] Vérifier que la colonne "Téléphone" est large (200px)
- [ ] Vérifier que la colonne "Code postal" est étroite (80px)
- [ ] Vérifier que les numéros de téléphone s'affichent sur une seule ligne

### 4. Gestion des Partenaires

#### Test 4.1 : Fenêtre partenaires s'affiche correctement
- [ ] Ouvrir la modification d'un partenaire
- [ ] Vérifier que la fenêtre s'affiche au centre de l'écran
- [ ] Vérifier qu'on peut scroller vers la fenêtre si nécessaire

#### Test 4.2 : Fenêtre contacts s'affiche correctement
- [ ] Ouvrir la gestion des contacts d'un partenaire
- [ ] Vérifier que la fenêtre s'affiche au centre de l'écran

#### Test 4.3 : Fenêtre documents s'affiche correctement
- [ ] Ouvrir la gestion des documents d'un partenaire
- [ ] Vérifier que la fenêtre s'affiche au centre de l'écran

### 5. Validation des Fichiers

#### Test 5.1 : Fichier commençant par une lettre
- [ ] Créer fichier : `Test_file.pdf` → ✅ Doit être accepté
- [ ] Créer fichier : `2025_file.pdf` → ❌ Doit être refusé

#### Test 5.2 : Formats acceptés
- [ ] PDF → ✅ Accepté
- [ ] XLS → ✅ Accepté
- [ ] XLSX → ✅ Accepté
- [ ] DOC → ✅ Accepté
- [ ] TXT → ✅ Accepté

## 📋 Checklist Complète

### Backend
- [x] Routes bordereaux acceptent XLS/XLSX
- [x] Routes archives acceptent XLS/XLSX
- [x] Routes financialDocuments acceptent XLS/XLSX
- [x] Routes formations acceptent XLS/XLSX
- [x] Routes partners acceptent XLS/XLSX
- [x] Routes structuredProducts acceptent XLS/XLSX
- [x] Tri par dénomination sociale dans backend

### Frontend
- [x] File input accepte .xls et .xlsx
- [x] Matching ignore les mots communs (Bordereau, Document, etc.)
- [x] Matching priorise la dénomination sociale
- [x] Pagination 50 utilisateurs par défaut
- [x] Filtre Actif/Inactif
- [x] Code couleur utilisateur inactif
- [x] Confirmation avant inactif/suppression
- [x] Colonnes Téléphone/CP ajustées
- [x] Fenêtres partenaires avec scrollIntoView

## 🐛 Problèmes Connus et Solutions

### Problème : Fichiers XLS refusés
**Solution :** ✅ Corrigé - Backend et frontend acceptent maintenant XLS/XLSX

### Problème : Mauvais matching (ex: NERIUM → BONFAIT)
**Solution :** ✅ Corrigé - Le système ignore maintenant "Bordereau" et cherche directement la dénomination sociale

### Problème : Upload échoue sans raison
**Vérifier :**
- Console du navigateur (F12) pour les erreurs
- Logs backend
- Vérifier que les fichiers commencent par une lettre
- Vérifier que les utilisateurs existent

## 🧪 Tests à Effectuer Manuellement

1. **Test Matching avec "Bordereau"**
   ```
   Fichier : "Bordereau NERIUM PATRIMOINE 01 25.pdf"
   Attendu : Associé à "NERIUM PATRIMOINE" (score 98%)
   ```

2. **Test Upload XLS**
   ```
   Fichier : "NERIUM_PATRIMOINE_test.xls"
   Attendu : Accepté et uploadé avec succès
   ```

3. **Test Filtre Utilisateurs**
   ```
   Action : Cliquer sur "Actifs"
   Attendu : Seulement les utilisateurs actifs sont affichés
   ```

4. **Test Confirmation**
   ```
   Action : Cliquer sur "Inactif" pour un utilisateur
   Attendu : Message de confirmation avec nom de l'utilisateur
   ```

## 📝 Notes

- Tous les tests doivent être effectués en tant qu'administrateur
- Les fichiers de test doivent être créés avec les bons noms
- Vérifier les emails de notification après upload
- Vérifier que les fichiers sont visibles dans l'onglet "Comptabilité" de l'utilisateur

