const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function resetAdminPassword() {
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

    // New password to set
    const newPassword = 'admin123';

    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password
    await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, 'admin@alliance-courtage.fr']
    );

    console.log('\n✅ Admin password has been reset!');
    console.log('=====================================');
    console.log('Email: admin@alliance-courtage.fr');
    console.log(`Password: ${newPassword}`);
    console.log('\n🔐 You can now login with these credentials');

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetAdminPassword();



