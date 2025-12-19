#!/bin/bash
# Script complet pour vérifier que toutes les API ont leurs dépendances de base de données

echo "🔍 Vérification complète de toutes les API..."
echo ""

# Fonction pour vérifier une colonne
check_column() {
  local table=$1
  local column=$2
  local result=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = '$table' AND COLUMN_NAME = '$column';" 2>/dev/null)
  if [ "$result" = "1" ]; then
    echo "  ✅ $table.$column"
    return 0
  else
    echo "  ❌ $table.$column (MANQUANTE)"
    return 1
  fi
}

# Fonction pour vérifier une table
check_table() {
  local table=$1
  local result=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = '$table';" 2>/dev/null)
  if [ "$result" = "1" ]; then
    echo "  ✅ $table"
    return 0
  else
    echo "  ❌ $table (MANQUANTE)"
    return 1
  fi
}

ERRORS=0

echo "📊 1. Vérification des tables principales..."
check_table "users" || ((ERRORS++))
check_table "archives" || ((ERRORS++))
check_table "assurances" || ((ERRORS++))
check_table "bordereaux" || ((ERRORS++))
check_table "favoris" || ((ERRORS++))
check_table "formations" || ((ERRORS++))
check_table "financial_documents" || ((ERRORS++))
check_table "product_reservations" || ((ERRORS++))
check_table "simulator_usage" || ((ERRORS++))
check_table "notifications" || ((ERRORS++))
check_table "partners" || ((ERRORS++))
check_table "partner_contacts" || ((ERRORS++))
check_table "partner_documents" || ((ERRORS++))
check_table "reglementaire_folders" || ((ERRORS++))
check_table "reglementaire_documents" || ((ERRORS++))
check_table "user_sessions" || ((ERRORS++))
check_table "password_reset_requests" || ((ERRORS++))
check_table "cms_content" || ((ERRORS++))
check_table "file_permissions" || ((ERRORS++))

echo ""
echo "📋 2. Vérification des colonnes dans 'users'..."
check_column "users" "denomination_sociale" || ((ERRORS++))
check_column "users" "telephone" || ((ERRORS++))
check_column "users" "code_postal" || ((ERRORS++))
check_column "users" "validite_date" || ((ERRORS++))

echo ""
echo "📋 3. Vérification des colonnes dans 'archives'..."
check_column "archives" "assurance" || ((ERRORS++))
check_column "archives" "file_content" || ((ERRORS++))
check_column "archives" "uploaded_by_prenom" || ((ERRORS++))
check_column "archives" "uploaded_by_nom" || ((ERRORS++))

echo ""
echo "📋 4. Vérification des colonnes dans 'partners'..."
check_column "partners" "logo_content" || ((ERRORS++))

echo ""
echo "📋 5. Vérification des colonnes dans 'reglementaire_folders'..."
check_column "reglementaire_folders" "title" || ((ERRORS++))
check_column "reglementaire_folders" "is_active" || ((ERRORS++))
check_column "reglementaire_folders" "display_order" || ((ERRORS++))

echo ""
echo "📋 6. Vérification des colonnes dans 'reglementaire_documents'..."
check_column "reglementaire_documents" "name" || ((ERRORS++))
check_column "reglementaire_documents" "is_active" || ((ERRORS++))
check_column "reglementaire_documents" "display_order" || ((ERRORS++))

echo ""
echo "📋 7. Vérification des colonnes dans 'financial_documents'..."
check_column "financial_documents" "subcategory" || ((ERRORS++))
check_column "financial_documents" "is_active" || ((ERRORS++))

echo ""
echo "📋 8. Vérification des colonnes dans 'formations'..."
check_column "formations" "user_name" || ((ERRORS++))
check_column "formations" "nom_document" || ((ERRORS++))
check_column "formations" "date" || ((ERRORS++))
check_column "formations" "heures" || ((ERRORS++))
check_column "formations" "categories" || ((ERRORS++))
check_column "formations" "delivree_par" || ((ERRORS++))
check_column "formations" "file_content" || ((ERRORS++))
check_column "formations" "year" || ((ERRORS++))
check_column "formations" "statut" || ((ERRORS++))

echo ""
echo "📋 9. Test de connexion au backend..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "000")
if [ "$BACKEND_STATUS" = "200" ]; then
  echo "  ✅ Backend répond (HTTP $BACKEND_STATUS)"
else
  echo "  ❌ Backend ne répond pas (HTTP $BACKEND_STATUS)"
  ((ERRORS++))
fi

echo ""
if [ $ERRORS -eq 0 ]; then
  echo "✅ Toutes les vérifications sont passées! Toutes les API devraient fonctionner."
else
  echo "❌ $ERRORS problème(s) détecté(s). Exécutez ./fix-database.sh pour corriger."
fi

echo ""
echo "✅ Vérification terminée!"

