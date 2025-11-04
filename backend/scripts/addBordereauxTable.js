const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addBordereauxTable() {
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

    // Create bordereaux table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS bordereaux (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        file_path VARCHAR(500) NOT NULL,
        file_size BIGINT,
        file_type VARCHAR(100),
        period_month INT COMMENT 'Month (1-12)',
        period_year INT COMMENT 'Year (e.g., 2024)',
        uploaded_by INT NOT NULL COMMENT 'Admin who uploaded the file',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_uploaded_by (uploaded_by),
        INDEX idx_period (period_year, period_month),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createTableSQL);
    console.log('✅ bordereaux table created successfully');

    await connection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

addBordereauxTable();

