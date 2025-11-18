const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

/**
 * Script pour créer la table partner_contacts
 * Cette table permet de gérer plusieurs contacts par partenaire
 */

async function addPartnerContactsTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage',
    charset: 'utf8mb4'
  });

  try {
    console.log('📋 Création de la table partner_contacts...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS partner_contacts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        partner_id INT NOT NULL,
        fonction VARCHAR(100) NOT NULL COMMENT 'Ex: Inspecteur, Service Commercial, Contact général, etc.',
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telephone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
        INDEX idx_partner_id (partner_id),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Table partner_contacts créée avec succès');
    console.log('');
    console.log('📝 Structure de la table:');
    console.log('   - id: Identifiant unique');
    console.log('   - partner_id: Référence au partenaire');
    console.log('   - fonction: Fonction du contact (Inspecteur, Service Commercial, etc.)');
    console.log('   - nom: Nom de famille');
    console.log('   - prenom: Prénom');
    console.log('   - email: Adresse email');
    console.log('   - telephone: Numéro de téléphone (optionnel)');
    
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
addPartnerContactsTable()
  .then(() => {
    console.log('');
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });


