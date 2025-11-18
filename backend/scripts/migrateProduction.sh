#!/bin/bash

# Script pour migrer la base de données de production
# Crée les tables manquantes (partner_contacts, partner_documents)
# Usage: ./migrateProduction.sh

echo "🔄 Migration de la base de données de production"
echo "================================================="
echo ""

# Vérifier que le conteneur existe
CONTAINER_NAME="alliance-courtage-mysql"
if ! docker ps --format "{{.Names}}" | grep -q "${CONTAINER_NAME}"; then
    echo "❌ Conteneur $CONTAINER_NAME non trouvé!"
    exit 1
fi

echo "✅ Conteneur trouvé: $CONTAINER_NAME"
echo ""

# Récupérer le mot de passe
MYSQL_ROOT_PASSWORD=$(docker inspect $CONTAINER_NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep "^MYSQL_ROOT_PASSWORD=" | cut -d'=' -f2)

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    MYSQL_ROOT_PASSWORD=$(docker inspect $CONTAINER_NAME --format '{{range .Config.Env}}{{println .}}{{end}}' | grep "^MYSQL_PASSWORD=" | cut -d'=' -f2)
fi

if [ -z "$MYSQL_ROOT_PASSWORD" ]; then
    read -sp "Mot de passe MySQL root: " MYSQL_ROOT_PASSWORD
    echo ""
fi

echo "🔍 Vérification des tables existantes..."
TABLES=$(docker exec $CONTAINER_NAME mysql -u root -p"$MYSQL_ROOT_PASSWORD" alliance_courtage -e "SHOW TABLES;" -s -N 2>/dev/null)

HAS_CONTACTS=$(echo "$TABLES" | grep -q "partner_contacts" && echo "yes" || echo "no")
HAS_DOCUMENTS=$(echo "$TABLES" | grep -q "partner_documents" && echo "yes" || echo "no")

echo "   partner_contacts: $([ "$HAS_CONTACTS" = "yes" ] && echo "✅ Existe" || echo "❌ Manquante")"
echo "   partner_documents: $([ "$HAS_DOCUMENTS" = "yes" ] && echo "✅ Existe" || echo "❌ Manquante")"
echo ""

if [ "$HAS_CONTACTS" = "yes" ] && [ "$HAS_DOCUMENTS" = "yes" ]; then
    echo "✅ Toutes les tables nécessaires existent déjà!"
    exit 0
fi

echo "🚀 Création des tables manquantes..."
echo ""

# Créer partner_contacts si manquante
if [ "$HAS_CONTACTS" = "no" ]; then
    echo "📝 Création de partner_contacts..."
    docker exec $CONTAINER_NAME mysql -u root -p"$MYSQL_ROOT_PASSWORD" alliance_courtage -e "
    CREATE TABLE IF NOT EXISTS partner_contacts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      partner_id INT NOT NULL,
      fonction VARCHAR(100) NOT NULL,
      nom VARCHAR(100) NOT NULL,
      prenom VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      telephone VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
      INDEX idx_partner_id (partner_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    " 2>/dev/null && echo "✅ Table partner_contacts créée" || echo "❌ Erreur création partner_contacts"
fi

# Créer partner_documents si manquante
if [ "$HAS_DOCUMENTS" = "no" ]; then
    echo "📝 Création de partner_documents..."
    docker exec $CONTAINER_NAME mysql -u root -p"$MYSQL_ROOT_PASSWORD" alliance_courtage -e "
    CREATE TABLE IF NOT EXISTS partner_documents (
      id INT PRIMARY KEY AUTO_INCREMENT,
      partner_id INT NOT NULL,
      title VARCHAR(255) NOT NULL COMMENT 'Titre du document',
      description TEXT,
      file_path VARCHAR(500),
      file_content LONGTEXT COMMENT 'Contenu en base64',
      file_size BIGINT,
      file_type VARCHAR(100),
      document_type VARCHAR(100),
      uploaded_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_partner_id (partner_id),
      INDEX idx_document_type (document_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    " 2>/dev/null && echo "✅ Table partner_documents créée" || echo "❌ Erreur création partner_documents"
fi

echo ""
echo "✅ Migration terminée!"
echo ""
echo "💡 Vérifiez avec:"
echo "   docker exec -it $CONTAINER_NAME mysql -u root -p$MYSQL_ROOT_PASSWORD alliance_courtage -e \"SHOW TABLES;\""
echo ""

