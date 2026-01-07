# Script PowerShell pour déployer les corrections vers le serveur de production
# Corrections:
# 1. NosArchivesPage: Fix null file_type error
# 2. Token expiration: Auto-logout on 401
# Usage: .\deploy-fixes-now.ps1

param(
    [string]$ServerIP = "13.38.115.36",
    [string]$ServerUser = "ubuntu",
    [string]$ServerPath = "~/alliance/alliance"
)

Write-Host ""
Write-Host "🚀 Déploiement des corrections vers le serveur..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Corrections incluses:" -ForegroundColor Yellow
Write-Host "  ✅ NosArchivesPage: Gestion des file_type null" -ForegroundColor Green
Write-Host "  ✅ Token expiré: Déconnexion automatique sur 401" -ForegroundColor Green
Write-Host "  ✅ HomePage: Gestion silencieuse des erreurs d'auth" -ForegroundColor Green
Write-Host ""

# 1. Build du frontend
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📦 Étape 1/4: Build du frontend..." -ForegroundColor Yellow
Write-Host ""

npm run build

if (-not (Test-Path "dist")) {
    Write-Host ""
    Write-Host "❌ Erreur: Le dossier dist/ n'existe pas après le build" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Build terminé avec succès" -ForegroundColor Green
Write-Host ""

# 2. Copier vers le serveur
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📤 Étape 2/4: Copie des fichiers vers le serveur..." -ForegroundColor Yellow
Write-Host ""

# Créer le dossier dist sur le serveur
ssh "${ServerUser}@${ServerIP}" "mkdir -p ${ServerPath}/dist"

# Copier les fichiers
Write-Host "   Transfert en cours..." -ForegroundColor Gray
scp -r dist/* "${ServerUser}@${ServerIP}:${ServerPath}/dist/"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Fichiers copiés vers le serveur" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la copie" -ForegroundColor Red
    exit 1
}

# 3. Copier dans le conteneur Docker
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🐳 Étape 3/4: Déploiement dans le conteneur Docker..." -ForegroundColor Yellow
Write-Host ""

ssh "${ServerUser}@${ServerIP}" @"
cd ${ServerPath}

echo "   Vérification des fichiers..."
ls -la dist/ | head -5

echo ""
echo "   Copie dans le conteneur..."
docker cp dist/. alliance-courtage-extranet:/usr/share/nginx/html/

echo ""
echo "   Redémarrage du conteneur..."
docker restart alliance-courtage-extranet

echo ""
echo "   Attente du redémarrage (3s)..."
sleep 3

echo ""
echo "   Vérification du conteneur..."
docker ps | grep alliance-courtage-extranet
"@

Write-Host ""
Write-Host "✅ Déploiement dans le conteneur terminé" -ForegroundColor Green
Write-Host ""

# 4. Vérification
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔍 Étape 4/4: Vérification du déploiement..." -ForegroundColor Yellow
Write-Host ""

ssh "${ServerUser}@${ServerIP}" @"
cd ${ServerPath}

echo "   Vérification des fichiers dans le conteneur..."
docker exec alliance-courtage-extranet ls -la /usr/share/nginx/html/assets/ | grep "index-.*\.js" | head -3

echo ""
echo "   Vérification que Nginx fonctionne..."
docker exec alliance-courtage-extranet nginx -t
"@

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✅ Déploiement terminé avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Ouvrez votre navigateur" -ForegroundColor White
Write-Host "   2. Accédez à http://${ServerIP}" -ForegroundColor White
Write-Host "   3. Videz le cache (Ctrl+Shift+R ou Ctrl+F5)" -ForegroundColor White
Write-Host "   4. Testez 'Nos Archives' - plus d'erreur null!" -ForegroundColor White
Write-Host "   5. Si token expiré, déconnexion automatique!" -ForegroundColor White
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""


