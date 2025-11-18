const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage',
  charset: 'utf8mb4'
};

async function addSimulatorUsageTable() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion à la base de données établie');

    // Créer la table simulator_usage
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS simulator_usage (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        simulator_type VARCHAR(50) NOT NULL,
        parameters JSON,
        result_summary TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_simulator_type (simulator_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table simulator_usage créée avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la création de la table:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addSimulatorUsageTable()
  .then(() => {
    console.log('✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

