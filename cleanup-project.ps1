# Script de nettoyage du projet
# Supprime les fichiers obsolètes, backups, et doublons

Write-Host "🧹 Nettoyage du projet en cours..." -ForegroundColor Cyan

$deletedCount = 0
$errorCount = 0

# Fonction pour supprimer un fichier avec gestion d'erreur
function Remove-FileSafe {
    param($FilePath)
    if (Test-Path $FilePath) {
        try {
            Remove-Item $FilePath -Force -ErrorAction Stop
            Write-Host "✅ Supprimé: $FilePath" -ForegroundColor Green
            $script:deletedCount++
            return $true
        } catch {
            Write-Host "❌ Erreur: $FilePath - $_" -ForegroundColor Red
            $script:errorCount++
            return $false
        }
    } else {
        Write-Host "⚠️  Non trouvé: $FilePath" -ForegroundColor Yellow
        return $false
    }
}

# Fonction pour supprimer un dossier avec gestion d'erreur
function Remove-DirectorySafe {
    param($DirPath)
    if (Test-Path $DirPath) {
        try {
            Remove-Item $DirPath -Recurse -Force -ErrorAction Stop
            Write-Host "✅ Supprimé: $DirPath" -ForegroundColor Green
            $script:deletedCount++
            return $true
        } catch {
            Write-Host "❌ Erreur: $DirPath - $_" -ForegroundColor Red
            $script:errorCount++
            return $false
        }
    } else {
        Write-Host "⚠️  Non trouvé: $DirPath" -ForegroundColor Yellow
        return $false
    }
}

Write-Host "`n📁 Fichiers de backup dans src/" -ForegroundColor Cyan
Remove-FileSafe "src/App_backup.tsx"
Remove-FileSafe "src/App_new.tsx"
Remove-FileSafe "src/GammeFinancierePage_new.tsx"
Remove-FileSafe "src/GammeFinancierePage_clean.tsx"

Write-Host "`n📦 Fichiers ZIP" -ForegroundColor Cyan
Remove-FileSafe "alliance-courtage-fixed.zip"
Remove-FileSafe "alliance-courtage-build-fixed.zip"

Write-Host "`n💾 Fichiers SQL de backup" -ForegroundColor Cyan
Remove-FileSafe "backend/backup_local.sql"
Remove-FileSafe "backend/backup_local_2025-11-01.sql"

Write-Host "`n📄 Fichiers de documentation excessive" -ForegroundColor Cyan
$mdFiles = @(
    "ADMIN_DASHBOARD.md",
    "ADMIN_PASSWORD_RECOVERY.md",
    "AUTHENTICATION.md",
    "AWS_SES_SMTP_CONFIGURATION_GUIDE.md",
    "CHECK_STATUS.md",
    "CONFIGURE_MAILTRAP_ON_SERVER.md",
    "DEPLOY_TIME_EXPLANATION.md",
    "DEPLOY_WITH_LOCAL_DATABASE.md",
    "DEPLOY_WITH_TERMIUS.md",
    "DEPLOYMENT_COMMANDS.md",
    "DEPLOYMENT_FROM_SCRATCH.md",
    "DOCKER_DEPLOYMENT_FROM_SCRATCH.md",
    "DOCKER_QUICK_START.md",
    "EC2_DEPLOYMENT_GUIDE.md",
    "EMAIL_CONFIGURATION.md",
    "FILE_ARCHITECTURE.md",
    "FILE_MANAGEMENT.md",
    "FIX_DOCKER_BUILD_ERROR.md",
    "FIX_DOCKER_PERMISSIONS.md",
    "FIX_MAILTRAP_ENV.md",
    "FIX_RESERVATION_ERROR.md",
    "FIX_ROLE_ENUM_QUICK.md",
    "FIX_ROLE_ENUM.md",
    "GESTION_ASSURANCES_GUIDE.md",
    "GUIDE_NOM_MASSE.md",
    "HIDDEN_PAGE_ACCESS.md",
    "MAILTRAP_SETUP_GUIDE.md",
    "MIGRATE_LOCAL_DB_TO_DOCKER.md",
    "PROBLEM_RESOLUTION.md",
    "PRODUITS_STRUCTURES_ARCHITECTURE.md",
    "PRODUITS_STRUCTURES_FLOW.md",
    "PRODUITS_STRUCTURES_PAGE_ROLE.md",
    "PROJECT_STATUS.md",
    "QUICK_DEPLOY.md",
    "QUICK_DEPLOYMENT_CHECKLIST.md",
    "QUICK_SERVER_DEPLOY.md",
    "QUICK_START.md",
    "README_DEPLOY.md",
    "RESERVATION_GUIDE.md",
    "SERVER_ACCESS_AND_DEPLOY.md",
    "START_CONTAINERS.md",
    "STOP_CONTAINERS.md",
    "STRUCTURED_PRODUCTS_DASHBOARD.md",
    "TERMIUS_QUICK_START.md",
    "TEST_COMPLET_INTERFACE.md",
    "TEST_EMAIL_RESET.md",
    "TEST_MAILTRAP_ON_SERVER.md",
    "TEST_PARTNERS.md",
    "TEST_UPLOAD_MASSE.md",
    "TESTING_GUIDE.md",
    "TROUBLESHOOTING.md",
    "UPLOAD_MASSE_IMPLEMENTATION.md",
    "UPLOAD_MASSE_LOGIC.md",
    "WHAT_HAPPENS_AFTER_DEPLOY.md"
)

foreach ($file in $mdFiles) {
    Remove-FileSafe $file
}

Write-Host "`n🗂️ Dossiers dupliqués" -ForegroundColor Cyan
Remove-DirectorySafe "backend/backend"

Write-Host "`n📊 Fichiers de données brutes" -ForegroundColor Cyan
Remove-FileSafe "BDD 2025 (2).xlsx - Base Brute.csv"
Remove-FileSafe "BDD 2025.xlsx"

Write-Host "`n🧹 Scripts de nettoyage" -ForegroundColor Cyan
Remove-FileSafe "cleanup-md-files.ps1"

Write-Host "`n📋 Fichiers suspects" -ForegroundColor Cyan
Remove-FileSafe "tatus --short"

Write-Host "`n🧪 Fichiers de test" -ForegroundColor Cyan
Remove-FileSafe "backend/scripts/testAPI.js"
Remove-FileSafe "backend/scripts/testAPIReset.js"
Remove-FileSafe "backend/scripts/testEmailReset.js"
Remove-FileSafe "backend/scripts/testMailtrap.js"
Remove-FileSafe "backend/scripts/testMailtrapDirect.js"
Remove-FileSafe "backend/scripts/testRegister.js"
Remove-FileSafe "test-all.sh"

Write-Host "`n📝 Fichiers SQL de migration (optionnel)" -ForegroundColor Cyan
Remove-FileSafe "backend/scripts/createBordereauxTable.sql"
Remove-FileSafe "backend/scripts/addPasswordResetRequestsTable.sql"
Remove-FileSafe "backend/scripts/createCMSTable.sql"
Remove-FileSafe "backend/scripts/fixRoleEnumDirect.sql"

Write-Host "`n📋 Fichiers suspects à vérifier (à supprimer si non utilisés)" -ForegroundColor Yellow
Write-Host "⚠️  Les fichiers suivants sont référencés mais pourraient être inutilisés:" -ForegroundColor Yellow
Write-Host "   - src/AzaleeWebsite.jsx" -ForegroundColor Yellow
Write-Host "   - src/AzaleeWebsite.tsx" -ForegroundColor Yellow
Write-Host "   - src/FileManagementPage.tsx" -ForegroundColor Yellow
Write-Host "   - src/StructuredProductsDashboard.tsx" -ForegroundColor Yellow
Write-Host "   - src/AdminDashboard.tsx" -ForegroundColor Yellow
Write-Host "   - src/financialProducts.json (si non utilisé)" -ForegroundColor Yellow

Write-Host "`n✅ Nettoyage terminé!" -ForegroundColor Green
Write-Host "   Fichiers supprimés: $deletedCount" -ForegroundColor Green
Write-Host "   Erreurs: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })

