#!/bin/bash
# Script de diagnostic complet pour identifier tous les problèmes

echo "🔍 Diagnostic complet de la base de données et du backend..."
echo ""

# 1. Vérifier les tables critiques
echo "📊 1. Vérification des tables critiques..."
TABLES=("simulator_usage" "product_reservations" "archives" "assurances")
for table in "${TABLES[@]}"; do
  EXISTS=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = '$table';" 2>/dev/null)
  if [ "$EXISTS" = "1" ]; then
    echo "  ✅ $table existe"
  else
    echo "  ❌ $table MANQUANTE"
  fi
done

echo ""
echo "📋 2. Vérification des colonnes dans archives..."
ARCHIVES_COLS=("assurance" "uploaded_by_prenom" "uploaded_by_nom" "file_content")
for col in "${ARCHIVES_COLS[@]}"; do
  EXISTS=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'archives' AND COLUMN_NAME = '$col';" 2>/dev/null)
  if [ "$EXISTS" = "1" ]; then
    echo "  ✅ archives.$col existe"
  else
    echo "  ❌ archives.$col MANQUANTE"
  fi
done

echo ""
echo "📋 3. Vérification de la structure de simulator_usage..."
sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE simulator_usage;" 2>/dev/null | head -10

echo ""
echo "📋 4. Vérification de la structure de archives..."
sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "DESCRIBE archives;" 2>/dev/null | head -15

echo ""
echo "🔍 5. Dernières erreurs du backend (simulator_usage et structured-products)..."
sudo docker logs --tail 200 alliance-courtage-backend 2>&1 | grep -A 15 -E "simulator_usage|structured-products|archives|ER_" | tail -50

echo ""
echo "✅ Diagnostic terminé!"

