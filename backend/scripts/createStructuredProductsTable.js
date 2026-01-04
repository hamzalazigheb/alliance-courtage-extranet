#!/usr/bin/env node

/**
 * Script pour créer la table structured_products avec la colonne date_strike
 */

const mysql = require('mysql2');

// Charger les variables d'environnement
try {
  require('dotenv').config({ path: './config.env' });
} catch (e) {
  console.log('ℹ️  config.env non trouvé, utilisation des variables d\'environnement système');
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage'
};

console.log('🔌 Connexion à la base de données...');
console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('❌ Erreur de connexion:', err.message);
    process.exit(1);
  }

  console.log('✅ Connecté à MySQL');

  // Vérifier si la table existe
  const checkTableQuery = `
    SELECT TABLE_NAME 
    FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = ? 
    AND TABLE_NAME = 'structured_products'
  `;

  connection.query(checkTableQuery, [dbConfig.database], (err, results) => {
    if (err) {
      console.error('❌ Erreur lors de la vérification:', err.message);
      connection.end();
      process.exit(1);
    }

    if (results.length > 0) {
      console.log('ℹ️  La table structured_products existe déjà!');
      
      // Vérifier si date_strike existe
      const checkColumnQuery = `
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'structured_products' 
        AND COLUMN_NAME = 'date_strike'
      `;
      
      connection.query(checkColumnQuery, [dbConfig.database], (err, colResults) => {
        if (err) {
          console.error('❌ Erreur:', err.message);
          connection.end();
          process.exit(1);
        }
        
        if (colResults.length > 0) {
          console.log('✅ La colonne date_strike existe déjà!');
          connection.end();
          process.exit(0);
        } else {
          console.log('📝 Ajout de la colonne date_strike...');
          connection.query('ALTER TABLE structured_products ADD COLUMN date_strike DATE', (err) => {
            if (err) {
              console.error('❌ Erreur:', err.message);
            } else {
              console.log('✅ Colonne date_strike ajoutée!');
            }
            connection.end();
            process.exit(err ? 1 : 0);
          });
        }
      });
      return;
    }

    // Créer la table
    console.log('📝 Création de la table structured_products...');
    const createTableQuery = `
      CREATE TABLE structured_products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        assurance TEXT,
        montant_enveloppe DECIMAL(15,2),
        date_strike DATE,
        category VARCHAR(100),
        file_path VARCHAR(500),
        file_size INT,
        file_type VARCHAR(50),
        uploaded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    connection.query(createTableQuery, (err) => {
      if (err) {
        console.error('❌ Erreur lors de la création de la table:', err.message);
        connection.end();
        process.exit(1);
      }

      console.log('✅ Table structured_products créée avec succès!');
      console.log('✅ Colonne date_strike incluse!');

      // Créer la table product_files si elle n'existe pas
      console.log('\n📝 Création de la table product_files...');
      const createFilesTableQuery = `
        CREATE TABLE IF NOT EXISTS product_files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          product_id INT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_path VARCHAR(500) NOT NULL,
          file_size INT,
          file_type VARCHAR(50),
          uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES structured_products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      connection.query(createFilesTableQuery, (err) => {
        if (err) {
          console.error('❌ Erreur:', err.message);
        } else {
          console.log('✅ Table product_files créée!');
        }

        // Créer la table product_reservations
        console.log('\n📝 Création de la table product_reservations...');
        const createReservationsTableQuery = `
          CREATE TABLE IF NOT EXISTS product_reservations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id INT NOT NULL,
            user_id INT NOT NULL,
            assurance_name VARCHAR(255),
            montant DECIMAL(15,2) NOT NULL,
            notes TEXT,
            status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES structured_products(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        connection.query(createReservationsTableQuery, (err) => {
          if (err) {
            console.error('❌ Erreur:', err.message);
          } else {
            console.log('✅ Table product_reservations créée!');
          }

          // Afficher la structure
          console.log('\n📋 Structure de la table structured_products:');
          connection.query('DESCRIBE structured_products', (err, results) => {
            if (err) {
              console.error('❌ Erreur:', err.message);
            } else {
              console.table(results);
            }

            connection.end();
            console.log('\n✅ Toutes les tables sont prêtes!');
            process.exit(0);
          });
        });
      });
    });
  });
});

