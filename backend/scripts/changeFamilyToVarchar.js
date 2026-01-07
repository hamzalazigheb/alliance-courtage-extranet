/**
 * Change the family column from ENUM to VARCHAR to support dynamic families
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });
const mysql = require('mysql2/promise');

async function changeFamilyColumn() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage'
  });

  try {
    console.log('🔧 Changing family column from ENUM to VARCHAR...\n');
    
    // Change the column type
    await connection.execute(`
      ALTER TABLE gamme_products 
      MODIFY COLUMN family VARCHAR(100) NOT NULL COMMENT 'Famille de produit (dynamique)'
    `);
    
    console.log('✅ Column type changed successfully!\n');
    
    // Now fix the empty family values
    console.log('🔧 Fixing empty family values...\n');
    const [result] = await connection.execute(`
      UPDATE gamme_products
      SET family = SUBSTRING_INDEX(SUBSTRING_INDEX(product_key, '_', 2), '_', -1)
      WHERE (family IS NULL OR family = '' OR TRIM(family) = '')
        AND product_key LIKE '%_%_%'
    `);
    
    console.log(`✅ Fixed ${result.affectedRows} product(s)\n`);
    
    // Verify
    const [products] = await connection.execute(`
      SELECT id, product_key, family
      FROM gamme_products
      WHERE product_key LIKE '%fesfes%'
      ORDER BY id
    `);
    
    console.log('📋 Products after fix:');
    products.forEach(p => {
      console.log(`  ID ${p.id}: ${p.product_key} -> family="${p.family}"`);
    });
    
    // Check table structure
    const [structure] = await connection.execute('DESCRIBE gamme_products');
    const familyCol = structure.find(col => col.Field === 'family');
    console.log(`\n✅ Family column type: ${familyCol.Type}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

changeFamilyColumn();

