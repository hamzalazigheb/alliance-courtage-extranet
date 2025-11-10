const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../config.env') });
const { query } = require('../config/database');

async function run() {
  const sqlPath = path.join(__dirname, 'createBordereauxTable.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await query(sql);
  console.log('✅ Table bordereaux created or already exists');
  process.exit(0);
}

run().catch((e) => {
  console.error('❌ Failed to create bordereaux table:', e);
  process.exit(1);
});


