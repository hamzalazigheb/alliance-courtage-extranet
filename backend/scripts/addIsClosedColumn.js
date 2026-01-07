#!/usr/bin/env node

/**
 * Script pour ajouter la colonne is_closed à la table structured_products
 * Cette colonne permet de marquer les produits comme clôturés automatiquement
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

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('❌ Erreur de connexion:', err.message);
    process.exit(1);
  }

  console.log('✅ Connecté à MySQL');

  // Vérifier si la colonne existe déjà dans la table archives
  const checkColumnQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? 
    AND TABLE_NAME = 'archives' 
    AND COLUMN_NAME = 'is_closed'
  `;
  
  connection.query(checkColumnQuery, [dbConfig.database], (err, results) => {
    if (err) {
      console.error('❌ Erreur lors de la vérification:', err.message);
      connection.end();
      process.exit(1);
    }
    
    if (results.length > 0) {
      console.log('✅ La colonne is_closed existe déjà dans archives!');
      connection.end();
      process.exit(0);
    }
    
    console.log('📝 Ajout de la colonne is_closed à la table archives...');
    
    const addColumnQuery = `
      ALTER TABLE archives 
      ADD COLUMN is_closed BOOLEAN DEFAULT FALSE
    `;
    
    connection.query(addColumnQuery, (err) => {
      if (err) {
        console.error('❌ Erreur lors de l\'ajout de la colonne:', err.message);
        connection.end();
        process.exit(1);
      }
      
      console.log('✅ Colonne is_closed ajoutée avec succès à la table archives!');
      
      // Afficher la structure mise à jour
      console.log('\n📋 Structure mise à jour de la table archives:');
      connection.query('DESCRIBE archives', (err, results) => {
        if (err) {
          console.error('❌ Erreur:', err.message);
        } else {
          console.table(results);
        }
        
        connection.end();
        console.log('\n✅ Migration terminée!');
        process.exit(0);
      });
    });
  });
});

