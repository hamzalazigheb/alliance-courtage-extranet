# Liste des fichiers à supprimer

## 📁 Fichiers de backup/anciens dans `src/`
- `src/App_backup.tsx` - Backup de App.tsx
- `src/App_new.tsx` - Version test de App.tsx
- `src/GammeFinancierePage_new.tsx` - Version test
- `src/GammeFinancierePage_clean.tsx` - Version nettoyée (si non utilisée)

## 📦 Fichiers ZIP (archives)
- `alliance-courtage-fixed.zip` - Archive ancienne
- `alliance-courtage-build-fixed.zip` - Archive build ancienne

## 💾 Fichiers SQL de backup
- `backend/backup_local.sql` - Backup local
- `backend/backup_local_2025-11-01.sql` - Backup daté

## 📄 Fichiers de documentation excessive (garder README.md et backend/README.md)
- `ADMIN_DASHBOARD.md`
- `ADMIN_PASSWORD_RECOVERY.md`
- `AUTHENTICATION.md`
- `AWS_SES_SMTP_CONFIGURATION_GUIDE.md`
- `CHECK_STATUS.md`
- `CONFIGURE_MAILTRAP_ON_SERVER.md`
- `DEPLOY_TIME_EXPLANATION.md`
- `DEPLOY_WITH_LOCAL_DATABASE.md`
- `DEPLOY_WITH_TERMIUS.md`
- `DEPLOYMENT_COMMANDS.md`
- `DEPLOYMENT_FROM_SCRATCH.md`
- `DOCKER_DEPLOYMENT_FROM_SCRATCH.md`
- `DOCKER_QUICK_START.md`
- `EC2_DEPLOYMENT_GUIDE.md`
- `EMAIL_CONFIGURATION.md`
- `FILE_ARCHITECTURE.md`
- `FILE_MANAGEMENT.md`
- `FIX_DOCKER_BUILD_ERROR.md`
- `FIX_DOCKER_PERMISSIONS.md`
- `FIX_MAILTRAP_ENV.md`
- `FIX_RESERVATION_ERROR.md`
- `FIX_ROLE_ENUM_QUICK.md`
- `FIX_ROLE_ENUM.md`
- `GESTION_ASSURANCES_GUIDE.md`
- `GUIDE_NOM_MASSE.md`
- `HIDDEN_PAGE_ACCESS.md`
- `MAILTRAP_SETUP_GUIDE.md`
- `MIGRATE_LOCAL_DB_TO_DOCKER.md`
- `PROBLEM_RESOLUTION.md`
- `PRODUITS_STRUCTURES_ARCHITECTURE.md`
- `PRODUITS_STRUCTURES_FLOW.md`
- `PRODUITS_STRUCTURES_PAGE_ROLE.md`
- `PROJECT_STATUS.md`
- `QUICK_DEPLOY.md`
- `QUICK_DEPLOYMENT_CHECKLIST.md`
- `QUICK_SERVER_DEPLOY.md`
- `QUICK_START.md`
- `README_DEPLOY.md`
- `RESERVATION_GUIDE.md`
- `SERVER_ACCESS_AND_DEPLOY.md`
- `START_CONTAINERS.md`
- `STOP_CONTAINERS.md`
- `STRUCTURED_PRODUCTS_DASHBOARD.md`
- `TERMIUS_QUICK_START.md`
- `TEST_COMPLET_INTERFACE.md`
- `TEST_EMAIL_RESET.md`
- `TEST_MAILTRAP_ON_SERVER.md`
- `TEST_PARTNERS.md`
- `TEST_UPLOAD_MASSE.md`
- `TESTING_GUIDE.md`
- `TROUBLESHOOTING.md`
- `UPLOAD_MASSE_IMPLEMENTATION.md`
- `UPLOAD_MASSE_LOGIC.md`
- `WHAT_HAPPENS_AFTER_DEPLOY.md`

## 🗂️ Dossiers/Fichiers dupliqués
- `backend/backend/` - Dossier dupliqué (vide - services/ est vide)

## 📊 Fichiers de données brutes (à la racine)
- `BDD 2025 (2).xlsx - Base Brute.csv`
- `BDD 2025.xlsx`

## 🧪 Fichiers de test (si non utilisés)
- `backend/scripts/testAPI.js`
- `backend/scripts/testAPIReset.js`
- `backend/scripts/testEmailReset.js`
- `backend/scripts/testMailtrap.js`
- `backend/scripts/testMailtrapDirect.js`
- `backend/scripts/testRegister.js`
- `test-all.sh`

## 🔧 Scripts de migration déjà exécutés (à garder pour historique, mais optionnel de supprimer)
- `backend/scripts/addAssuranceColumn.js` (si migration terminée)
- `backend/scripts/addBase64ColumnToBordereaux.js` (si migration terminée)
- `backend/scripts/addFileContentToArchives.js` (si migration terminée)
- `backend/scripts/addFileContentToArchivesForStructuredProducts.js` (si migration terminée)
- `backend/scripts/addFileContentToBordereaux.js` (si migration terminée)
- `backend/scripts/addFileContentToFinancialDocuments.js` (si migration terminée)
- `backend/scripts/addFileContentToFormations.js` (si migration terminée)
- `backend/scripts/addLogoContentToPartners.js` (si migration terminée)
- `backend/scripts/addProfilePhotoToUsers.js` (si migration terminée)
- `backend/scripts/addUserEmailColumn.js` (si migration terminée)
- `backend/scripts/fixBordereauxFilePath.js` (si migration terminée)
- `backend/scripts/fixCompletedAtColumn.js` (si migration terminée)
- `backend/scripts/fixRoleEnumDirect.sql` (si migration terminée)
- `backend/scripts/fixUserRoles.js` (si migration terminée)
- `backend/scripts/fixUsersRoleEnum.js` (si migration terminée)
- `backend/scripts/migrateBordereauxTable.js` (si migration terminée)
- `backend/scripts/recreatePasswordResetTable.js` (si migration terminée)
- `backend/scripts/verifyBordereauxTable.js` (si migration terminée)

## 📝 Fichiers SQL de migration (optionnel - garder pour historique)
- `backend/scripts/createBordereauxTable.sql`
- `backend/scripts/addPasswordResetRequestsTable.sql`
- `backend/scripts/createCMSTable.sql`
- `backend/scripts/init.sql` (garder si utilisé pour initialisation)

## 🧹 Scripts de nettoyage
- `cleanup-md-files.ps1` - Script de nettoyage (peut être supprimé après utilisation)

## 📋 Fichiers suspects à vérifier
- `tatus --short` - Fichier étrange (probablement une erreur de commande)
- `src/financialProducts.json` - Utilisé uniquement par GammeFinancierePage_clean.tsx et _new.tsx (à supprimer si versions clean/new supprimées)
- `src/AzaleeWebsite.jsx` - Référencé mais à vérifier si utilisé
- `src/AzaleeWebsite.tsx` - Référencé mais à vérifier si utilisé
- `src/FileManagementPage.tsx` - Référencé mais possible doublon de FileManagePage.tsx
- `src/StructuredProductsDashboard.tsx` - Référencé mais à vérifier si utilisé
- `src/AdminDashboard.tsx` - Référencé mais à vérifier si utilisé

## 📂 Fichiers dans uploads/ (optionnel - à nettoyer périodiquement)
- `backend/uploads/structured-products/*` - Fichiers anciens si migration base64 terminée
- `backend/uploads/partners-logos/*` - Logos anciens si migration base64 terminée

## ⚠️ Fichiers à garder (utilisés)
- `src/index.css` - **GARDER** - Utilisé par index.tsx
- `src/App.tsx` - **GARDER** - Fichier principal
- `src/FileManagePage.tsx` - **GARDER** - Version active
- `image/` - **VÉRIFIER** - Dossier avec images, vérifier utilisation avant suppression

## 📊 Résumé des fichiers à supprimer

### 🔴 Priorité haute (sûrs à supprimer)
- 4 fichiers de backup dans src/
- 2 fichiers ZIP
- 2 fichiers SQL de backup
- ~50 fichiers .md de documentation
- 1 dossier dupliqué backend/backend/
- 2 fichiers Excel/CSV à la racine
- 1 fichier suspect "tatus --short"

### 🟡 Priorité moyenne (à vérifier)
- Scripts de migration déjà exécutés (garder pour historique ou supprimer)
- Fichiers de test
- Fichiers suspects dans src/
- Fichiers dans uploads/ (anciens fichiers physiques)

### 🟢 Priorité basse (garder pour référence)
- Scripts de migration (utiles pour l'historique)
- README.md et backend/README.md (garder)

