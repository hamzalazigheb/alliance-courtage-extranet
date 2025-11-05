const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addLinkToNotifications() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL');

    // Vérifier si la colonne existe déjà
    const [columns] = await connection.execute(
      `SELECT COUNT(*) as count 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'notifications' 
       AND COLUMN_NAME = 'link'`,
      [process.env.DB_NAME || 'alliance_courtage']
    );

    if (columns[0].count === 0) {
      console.log('🔧 Ajout de la colonne link à la table notifications...');
      await connection.execute(
        'ALTER TABLE notifications ADD COLUMN link VARCHAR(500) NULL AFTER related_type'
      );
      console.log('✅ Colonne link ajoutée avec succès');
    } else {
      console.log('✅ La colonne link existe déjà');
    }

    // Vérification finale
    const [finalColumns] = await connection.execute(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'notifications' 
       AND COLUMN_NAME = 'link'`,
      [process.env.DB_NAME || 'alliance_courtage']
    );

    if (finalColumns.length > 0) {
      console.log('\n📊 Colonne link:');
      console.log(`   Type: ${finalColumns[0].COLUMN_TYPE}`);
      console.log(`   Nullable: ${finalColumns[0].IS_NULLABLE}`);
    }

    await connection.end();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

addLinkToNotifications();

