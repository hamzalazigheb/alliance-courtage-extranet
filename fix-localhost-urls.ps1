# Script PowerShell pour remplacer toutes les occurrences de localhost:3001
# dans les fichiers TypeScript

$files = @(
    "src\ProduitsStructuresPage.tsx",
    "src\AdminDashboard.tsx",
    "src\StructuredProductsDashboard.tsx",
    "src\FileManagePage.tsx",
    "src\UserManagementPage.tsx",
    "src\FinancialDocumentsPage.tsx",
    "src\GammeFinancierePage.tsx",
    "src\GammeFinancierePage_clean.tsx",
    "src\NosArchivesPage.tsx",
    "src\PartnerManagementPage.tsx",
    "src\FileManagementPage.tsx",
    "src\GammeFinancierePage_new.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        $content = Get-Content $file -Raw
        
        # Remplacer les imports si nécessaire
        if ($content -notmatch "buildAPIURL|buildFileURL") {
            # Ajouter l'import si les fonctions sont utilisées
            if ($content -match "http://localhost:3001") {
                $content = $content -replace "(import.*from '\.\/api';)", "`$1`nimport { buildAPIURL, buildFileURL } from './api';"
            }
        }
        
        # Remplacer les URLs API
        $content = $content -replace "fetch\(`"http://localhost:3001/api/([^`"]+)`"", "fetch(buildAPIURL('/`$1')"
        $content = $content -replace "fetch\(`'http://localhost:3001/api/([^`']+)`'", "fetch(buildAPIURL('/`$1')"
        $content = $content -replace "fetch\(`"http://localhost:3001/api/([^`"]+)`"", "fetch(buildAPIURL('/`$1')"
        
        # Remplacer les URLs de fichiers
        $content = $content -replace "`"http://localhost:3001(\$?\{[^}]+\})`"", "buildFileURL(`$1)"
        $content = $content -replace "`"http://localhost:3001([^`"]+)`"", "buildFileURL('`$1')"
        $content = $content -replace "`'http://localhost:3001([^`']+)`'", "buildFileURL('`$1')"
        $content = $content -replace "http://localhost:3001(\$?\{[^}]+\})", "buildFileURL(`$1)"
        $content = $content -replace "http://localhost:3001([^\"'`s]+)", "buildFileURL('`$1')"
        
        Set-Content $file $content -NoNewline
        Write-Host "  ✓ Updated $file"
    } else {
        Write-Host "  ✗ File not found: $file"
    }
}

Write-Host "`nDone!"

