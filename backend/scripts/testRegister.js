const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function testRegister() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL\n');

    // Vérifier la structure de la table users
    console.log('📋 Checking users table structure...');
    const [columns] = await connection.query('DESCRIBE users');
    console.log('\nTable users columns:');
    console.table(columns);

    // Vérifier les contraintes
    console.log('\n🔍 Checking table constraints...');
    const [constraints] = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    if (constraints.length > 0) {
      console.table(constraints);
    } else {
      console.log('No constraints found');
    }

    // Test INSERT avec des valeurs de test
    console.log('\n🧪 Testing INSERT query...');
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = '$2a$10$testHash1234567890123456789012345678901234567890123456789012'; // bcrypt hash fictif
    
    try {
      const [result] = await connection.query(
        'INSERT INTO users (email, password, nom, prenom, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [testEmail, testPassword, 'Test', 'User', 'user', true]
      );
      console.log('✅ Test INSERT successful!');
      console.log('   Insert ID:', result.insertId);
      
      // Nettoyer - supprimer l'utilisateur de test
      await connection.query('DELETE FROM users WHERE email = ?', [testEmail]);
      console.log('✅ Test user cleaned up');
      
    } catch (insertError) {
      console.error('❌ Test INSERT failed!');
      console.error('Error code:', insertError.code);
      console.error('Error message:', insertError.message);
      console.error('Error SQL state:', insertError.sqlState);
      console.error('Full error:', insertError);
      
      // Vérifier si c'est un problème de colonne manquante
      if (insertError.code === 'ER_BAD_FIELD_ERROR') {
        console.error('\n⚠️  Column missing! Check if all required columns exist.');
      }
      
      // Vérifier si c'est un problème de valeur par défaut
      if (insertError.code === 'ER_NO_DEFAULT_FOR_FIELD') {
        console.error('\n⚠️  Default value missing! Check if all NOT NULL columns have defaults.');
      }
    }

    // Vérifier les valeurs par défaut
    console.log('\n📊 Checking default values and NULL constraints...');
    const [defaults] = await connection.query(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        EXTRA
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    console.table(defaults);

    await connection.end();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

testRegister();

