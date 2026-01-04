#!/usr/bin/env node

/**
 * Script pour ajouter la colonne date_strike à la table archives
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

  // Vérifier si la colonne existe déjà
  const checkColumnQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = ? 
    AND TABLE_NAME = 'archives' 
    AND COLUMN_NAME = 'date_strike'
  `;

  connection.query(checkColumnQuery, [dbConfig.database], (err, results) => {
    if (err) {
      console.error('❌ Erreur lors de la vérification:', err.message);
      connection.end();
      process.exit(1);
    }

    if (results.length > 0) {
      console.log('ℹ️  La colonne date_strike existe déjà dans archives!');
      console.log('✅ Aucune modification nécessaire');
      connection.end();
      process.exit(0);
    }

    // Ajouter la colonne
    console.log('📝 Ajout de la colonne date_strike à la table archives...');
    const alterQuery = 'ALTER TABLE archives ADD COLUMN date_strike DATE';

    connection.query(alterQuery, (err) => {
      if (err) {
        console.error('❌ Erreur lors de l\'ajout de la colonne:', err.message);
        connection.end();
        process.exit(1);
      }

      console.log('✅ Colonne date_strike ajoutée avec succès à archives!');

      // Vérifier la structure de la table
      console.log('\n📋 Structure de la table archives (nouvelles colonnes):');
      connection.query('DESCRIBE archives', (err, results) => {
        if (err) {
          console.error('❌ Erreur lors de la description:', err.message);
        } else {
          // Afficher seulement les colonnes pertinentes
          const relevantCols = results.filter(r => 
            ['montant_enveloppe', 'date_strike', 'assurance', 'category'].includes(r.Field)
          );
          console.table(relevantCols);
        }

        connection.end();
        console.log('\n✅ Terminé!');
        console.log('\n💡 Redémarrez votre backend pour que les changements prennent effet.');
        process.exit(0);
      });
    });
  });
});

