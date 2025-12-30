const { query } = require('../config/database');

async function fixMissingColumns() {
  console.log('🔧 Correction des colonnes et tables manquantes...\n');

  try {
    // 1. Ajouter la colonne validite_date à la table users
    console.log('📋 1. Vérification de la colonne validite_date...');
    try {
      const columns = await query(`SHOW COLUMNS FROM users LIKE 'validite_date'`);
      if (columns.length === 0) {
        await query(`ALTER TABLE users ADD COLUMN validite_date DATE DEFAULT NULL`);
        console.log('✅ Colonne validite_date ajoutée à la table users');
      } else {
        console.log('✅ Colonne validite_date existe déjà');
      }
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout de validite_date:', err.message);
    }

    // 2. Créer la table user_sessions si elle n'existe pas
    console.log('\n📋 2. Vérification de la table user_sessions...');
    try {
      const tables = await query(`SHOW TABLES LIKE 'user_sessions'`);
      if (tables.length === 0) {
        await query(`
          CREATE TABLE user_sessions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token TEXT NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id),
            INDEX idx_expires_at (expires_at),
            INDEX idx_token (token(255))
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table user_sessions créée');
      } else {
        console.log('✅ Table user_sessions existe déjà');
      }
    } catch (err) {
      console.error('❌ Erreur lors de la création de user_sessions:', err.message);
    }

    // 3. Créer la table password_reset_requests si elle n'existe pas
    console.log('\n📋 3. Vérification de la table password_reset_requests...');
    try {
      const tables = await query(`SHOW TABLES LIKE 'password_reset_requests'`);
      if (tables.length === 0) {
        await query(`
          CREATE TABLE password_reset_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            user_email VARCHAR(255) NOT NULL,
            status ENUM('pending', 'completed', 'expired') DEFAULT 'pending',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id),
            INDEX idx_status (status),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);
        console.log('✅ Table password_reset_requests créée');
      } else {
        console.log('✅ Table password_reset_requests existe déjà');
      }
    } catch (err) {
      console.error('❌ Erreur lors de la création de password_reset_requests:', err.message);
    }

    // 4. Vérifier et créer l'index pour validite_date
    console.log('\n📋 4. Vérification de l\'index pour validite_date...');
    try {
      const indexes = await query(`SHOW INDEX FROM users WHERE Key_name = 'idx_users_validite_date'`);
      if (indexes.length === 0) {
        await query(`CREATE INDEX idx_users_validite_date ON users(validite_date)`);
        console.log('✅ Index idx_users_validite_date créé');
      } else {
        console.log('✅ Index idx_users_validite_date existe déjà');
      }
    } catch (err) {
      console.error('❌ Erreur lors de la création de l\'index:', err.message);
    }

    console.log('\n✅ Migration terminée avec succès!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
fixMissingColumns();




