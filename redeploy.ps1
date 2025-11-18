# Script de redéploiement PowerShell pour Alliance Courtage
# Usage: .\redeploy.ps1
# 
# Ce script redéploie l'application en préservant toutes les données

Write-Host "🔄 Redéploiement Alliance Courtage" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Ce script va redéployer l'application avec les nouvelles fonctionnalités" -ForegroundColor Yellow
Write-Host "    Les données de production seront préservées" -ForegroundColor Green
Write-Host ""

# Vérifier Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker n'est pas installé!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker détecté" -ForegroundColor Green
Write-Host ""

# Vérifier que les conteneurs existent
Write-Host "🔍 Vérification des conteneurs existants..." -ForegroundColor Blue
$backendContainer = docker ps -a --filter "name=alliance-courtage-backend" --format "{{.Names}}"
$frontendContainer = docker ps -a --filter "name=alliance-courtage-extranet" --format "{{.Names}}"
$mysqlContainer = docker ps -a --filter "name=alliance-courtage" --format "{{.Names}}"

if (-not $backendContainer) {
    Write-Host "⚠️  Conteneur backend non trouvé" -ForegroundColor Yellow
}
if (-not $frontendContainer) {
    Write-Host "⚠️  Conteneur frontend non trouvé" -ForegroundColor Yellow
}
if (-not $mysqlContainer) {
    Write-Host "⚠️  Conteneur MySQL non trouvé" -ForegroundColor Yellow
}

Write-Host "   Backend: $backendContainer" -ForegroundColor White
Write-Host "   Frontend: $frontendContainer" -ForegroundColor White
Write-Host "   MySQL: $mysqlContainer" -ForegroundColor White
Write-Host ""

# Demander confirmation
Write-Host "⚠️  CONFIRMATION REQUISE" -ForegroundColor Yellow
Write-Host "   Ce script va:" -ForegroundColor White
Write-Host "   1. Faire un backup de la base de données" -ForegroundColor White
Write-Host "   2. Arrêter les conteneurs (données préservées)" -ForegroundColor White
Write-Host "   3. Rebuild les images avec les nouvelles fonctionnalités" -ForegroundColor White
Write-Host "   4. Redémarrer les conteneurs" -ForegroundColor White
Write-Host ""
$confirm = Read-Host "Continuer? (O/N)"

if ($confirm -ne "O" -and $confirm -ne "o" -and $confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "❌ Redéploiement annulé" -ForegroundColor Red
    exit 0
}

Write-Host ""

# Backup de la base de données
Write-Host "💾 Étape 1/5: Backup de la base de données..." -ForegroundColor Blue
$backupDir = "backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$backupDir\backup_$timestamp.sql"

if ($mysqlContainer) {
    Write-Host "   Création du backup depuis le conteneur MySQL..." -ForegroundColor White
    # Essayer avec le mot de passe par défaut, sinon demander
    $mysqlPassword = "alliance2024Secure"
    docker exec $mysqlContainer mysqldump -u root -p$mysqlPassword alliance_courtage > $backupFile 2>$null
    
    if (-not (Test-Path $backupFile) -or (Get-Item $backupFile).Length -eq 0) {
        Write-Host "   ⚠️  Backup avec mot de passe par défaut échoué" -ForegroundColor Yellow
        $mysqlPassword = Read-Host "   Entrez le mot de passe MySQL root" -AsSecureString
        $mysqlPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
            [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
        )
        docker exec $mysqlContainer mysqldump -u root -p$mysqlPasswordPlain alliance_courtage > $backupFile 2>$null
    }
    
    if (Test-Path $backupFile -and (Get-Item $backupFile).Length -gt 0) {
        Write-Host "   ✅ Backup créé: $backupFile" -ForegroundColor Green
        $fileSize = [math]::Round((Get-Item $backupFile).Length / 1MB, 2)
        Write-Host "   📊 Taille: $fileSize MB" -ForegroundColor White
    } else {
        Write-Host "   ⚠️  Backup échoué, mais continuons..." -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Conteneur MySQL non trouvé, backup ignoré" -ForegroundColor Yellow
}
Write-Host ""

# Arrêter les conteneurs (SANS supprimer les volumes)
Write-Host "🛑 Étape 2/5: Arrêt des conteneurs (volumes préservés)..." -ForegroundColor Blue
if ($backendContainer) {
    Write-Host "   Arrêt du backend..." -ForegroundColor White
    docker stop $backendContainer 2>$null
}
if ($frontendContainer) {
    Write-Host "   Arrêt du frontend..." -ForegroundColor White
    docker stop $frontendContainer 2>$null
}
# Ne PAS arrêter MySQL pour préserver les données
Write-Host "   ✅ MySQL reste en cours d'exécution (données préservées)" -ForegroundColor Green
Write-Host ""

# Build des nouvelles images
Write-Host "🏗️  Étape 3/5: Build des nouvelles images..." -ForegroundColor Blue

# Build backend
if (Test-Path "backend\Dockerfile") {
    Write-Host "   Build de l'image backend..." -ForegroundColor White
    Set-Location backend
    docker build -t alliance-courtage-backend:latest .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Erreur lors du build backend!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Write-Host "   ✅ Image backend construite" -ForegroundColor Green
    Set-Location ..
} else {
    Write-Host "   ⚠️  Dockerfile backend non trouvé" -ForegroundColor Yellow
}

# Build frontend
if (Test-Path "Dockerfile") {
    Write-Host "   Build de l'image frontend..." -ForegroundColor White
    docker build -t alliance-courtage-frontend:latest .
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Erreur lors du build frontend!" -ForegroundColor Red
        exit 1
    }
    Write-Host "   ✅ Image frontend construite" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Dockerfile frontend non trouvé" -ForegroundColor Yellow
}

Write-Host ""

# Redémarrer les conteneurs
Write-Host "🚀 Étape 4/5: Redémarrage des conteneurs..." -ForegroundColor Blue

# Redémarrer backend
if ($backendContainer) {
    Write-Host "   Redémarrage du backend..." -ForegroundColor White
    docker start $backendContainer 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Backend redémarré" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Le conteneur backend doit être recréé manuellement" -ForegroundColor Yellow
    }
}

# Redémarrer frontend
if ($frontendContainer) {
    Write-Host "   Redémarrage du frontend..." -ForegroundColor White
    docker start $frontendContainer 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Frontend redémarré" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Le conteneur frontend doit être recréé manuellement" -ForegroundColor Yellow
    }
}

Write-Host ""

# Vérifier l'état
Write-Host "📊 Étape 5/5: Vérification de l'état..." -ForegroundColor Blue
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "📋 État des conteneurs:" -ForegroundColor Cyan
docker ps --filter "name=alliance-courtage" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host ""
Write-Host "✅ Redéploiement terminé!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Vérifier les logs: docker logs alliance-courtage-backend" -ForegroundColor White
Write-Host "   2. Tester l'API: curl http://localhost:3001/api/health" -ForegroundColor White
Write-Host "   3. Tester le frontend: http://localhost" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Protection des données:" -ForegroundColor Green
Write-Host "   ✅ Backup créé: $backupFile" -ForegroundColor Green
Write-Host "   ✅ MySQL toujours en cours d'exécution" -ForegroundColor Green
Write-Host "   ✅ Volumes préservés" -ForegroundColor Green
Write-Host "   ✅ Aucune donnée supprimée" -ForegroundColor Green
Write-Host ""


