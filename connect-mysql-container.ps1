# Script PowerShell pour se connecter au conteneur MySQL
# Le conteneur s'appelle "alliance-courtage-mysql" d'après l'image

Write-Host "🔌 Connexion au conteneur MySQL..." -ForegroundColor Cyan
Write-Host ""

# Se connecter directement avec mysql client
# Le mot de passe root par défaut est: alliance2024Secure
# La base de données s'appelle: alliance_courtage

# Option 1: Avec prompt pour le mot de passe
docker exec -it alliance-courtage-mysql mysql -u root -p

# Option 2: Avec mot de passe directement (décommentez si vous préférez)
# docker exec -it alliance-courtage-mysql mysql -u root -p'alliance2024Secure' alliance_courtage

Write-Host ""
Write-Host "✅ Une fois connecté, vous pouvez exécuter les requêtes SQL du fichier view-bulk-uploads.sql" -ForegroundColor Green
Write-Host "   Ou copier-coller les requêtes directement dans le terminal MySQL" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Commandes utiles une fois dans MySQL:" -ForegroundColor Yellow
Write-Host "   USE alliance_courtage;" -ForegroundColor White
Write-Host "   SHOW TABLES;" -ForegroundColor White
Write-Host "   SELECT COUNT(*) FROM bordereaux;" -ForegroundColor White
Write-Host "   SELECT COUNT(*) FROM archives;" -ForegroundColor White

