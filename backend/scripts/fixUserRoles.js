const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function fixUserRoles() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL\n');

    // Fix users with empty or null roles
    const [result] = await connection.query(
      `UPDATE users SET role = 'admin' WHERE role IS NULL OR role = ''`
    );
    
    console.log(`✅ Updated ${result.affectedRows} users with admin role\n`);

    // Verify
    const [users] = await connection.query('SELECT id, email, nom, prenom, role FROM users');
    
    console.log('📊 Users in Database:');
    console.log('=====================================');
    users.forEach(user => {
      console.log(`ID: ${user.id} | Email: ${user.email} | Name: ${user.nom} ${user.prenom} | Role: ${user.role}`);
    });

    await connection.end();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixUserRoles();

