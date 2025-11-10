# Analyse des fichiers du projet - Ã€ supprimer vs Ã€ conserver

## ðŸ“ FICHIERS Ã€ CONSERVER (Essentiels)

### Configuration et Build
- âœ… `package.json` - DÃ©pendances du projet
- âœ… `package-lock.json` - Verrouillage des versions
- âœ… `tsconfig.json` - Configuration TypeScript
- âœ… `vite.config.ts` - Configuration Vite
- âœ… `tailwind.config.js` - Configuration Tailwind CSS
- âœ… `postcss.config.js` - Configuration PostCSS
- âœ… `index.html` - Point d'entrÃ©e HTML
- âœ… `index.css` - Styles globaux
- âœ… `index.tsx` - Point d'entrÃ©e React

### Backend
- âœ… `backend/package.json` - DÃ©pendances backend
- âœ… `backend/package-lock.json` - Verrouillage des versions
- âœ… `backend/server.js` - Serveur Express principal
- âœ… `backend/config/database.js` - Configuration base de donnÃ©es
- âœ… `backend/config.env` - Variables d'environnement (Ã  sÃ©curiser)
- âœ… `backend/middleware/auth.js` - Middleware d'authentification
- âœ… `backend/services/emailService.js` - Service email
- âœ… `backend/routes/*.js` - Toutes les routes API (essentielles)
- âœ… `backend/Dockerfile` - Image Docker backend
- âœ… `backend/docker-compose.yml` - Configuration Docker Compose

### Frontend - Source
- âœ… `src/App.tsx` - Composant principal
- âœ… `src/api.js` - Configuration API
- âœ… `src/types.ts` - Types TypeScript
- âœ… `src/index.tsx` - Point d'entrÃ©e React
- âœ… `src/index.css` - Styles
- âœ… `src/pages/*.tsx` - Tous les composants de pages (extraits)
- âœ… `src/components/*.tsx` - Composants rÃ©utilisables
- âœ… `src/hooks/*.ts` - Hooks React personnalisÃ©s
- âœ… `src/utils/*.ts` - Utilitaires
- âœ… `src/*Page.tsx` - Pages principales (CMS, Manage, etc.)

### Docker et DÃ©ploiement
- âœ… `Dockerfile` - Image Docker frontend
- âœ… `nginx.conf` - Configuration Nginx
- âœ… `nginx-production.conf` - Configuration Nginx production
- âœ… `docker-compose.yml` (si prÃ©sent) - Configuration Docker Compose

### Documentation essentielle
- âœ… `README.md` - Documentation principale
- âœ… `GUIDE_UTILISATEUR.md` - Guide utilisateur
- âœ… `GUIDE_ADMINISTRATEUR.md` - Guide administrateur
- âœ… `GUIDE_UTILISATEUR.html` - Guide utilisateur (HTML)
- âœ… `GUIDE_ADMINISTRATEUR.html` - Guide administrateur (HTML)
- âœ… `GUIDE_UTILISATEUR.pdf` - Guide utilisateur (PDF)
- âœ… `GUIDE_ADMINISTRATEUR.pdf` - Guide administrateur (PDF)
- âœ… `NOTIFICATIONS_ARCHITECTURE.md` - Architecture des notifications

### Assets
- âœ… `public/*` - Tous les fichiers publics (logos, images)
- âœ… `alliance-courtage-logo.svg` - Logo principal
- âœ… `abeille-assurances-logo.svg` - Logo partenaire

### Scripts essentiels
- âœ… `backend/scripts/init.sql` - Script d'initialisation DB
- âœ… `backend/scripts/initDatabase.js` - Script d'initialisation DB
- âœ… `backend/scripts/emptyDatabase.js` - Script pour vider la DB (utile pour client)
- âœ… `backend/scripts/emptyDatabase.sql` - Version SQL
- âœ… `backend/scripts/resetAdminPassword.js` - RÃ©initialisation mot de passe admin

---

## ðŸ—‘ï¸ FICHIERS Ã€ SUPPRIMER (Temporaires/Debug/Redondants)

### Documentation temporaire et debug (86 fichiers .md Ã  supprimer)
- âŒ `API_TESTING_GUIDE.md`
- âŒ `BASE64_UPLOAD_VERIFICATION.md`
- âŒ `CACHE_IMPLEMENTATION_SUMMARY.md`
- âŒ `CACHE_IMPLEMENTATION.md`
- âŒ `CHARTE_GRAPHIQUE_PUBLIC.md`
- âŒ `CHECK_ALL_ERRORS.md`
- âŒ `CHECK_BORDEREAUX_ERROR.md`
- âŒ `CHECK_BORDEREAUX_RECENT_ERROR.md`
- âŒ `CHECK_BORDEREAUX_RECENT_FINAL.md`
- âŒ `CHECK_LATEST_ERROR.md`
- âŒ `CHECK_REGLEMENTAIRE_ERROR.md`
- âŒ `CLEAR_RECENT_UPLOADS.md`
- âŒ `DEBUG_BROADCAST_ROUTE.md`
- âŒ `DEBUG_EMAIL_RESERVATION.md`
- âŒ `DEPLOY_BORDEREAUX_FIX.md`
- âŒ `DEPLOY_CHECKLIST.md`
- âŒ `DEPLOY_COMMANDS.md`
- âŒ `DEPLOY_CORRECTED.md`
- âŒ `DEPLOY_DOCKER_MIGRATION.md`
- âŒ `DEPLOY_FIX_ROUTES_404.md`
- âŒ `DEPLOY_FIX.md`
- âŒ `DEPLOY_GITHUB_WORKFLOW.md`
- âŒ `DEPLOY_NOTIFICATIONS_LINK.md`
- âŒ `DEPLOY_NOW_TERMIUS.md`
- âŒ `DEPLOY_RATE_LIMIT_FIX.md`
- âŒ `DEPLOY_REGLEMENTAIRE_FIX.md`
- âŒ `DEPLOY_SERVER_FIXES.md`
- âŒ `DEPLOY_STEPS.md`
- âŒ `DEPLOY_TERMIUS.md`
- âŒ `DEPLOYMENT_GUIDE.md`
- âŒ `DEPLOYMENT_PACKAGE.md`
- âŒ `FILES_TO_DELETE.md`
- âŒ `FINAL_CLEANUP.md`
- âŒ `FINAL_RATE_LIMIT_FIX.md`
- âŒ `FINAL_VERIFICATION.md`
- âŒ `FIND_MYSQL_PASSWORD.md`
- âŒ `FIX_404_BORDEREAUX.md`
- âŒ `FIX_500_BORDEREAUX.md`
- âŒ `FIX_ALL_TABLES_FILE_CONTENT.md`
- âŒ `FIX_BORDEREAUX_STRUCTURE.md`
- âŒ `FIX_BORDEREAUX_TABLE.md`
- âŒ `FIX_BOTH_ROUTES.md`
- âŒ `FIX_CORRUPTED_JSON_LOCAL.md`
- âŒ `FIX_DOCKER_NETWORK.md`
- âŒ `FIX_FINANCIAL_DOCUMENTS.md`
- âŒ `FIX_MISSING_TABLES.md`
- âŒ `FIX_OLD_VERSION.md`
- âŒ `FIX_PARTNERS_TABLE.md`
- âŒ `FIX_PRODUCT_RESERVATIONS.md`
- âŒ `FIX_RATE_LIMIT_FINAL.md`
- âŒ `FIX_RATE_LIMIT_PERMANENT.md`
- âŒ `FIX_RATE_LIMIT.md`
- âŒ `FIX_REGLEMENTAIRE_TABLES.md`
- âŒ `FIX_RESERVATIONS_ROUTE.md`
- âŒ `HOME_PAGE_STATIC_DATA.md`
- âŒ `HTTPS_SETUP.md`
- âŒ `IMPLEMENTATION_SUMMARY.md`
- âŒ `INSTALLATION_DATABASE.md`
- âŒ `MIGRATION_UTILISATEURS.md`
- âŒ `PERMISSIONS_AUDIT.md`
- âŒ `PROFILE_PHOTO_REMOVAL_SUMMARY.md`
- âŒ `PROJECT_ANALYSIS.md`
- âŒ `PROJECT_REVIEW.md`
- âŒ `QUICK_DEPLOY.md`
- âŒ `QUICK_FIX_BROADCAST.md`
- âŒ `QUICK_GITHUB_DEPLOY.md`
- âŒ `QUICK_INSTALL_GUIDE.md`
- âŒ `QUICK_TEST_GUIDE.md`
- âŒ `REBUILD_FRONTEND.md`
- âŒ `REDEPLOY_FRONTEND.md`
- âŒ `REDEPLOY_WITHOUT_NPM.md`
- âŒ `RESET_DATABASE_FOR_CLIENT.md`
- âŒ `RESET_DB_WITH_PASSWORD.md`
- âŒ `SECURITY_AUDIT.md`
- âŒ `SECURITY_RECOMMENDATIONS.md`
- âŒ `TEST_LOCAL_IMAGE_UPLOAD.md`
- âŒ `TEST_LOCAL_UPLOAD.md`
- âŒ `TEST_RESULTS.md`
- âŒ `TEST_SCRIPTS_README.md`
- âŒ `TEST_SUMMARY.md`
- âŒ `VERIFY_BORDEREAUX_TABLE.md`

### Scripts SQL temporaires (Ã  supprimer aprÃ¨s migration)
- âŒ `CREATE_REGLEMENTAIRE_TABLES.sql` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `FIX_ALL_TABLES.sql` - Fix temporaire
- âŒ `RECREATE_BORDEREAUX_FINAL.sql` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `RESET_DATABASE_FIXED.sql` - Utiliser emptyDatabase.js Ã  la place
- âŒ `backend/scripts/checkCMSContentColumn.sql` - VÃ©rification temporaire
- âŒ `backend/scripts/fixContentColumn.sql` - Fix temporaire
- âŒ `backend/scripts/fixCorruptedCMSJSON.sql` - Fix temporaire
- âŒ `backend/scripts/addLinkToNotifications.sql` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/fixProductReservationsTable.sql` - Migration dÃ©jÃ  effectuÃ©e

### Scripts de migration (Ã  archiver ou supprimer aprÃ¨s migration)
- âŒ `backend/scripts/addAllUserColumns.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addAssuranceColumn.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addAssurancesTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addBase64ColumnToBordereaux.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addBordereauxTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addDenominationSocialeToUsers.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addFavorisTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addFileContentToArchives.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addFileContentToArchivesForStructuredProducts.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addFileContentToBordereaux.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addFileContentToFinancialDocuments.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addFileContentToFormations.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addFinancialDocumentsTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addFormationsTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addLinkToNotifications.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addLogoContentToPartners.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addMissingColumnsToPasswordReset.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addNotificationsTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addPasswordResetRequestsTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addProductReservationsTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addProfilePhotoToUsers.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addReglementaireTables.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addTelephoneCodePostalToUsers.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/addUserEmailColumn.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/checkProductReservationsTable.js` - Script de vÃ©rification temporaire
- âŒ `backend/scripts/createBordereauxTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/createCMSTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/exportLocalDatabase.js` - Script temporaire
- âŒ `backend/scripts/fixBordereauxFilePath.js` - Fix temporaire
- âŒ `backend/scripts/fixCMSContentToLongText.js` - Fix temporaire
- âŒ `backend/scripts/fixCompletedAtColumn.js` - Fix temporaire
- âŒ `backend/scripts/fixCorruptedCMS.js` - Fix temporaire
- âŒ `backend/scripts/fixProductReservationsTable.js` - Fix temporaire
- âŒ `backend/scripts/fixRoleEnumWithDataMigration.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/fixUserRoles.js` - Fix temporaire
- âŒ `backend/scripts/fixUsersRoleEnum.js` - Fix temporaire
- âŒ `backend/scripts/freshDatabase.js` - Script temporaire
- âŒ `backend/scripts/listArchivesFiles.js` - Script de debug
- âŒ `backend/scripts/listBordereauxFiles.js` - Script de debug
- âŒ `backend/scripts/migrateBordereauxTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/migrateData.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/recreatePasswordResetTable.js` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `backend/scripts/runAllMigrations.js` - Script temporaire
- âŒ `backend/scripts/runAllTests.js` - Script de test temporaire
- âŒ `backend/scripts/testAllAPI.js` - Script de test temporaire
- âŒ `backend/scripts/testDatabase.js` - Script de test temporaire
- âŒ `backend/scripts/testImageUpload.js` - Script de test temporaire
- âŒ `backend/scripts/testPerformance.js` - Script de test temporaire
- âŒ `backend/scripts/testSecurity.js` - Script de test temporaire
- âŒ `backend/scripts/testUserColumns.js` - Script de test temporaire
- âŒ `backend/scripts/verifyBordereauxTable.js` - Script de vÃ©rification temporaire
- âŒ `backend/scripts/viewUsers.js` - Script de debug
- âŒ `backend/scripts/checkSessions.js` - Script de debug
- âŒ `backend/scripts/installDatabase.sql` - Utiliser init.sql Ã  la place

### Scripts shell temporaires
- âŒ `deploy.sh` - Script de dÃ©ploiement temporaire
- âŒ `deploy-production.sh` - Script de dÃ©ploiement temporaire
- âŒ `fix-broadcast-route.sh` - Fix temporaire
- âŒ `migrate-to-docker.sh` - Migration dÃ©jÃ  effectuÃ©e
- âŒ `QUICK_RESET_DATABASE.sh` - Utiliser emptyDatabase.js
- âŒ `RESET_DATABASE_SAFE.sh` - Utiliser emptyDatabase.js
- âŒ `TERMIUS_QUICK_COMMANDS.sh` - Script temporaire
- âŒ `backend/setup.sh` - Script temporaire

### Scripts PowerShell temporaires
- âŒ `cleanup-md-files.ps1` - Script de nettoyage temporaire
- âŒ `cleanup-project.ps1` - Script de nettoyage temporaire
- âŒ `cleanup-remaining-files.ps1` - Script de nettoyage temporaire
- âŒ `fix-localhost-urls.ps1` - Fix temporaire

### Fichiers de configuration non utilisÃ©s
- âŒ `amplify.yml` - Configuration AWS Amplify (non utilisÃ©)
- âŒ `netlify.toml` - Configuration Netlify (non utilisÃ© si dÃ©ployÃ© sur Docker)

### Fichiers dupliquÃ©s
- âŒ `src/ProduitsStructuresPage.tsx` - **DUPLIQUÃ‰** (utiliser `src/pages/ProduitsStructuresPage.tsx` Ã  la place)

### Dossiers temporaires
- âŒ `dist/` - Dossier de build (peut Ãªtre rÃ©gÃ©nÃ©rÃ©)
- âŒ `node_modules/` - DÃ©pendances (peut Ãªtre rÃ©gÃ©nÃ©rÃ© avec `npm install`)
- âŒ `backend/node_modules/` - DÃ©pendances backend (peut Ãªtre rÃ©gÃ©nÃ©rÃ©)
- âŒ `uploads/` - Fichiers uploadÃ©s temporaires (Ã  vÃ©rifier avant suppression)
- âŒ `backend/uploads/` - Fichiers uploadÃ©s backend (Ã  vÃ©rifier avant suppression)
- âŒ `image/` - Images temporaires (Ã  vÃ©rifier)

---

## âš ï¸ FICHIERS Ã€ VÃ‰RIFIER AVANT SUPPRESSION

### Scripts de migration (archiver si migration non terminÃ©e)
- âš ï¸ `backend/scripts/wait-for-mysql.js` - Peut Ãªtre utile pour Docker
- âš ï¸ `backend/README.md` - Documentation backend (Ã  vÃ©rifier si utile)

### Fichiers uploadÃ©s
- âš ï¸ `backend/uploads/structured-products/*` - VÃ©rifier si fichiers de production
- âš ï¸ `backend/uploads/partners-logos/*` - VÃ©rifier si logos de production
- âš ï¸ `backend/uploads/cms-content/*` - VÃ©rifier si contenu CMS de production

---

## ðŸ“Š RÃ‰SUMÃ‰

### Ã€ CONSERVER
- **~50 fichiers essentiels** (code source, configuration, documentation principale)
- **~15 routes backend** (toutes les routes API)
- **~11 pages frontend** (tous les composants de pages)
- **Documentation utilisateur/admin** (guides HTML, MD, PDF)

### Ã€ SUPPRIMER
- **~86 fichiers .md** (documentation temporaire/debug)
- **~50 scripts de migration** (migrations dÃ©jÃ  effectuÃ©es)
- **~8 scripts shell** (scripts temporaires)
- **~4 scripts PowerShell** (scripts temporaires)
- **~8 fichiers SQL** (migrations dÃ©jÃ  effectuÃ©es)
- **1 fichier dupliquÃ©** (`src/ProduitsStructuresPage.tsx`)

**Total estimÃ© Ã  supprimer : ~157 fichiers**

---

## ðŸŽ¯ RECOMMANDATION

1. **CrÃ©er un dossier `archive/`** pour sauvegarder les scripts de migration avant suppression
2. **Supprimer tous les fichiers .md temporaires** (garder seulement README.md, guides utilisateur/admin, NOTIFICATIONS_ARCHITECTURE.md)
3. **Supprimer les scripts de migration** aprÃ¨s vÃ©rification que toutes les migrations sont terminÃ©es
4. **Supprimer le fichier dupliquÃ©** `src/ProduitsStructuresPage.tsx`
5. **Nettoyer les scripts shell/PowerShell** temporaires
6. **VÃ©rifier les fichiers uploadÃ©s** avant suppression des dossiers `uploads/`

