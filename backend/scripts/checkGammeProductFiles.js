/**
 * Script pour vérifier les fichiers des produits gamme
 * Usage: node backend/scripts/checkGammeProductFiles.js [family_name]
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

const mysql = require('mysql2/promise');

async function checkFiles(familyFilter = null) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage'
  });

  try {
    console.log('🔍 Checking gamme product files...\n');
    
    let query = `
      SELECT 
        gpf.id as file_id,
        gpf.product_key,
        gpf.file_name,
        gpf.file_size,
        gpf.file_type,
        gpf.display_order,
        gpf.created_at as file_created,
        gp.id as product_id,
        gp.family,
        gp.client_type,
        gp.product_name
      FROM gamme_product_files gpf
      JOIN gamme_products gp ON gpf.product_key = gp.product_key
    `;
    
    const params = [];
    if (familyFilter) {
      query += ' WHERE gp.family = ?';
      params.push(familyFilter);
    }
    
    query += ' ORDER BY gp.family, gp.client_type, gp.product_name, gpf.display_order';
    
    const [files] = await connection.execute(query, params);
    
    if (files.length === 0) {
      console.log(`❌ No files found${familyFilter ? ` for family "${familyFilter}"` : ''}`);
      
      // Check if products exist
      let productQuery = 'SELECT COUNT(*) as count FROM gamme_products';
      const productParams = [];
      if (familyFilter) {
        productQuery += ' WHERE family = ?';
        productParams.push(familyFilter);
      }
      const [productCount] = await connection.execute(productQuery, productParams);
      console.log(`📊 Products in database: ${productCount[0].count}`);
      
      if (productCount[0].count > 0) {
        console.log('\n⚠️  Products exist but have no files attached!');
      }
    } else {
      console.log(`✅ Found ${files.length} file(s)${familyFilter ? ` for family "${familyFilter}"` : ''}:\n`);
      
      // Group by product
      const byProduct = {};
      files.forEach(file => {
        const key = file.product_key;
        if (!byProduct[key]) {
          byProduct[key] = {
            product_key: key,
            product_id: file.product_id,
            family: file.family,
            client_type: file.client_type,
            product_name: file.product_name,
            files: []
          };
        }
        byProduct[key].files.push({
          id: file.file_id,
          name: file.file_name,
          size: file.file_size,
          type: file.file_type,
          order: file.display_order
        });
      });
      
      // Display grouped results
      Object.values(byProduct).forEach(product => {
        console.log(`\n📦 Product: ${product.product_key}`);
        console.log(`   ID: ${product.product_id} | Family: ${product.family} | Client: ${product.client_type}`);
        console.log(`   Files (${product.files.length}):`);
        product.files.forEach(file => {
          const sizeKB = (file.size / 1024).toFixed(2);
          console.log(`      - ${file.name} (${sizeKB} KB, ${file.type})`);
        });
      });
      
      // Summary by family
      console.log('\n📊 Summary by family:');
      const byFamily = {};
      files.forEach(file => {
        if (!byFamily[file.family]) {
          byFamily[file.family] = { products: new Set(), files: 0 };
        }
        byFamily[file.family].products.add(file.product_key);
        byFamily[file.family].files++;
      });
      
      Object.entries(byFamily).forEach(([family, data]) => {
        console.log(`   ${family}: ${data.products.size} product(s), ${data.files} file(s)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

const familyFilter = process.argv[2] || null;
checkFiles(familyFilter);
