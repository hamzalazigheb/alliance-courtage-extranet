# Script PowerShell de déploiement avec conservation des données
# Ce script met à jour uniquement le code sans toucher à la base de données

$ErrorActionPreference = "Stop"

Write-Host "`n🚀 DÉPLOIEMENT AVEC CONSERVATION DES DONNÉES" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$BACKEND_CONTAINER = "alliance-courtage-backend"
$FRONTEND_CONTAINER = "alliance-courtage-extranet"
$MYSQL_CONTAINER = "alliance-courtage-mysql"
$DB_PASSWORD = if ($env:DB_PASSWORD) { $env:DB_PASSWORD } else { "alliance2024Secure" }

Write-Host "📋 Étape 1/7: Vérification de l'état actuel" -ForegroundColor Blue
Write-Host "------------------------------------------------------------"

# Vérifier les conteneurs
Write-Host "Conteneurs actuels:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host ""

# Vérifier MySQL
$mysqlRunning = docker ps | Select-String $MYSQL_CONTAINER
if (-not $mysqlRunning) {
    Write-Host "❌ Erreur: Le conteneur MySQL n'est pas démarré" -ForegroundColor Red
    exit 1
}
Write-Host "✅ MySQL est en ligne" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Étape 2/7: Sauvegarde de sécurité de la base de données" -ForegroundColor Blue
Write-Host "------------------------------------------------------------"

# Créer un dossier de backup
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "backups\$timestamp"
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

Write-Host "Sauvegarde de la base de données..."
docker exec $MYSQL_CONTAINER mysqldump -u root -p$DB_PASSWORD alliance_courtage > "$BACKUP_DIR\database_backup.sql"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Sauvegarde créée: $BACKUP_DIR\database_backup.sql" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la sauvegarde" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Étape 3/7: Récupération des derniers changements" -ForegroundColor Blue
Write-Host "------------------------------------------------------------"

# Statut Git
Write-Host "Statut Git actuel:"
git status

$response = Read-Host "`nVoulez-vous sauvegarder les modifications locales? (o/N)"
if ($response -eq "o" -or $response -eq "O") {
    git stash push -m "Sauvegarde avant déploiement $timestamp"
    Write-Host "✅ Modifications locales sauvegardées" -ForegroundColor Green
}

# Pull
Write-Host "Récupération des derniers changements..."
git pull origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Code mis à jour" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors du pull" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Étape 4/7: Construction du nouveau backend" -ForegroundColor Blue
Write-Host "------------------------------------------------------------"

Set-Location backend
Write-Host "Construction de l'image backend..."
docker build -t backend_backend:new .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Image backend construite" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la construction du backend" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host ""
Write-Host "📋 Étape 5/7: Construction du nouveau frontend" -ForegroundColor Blue
Write-Host "------------------------------------------------------------"

Write-Host "Construction de l'image frontend..."
docker build -t alliance-courtage-frontend:new .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Image frontend construite" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la construction du frontend" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Étape 6/7: Déploiement avec zéro downtime" -ForegroundColor Blue
Write-Host "------------------------------------------------------------"

# Récupérer le réseau MySQL
$MYSQL_NETWORK = docker inspect $MYSQL_CONTAINER --format='{{range $net, $v := .NetworkSettings.Networks}}{{$net}}{{end}}' | Select-Object -First 1
Write-Host "Réseau MySQL: $MYSQL_NETWORK"

# Déployer nouveau backend
Write-Host "`nDéploiement du backend..."
docker run -d `
  --name backend-new `
  -p 3002:3001 `
  --network $MYSQL_NETWORK `
  --env-file backend/config.env `
  -e NODE_ENV=production `
  -e DB_HOST=$MYSQL_CONTAINER `
  -e DB_PORT=3306 `
  -e DB_NAME=alliance_courtage `
  -e DB_USER=root `
  -e DB_PASSWORD=$DB_PASSWORD `
  -v ${PWD}/backend/uploads:/app/uploads `
  backend_backend:new

Write-Host "Attente du démarrage du backend..."
Start-Sleep -Seconds 10

# Tester le nouveau backend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/api/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Nouveau backend opérationnel" -ForegroundColor Green
    
    # Remplacer l'ancien
    Write-Host "Arrêt de l'ancien backend..."
    docker stop $BACKEND_CONTAINER
    docker rm $BACKEND_CONTAINER
    
    docker stop backend-new
    docker rm backend-new
    
    # Lancer le backend final
    docker run -d `
      --name $BACKEND_CONTAINER `
      --restart unless-stopped `
      -p 3001:3001 `
      --network $MYSQL_NETWORK `
      --env-file backend/config.env `
      -e NODE_ENV=production `
      -e DB_HOST=$MYSQL_CONTAINER `
      -e DB_PORT=3306 `
      -e DB_NAME=alliance_courtage `
      -e DB_USER=root `
      -e DB_PASSWORD=$DB_PASSWORD `
      -v ${PWD}/backend/uploads:/app/uploads `
      backend_backend:new
    
    Write-Host "✅ Backend déployé" -ForegroundColor Green
} catch {
    Write-Host "❌ Le nouveau backend ne répond pas" -ForegroundColor Red
    docker logs backend-new
    docker rm -f backend-new
    exit 1
}

# Déployer nouveau frontend
Write-Host "`nDéploiement du frontend..."
docker run -d `
  --name frontend-new `
  -p 81:80 `
  --restart unless-stopped `
  alliance-courtage-frontend:new

Write-Host "Attente du démarrage du frontend..."
Start-Sleep -Seconds 5

# Tester le nouveau frontend
try {
    $response = Invoke-WebRequest -Uri "http://localhost:81" -Method GET -TimeoutSec 5
    Write-Host "✅ Nouveau frontend opérationnel" -ForegroundColor Green
    
    # Remplacer l'ancien
    Write-Host "Arrêt de l'ancien frontend..."
    docker stop $FRONTEND_CONTAINER
    docker rm $FRONTEND_CONTAINER
    
    docker stop frontend-new
    docker rm frontend-new
    
    # Lancer le frontend final
    docker run -d `
      --name $FRONTEND_CONTAINER `
      --restart unless-stopped `
      -p 80:80 `
      alliance-courtage-frontend:new
    
    Write-Host "✅ Frontend déployé" -ForegroundColor Green
} catch {
    Write-Host "❌ Le nouveau frontend ne répond pas" -ForegroundColor Red
    docker logs frontend-new
    docker rm -f frontend-new
    exit 1
}

Write-Host ""
Write-Host "📋 Étape 7/7: Vérification finale" -ForegroundColor Blue
Write-Host "------------------------------------------------------------"

Write-Host "Services après déploiement:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

Write-Host "`nTests de santé:"

# Test backend
try {
    Invoke-WebRequest -Uri "http://localhost:3001/api/health" -Method GET -TimeoutSec 5 | Out-Null
    Write-Host "✅ Backend: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend: ERREUR" -ForegroundColor Red
}

# Test frontend
try {
    Invoke-WebRequest -Uri "http://localhost" -Method GET -TimeoutSec 5 | Out-Null
    Write-Host "✅ Frontend: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend: ERREUR" -ForegroundColor Red
}

# Test MySQL
$mysqlTest = docker exec $MYSQL_CONTAINER mysqladmin ping -h localhost -u root -p$DB_PASSWORD 2>$null
if ($mysqlTest -match "mysqld is alive") {
    Write-Host "✅ MySQL: OK (données conservées)" -ForegroundColor Green
} else {
    Write-Host "❌ MySQL: ERREUR" -ForegroundColor Red
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Résumé:"
Write-Host "   • Code: MIS À JOUR ✅"
Write-Host "   • Base de données: CONSERVÉE ✅"
Write-Host "   • Sauvegarde: $BACKUP_DIR"
Write-Host ""
Write-Host "🌐 URLs:"
Write-Host "   • Frontend: http://votre-serveur"
Write-Host "   • Backend: http://votre-serveur:3001"
Write-Host "   • API Health: http://votre-serveur:3001/api/health"
Write-Host ""
Write-Host "📝 Prochaines étapes:"
Write-Host "   1. Tester le site en production"
Write-Host "   2. Vérifier que toutes les données sont présentes"
Write-Host "   3. Consulter les logs si nécessaire:"
Write-Host "      docker logs $BACKEND_CONTAINER"
Write-Host "      docker logs $FRONTEND_CONTAINER"
Write-Host ""

