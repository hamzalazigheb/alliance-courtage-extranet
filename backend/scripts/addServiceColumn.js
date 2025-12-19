const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

/**
 * Script pour ajouter la colonne "service" à la table partner_contacts
 * Exécuter avec: node backend/scripts/addServiceColumn.js
 */

async function addServiceColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔍 Vérification de l\'existence de la colonne "service"...');
    
    // Vérifier si la colonne existe déjà
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'partner_contacts' 
      AND COLUMN_NAME = 'service'
    `, [process.env.DB_NAME || 'alliance_courtage']);

    if (columns.length > 0) {
      console.log('✅ La colonne "service" existe déjà dans la table partner_contacts');
      return;
    }

    console.log('📋 Ajout de la colonne "service" à la table partner_contacts...');
    
    await connection.execute(`
      ALTER TABLE partner_contacts 
      ADD COLUMN service VARCHAR(100) NULL 
      AFTER telephone
    `);
    
    console.log('✅ Colonne "service" ajoutée avec succès !');
    console.log('');
    console.log('📝 Structure de la colonne:');
    console.log('   - Nom: service');
    console.log('   - Type: VARCHAR(100)');
    console.log('   - Nullable: OUI');
    console.log('   - Position: Après "telephone"');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de la colonne:', error.message);
    console.error('Détails:', {
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Exécuter le script
addServiceColumn()
  .then(() => {
    console.log('');
    console.log('✨ Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

