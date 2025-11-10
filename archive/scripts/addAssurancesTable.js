const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addAssurancesTable() {
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

    // Create assurances table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS assurances (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE,
        montant_enveloppe DECIMAL(15, 2) DEFAULT 0 COMMENT 'Montant total disponible pour cette assurance',
        color VARCHAR(50) DEFAULT 'gray' COMMENT 'Couleur pour l''affichage (blue, orange, green, etc.)',
        icon VARCHAR(10) DEFAULT '📄' COMMENT 'Icône emoji pour l''affichage',
        is_active BOOLEAN DEFAULT TRUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createTableSQL);
    console.log('✅ assurances table created successfully');

    // Insert default assurances if they don't exist
    const defaultAssurances = [
      { name: 'SwissLife', montant_enveloppe: 5000000, color: 'blue', icon: '🏢' },
      { name: 'CARDIF', montant_enveloppe: 3000000, color: 'orange', icon: '🛡️' },
      { name: 'Abeille Assurances', montant_enveloppe: 2000000, color: 'green', icon: '🐝' },
      { name: 'AXA', montant_enveloppe: 4000000, color: 'purple', icon: '🔷' },
      { name: 'Allianz', montant_enveloppe: 3500000, color: 'red', icon: '⚡' },
      { name: 'Generali', montant_enveloppe: 2500000, color: 'yellow', icon: '🌟' }
    ];

    for (const assurance of defaultAssurances) {
      await connection.query(
        `INSERT IGNORE INTO assurances (name, montant_enveloppe, color, icon) 
         VALUES (?, ?, ?, ?)`,
        [assurance.name, assurance.montant_enveloppe, assurance.color, assurance.icon]
      );
    }

    console.log('✅ Default assurances inserted');

    await connection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

addAssurancesTable();


