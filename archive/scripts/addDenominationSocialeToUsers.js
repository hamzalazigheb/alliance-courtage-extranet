const { query } = require('../config/database');

async function addDenominationSocialeToUsers() {
  try {
    console.log('🔄 Ajout de la colonne denomination_sociale à la table users...');
    
    // Vérifier si la colonne existe déjà
    const columns = await query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'denomination_sociale'`
    );
    
    if (columns.length === 0) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN denomination_sociale VARCHAR(255) NULL 
        AFTER prenom
      `);
      console.log('✅ Colonne denomination_sociale ajoutée');
    } else {
      console.log('ℹ️  Colonne denomination_sociale existe déjà');
    }
    
    console.log('✅ Migration terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

addDenominationSocialeToUsers();

