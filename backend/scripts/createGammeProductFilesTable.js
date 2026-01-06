const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function createGammeProductFilesTable() {
  try {
    console.log('📝 Création de la table gamme_product_files...');

    const sqlFile = path.join(__dirname, 'createGammeProductFilesTable.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    await query(sqlContent);
    console.log('✅ Table gamme_product_files créée avec succès!');

    // Vérifier la table
    const [tables] = await query(`SHOW TABLES LIKE 'gamme_product_files'`);
    if (tables.length > 0) {
      console.log('✅ Table gamme_product_files confirmée dans la base de données');
      
      // Afficher la structure de la table
      const [structure] = await query(`DESCRIBE gamme_product_files`);
      console.log('📊 Structure de la table:');
      console.table(structure);
    } else {
      console.error('❌ Erreur: La table gamme_product_files n\'a pas été trouvée après la création.');
    }

  } catch (error) {
    if (error.message.includes('already exists')) {
      console.warn('⚠️ La table gamme_product_files existe déjà. Aucune modification nécessaire.');
    } else {
      console.error('❌ Erreur lors de la création de la table gamme_product_files:', error);
      throw error;
    }
  }
}

// Exécuter la fonction
(async () => {
  try {
    console.log('✅ Connexion à la base de données...');
    await createGammeProductFilesTable();
    console.log('🔌 Terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
})();

