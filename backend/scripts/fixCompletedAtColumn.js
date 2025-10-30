const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const fixCompletedAtColumn = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage'
  });

  try {
    // Drop the column if it exists
    await connection.execute(`ALTER TABLE password_reset_requests DROP COLUMN completed_at`);
    console.log('✅ dropped completed_at column');
    
    // Recreate with proper type
    await connection.execute(`ALTER TABLE password_reset_requests ADD COLUMN completed_at TIMESTAMP NULL AFTER requested_at`);
    console.log('✅ recreated completed_at column with proper TIMESTAMP type');
    
    // Do the same for completed_by and notes to ensure consistency
    const [columns2] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'password_reset_requests' AND COLUMN_NAME = 'completed_by'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    if (columns2.length === 0) {
      await connection.execute(`ALTER TABLE password_reset_requests ADD COLUMN completed_by INT NULL AFTER completed_at`);
      await connection.execute(`ALTER TABLE password_reset_requests ADD FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL`);
      console.log('✅ completed_by column added');
    }
    
    const [columns3] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'password_reset_requests' AND COLUMN_NAME = 'notes'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    if (columns3.length === 0) {
      await connection.execute(`ALTER TABLE password_reset_requests ADD COLUMN notes TEXT AFTER completed_by`);
      console.log('✅ notes column added');
    }
    
    console.log('✅ All columns fixed successfully');
  } catch (error) {
    console.error('❌ Error fixing columns:', error);
  } finally {
    await connection.end();
  }
};

fixCompletedAtColumn();
