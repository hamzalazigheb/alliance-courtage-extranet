#!/bin/bash

# Script de diagnostic pour le bouton "sauvegarder" bloqué
# À exécuter sur le serveur

echo "🔍 Diagnostic du bouton 'sauvegarder' bloqué"
echo "=========================================="
echo ""

# 1. Vérifier les containers
echo "📦 1. Vérification des containers Docker..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "alliance-courtage|NAMES"
echo ""

# 2. Logs backend récents (dernières 50 lignes)
echo "📋 2. Logs backend récents (dernières 50 lignes)..."
echo "---"
docker logs alliance-courtage-backend --tail 50 2>&1 | grep -E "gamme-produits|PUT|sauvegarde|error|Error|timeout|Timeout" || echo "Aucun log récent trouvé"
echo ""

# 3. Logs backend avec erreurs
echo "❌ 3. Erreurs backend récentes..."
echo "---"
docker logs alliance-courtage-backend --tail 100 2>&1 | grep -i "error\|exception\|failed\|timeout" | tail -20 || echo "Aucune erreur récente"
echo ""

# 4. Test de l'endpoint API directement
echo "🌐 4. Test de l'endpoint /api/cms/gamme-produits (GET)..."
echo "---"
TOKEN=$(docker exec alliance-courtage-backend sh -c "cat /app/config.env 2>/dev/null | grep JWT_SECRET || echo 'test'" | head -1)
curl -s -o /dev/null -w "HTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  -H "x-auth-token: test" \
  http://localhost:3001/api/cms/gamme-produits || echo "❌ Erreur de connexion"
echo ""

# 5. Vérifier la taille du contenu dans la DB
echo "💾 5. Taille du contenu dans la base de données..."
echo "---"
docker exec alliance-courtage-mysql mysql -uroot -palliance2024Secure -D alliance_courtage -e \
  "SELECT page, LENGTH(content) as size_bytes, ROUND(LENGTH(content)/1024/1024, 2) as size_mb, updated_at FROM cms_content WHERE page = 'gamme-produits';" 2>/dev/null || echo "❌ Erreur de connexion MySQL"
echo ""

# 6. Vérifier les connexions MySQL actives
echo "🔌 6. Connexions MySQL actives..."
echo "---"
docker exec alliance-courtage-mysql mysql -uroot -palliance2024Secure -e \
  "SHOW PROCESSLIST;" 2>/dev/null | head -10 || echo "❌ Erreur"
echo ""

# 7. Vérifier les ressources système
echo "💻 7. Utilisation CPU/Mémoire des containers..."
echo "---"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep alliance-courtage
echo ""

# 8. Vérifier les logs frontend pour erreurs JavaScript
echo "🌐 8. Logs frontend (dernières 30 lignes)..."
echo "---"
docker logs alliance-courtage-extranet --tail 30 2>&1 | grep -E "error|Error|failed|Failed" || echo "Aucune erreur frontend"
echo ""

# 9. Test de connectivité backend
echo "🔗 9. Test de connectivité backend..."
echo "---"
curl -s -o /dev/null -w "Backend Health: %{http_code}\n" http://localhost:3001/api/health || echo "❌ Backend non accessible"
echo ""

# 10. Vérifier les timeouts configurés
echo "⏱️  10. Configuration des timeouts backend..."
echo "---"
docker exec alliance-courtage-backend sh -c "grep -E 'timeout|Timeout|TIMEOUT' /app/config/database.js /app/routes/cms.js 2>/dev/null | head -10" || echo "Fichiers non trouvés"
echo ""

echo "✅ Diagnostic terminé"
echo ""
echo "💡 Commandes utiles pour approfondir:"
echo "   - Voir tous les logs backend: docker logs -f alliance-courtage-backend"
echo "   - Voir les logs en temps réel: docker logs -f alliance-courtage-backend | grep gamme-produits"
echo "   - Tester l'API avec curl: curl -X PUT http://localhost:3001/api/cms/gamme-produits -H 'Content-Type: application/json' -d '{\"content\":\"test\"}'"
echo "   - Redémarrer le backend: docker restart alliance-courtage-backend"

