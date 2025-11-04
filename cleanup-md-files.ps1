# Script pour supprimer tous les fichiers .md sauf README.md et backend/README.md

Get-ChildItem -Path . -Filter *.md -Recurse | Where-Object {
    $_.Name -ne 'README.md' -and $_.FullName -notlike '*\backend\README.md'
} | Remove-Item -Verbose

Write-Host "✅ Tous les fichiers .md ont été supprimés (sauf README.md et backend/README.md)"
