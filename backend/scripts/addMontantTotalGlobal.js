const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../config.env' });

async function addMontantTotalGlobalColumn() {
  let connection;
  
  try {
    console.log('🔌 Connexion à MySQL...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage'
    });
    
    console.log('✅ Connexion réussie!');
    
    // Vérifier si la colonne existe déjà
    console.log('\n📋 Vérification de la colonne montant_total_global...');
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
        AND TABLE_NAME = 'archives' 
        AND COLUMN_NAME = 'montant_total_global'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    if (columns.length > 0) {
      console.log('✅ La colonne montant_total_global existe déjà dans la table archives');
    } else {
      console.log('⚠️  La colonne montant_total_global n\'existe pas, création...');
      
      // Ajouter la colonne
      await connection.query(`
        ALTER TABLE archives 
        ADD COLUMN montant_total_global DECIMAL(15,2) DEFAULT NULL
        COMMENT 'Montant total global du produit (tous assurances confondues)'
      `);
      
      console.log('✅ Colonne montant_total_global ajoutée avec succès!');
    }
    
    // Afficher la structure de la table
    console.log('\n📊 Structure de la table archives (colonnes montant):');
    const [structure] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = 'archives'
        AND COLUMN_NAME LIKE '%montant%'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    console.table(structure);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

addMontantTotalGlobalColumn();

