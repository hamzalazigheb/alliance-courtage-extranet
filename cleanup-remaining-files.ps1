# Script pour supprimer les fichiers restants non utilisés

Write-Host "🧹 Suppression des fichiers non utilisés..." -ForegroundColor Cyan

# Fichiers non utilisés identifiés
$filesToDelete = @(
    "src/AzaleeWebsite.jsx",
    "src/AzaleeWebsite.tsx",
    "src/financialProducts.json"
)

$deletedCount = 0
$errorCount = 0

foreach ($file in $filesToDelete) {
    if (Test-Path $file) {
        try {
            Remove-Item $file -Force
            Write-Host "✅ Supprimé: $file" -ForegroundColor Green
            $deletedCount++
        } catch {
            Write-Host "❌ Erreur: $file - $_" -ForegroundColor Red
            $errorCount++
        }
    } else {
        Write-Host "⚠️  Non trouvé: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n✅ Nettoyage terminé!" -ForegroundColor Green
Write-Host "   Fichiers supprimés: $deletedCount" -ForegroundColor Green
Write-Host "   Erreurs: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })

