# Script PowerShell pour comparer les bases de données
# Usage: .\compareDatabases.ps1

Write-Host "🔍 Comparaison des bases de données" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Demander les informations de connexion à la production
Write-Host "📡 Configuration de la connexion PRODUCTION" -ForegroundColor Yellow
Write-Host ""

$prodHost = Read-Host "Host de production (ex: votre-serveur.com ou IP)"
$prodPort = Read-Host "Port (défaut: 3306)"
if ([string]::IsNullOrWhiteSpace($prodPort)) { $prodPort = "3306" }

$prodUser = Read-Host "Utilisateur MySQL"
$prodPassword = Read-Host "Mot de passe MySQL" -AsSecureString
$prodPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($prodPassword)
)
$prodDatabase = Read-Host "Nom de la base de données (défaut: alliance_courtage)"
if ([string]::IsNullOrWhiteSpace($prodDatabase)) { $prodDatabase = "alliance_courtage" }

Write-Host ""
Write-Host "🔍 Exécution de la comparaison..." -ForegroundColor Blue
Write-Host ""

# Exécuter le script Node.js avec les variables d'environnement
$env:PROD_DB_HOST = $prodHost
$env:PROD_DB_PORT = $prodPort
$env:PROD_DB_USER = $prodUser
$env:PROD_DB_PASSWORD = $prodPasswordPlain
$env:PROD_DB_NAME = $prodDatabase

node scripts/compareDatabases.js

# Nettoyer les variables d'environnement
Remove-Item Env:\PROD_DB_HOST
Remove-Item Env:\PROD_DB_PORT
Remove-Item Env:\PROD_DB_USER
Remove-Item Env:\PROD_DB_PASSWORD
Remove-Item Env:\PROD_DB_NAME


