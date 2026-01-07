/**
 * Quick script to check products directly
 */
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
    const [products] = await connection.execute(`
      SELECT id, product_key, family, client_type, product_name
      FROM gamme_products
      WHERE product_key LIKE '%fesfes%'
    `);
    
    console.log(`Found ${products.length} products with "fesfes":\n`);
    products.forEach(p => {
      console.log(`ID: ${p.id} | Key: ${p.product_key} | Family: "${p.family}" | Client: ${p.client_type}`);
    });
    
    const [files] = await connection.execute(`
      SELECT gpf.id, gpf.product_key, gpf.file_name, gp.family
      FROM gamme_product_files gpf
      JOIN gamme_products gp ON gpf.product_key = gp.product_key
      WHERE gp.product_key LIKE '%fesfes%'
    `);
    
    console.log(`\nFound ${files.length} files for these products:`);
    files.forEach(f => {
      console.log(`  - ${f.file_name} (product_key: ${f.product_key}, family: "${f.family}")`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

check();

