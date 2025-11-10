const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function fixUsersRoleEnum() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL\n');

    // Vérifier la structure actuelle de la colonne role
    console.log('📋 Checking current role column definition...');
    const [columns] = await connection.query(`
      SELECT COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    if (columns.length > 0) {
      console.log('Current role column type:', columns[0].COLUMN_TYPE);
      console.log('Default value:', columns[0].COLUMN_DEFAULT);
      console.log('Nullable:', columns[0].IS_NULLABLE);
    }

    // Vérifier les valeurs actuellement utilisées
    console.log('\n📊 Checking existing role values...');
    const [existingRoles] = await connection.query(`
      SELECT DISTINCT role FROM users WHERE role IS NOT NULL
    `);
    console.log('Existing roles in database:', existingRoles.map(r => r.role));

    // Modifier la colonne role pour accepter les valeurs nécessaires
    console.log('\n🔧 Updating role column to accept: admin, user, broker...');
    
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'user', 'broker') NOT NULL DEFAULT 'user'
    `);
    
    console.log('✅ Role column updated successfully!');

    // Vérifier la nouvelle structure
    console.log('\n📋 Verifying new structure...');
    const [newColumns] = await connection.query(`
      SELECT COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    if (newColumns.length > 0) {
      console.log('New role column type:', newColumns[0].COLUMN_TYPE);
      console.log('Default value:', newColumns[0].COLUMN_DEFAULT);
    }

    await connection.end();
    console.log('\n✅ Database connection closed');
    console.log('\n✅ Role column fixed! You can now use: admin, user, or broker');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

fixUsersRoleEnum();

