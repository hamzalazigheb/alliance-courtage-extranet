const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addFileContentToArchivesForStructuredProducts() {
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

    // Check if file_content column already exists
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'archives' 
       AND COLUMN_NAME = 'file_content'`,
      [process.env.DB_NAME || 'alliance_courtage']
    );

    if (columns.length === 0) {
      // Add file_content column to store base64 encoded files
      await connection.query(`
        ALTER TABLE archives 
        ADD COLUMN file_content LONGTEXT COMMENT 'Base64 encoded file content'
      `);
      console.log('✅ file_content column added to archives table');
    } else {
      console.log('ℹ️ file_content column already exists in archives table');
    }

    // Modify file_path to allow NULL for base64 files
    try {
      await connection.query(`
        ALTER TABLE archives 
        MODIFY COLUMN file_path VARCHAR(500) NULL
      `);
      console.log('✅ file_path column modified to allow NULL');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR' || error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ file_path column already allows NULL or column does not exist');
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

addFileContentToArchivesForStructuredProducts();

