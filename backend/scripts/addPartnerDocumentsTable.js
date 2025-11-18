const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

/**
 * Script pour créer la table partner_documents
 * Cette table permet de gérer les documents (conventions de distribution, etc.) par partenaire
 */

async function addPartnerDocumentsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage',
    charset: 'utf8mb4'
  });

  try {
    console.log('📋 Création de la table partner_documents...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS partner_documents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        partner_id INT NOT NULL,
        title VARCHAR(255) NOT NULL COMMENT 'Titre du document (ex: Convention de distribution)',
        description TEXT COMMENT 'Description optionnelle',
        file_path VARCHAR(500) COMMENT 'Chemin du fichier (ancien système)',
        file_content LONGTEXT COMMENT 'Contenu du fichier en base64',
        file_size BIGINT COMMENT 'Taille du fichier en octets',
        file_type VARCHAR(100) COMMENT 'Type MIME du fichier',
        document_type VARCHAR(100) COMMENT 'Type de document: convention, brochure, autre',
        uploaded_by INT COMMENT 'ID utilisateur qui a uploade',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_partner_id (partner_id),
        INDEX idx_document_type (document_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Table partner_documents créée avec succès');
    console.log('');
    console.log('📝 Structure de la table:');
    console.log('   - id: Identifiant unique');
    console.log('   - partner_id: Référence au partenaire');
    console.log('   - title: Titre du document');
    console.log('   - description: Description optionnelle');
    console.log('   - file_content: Contenu en base64 (stockage dans la DB)');
    console.log('   - file_type: Type MIME (application/pdf, etc.)');
    console.log('   - document_type: Type de document (convention, brochure, etc.)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error);
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  La table existe déjà, pas de problème !');
    } else {
      throw error;
    }
  } finally {
    await connection.end();
  }
}

// Exécuter le script
addPartnerDocumentsTable()
  .then(() => {
    console.log('');
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

