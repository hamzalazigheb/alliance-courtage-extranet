const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDatabase() {
  log('\n🗄️  Testing Database Structure\n', 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage'
    });

    log('✅ Connected to MySQL database\n', 'green');

    // Test 1: Check all required tables
    log('📋 Checking Required Tables...\n', 'blue');
    const requiredTables = [
      'users',
      'structured_products',
      'product_reservations',
      'assurances',
      'bordereaux',
      'formations',
      'archives',
      'financial_documents',
      'partners',
      'password_reset_requests',
      'cms_content',
      'reglementaire_folders',
      'reglementaire_documents',
      'notifications',
      'favoris'
    ];

    let tablesFound = 0;
    let tablesMissing = [];

    for (const table of requiredTables) {
      try {
        const [rows] = await connection.query(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          log(`✅ Table ${table} exists`, 'green');
          tablesFound++;
        } else {
          log(`❌ Table ${table} does NOT exist`, 'red');
          tablesMissing.push(table);
        }
      } catch (err) {
        log(`⚠️  Error checking table ${table}: ${err.message}`, 'yellow');
      }
    }

    log(`\n📊 Tables: ${tablesFound}/${requiredTables.length} found\n`, 'cyan');

    // Test 2: Check table structures
    log('🔍 Checking Table Structures...\n', 'blue');
    const tablesToCheck = ['users', 'favoris', 'notifications', 'structured_products'];
    
    for (const table of tablesToCheck) {
      try {
        const [rows] = await connection.query(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          const [columns] = await connection.query(`DESCRIBE ${table}`);
          log(`\n📋 Table: ${table}`, 'cyan');
          columns.forEach(col => {
            log(`   - ${col.Field} (${col.Type})`, 'blue');
          });
        }
      } catch (err) {
        log(`⚠️  Error describing table ${table}: ${err.message}`, 'yellow');
      }
    }

    // Test 3: Check foreign keys
    log('\n🔗 Checking Foreign Keys...\n', 'blue');
    try {
      const [fkRows] = await connection.query(`
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = ?
        AND REFERENCED_TABLE_NAME IS NOT NULL
      `, [process.env.DB_NAME || 'alliance_courtage']);

      if (fkRows.length > 0) {
        log(`✅ Found ${fkRows.length} foreign key(s):`, 'green');
        fkRows.forEach(fk => {
          log(`   - ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`, 'blue');
        });
      } else {
        log('⚠️  No foreign keys found', 'yellow');
      }
    } catch (err) {
      log(`⚠️  Error checking foreign keys: ${err.message}`, 'yellow');
    }

    // Test 4: Check indexes
    log('\n📑 Checking Indexes...\n', 'blue');
    const tablesWithIndexes = ['favoris', 'notifications', 'users'];
    
    for (const table of tablesWithIndexes) {
      try {
        const [rows] = await connection.query(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          const [indexes] = await connection.query(`SHOW INDEXES FROM ${table}`);
          if (indexes.length > 0) {
            log(`\n📋 Indexes for ${table}:`, 'cyan');
            const uniqueIndexes = [...new Set(indexes.map(idx => idx.Key_name))];
            uniqueIndexes.forEach(idxName => {
              const isUnique = indexes.find(idx => idx.Key_name === idxName && idx.Non_unique === 0);
              log(`   - ${idxName} ${isUnique ? '(UNIQUE)' : ''}`, 'blue');
            });
          }
        }
      } catch (err) {
        log(`⚠️  Error checking indexes for ${table}: ${err.message}`, 'yellow');
      }
    }

    // Test 5: Check data integrity
    log('\n🔍 Checking Data Integrity...\n', 'blue');
    try {
      // Check for orphaned records
      const [orphaned] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM favoris f 
        LEFT JOIN users u ON f.user_id = u.id 
        WHERE u.id IS NULL
      `);
      
      if (orphaned[0].count > 0) {
        log(`⚠️  Found ${orphaned[0].count} orphaned favoris records`, 'yellow');
      } else {
        log('✅ No orphaned favoris records', 'green');
      }
    } catch (err) {
      log(`⚠️  Error checking data integrity: ${err.message}`, 'yellow');
    }

    // Summary
    log('\n' + '='.repeat(60), 'cyan');
    if (tablesMissing.length === 0) {
      log('\n🎉 All database tests passed!\n', 'green');
    } else {
      log(`\n⚠️  ${tablesMissing.length} table(s) missing: ${tablesMissing.join(', ')}\n`, 'yellow');
    }

    await connection.end();
    log('✅ Database connection closed\n', 'green');

  } catch (error) {
    log(`\n❌ Database test failed: ${error.message}\n`, 'red');
    console.error(error);
    process.exit(1);
  }
}

testDatabase();

