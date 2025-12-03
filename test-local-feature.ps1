# Script PowerShell pour tester une nouvelle fonctionnalité en local

Write-Host "🧪 Test de la nouvelle fonctionnalité en local..." -ForegroundColor Cyan
Write-Host ""

# Vérifier que le backend est démarré
Write-Host "📡 Vérification du backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/me" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Backend est démarré" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend n'est pas démarré. Lancez: cd backend && npm run dev" -ForegroundColor Red
    exit 1
}

# Vérifier que le frontend est démarré
Write-Host "🌐 Vérification du frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Frontend est démarré" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Frontend n'est pas démarré. Lancez: npm run dev" -ForegroundColor Yellow
}

# Test de l'API (remplacez par votre endpoint)
Write-Host ""
Write-Host "🔍 Test de l'API..." -ForegroundColor Yellow
$apiUrl = "http://localhost:3001/api/nouvelle-fonctionnalite"
try {
    $response = Invoke-WebRequest -Uri $apiUrl -Method GET -TimeoutSec 5 -ErrorAction SilentlyContinue
    Write-Host "✅ API répond (code: $($response.StatusCode))" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✅ API répond (code: 401 - Auth requise)" -ForegroundColor Green
    } else {
        Write-Host "❌ API ne répond pas correctement" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Tests terminés!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Tester manuellement sur http://localhost:5173"
Write-Host "   2. Vérifier les logs du backend"
Write-Host "   3. Vérifier la console du navigateur"
Write-Host "   4. Si tout fonctionne, commit et push"

