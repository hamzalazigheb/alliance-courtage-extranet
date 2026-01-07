/**
 * Script pour corriger l'encodage UTF-8 des familles dans gamme_families
 * Usage: node backend/scripts/fixGammeFamiliesEncoding.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

const mysql = require('mysql2/promise');

async function fixEncoding() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage',
    charset: 'utf8mb4'
  });

  try {
    console.log('🔍 Checking gamme_families encoding...\n');
    
    // Vérifier l'encodage actuel de la table
    const [tableInfo] = await connection.execute(`
      SELECT TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'gamme_families'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    console.log('📋 Current table collation:', tableInfo[0]?.TABLE_COLLATION || 'Unknown');
    
    // Vérifier les données actuelles
    const [families] = await connection.execute('SELECT * FROM gamme_families ORDER BY display_order');
    
    console.log(`\n📊 Found ${families.length} families:\n`);
    families.forEach(f => {
      console.log(`  - value: "${f.value}", label: "${f.label}"`);
    });
    
    // Convertir la table en utf8mb4 si nécessaire
    console.log('\n🔧 Converting table to utf8mb4_unicode_ci...');
    await connection.execute(`
      ALTER TABLE gamme_families 
      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
    
    // Corriger les labels mal encodés
    console.log('\n🔧 Fixing encoding for known families...');
    
    const corrections = [
      { value: 'epargne', label: 'Épargne' },
      { value: 'retraite', label: 'Retraite' },
      { value: 'prevoyance', label: 'Prévoyance' },
      { value: 'sante', label: 'Santé' },
      { value: 'cif', label: 'CIF' }
    ];
    
    for (const correction of corrections) {
      await connection.execute(
        'UPDATE gamme_families SET label = ? WHERE value = ?',
        [correction.label, correction.value]
      );
      console.log(`  ✅ Fixed: ${correction.value} -> "${correction.label}"`);
    }
    
    // Vérifier les résultats
    const [updatedFamilies] = await connection.execute('SELECT * FROM gamme_families ORDER BY display_order');
    
    console.log('\n✅ Updated families:');
    updatedFamilies.forEach(f => {
      console.log(`  - value: "${f.value}", label: "${f.label}"`);
    });
    
    // Vérifier l'encodage final
    const [finalInfo] = await connection.execute(`
      SELECT TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'gamme_families'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    console.log(`\n✅ Final table collation: ${finalInfo[0]?.TABLE_COLLATION}`);
    console.log('\n✅ Encoding fix complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixEncoding();

