const { query } = require('../config/database');

async function addTelephoneCodePostalToUsers() {
  try {
    console.log('🔄 Ajout des colonnes telephone et code_postal à la table users...');
    
    // Vérifier si les colonnes existent déjà
    const columns = await query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME IN ('telephone', 'code_postal')`
    );
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Ajouter telephone si elle n'existe pas
    if (!existingColumns.includes('telephone')) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN telephone VARCHAR(20) NULL 
        AFTER prenom
      `);
      console.log('✅ Colonne telephone ajoutée');
    } else {
      console.log('ℹ️  Colonne telephone existe déjà');
    }
    
    // Ajouter code_postal si elle n'existe pas
    if (!existingColumns.includes('code_postal')) {
      await query(`
        ALTER TABLE users 
        ADD COLUMN code_postal VARCHAR(10) NULL 
        AFTER telephone
      `);
      console.log('✅ Colonne code_postal ajoutée');
    } else {
      console.log('ℹ️  Colonne code_postal existe déjà');
    }
    
    console.log('✅ Migration terminée avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

addTelephoneCodePostalToUsers();

