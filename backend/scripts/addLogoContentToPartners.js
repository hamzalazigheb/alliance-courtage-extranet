const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addLogoContentToPartners() {
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

    // Add logo_content column to store base64 encoded images
    const addColumnSQL = `
      ALTER TABLE partners 
      ADD COLUMN IF NOT EXISTS logo_content LONGTEXT COMMENT 'Base64 encoded logo image'
    `;

    try {
      await connection.query(addColumnSQL);
      console.log('✅ logo_content column added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ logo_content column already exists');
      } else {
        throw error;
      }
    }

    // Make logo_url nullable (since we'll use base64 now)
    try {
      await connection.query(`
        ALTER TABLE partners 
        MODIFY COLUMN logo_url VARCHAR(500) NULL COMMENT 'Logo URL (null when logo is stored as base64 in logo_content)'
      `);
      console.log('✅ logo_url column modified to allow NULL');
    } catch (error) {
      console.log('ℹ️ Could not modify logo_url column:', error.message);
    }

    await connection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error modifying table:', error);
    process.exit(1);
  }
}

addLogoContentToPartners();

