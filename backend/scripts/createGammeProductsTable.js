const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createGammeProductsTable() {
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
    
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'createGammeProductsTable.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('📋 Création de la table gamme_products...');
    await connection.query(sql);
    console.log('✅ Table gamme_products créée avec succès!');
    
    // Vérifier la structure
    const [rows] = await connection.query(`
      SHOW COLUMNS FROM gamme_products;
    `);
    
    console.log('📊 Structure de la table gamme_products:');
    console.table(rows);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

createGammeProductsTable();

