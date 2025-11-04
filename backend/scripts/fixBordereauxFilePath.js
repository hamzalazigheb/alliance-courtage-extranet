const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function fixBordereauxFilePath() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL');
    console.log('🔧 Modifying file_path column to allow NULL...\n');

    try {
      // Modify file_path to allow NULL
      await connection.query(`
        ALTER TABLE bordereaux 
        MODIFY COLUMN file_path VARCHAR(500) NULL COMMENT 'File path (null when file is stored as base64 in file_content)'
      `);
      console.log('✅ file_path column modified to allow NULL');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('ℹ️ file_path column does not exist or already allows NULL');
      } else {
        throw error;
      }
    }

    await connection.end();
    console.log('✅ Database connection closed\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixBordereauxFilePath();

