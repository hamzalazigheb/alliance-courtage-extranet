/**
 * Script pour nettoyer les familles vides/invalides de la base de données
 * Usage: node backend/scripts/cleanupEmptyFamilies.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

const mysql = require('mysql2/promise');

async function cleanupEmptyFamilies() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage'
  });

  try {
    console.log('🔍 Checking for empty/invalid families...\n');
    
    // Show all families before cleanup
    const [familiesBefore] = await connection.execute('SELECT * FROM gamme_families');
    console.log('📋 Families before cleanup:');
    familiesBefore.forEach(f => {
      const status = (!f.label || !f.label.trim() || !f.value || !f.value.trim()) ? '❌ INVALID' : '✅ Valid';
      console.log(`   ${status} - value: "${f.value}", label: "${f.label}"`);
    });
    console.log('');
    
    // Delete empty families
    const [result] = await connection.execute(`
      DELETE FROM gamme_families 
      WHERE label IS NULL 
         OR label = '' 
         OR TRIM(label) = ''
         OR value IS NULL 
         OR value = '' 
         OR TRIM(value) = ''
    `);
    
    console.log(`🧹 Deleted ${result.affectedRows} invalid families\n`);
    
    // Show remaining families
    const [familiesAfter] = await connection.execute('SELECT * FROM gamme_families ORDER BY display_order, label');
    console.log('📋 Families after cleanup:');
    familiesAfter.forEach(f => {
      console.log(`   ✅ value: "${f.value}", label: "${f.label}"`);
    });
    
    console.log(`\n✅ Done! ${familiesAfter.length} valid families remaining.`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

cleanupEmptyFamilies();

