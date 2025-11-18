# Script PowerShell pour déployer le frontend vers le serveur
# Usage: .\deploy-frontend-to-server.ps1

param(
    [string]$ServerIP = "13.38.115.36",
    [string]$ServerUser = "ubuntu",
    [string]$ServerPath = "~/alliance/alliance"
)

Write-Host "🚀 Déploiement du frontend vers le serveur..." -ForegroundColor Cyan

# 1. Build du frontend
Write-Host "📦 Build du frontend..." -ForegroundColor Yellow
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Erreur: Le dossier dist/ n'existe pas après le build" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build terminé" -ForegroundColor Green

# 2. Copier vers le serveur
Write-Host "📤 Copie des fichiers vers le serveur..." -ForegroundColor Yellow

# Créer le dossier dist sur le serveur
ssh "${ServerUser}@${ServerIP}" "mkdir -p ${ServerPath}/dist"

# Copier les fichiers
scp -r dist/* "${ServerUser}@${ServerIP}:${ServerPath}/dist/"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Fichiers copiés vers le serveur" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors de la copie" -ForegroundColor Red
    exit 1
}

# 3. Copier dans le conteneur Docker
Write-Host "🐳 Copie dans le conteneur Docker..." -ForegroundColor Yellow

ssh "${ServerUser}@${ServerIP}" @"
cd ${ServerPath}
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/
docker restart alliance-courtage-extranet
echo "✅ Frontend déployé dans le conteneur"
"@

Write-Host ""
Write-Host "✅ Déploiement terminé !" -ForegroundColor Green
Write-Host "📝 Videz le cache de votre navigateur (Ctrl+Shift+R) pour voir les changements" -ForegroundColor Cyan

