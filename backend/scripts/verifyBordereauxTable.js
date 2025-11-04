const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function verifyBordereauxTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL\n');
    console.log('🔍 Verifying bordereaux table structure...\n');

    // Check if table exists
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bordereaux'
    `, [process.env.DB_NAME || 'alliance_courtage']);

    if (tables.length === 0) {
      console.log('❌ Table bordereaux does not exist!');
      await connection.end();
      process.exit(1);
    }

    console.log('✅ Table bordereaux exists\n');

    // Get table structure
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bordereaux'
      ORDER BY ORDINAL_POSITION
    `, [process.env.DB_NAME || 'alliance_courtage']);

    console.log('📋 Table columns:');
    console.log('─'.repeat(80));
    columns.forEach(col => {
      const maxLength = col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : '';
      console.log(`  ${col.COLUMN_NAME.padEnd(20)} ${col.DATA_TYPE}${maxLength.padEnd(10)} ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('─'.repeat(80));

    // Check if file_content column exists
    const fileContentColumn = columns.find(col => col.COLUMN_NAME === 'file_content');
    if (fileContentColumn) {
      console.log('\n✅ file_content column exists');
      console.log(`   Type: ${fileContentColumn.DATA_TYPE}`);
    } else {
      console.log('\n❌ file_content column does NOT exist!');
      console.log('   Run: node scripts/addFileContentToBordereaux.js');
      await connection.end();
      process.exit(1);
    }

    await connection.end();
    console.log('\n✅ Database connection closed\n');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyBordereauxTable();

