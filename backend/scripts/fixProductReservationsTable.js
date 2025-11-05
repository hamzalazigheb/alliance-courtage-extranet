const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function fixProductReservationsTable() {
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

    // Check if table exists
    const [tables] = await connection.query(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_reservations'`,
      [process.env.DB_NAME || 'alliance_courtage']
    );

    if (tables.length > 0) {
      console.log('📋 Table product_reservations exists, checking schema...');
      
      // Check current schema
      const [columns] = await connection.query(`DESCRIBE product_reservations`);
      console.log('Current schema:', columns);
      
      // Drop table to recreate with correct schema
      console.log('🔄 Dropping existing table...');
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      await connection.query('DROP TABLE IF EXISTS product_reservations');
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    }

    // Create product_reservations table with correct schema
    console.log('🔨 Creating product_reservations table...');
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS product_reservations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        user_id INT NOT NULL,
        montant DECIMAL(15, 2) NOT NULL,
        notes TEXT,
        status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, approved, rejected',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_product_id (product_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (product_id) REFERENCES archives(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createTableSQL);
    console.log('✅ product_reservations table created successfully');

    // Verify table structure
    const [finalColumns] = await connection.query(`DESCRIBE product_reservations`);
    console.log('\n📊 Final table structure:');
    console.table(finalColumns);

    await connection.end();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('SQL Message:', error.sqlMessage);
    }
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

fixProductReservationsTable();

