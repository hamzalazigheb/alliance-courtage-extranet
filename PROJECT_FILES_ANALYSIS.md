# Analyse des fichiers du projet - À supprimer vs À conserver

## 📁 FICHIERS À CONSERVER (Essentiels)

### Configuration et Build
- ✅ `package.json` - Dépendances du projet
- ✅ `package-lock.json` - Verrouillage des versions
- ✅ `tsconfig.json` - Configuration TypeScript
- ✅ `vite.config.ts` - Configuration Vite
- ✅ `tailwind.config.js` - Configuration Tailwind CSS
- ✅ `postcss.config.js` - Configuration PostCSS
- ✅ `index.html` - Point d'entrée HTML
- ✅ `index.css` - Styles globaux
- ✅ `index.tsx` - Point d'entrée React

### Backend
- ✅ `backend/package.json` - Dépendances backend
- ✅ `backend/package-lock.json` - Verrouillage des versions
- ✅ `backend/server.js` - Serveur Express principal
- ✅ `backend/config/database.js` - Configuration base de données
- ✅ `backend/config.env` - Variables d'environnement (à sécuriser)
- ✅ `backend/middleware/auth.js` - Middleware d'authentification
- ✅ `backend/services/emailService.js` - Service email
- ✅ `backend/routes/*.js` - Toutes les routes API (essentielles)
- ✅ `backend/Dockerfile` - Image Docker backend
- ✅ `backend/docker-compose.yml` - Configuration Docker Compose

### Frontend - Source
- ✅ `src/App.tsx` - Composant principal
- ✅ `src/api.js` - Configuration API
- ✅ `src/types.ts` - Types TypeScript
- ✅ `src/index.tsx` - Point d'entrée React
- ✅ `src/index.css` - Styles
- ✅ `src/pages/*.tsx` - Tous les composants de pages (extraits)
- ✅ `src/components/*.tsx` - Composants réutilisables
- ✅ `src/hooks/*.ts` - Hooks React personnalisés
- ✅ `src/utils/*.ts` - Utilitaires
- ✅ `src/*Page.tsx` - Pages principales (CMS, Manage, etc.)

### Docker et Déploiement
- ✅ `Dockerfile` - Image Docker frontend
- ✅ `nginx.conf` - Configuration Nginx
- ✅ `nginx-production.conf` - Configuration Nginx production
- ✅ `docker-compose.yml` (si présent) - Configuration Docker Compose

### Documentation essentielle
- ✅ `README.md` - Documentation principale
- ✅ `GUIDE_UTILISATEUR.md` - Guide utilisateur
- ✅ `GUIDE_ADMINISTRATEUR.md` - Guide administrateur
- ✅ `GUIDE_UTILISATEUR.html` - Guide utilisateur (HTML)
- ✅ `GUIDE_ADMINISTRATEUR.html` - Guide administrateur (HTML)
- ✅ `GUIDE_UTILISATEUR.pdf` - Guide utilisateur (PDF)
- ✅ `GUIDE_ADMINISTRATEUR.pdf` - Guide administrateur (PDF)
- ✅ `NOTIFICATIONS_ARCHITECTURE.md` - Architecture des notifications

### Assets
- ✅ `public/*` - Tous les fichiers publics (logos, images)
- ✅ `alliance-courtage-logo.svg` - Logo principal
- ✅ `abeille-assurances-logo.svg` - Logo partenaire

### Scripts essentiels
- ✅ `backend/scripts/init.sql` - Script d'initialisation DB
- ✅ `backend/scripts/initDatabase.js` - Script d'initialisation DB
- ✅ `backend/scripts/emptyDatabase.js` - Script pour vider la DB (utile pour client)
- ✅ `backend/scripts/emptyDatabase.sql` - Version SQL
- ✅ `backend/scripts/resetAdminPassword.js` - Réinitialisation mot de passe admin

---

## 🗑️ FICHIERS À SUPPRIMER (Temporaires/Debug/Redondants)

### Documentation temporaire et debug (86 fichiers .md à supprimer)
- ❌ `API_TESTING_GUIDE.md`
- ❌ `BASE64_UPLOAD_VERIFICATION.md`
- ❌ `CACHE_IMPLEMENTATION_SUMMARY.md`
- ❌ `CACHE_IMPLEMENTATION.md`
- ❌ `CHARTE_GRAPHIQUE_PUBLIC.md`
- ❌ `CHECK_ALL_ERRORS.md`
- ❌ `CHECK_BORDEREAUX_ERROR.md`
- ❌ `CHECK_BORDEREAUX_RECENT_ERROR.md`
- ❌ `CHECK_BORDEREAUX_RECENT_FINAL.md`
- ❌ `CHECK_LATEST_ERROR.md`
- ❌ `CHECK_REGLEMENTAIRE_ERROR.md`
- ❌ `CLEAR_RECENT_UPLOADS.md`
- ❌ `DEBUG_BROADCAST_ROUTE.md`
- ❌ `DEBUG_EMAIL_RESERVATION.md`
- ❌ `DEPLOY_BORDEREAUX_FIX.md`
- ❌ `DEPLOY_CHECKLIST.md`
- ❌ `DEPLOY_COMMANDS.md`
- ❌ `DEPLOY_CORRECTED.md`
- ❌ `DEPLOY_DOCKER_MIGRATION.md`
- ❌ `DEPLOY_FIX_ROUTES_404.md`
- ❌ `DEPLOY_FIX.md`
- ❌ `DEPLOY_GITHUB_WORKFLOW.md`
- ❌ `DEPLOY_NOTIFICATIONS_LINK.md`
- ❌ `DEPLOY_NOW_TERMIUS.md`
- ❌ `DEPLOY_RATE_LIMIT_FIX.md`
- ❌ `DEPLOY_REGLEMENTAIRE_FIX.md`
- ❌ `DEPLOY_SERVER_FIXES.md`
- ❌ `DEPLOY_STEPS.md`
- ❌ `DEPLOY_TERMIUS.md`
- ❌ `DEPLOYMENT_GUIDE.md`
- ❌ `DEPLOYMENT_PACKAGE.md`
- ❌ `FILES_TO_DELETE.md`
- ❌ `FINAL_CLEANUP.md`
- ❌ `FINAL_RATE_LIMIT_FIX.md`
- ❌ `FINAL_VERIFICATION.md`
- ❌ `FIND_MYSQL_PASSWORD.md`
- ❌ `FIX_404_BORDEREAUX.md`
- ❌ `FIX_500_BORDEREAUX.md`
- ❌ `FIX_ALL_TABLES_FILE_CONTENT.md`
- ❌ `FIX_BORDEREAUX_STRUCTURE.md`
- ❌ `FIX_BORDEREAUX_TABLE.md`
- ❌ `FIX_BOTH_ROUTES.md`
- ❌ `FIX_CORRUPTED_JSON_LOCAL.md`
- ❌ `FIX_DOCKER_NETWORK.md`
- ❌ `FIX_FINANCIAL_DOCUMENTS.md`
- ❌ `FIX_MISSING_TABLES.md`
- ❌ `FIX_OLD_VERSION.md`
- ❌ `FIX_PARTNERS_TABLE.md`
- ❌ `FIX_PRODUCT_RESERVATIONS.md`
- ❌ `FIX_RATE_LIMIT_FINAL.md`
- ❌ `FIX_RATE_LIMIT_PERMANENT.md`
- ❌ `FIX_RATE_LIMIT.md`
- ❌ `FIX_REGLEMENTAIRE_TABLES.md`
- ❌ `FIX_RESERVATIONS_ROUTE.md`
- ❌ `HOME_PAGE_STATIC_DATA.md`
- ❌ `HTTPS_SETUP.md`
- ❌ `IMPLEMENTATION_SUMMARY.md`
- ❌ `INSTALLATION_DATABASE.md`
- ❌ `MIGRATION_UTILISATEURS.md`
- ❌ `PERMISSIONS_AUDIT.md`
- ❌ `PROFILE_PHOTO_REMOVAL_SUMMARY.md`
- ❌ `PROJECT_ANALYSIS.md`
- ❌ `PROJECT_REVIEW.md`
- ❌ `QUICK_DEPLOY.md`
- ❌ `QUICK_FIX_BROADCAST.md`
- ❌ `QUICK_GITHUB_DEPLOY.md`
- ❌ `QUICK_INSTALL_GUIDE.md`
- ❌ `QUICK_TEST_GUIDE.md`
- ❌ `REBUILD_FRONTEND.md`
- ❌ `REDEPLOY_FRONTEND.md`
- ❌ `REDEPLOY_WITHOUT_NPM.md`
- ❌ `RESET_DATABASE_FOR_CLIENT.md`
- ❌ `RESET_DB_WITH_PASSWORD.md`
- ❌ `SECURITY_AUDIT.md`
- ❌ `SECURITY_RECOMMENDATIONS.md`
- ❌ `TEST_LOCAL_IMAGE_UPLOAD.md`
- ❌ `TEST_LOCAL_UPLOAD.md`
- ❌ `TEST_RESULTS.md`
- ❌ `TEST_SCRIPTS_README.md`
- ❌ `TEST_SUMMARY.md`
- ❌ `VERIFY_BORDEREAUX_TABLE.md`

### Scripts SQL temporaires (à supprimer après migration)
- ❌ `CREATE_REGLEMENTAIRE_TABLES.sql` - Migration déjà effectuée
- ❌ `FIX_ALL_TABLES.sql` - Fix temporaire
- ❌ `RECREATE_BORDEREAUX_FINAL.sql` - Migration déjà effectuée
- ❌ `RESET_DATABASE_FIXED.sql` - Utiliser emptyDatabase.js à la place
- ❌ `backend/scripts/checkCMSContentColumn.sql` - Vérification temporaire
- ❌ `backend/scripts/fixContentColumn.sql` - Fix temporaire
- ❌ `backend/scripts/fixCorruptedCMSJSON.sql` - Fix temporaire
- ❌ `backend/scripts/addLinkToNotifications.sql` - Migration déjà effectuée
- ❌ `backend/scripts/fixProductReservationsTable.sql` - Migration déjà effectuée

### Scripts de migration (à archiver ou supprimer après migration)
- ❌ `backend/scripts/addAllUserColumns.js` - Migration déjà effectuée
- ❌ `backend/scripts/addAssuranceColumn.js` - Migration déjà effectuée
- ❌ `backend/scripts/addAssurancesTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/addBase64ColumnToBordereaux.js` - Migration déjà effectuée
- ❌ `backend/scripts/addBordereauxTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/addDenominationSocialeToUsers.js` - Migration déjà effectuée
- ❌ `backend/scripts/addFavorisTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/addFileContentToArchives.js` - Migration déjà effectuée
- ❌ `backend/scripts/addFileContentToArchivesForStructuredProducts.js` - Migration déjà effectuée
- ❌ `backend/scripts/addFileContentToBordereaux.js` - Migration déjà effectuée
- ❌ `backend/scripts/addFileContentToFinancialDocuments.js` - Migration déjà effectuée
- ❌ `backend/scripts/addFileContentToFormations.js` - Migration déjà effectuée
- ❌ `backend/scripts/addFinancialDocumentsTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/addFormationsTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/addLinkToNotifications.js` - Migration déjà effectuée
- ❌ `backend/scripts/addLogoContentToPartners.js` - Migration déjà effectuée
- ❌ `backend/scripts/addMissingColumnsToPasswordReset.js` - Migration déjà effectuée
- ❌ `backend/scripts/addNotificationsTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/addPasswordResetRequestsTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/addProductReservationsTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/addProfilePhotoToUsers.js` - Migration déjà effectuée
- ❌ `backend/scripts/addReglementaireTables.js` - Migration déjà effectuée
- ❌ `backend/scripts/addTelephoneCodePostalToUsers.js` - Migration déjà effectuée
- ❌ `backend/scripts/addUserEmailColumn.js` - Migration déjà effectuée
- ❌ `backend/scripts/checkProductReservationsTable.js` - Script de vérification temporaire
- ❌ `backend/scripts/createBordereauxTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/createCMSTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/exportLocalDatabase.js` - Script temporaire
- ❌ `backend/scripts/fixBordereauxFilePath.js` - Fix temporaire
- ❌ `backend/scripts/fixCMSContentToLongText.js` - Fix temporaire
- ❌ `backend/scripts/fixCompletedAtColumn.js` - Fix temporaire
- ❌ `backend/scripts/fixCorruptedCMS.js` - Fix temporaire
- ❌ `backend/scripts/fixProductReservationsTable.js` - Fix temporaire
- ❌ `backend/scripts/fixRoleEnumWithDataMigration.js` - Migration déjà effectuée
- ❌ `backend/scripts/fixUserRoles.js` - Fix temporaire
- ❌ `backend/scripts/fixUsersRoleEnum.js` - Fix temporaire
- ❌ `backend/scripts/freshDatabase.js` - Script temporaire
- ❌ `backend/scripts/listArchivesFiles.js` - Script de debug
- ❌ `backend/scripts/listBordereauxFiles.js` - Script de debug
- ❌ `backend/scripts/migrateBordereauxTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/migrateData.js` - Migration déjà effectuée
- ❌ `backend/scripts/recreatePasswordResetTable.js` - Migration déjà effectuée
- ❌ `backend/scripts/runAllMigrations.js` - Script temporaire
- ❌ `backend/scripts/runAllTests.js` - Script de test temporaire
- ❌ `backend/scripts/testAllAPI.js` - Script de test temporaire
- ❌ `backend/scripts/testDatabase.js` - Script de test temporaire
- ❌ `backend/scripts/testImageUpload.js` - Script de test temporaire
- ❌ `backend/scripts/testPerformance.js` - Script de test temporaire
- ❌ `backend/scripts/testSecurity.js` - Script de test temporaire
- ❌ `backend/scripts/testUserColumns.js` - Script de test temporaire
- ❌ `backend/scripts/verifyBordereauxTable.js` - Script de vérification temporaire
- ❌ `backend/scripts/viewUsers.js` - Script de debug
- ❌ `backend/scripts/checkSessions.js` - Script de debug
- ❌ `backend/scripts/installDatabase.sql` - Utiliser init.sql à la place

### Scripts shell temporaires
- ❌ `deploy.sh` - Script de déploiement temporaire
- ❌ `deploy-production.sh` - Script de déploiement temporaire
- ❌ `fix-broadcast-route.sh` - Fix temporaire
- ❌ `migrate-to-docker.sh` - Migration déjà effectuée
- ❌ `QUICK_RESET_DATABASE.sh` - Utiliser emptyDatabase.js
- ❌ `RESET_DATABASE_SAFE.sh` - Utiliser emptyDatabase.js
- ❌ `TERMIUS_QUICK_COMMANDS.sh` - Script temporaire
- ❌ `backend/setup.sh` - Script temporaire

### Scripts PowerShell temporaires
- ❌ `cleanup-md-files.ps1` - Script de nettoyage temporaire
- ❌ `cleanup-project.ps1` - Script de nettoyage temporaire
- ❌ `cleanup-remaining-files.ps1` - Script de nettoyage temporaire
- ❌ `fix-localhost-urls.ps1` - Fix temporaire

### Fichiers de configuration non utilisés
- ❌ `amplify.yml` - Configuration AWS Amplify (non utilisé)
- ❌ `netlify.toml` - Configuration Netlify (non utilisé si déployé sur Docker)

### Fichiers dupliqués
- ❌ `src/ProduitsStructuresPage.tsx` - **DUPLIQUÉ** (utiliser `src/pages/ProduitsStructuresPage.tsx` à la place)

### Dossiers temporaires
- ❌ `dist/` - Dossier de build (peut être régénéré)
- ❌ `node_modules/` - Dépendances (peut être régénéré avec `npm install`)
- ❌ `backend/node_modules/` - Dépendances backend (peut être régénéré)
- ❌ `uploads/` - Fichiers uploadés temporaires (à vérifier avant suppression)
- ❌ `backend/uploads/` - Fichiers uploadés backend (à vérifier avant suppression)
- ❌ `image/` - Images temporaires (à vérifier)

---

## ⚠️ FICHIERS À VÉRIFIER AVANT SUPPRESSION

### Scripts de migration (archiver si migration non terminée)
- ⚠️ `backend/scripts/wait-for-mysql.js` - Peut être utile pour Docker
- ⚠️ `backend/README.md` - Documentation backend (à vérifier si utile)

### Fichiers uploadés
- ⚠️ `backend/uploads/structured-products/*` - Vérifier si fichiers de production
- ⚠️ `backend/uploads/partners-logos/*` - Vérifier si logos de production
- ⚠️ `backend/uploads/cms-content/*` - Vérifier si contenu CMS de production

---

## 📊 RÉSUMÉ

### À CONSERVER
- **~50 fichiers essentiels** (code source, configuration, documentation principale)
- **~15 routes backend** (toutes les routes API)
- **~11 pages frontend** (tous les composants de pages)
- **Documentation utilisateur/admin** (guides HTML, MD, PDF)

### À SUPPRIMER
- **~86 fichiers .md** (documentation temporaire/debug)
- **~50 scripts de migration** (migrations déjà effectuées)
- **~8 scripts shell** (scripts temporaires)
- **~4 scripts PowerShell** (scripts temporaires)
- **~8 fichiers SQL** (migrations déjà effectuées)
- **1 fichier dupliqué** (`src/ProduitsStructuresPage.tsx`)

**Total estimé à supprimer : ~157 fichiers**

---

## 🎯 RECOMMANDATION

1. **Créer un dossier `archive/`** pour sauvegarder les scripts de migration avant suppression
2. **Supprimer tous les fichiers .md temporaires** (garder seulement README.md, guides utilisateur/admin, NOTIFICATIONS_ARCHITECTURE.md)
3. **Supprimer les scripts de migration** après vérification que toutes les migrations sont terminées
4. **Supprimer le fichier dupliqué** `src/ProduitsStructuresPage.tsx`
5. **Nettoyer les scripts shell/PowerShell** temporaires
6. **Vérifier les fichiers uploadés** avant suppression des dossiers `uploads/`

