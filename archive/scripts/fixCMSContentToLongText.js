const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage'
};

async function fixCMSContentColumn() {
  let connection;
  
  try {
    console.log('🔧 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connecté à la base de données\n');

    // Vérifier le type actuel de la colonne
    console.log('📋 Vérification du type de colonne actuel...');
    const [columns] = await connection.execute(
      `SELECT COLUMN_NAME, COLUMN_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cms_content' AND COLUMN_NAME = 'content'`,
      [dbConfig.database]
    );

    if (columns.length > 0) {
      const columnType = columns[0].COLUMN_TYPE.toLowerCase();
      console.log('   Type actuel:', columns[0].COLUMN_TYPE);
      
      if (columnType.includes('text') && !columnType.includes('longtext')) {
        console.log('   ⚠️  La colonne est TEXT (limite 64KB), conversion en LONGTEXT nécessaire\n');
        
        // Modifier la colonne pour supporter les grandes images base64
        console.log('🔄 Conversion de TEXT en LONGTEXT...');
        await connection.execute(
          'ALTER TABLE cms_content MODIFY COLUMN content LONGTEXT NOT NULL'
        );
        console.log('✅ Colonne convertie en LONGTEXT (limite 4GB)\n');
      } else {
        console.log('   ✅ La colonne est déjà LONGTEXT, pas de modification nécessaire\n');
      }
    } else {
      console.log('   ⚠️  Colonne non trouvée, création de la table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS cms_content (
          id INT PRIMARY KEY AUTO_INCREMENT,
          page VARCHAR(100) UNIQUE NOT NULL,
          content LONGTEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      console.log('✅ Table créée avec LONGTEXT\n');
    }

    // Vérifier que la modification a fonctionné
    const [finalColumns] = await connection.execute(
      `SELECT COLUMN_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'cms_content' AND COLUMN_NAME = 'content'`,
      [dbConfig.database]
    );

    if (finalColumns.length > 0) {
      console.log('📊 Type final:', finalColumns[0].COLUMN_TYPE);
      console.log('✅ La colonne peut maintenant stocker jusqu\'à 4GB de données\n');
    }

    console.log('🎉 Modification terminée avec succès!\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le script
fixCMSContentColumn();

