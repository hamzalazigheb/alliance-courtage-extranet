const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function addAssuranceNameColumn() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      multipleStatements: true
    });

    console.log('✅ Connecté à la base de données');

    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'add-assurance-name-column.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Exécuter le SQL
    console.log('📝 Exécution du script SQL...');
    const [results] = await connection.query(sql);
    
    console.log('✅ Script exécuté avec succès !');
    
    // Vérifier que la colonne existe maintenant
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'product_reservations' 
       AND COLUMN_NAME = 'assurance_name'`,
      [process.env.DB_NAME || 'alliance_courtage']
    );

    if (columns.length > 0) {
      console.log('✅ Colonne assurance_name confirmée :');
      console.log(`   Type: ${columns[0].COLUMN_TYPE}`);
    } else {
      console.log('⚠️  La colonne assurance_name n\'a pas été trouvée');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le script
addAssuranceNameColumn();

