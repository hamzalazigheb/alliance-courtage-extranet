const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function viewUsers() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL');

    const [users] = await connection.query(
      'SELECT id, email, nom, prenom, role, is_active FROM users'
    );

    console.log('\n📊 Users in Database:');
    console.log('=====================================');
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
    } else {
      users.forEach(user => {
        console.log(`\n👤 User ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Name: ${user.nom} ${user.prenom}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Active: ${user.is_active ? 'Yes' : 'No'}`);
      });
    }

    console.log('\n📝 Default Admin Credentials:');
    console.log('=====================================');
    console.log('Email: admin@alliance-courtage.fr');
    console.log('Password: password (default)');
    console.log('\n💡 If password doesn\'t work, you can reset it using bcrypt hash');

    await connection.end();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

viewUsers();



