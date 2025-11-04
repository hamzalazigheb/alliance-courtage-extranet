const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addFavorisTable() {
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

    // Create favoris table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`favoris\` (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        item_type VARCHAR(50) NOT NULL COMMENT 'Type: document, product, archive, etc.',
        item_id INT NOT NULL COMMENT 'ID de l element favori',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        url VARCHAR(500),
        metadata TEXT COMMENT 'JSON pour stocker des infos supplémentaires',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_item_type (item_type),
        INDEX idx_item_id (item_id),
        INDEX idx_created_at (created_at),
        UNIQUE KEY unique_user_item (user_id, item_type, item_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createTableSQL);
    console.log('✅ favoris table created successfully');

    await connection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

addFavorisTable();

