const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });
const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage'
  });

  try {
    const [structure] = await connection.execute('DESCRIBE gamme_products');
    console.log('📋 Table structure:');
    structure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null} ${col.Key} ${col.Default}`);
    });
    
    // Try a direct update with explicit value
    console.log('\n🔧 Trying direct update...');
    const [result] = await connection.execute(
      'UPDATE gamme_products SET family = ? WHERE id = ?',
      ['fesfes', 37]
    );
    console.log(`Updated ${result.affectedRows} row(s)`);
    
    // Check immediately
    const [check] = await connection.execute(
      'SELECT id, product_key, family FROM gamme_products WHERE id = 37'
    );
    console.log(`After update: ID ${check[0].id}, family="${check[0].family}" (length: ${check[0].family ? check[0].family.length : 'null'})`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

check();

