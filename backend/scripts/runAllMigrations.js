const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../config.env') });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage',
  charset: 'utf8mb4'
};

async function checkTableExists(connection, tableName) {
  try {
    const [rows] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = ? AND table_name = ?`,
      [config.database, tableName]
    );
    return rows[0].count > 0;
  } catch (error) {
    return false;
  }
}

async function runAllMigrations() {
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('🔄 Starting database migrations...\n');
    
    // 1. Check/Create core tables (from init.sql - already handled by Docker)
    console.log('📊 Checking core tables...');
    const coreTables = [
      'users', 'news', 'financial_products', 'product_performances', 
      'partners', 'archives', 'simulators', 'user_sessions'
    ];
    
    for (const table of coreTables) {
      const exists = await checkTableExists(connection, table);
      console.log(`   ${exists ? '✅' : '⚠️ '} ${table} ${exists ? 'exists' : 'missing (will be created by init.sql)'}`);
    }
    
    // 2. Create bordereaux table if not exists
    console.log('\n📋 Creating bordereaux table...');
    const bordereauxExists = await checkTableExists(connection, 'bordereaux');
    if (!bordereauxExists) {
      const sqlPath = path.join(__dirname, 'createBordereauxTable.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await connection.query(sql);
      console.log('   ✅ bordereaux table created');
    } else {
      console.log('   ✅ bordereaux table already exists');
    }
    
    // 3. Create financial_documents table if not exists
    console.log('\n📄 Creating financial_documents table...');
    const financialDocsExists = await checkTableExists(connection, 'financial_documents');
    if (!financialDocsExists) {
      const { addFinancialDocumentsTable } = require('./addFinancialDocumentsTable');
      // We'll run it directly
      const createSQL = `
        CREATE TABLE IF NOT EXISTS financial_documents (
          id INT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          file_path VARCHAR(500) NOT NULL,
          file_size INT,
          file_type VARCHAR(50),
          category VARCHAR(100) NOT NULL,
          subcategory VARCHAR(100),
          year INT,
          uploaded_by INT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_category (category),
          INDEX idx_subcategory (subcategory),
          INDEX idx_year (year)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
      await connection.query(createSQL);
      console.log('   ✅ financial_documents table created');
    } else {
      console.log('   ✅ financial_documents table already exists');
    }
    
    // 4. Create cms_content table if not exists
    console.log('\n📝 Creating cms_content table...');
    const cmsExists = await checkTableExists(connection, 'cms_content');
    if (!cmsExists) {
      const sqlPath = path.join(__dirname, 'createCMSTable.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');
      await connection.query(sql);
      console.log('   ✅ cms_content table created');
    } else {
      console.log('   ✅ cms_content table already exists');
    }
    
    // 5. Create password_reset_requests table if not exists
    console.log('\n🔐 Checking password_reset_requests table...');
    const passwordResetExists = await checkTableExists(connection, 'password_reset_requests');
    if (!passwordResetExists) {
      const sqlPath = path.join(__dirname, 'addPasswordResetRequestsTable.sql');
      if (fs.existsSync(sqlPath)) {
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await connection.query(sql);
        console.log('   ✅ password_reset_requests table created');
      } else {
        // Create it manually
        const createSQL = `
          CREATE TABLE IF NOT EXISTS password_reset_requests (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            completed_at TIMESTAMP NULL,
            completed_by INT NULL,
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
            INDEX idx_token (token),
            INDEX idx_user_id (user_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;
        await connection.query(createSQL);
        console.log('   ✅ password_reset_requests table created');
      }
    } else {
      // Check if missing columns exist
      console.log('   ✅ password_reset_requests table exists, checking columns...');
      const [columns] = await connection.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'password_reset_requests'
      `, [config.database]);
      const columnNames = columns.map(c => c.COLUMN_NAME);
      
      if (!columnNames.includes('completed_at')) {
        await connection.query(`ALTER TABLE password_reset_requests ADD COLUMN completed_at TIMESTAMP NULL AFTER requested_at`);
        console.log('   ✅ Added completed_at column');
      }
      if (!columnNames.includes('completed_by')) {
        await connection.query(`ALTER TABLE password_reset_requests ADD COLUMN completed_by INT NULL AFTER completed_at`);
        await connection.query(`ALTER TABLE password_reset_requests ADD FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL`);
        console.log('   ✅ Added completed_by column');
      }
      if (!columnNames.includes('notes')) {
        await connection.query(`ALTER TABLE password_reset_requests ADD COLUMN notes TEXT AFTER completed_by`);
        console.log('   ✅ Added notes column');
      }
    }
    
    // 6. Check structured_products table (if it exists)
    console.log('\n📦 Checking structured_products table...');
    const structuredProductsExists = await checkTableExists(connection, 'structured_products');
    if (structuredProductsExists) {
      console.log('   ✅ structured_products table exists');
    } else {
      console.log('   ℹ️  structured_products table not found (may not be needed)');
    }
    
    console.log('\n🎉 All migrations completed successfully!');
    console.log(`📊 Database: ${config.database}`);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runAllMigrations();
}

module.exports = { runAllMigrations };

