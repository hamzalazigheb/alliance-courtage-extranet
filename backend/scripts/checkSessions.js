const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function checkSessions() {
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

    // Check sessions
    const [sessions] = await connection.query('SELECT * FROM user_sessions ORDER BY created_at DESC LIMIT 10');
    
    console.log('📊 Active Sessions:');
    console.log('=====================================');
    
    if (sessions.length === 0) {
      console.log('❌ No sessions found\n');
    } else {
      sessions.forEach(session => {
        console.log(`Token: ${session.token.substring(0, 20)}...`);
        console.log(`User ID: ${session.user_id}`);
        console.log(`Expires: ${session.expires_at}`);
        console.log(`Created: ${session.created_at}`);
        console.log('---');
      });
    }

    await connection.end();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkSessions();

