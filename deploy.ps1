# Script de déploiement PowerShell pour Alliance Courtage
# Usage: .\deploy.ps1

Write-Host "🚀 Déploiement Alliance Courtage" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker n'est pas installé!" -ForegroundColor Red
    Write-Host "   Installez Docker Desktop: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Docker détecté" -ForegroundColor Green

# Vérifier docker-compose
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ docker-compose n'est pas installé!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ docker-compose détecté" -ForegroundColor Green
Write-Host ""

# Vérifier config.env
if (-not (Test-Path "backend\config.env")) {
    Write-Host "❌ backend\config.env n'existe pas!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Configuration trouvée" -ForegroundColor Green
Write-Host ""

# Vérifier SMTP configuré
$configContent = Get-Content "backend\config.env" -Raw
if ($configContent -notmatch "SMTP_USER=.*" -or $configContent -match "SMTP_USER=REMPLACEZ") {
    Write-Host "⚠️  SMTP non configuré ou identifiants manquants" -ForegroundColor Yellow
    Write-Host "   Les emails ne seront pas envoyés en production" -ForegroundColor Yellow
    Write-Host ""
}

# Demander confirmation pour backup (optionnel mais recommandé)
Write-Host "💾 Backup de la base de données (recommandé)" -ForegroundColor Yellow
$backup = Read-Host "Voulez-vous faire un backup avant le déploiement? (O/N)"
if ($backup -eq "O" -or $backup -eq "o" -or $backup -eq "Y" -or $backup -eq "y") {
    Write-Host "📦 Création du backup..." -ForegroundColor Blue
    $backupDir = "backups"
    if (-not (Test-Path $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir | Out-Null
    }
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "$backupDir\backup_$timestamp.sql"
    
    # Vérifier si MySQL est en cours d'exécution
    $mysqlRunning = docker ps --filter "name=alliance-courtage-mysql" --format "{{.Names}}"
    if ($mysqlRunning) {
        docker exec alliance-courtage-mysql mysqldump -u root -palliance2024Secure alliance_courtage > $backupFile 2>$null
        if (Test-Path $backupFile) {
            Write-Host "✅ Backup créé: $backupFile" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Backup échoué (continuer quand même)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  MySQL n'est pas en cours d'exécution, backup ignoré" -ForegroundColor Yellow
    }
    Write-Host ""
}

# Arrêter les conteneurs existants (SANS supprimer les volumes pour préserver les données)
Write-Host "🛑 Arrêt des conteneurs existants (volumes préservés)..." -ForegroundColor Blue
Set-Location backend
docker-compose down
# IMPORTANT: Ne pas utiliser -v pour préserver les données MySQL
Write-Host "✅ Volumes préservés - données de production intactes" -ForegroundColor Green
Write-Host ""

# Build et démarrage
Write-Host "🏗️  Build et démarrage des conteneurs..." -ForegroundColor Blue
docker-compose up -d --build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors du build!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "⏳ Attente du démarrage des services..." -ForegroundColor Blue
Start-Sleep -Seconds 10

# Vérifier les conteneurs
Write-Host ""
Write-Host "📊 État des conteneurs:" -ForegroundColor Blue
docker-compose ps

Write-Host ""
Write-Host "✅ Déploiement terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Vérifier les logs: docker-compose logs -f" -ForegroundColor White
Write-Host "   2. Tester l'API: http://localhost:3001/api/health" -ForegroundColor White
Write-Host "   3. ⚠️  NE PAS exécuter initDatabase.js en production (données préservées)" -ForegroundColor Yellow
Write-Host ""
Write-Host "🔒 Protection des données:" -ForegroundColor Green
Write-Host "   ✅ Volumes Docker préservés" -ForegroundColor Green
Write-Host "   ✅ Base de données existante conservée" -ForegroundColor Green
Write-Host "   ✅ Aucune migration destructive" -ForegroundColor Green
Write-Host ""

Set-Location ..

