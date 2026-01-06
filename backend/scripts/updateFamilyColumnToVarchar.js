const { query, connection } = require('../config/database');

async function updateFamilyColumnToVarchar() {
  try {
    console.log('🔌 Connexion à MySQL...');
    await connection.connect();
    console.log('✅ Connexion réussie!');

    console.log('🔄 Modification de la colonne family de ENUM à VARCHAR...');
    
    await query(`
      ALTER TABLE gamme_products 
      MODIFY COLUMN family VARCHAR(100) NOT NULL 
      COMMENT 'Famille de produit (dynamique)'
    `);
    
    console.log('✅ Colonne family modifiée avec succès!');
    console.log('   Type: ENUM → VARCHAR(100)');
    
    // Vérifier le résultat
    const [columns] = await query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'gamme_products'
      AND COLUMN_NAME = 'family'
    `);
    
    console.log('\n📊 Structure de la colonne family:');
    console.table(columns);

  } catch (error) {
    console.error('❌ Erreur lors de la modification:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

updateFamilyColumnToVarchar();

