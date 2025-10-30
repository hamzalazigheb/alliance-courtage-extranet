const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config({ path: '../config.env' });

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage'
    });

    // Read and execute SQL
    const sql = fs.readFileSync(__dirname + '/createCMSTable.sql', 'utf8');
    await conn.query(sql);
    
    console.log('✅ CMS table created successfully');
    await conn.end();
  } catch (error) {
    console.error('❌ Error creating CMS table:', error.message);
    process.exit(1);
  }
})();


