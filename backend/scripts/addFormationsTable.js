const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addFormationsTable() {
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

    // Create formations table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS formations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        nom_document VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        heures INT NOT NULL,
        categories JSON NOT NULL,
        delivree_par VARCHAR(255),
        file_path VARCHAR(500) NOT NULL,
        file_size INT,
        file_type VARCHAR(50),
        statut ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        year INT NOT NULL,
        rejected_reason TEXT,
        approved_by INT,
        approved_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_statut (statut),
        INDEX idx_year (year),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createTableSQL);
    console.log('✅ formations table created successfully');

    await connection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

addFormationsTable();
