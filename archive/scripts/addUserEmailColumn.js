const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const addUserEmailColumn = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage'
  });

  try {
    // Check if the column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'password_reset_requests' AND COLUMN_NAME = 'user_email'
    `, [process.env.DB_NAME || 'alliance_courtage']);

    if (columns.length === 0) {
      // Add the user_email column
      await connection.execute(`
        ALTER TABLE password_reset_requests 
        ADD COLUMN user_email VARCHAR(255) NOT NULL AFTER user_id
      `);
      console.log('✅ user_email column added to password_reset_requests table');
    } else {
      console.log('✅ user_email column already exists');
    }
  } catch (error) {
    console.error('❌ Error adding user_email column:', error);
  } finally {
    await connection.end();
  }
};

addUserEmailColumn();


