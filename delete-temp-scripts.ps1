# Script pour supprimer les scripts temporaires

# Scripts shell à supprimer
$shellScripts = @(
    'deploy.sh',
    'deploy-production.sh',
    'fix-broadcast-route.sh',
    'migrate-to-docker.sh',
    'QUICK_RESET_DATABASE.sh',
    'RESET_DATABASE_SAFE.sh',
    'TERMIUS_QUICK_COMMANDS.sh',
    'backend\setup.sh'
)

# Scripts PowerShell à supprimer
$psScripts = @(
    'cleanup-md-files.ps1',
    'cleanup-project.ps1',
    'cleanup-remaining-files.ps1',
    'fix-localhost-urls.ps1',
    'move-to-archive.ps1',
    'delete-temp-md.ps1',
    'delete-temp-scripts.ps1'
)

# Fichiers de configuration non utilisés
$configFiles = @(
    'amplify.yml',
    'netlify.toml'
)

$deleted = 0
$notFound = 0

Write-Host "Suppression des scripts shell..."
foreach ($script in $shellScripts) {
    if (Test-Path $script) {
        Remove-Item $script -Force
        Write-Host "  Supprime: $script"
        $deleted++
    } else {
        $notFound++
    }
}

Write-Host "`nSuppression des scripts PowerShell..."
foreach ($script in $psScripts) {
    if (Test-Path $script) {
        Remove-Item $script -Force
        Write-Host "  Supprime: $script"
        $deleted++
    } else {
        $notFound++
    }
}

Write-Host "`nSuppression des fichiers de configuration non utilises..."
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  Supprime: $file"
        $deleted++
    } else {
        $notFound++
    }
}

Write-Host "`nSuppression terminee: $deleted fichiers supprimes, $notFound fichiers non trouves"

