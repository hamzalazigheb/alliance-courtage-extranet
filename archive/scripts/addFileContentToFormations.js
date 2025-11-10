const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addFileContentToFormations() {
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
    const addColumnSQL = `
      ALTER TABLE formations 
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

    // Make file_path nullable (since we'll use base64 now)
    try {
      await connection.query(`
        ALTER TABLE formations 
        MODIFY COLUMN file_path VARCHAR(500) NULL COMMENT 'File path (null when file is stored as base64 in file_content)'
      `);
      console.log('✅ file_path column modified to allow NULL');
    } catch (error) {
      console.log('ℹ️ Could not modify file_path column:', error.message);
    }

    await connection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error modifying table:', error);
    process.exit(1);
  }
}

addFileContentToFormations();

