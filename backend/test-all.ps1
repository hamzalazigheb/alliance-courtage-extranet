# Script PowerShell pour tester toutes les APIs avant déploiement

Write-Host "`n🧪 TESTS COMPLETS AVANT DÉPLOIEMENT" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$API_URL = if ($env:API_URL) { $env:API_URL } else { "http://localhost:3001" }
$ADMIN_EMAIL = if ($env:ADMIN_EMAIL) { $env:ADMIN_EMAIL } else { "admin@alliance.com" }
$ADMIN_PASSWORD = if ($env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD } else { "admin123" }

Write-Host "📝 Configuration:"
Write-Host "   API URL: $API_URL"
Write-Host "   Admin Email: $ADMIN_EMAIL"
Write-Host ""

# Vérifier que le serveur est démarré
Write-Host "🔍 Vérification du serveur..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "$API_URL/api/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host " ✅ Serveur accessible" -ForegroundColor Green
} catch {
    Write-Host " ❌ Serveur inaccessible" -ForegroundColor Red
    Write-Host "   Veuillez démarrer le serveur avec: npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Test 1: APIs générales
Write-Host "🚀 Test 1/2: APIs générales" -ForegroundColor Cyan
Write-Host "----------------------------" -ForegroundColor Cyan
$env:API_URL = $API_URL
$env:ADMIN_EMAIL = $ADMIN_EMAIL
$env:ADMIN_PASSWORD = $ADMIN_PASSWORD
node test-all-apis.js
$API_TEST_RESULT = $LASTEXITCODE

Write-Host ""
Write-Host ""

# Test 2: Upload de fichiers
Write-Host "📤 Test 2/2: Upload de fichiers" -ForegroundColor Cyan
Write-Host "--------------------------------" -ForegroundColor Cyan
node test-file-uploads.js
$UPLOAD_TEST_RESULT = $LASTEXITCODE

Write-Host ""
Write-Host ""

# Résumé final
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "📊 RÉSUMÉ FINAL" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

if ($API_TEST_RESULT -eq 0) {
    Write-Host "✅ Tests APIs générales: RÉUSSIS" -ForegroundColor Green
} else {
    Write-Host "❌ Tests APIs générales: ÉCHOUÉS" -ForegroundColor Red
}

if ($UPLOAD_TEST_RESULT -eq 0) {
    Write-Host "✅ Tests Upload fichiers: RÉUSSIS" -ForegroundColor Green
} else {
    Write-Host "❌ Tests Upload fichiers: ÉCHOUÉS" -ForegroundColor Red
}

Write-Host ""

if ($API_TEST_RESULT -eq 0 -and $UPLOAD_TEST_RESULT -eq 0) {
    Write-Host "🎉 TOUS LES TESTS SONT RÉUSSIS!" -ForegroundColor Green
    Write-Host "✅ Le projet est prêt pour le déploiement" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️ CERTAINS TESTS ONT ÉCHOUÉ" -ForegroundColor Red
    Write-Host "⚠️ Veuillez corriger les erreurs avant de déployer" -ForegroundColor Yellow
    exit 1
}

