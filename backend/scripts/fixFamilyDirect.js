const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });
const mysql = require('mysql2/promise');

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage'
  });

  try {
    // Update products with empty family by extracting from product_key
    const [result] = await connection.execute(`
      UPDATE gamme_products
      SET family = SUBSTRING_INDEX(SUBSTRING_INDEX(product_key, '_', 2), '_', -1)
      WHERE (family IS NULL OR family = '' OR TRIM(family) = '')
        AND product_key LIKE '%_%_%'
    `);
    
    console.log(`✅ Updated ${result.affectedRows} product(s)`);
    
    // Verify
    const [products] = await connection.execute(`
      SELECT id, product_key, family
      FROM gamme_products
      WHERE product_key LIKE '%fesfes%'
    `);
    
    console.log('\n📋 Products after fix:');
    products.forEach(p => {
      console.log(`  ID ${p.id}: ${p.product_key} -> family="${p.family}"`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

fix();

