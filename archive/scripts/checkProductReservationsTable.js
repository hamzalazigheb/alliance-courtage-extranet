const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function checkProductReservationsTable() {
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

    // Check if table exists
    const [tables] = await connection.query(
      `SELECT TABLE_NAME 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_reservations'`,
      [process.env.DB_NAME || 'alliance_courtage']
    );

    if (tables.length === 0) {
      console.log('❌ Table product_reservations does not exist!');
      console.log('📋 Please run: node scripts/addProductReservationsTable.js');
    } else {
      console.log('✅ Table product_reservations exists');
      
      // Show table structure
      const [columns] = await connection.query(
        `DESCRIBE product_reservations`
      );
      console.log('\n📊 Table structure:');
      console.table(columns);
    }

    await connection.end();
    console.log('\n✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('❌ Table does not exist!');
      console.log('📋 Please run: node scripts/addProductReservationsTable.js');
    }
    process.exit(1);
  }
}

checkProductReservationsTable();


