const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage',
  charset: 'utf8mb4'
};

async function checkColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    
    const [rows] = await connection.query('DESCRIBE users');
    console.log('\n📋 Colonnes de la table users:');
    console.log('─'.repeat(60));
    rows.forEach(r => {
      console.log(`✓ ${r.Field.padEnd(25)} ${r.Type.padEnd(20)} ${r.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Vérifier spécifiquement must_change_password
    const hasColumn = rows.some(r => r.Field === 'must_change_password');
    console.log('\n' + '─'.repeat(60));
    if (hasColumn) {
      console.log('✅ La colonne must_change_password existe !');
    } else {
      console.log('❌ La colonne must_change_password n\'existe pas');
    }
    
    // Vérifier quelques utilisateurs
    const [users] = await connection.query(
      'SELECT id, email, nom, prenom, must_change_password FROM users LIMIT 5'
    );
    
    if (users.length > 0) {
      console.log('\n📊 Exemples d\'utilisateurs:');
      console.log('─'.repeat(60));
      users.forEach(u => {
        console.log(`ID: ${u.id} | ${u.email} | must_change_password: ${u.must_change_password}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkColumn();




