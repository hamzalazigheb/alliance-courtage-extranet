#!/bin/bash
# Script pour vérifier la structure de la base de données sur le serveur

echo "🔍 Vérification de la structure de la base de données sur le serveur..."
echo ""

# Liste des tables attendues (basée sur votre structure locale)
TABLES=(
  "archives"
  "assurances"
  "bordereaux"
  "cms_content"
  "favoris"
  "file_permissions"
  "financial_documents"
  "financial_products"
  "formations"
  "news"
  "notifications"
  "partners"
  "partner_contacts"
  "partner_documents"
  "password_reset_requests"
  "product_performances"
  "product_reservations"
  "reglementaire_documents"
  "reglementaire_folders"
  "simulators"
  "simulator_usage"
  "users"
  "user_sessions"
)

echo "📊 Vérification des tables..."
echo ""

# Se connecter à MySQL et vérifier chaque table
for table in "${TABLES[@]}"; do
  EXISTS=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = '$table';" 2>/dev/null)
  
  if [ "$EXISTS" = "1" ]; then
    ROWS=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM $table;" 2>/dev/null)
    echo "✅ $table (existe, $ROWS lignes)"
  else
    echo "❌ $table (MANQUANTE)"
  fi
done

echo ""
echo "📋 Vérification des colonnes dans la table 'users'..."
echo ""

# Colonnes attendues dans users
USER_COLUMNS=(
  "id"
  "email"
  "password"
  "nom"
  "prenom"
  "denomination_sociale"
  "telephone"
  "code_postal"
  "validite_date"
  "role"
  "is_active"
  "created_at"
  "updated_at"
)

for col in "${USER_COLUMNS[@]}"; do
  EXISTS=$(sudo docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -sN -e "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'alliance_courtage' AND TABLE_NAME = 'users' AND COLUMN_NAME = '$col';" 2>/dev/null)
  
  if [ "$EXISTS" = "1" ]; then
    echo "✅ users.$col"
  else
    echo "❌ users.$col (MANQUANTE)"
  fi
done

echo ""
echo "✅ Vérification terminée!"

