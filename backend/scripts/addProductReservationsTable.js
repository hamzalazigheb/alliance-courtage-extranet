const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addProductReservationsTable() {
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

    // Create product_reservations table
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

    await connection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

addProductReservationsTable();


