/**
 * Script pour corriger les produits avec des valeurs de famille vides
 * Extrait la famille du product_key et met à jour la colonne family
 * Usage: node backend/scripts/fixEmptyFamilyValues.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

const mysql = require('mysql2/promise');

async function fixEmptyFamilies() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage'
  });

  try {
    console.log('🔍 Checking for products with empty family values...\n');
    
    // Trouver les produits avec family vide ou NULL
    const [products] = await connection.execute(`
      SELECT id, product_key, family, client_type, product_name
      FROM gamme_products
      WHERE family IS NULL OR family = '' OR TRIM(COALESCE(family, '')) = ''
    `);
    
    if (products.length === 0) {
      console.log('✅ No products with empty family values found!');
      return;
    }
    
    console.log(`⚠️  Found ${products.length} product(s) with empty family values:\n`);
    
    let fixed = 0;
    let errors = 0;
    
    for (const product of products) {
      // Extraire la famille du product_key (format: clientType_family_productName)
      const parts = product.product_key.split('_');
      if (parts.length >= 3) {
        // La famille est le deuxième élément
        const extractedFamily = parts[1];
        
        if (extractedFamily && extractedFamily.trim()) {
          try {
            const [result] = await connection.execute(
              'UPDATE gamme_products SET family = ? WHERE id = ?',
              [extractedFamily.trim(), product.id]
            );
            if (result.affectedRows > 0) {
              console.log(`✅ Fixed product ${product.id}: ${product.product_key} -> family="${extractedFamily.trim()}"`);
              fixed++;
            } else {
              console.warn(`⚠️  No rows updated for product ${product.id}`);
            }
          } catch (error) {
            console.error(`❌ Error fixing product ${product.id}:`, error.message);
            errors++;
          }
        } else {
          console.warn(`⚠️  Could not extract family from product_key: ${product.product_key}`);
          errors++;
        }
      } else {
        console.warn(`⚠️  Invalid product_key format: ${product.product_key}`);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ❌ Errors: ${errors}`);
    
    // Vérifier qu'il ne reste plus de produits avec family vide
    const [remaining] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM gamme_products
      WHERE family IS NULL OR family = '' OR TRIM(family) = ''
    `);
    
    if (remaining[0].count === 0) {
      console.log(`\n✅ All products now have valid family values!`);
    } else {
      console.log(`\n⚠️  ${remaining[0].count} product(s) still have empty family values`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixEmptyFamilies();

