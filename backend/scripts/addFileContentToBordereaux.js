const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addFileContentToBordereaux() {
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

    // Add file_content column to store base64 encoded files
    // Using LONGTEXT to handle large files (up to 4GB in MySQL)
    const addColumnSQL = `
      ALTER TABLE bordereaux 
      ADD COLUMN IF NOT EXISTS file_content LONGTEXT COMMENT 'Base64 encoded file content'
    `;

    try {
      await connection.query(addColumnSQL);
      console.log('✅ file_content column added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ file_content column already exists');
      } else {
        throw error;
      }
    }

    await connection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error modifying table:', error);
    process.exit(1);
  }
}

addFileContentToBordereaux();

