const { query } = require('../config/database');

async function addAllUserColumns() {
  try {
    console.log('🔄 Ajout de toutes les colonnes utilisateur à la table users...\n');
    
    // Vérifier quelles colonnes existent déjà
    const columns = await query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME IN ('denomination_sociale', 'telephone', 'code_postal')`
    );
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Colonnes existantes:', existingColumns.length > 0 ? existingColumns.join(', ') : 'Aucune');
    console.log('');
    
    // Ajouter denomination_sociale si elle n'existe pas
    if (!existingColumns.includes('denomination_sociale')) {
      try {
        await query(`
          ALTER TABLE users 
          ADD COLUMN denomination_sociale VARCHAR(255) NULL 
          AFTER prenom
        `);
        console.log('✅ Colonne denomination_sociale ajoutée');
      } catch (error) {
        console.error('❌ Erreur ajout denomination_sociale:', error.message);
      }
    } else {
      console.log('ℹ️  Colonne denomination_sociale existe déjà');
    }
    
    // Ajouter telephone si elle n'existe pas
    if (!existingColumns.includes('telephone')) {
      try {
        // Vérifier où insérer (après denomination_sociale si elle existe, sinon après prenom)
        const hasDenomination = existingColumns.includes('denomination_sociale');
        const afterColumn = hasDenomination ? 'denomination_sociale' : 'prenom';
        
        await query(`
          ALTER TABLE users 
          ADD COLUMN telephone VARCHAR(20) NULL 
          AFTER ${afterColumn}
        `);
        console.log('✅ Colonne telephone ajoutée');
      } catch (error) {
        console.error('❌ Erreur ajout telephone:', error.message);
      }
    } else {
      console.log('ℹ️  Colonne telephone existe déjà');
    }
    
    // Ajouter code_postal si elle n'existe pas
    if (!existingColumns.includes('code_postal')) {
      try {
        // Vérifier où insérer (après telephone si elle existe)
        const hasTelephone = existingColumns.includes('telephone');
        const afterColumn = hasTelephone ? 'telephone' : (existingColumns.includes('denomination_sociale') ? 'denomination_sociale' : 'prenom');
        
        await query(`
          ALTER TABLE users 
          ADD COLUMN code_postal VARCHAR(10) NULL 
          AFTER ${afterColumn}
        `);
        console.log('✅ Colonne code_postal ajoutée');
      } catch (error) {
        console.error('❌ Erreur ajout code_postal:', error.message);
      }
    } else {
      console.log('ℹ️  Colonne code_postal existe déjà');
    }
    
    // Vérification finale
    console.log('\n🔍 Vérification finale...');
    const finalColumns = await query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME IN ('denomination_sociale', 'telephone', 'code_postal')
       ORDER BY ORDINAL_POSITION`
    );
    
    const finalColumnNames = finalColumns.map(col => col.COLUMN_NAME);
    console.log('📋 Colonnes finales:', finalColumnNames.length > 0 ? finalColumnNames.join(', ') : 'Aucune');
    
    if (finalColumnNames.length === 3) {
      console.log('\n✅ Toutes les colonnes ont été ajoutées avec succès !');
    } else {
      console.log(`\n⚠️  ${finalColumnNames.length}/3 colonnes présentes`);
    }
    
    console.log('\n✅ Migration terminée !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    console.error('Détails:', error.message);
    process.exit(1);
  }
}

addAllUserColumns();

