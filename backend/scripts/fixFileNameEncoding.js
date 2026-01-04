const { query, getConnection } = require('../config/database');

// Fonction pour corriger l'encodage des noms de fichiers
function fixFilenameEncoding(filename) {
  try {
    // Si le nom de fichier est déjà en UTF-8 valide, le retourner
    if (Buffer.from(filename, 'utf8').toString('utf8') === filename) {
      return filename;
    }
    
    // Essayer de décoder depuis latin1 vers UTF-8 (problème courant)
    const buffer = Buffer.from(filename, 'latin1');
    return buffer.toString('utf8');
  } catch (error) {
    console.error('Erreur encodage filename:', error);
    return filename;
  }
}

async function fixEncodingInDatabase() {
  let connection;
  try {
    console.log('🔧 Connexion à la base de données...');
    connection = await getConnection();
    
    // Étape 1: Vérifier et convertir la table en UTF-8
    console.log('📝 Conversion de la table product_files en UTF-8...');
    await connection.query(`
      ALTER TABLE product_files CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    console.log('✅ Table convertie en UTF-8');

    // Étape 2: Récupérer tous les fichiers
    console.log('📋 Récupération des fichiers...');
    const [files] = await connection.query('SELECT id, file_name FROM product_files');
    console.log(`   Trouvé ${files.length} fichier(s)`);

    // Étape 3: Corriger les noms de fichiers mal encodés
    let fixedCount = 0;
    for (const file of files) {
      const fixedName = fixFilenameEncoding(file.file_name);
      
      if (fixedName !== file.file_name) {
        console.log(`   🔄 Correction: "${file.file_name}" → "${fixedName}"`);
        await connection.query(
          'UPDATE product_files SET file_name = ? WHERE id = ?',
          [fixedName, file.id]
        );
        fixedCount++;
      }
    }

    console.log(`\n✅ Encodage corrigé pour ${fixedCount} fichier(s)!`);
    
    if (fixedCount === 0) {
      console.log('ℹ️  Aucun fichier à corriger (tous sont déjà en UTF-8 valide)');
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    if (connection) {
      connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le script
if (require.main === module) {
  fixEncodingInDatabase()
    .then(() => {
      console.log('\n✨ Script terminé avec succès!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { fixEncodingInDatabase };

