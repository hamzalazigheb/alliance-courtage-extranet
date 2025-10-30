const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const recreateTable = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage'
  });

  try {
    // Drop the table if it exists
    await connection.execute(`DROP TABLE IF EXISTS password_reset_requests`);
    console.log('✅ Dropped existing table');
    
    // Recreate the table with proper structure
    await connection.execute(`
      CREATE TABLE password_reset_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        completed_by INT NULL,
        notes TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_status (status),
        INDEX idx_user_id (user_id)
      )
    `);
    
    console.log('✅ Table recreated successfully with proper structure');
  } catch (error) {
    console.error('❌ Error recreating table:', error);
  } finally {
    await connection.end();
  }
};

recreateTable();


