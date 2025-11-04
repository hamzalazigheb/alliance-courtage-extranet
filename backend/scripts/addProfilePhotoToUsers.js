const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addProfilePhotoToUsers() {
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

    // Add profile_photo column to store base64 encoded images
    const addColumnSQL = `
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_photo LONGTEXT COMMENT 'Base64 encoded profile photo'
    `;

    try {
      await connection.query(addColumnSQL);
      console.log('✅ profile_photo column added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️ profile_photo column already exists');
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

addProfilePhotoToUsers();

