const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function fixRoleEnumWithDataMigration() {
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

    // Étape 1: Vérifier les valeurs actuelles de role
    console.log('📊 Step 1: Checking current role values...');
    const [roles] = await connection.query(`
      SELECT DISTINCT role, COUNT(*) as count 
      FROM users 
      WHERE role IS NOT NULL 
      GROUP BY role
    `);
    
    console.log('Current role values in database:');
    console.table(roles);

    // Étape 2: Vérifier la structure actuelle de l'ENUM
    console.log('\n📋 Step 2: Checking current ENUM definition...');
    const [columnInfo] = await connection.query(`
      SELECT COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    if (columnInfo.length > 0) {
      console.log('Current role column type:', columnInfo[0].COLUMN_TYPE);
    }

    // Étape 3: Mettre à jour les valeurs invalides vers 'user' (valeur par défaut)
    console.log('\n🔧 Step 3: Updating invalid role values...');
    
    // Identifier les valeurs valides
    const validRoles = ['admin', 'user', 'broker'];
    
    // Pour chaque valeur qui n'est pas dans la liste valide, la remplacer par 'user'
    const [allRoles] = await connection.query(`
      SELECT DISTINCT role FROM users WHERE role IS NOT NULL
    `);
    
    let updateCount = 0;
    for (const row of allRoles) {
      const currentRole = row.role;
      // Normaliser (lowercase, trim)
      const normalizedRole = currentRole ? currentRole.toLowerCase().trim() : null;
      
      if (!normalizedRole || !validRoles.includes(normalizedRole)) {
        console.log(`⚠️  Found invalid role: "${currentRole}" -> updating to "user"`);
        
        // D'abord, convertir en VARCHAR temporaire pour permettre n'importe quelle valeur
        // Mais d'abord, on va juste mettre à jour directement les valeurs
        const [result] = await connection.query(
          'UPDATE users SET role = ? WHERE role = ?',
          ['user', currentRole]
        );
        updateCount += result.affectedRows;
        console.log(`   Updated ${result.affectedRows} user(s)`);
      } else if (normalizedRole !== currentRole) {
        // Normaliser la casse
        console.log(`🔧 Normalizing role: "${currentRole}" -> "${normalizedRole}"`);
        const [result] = await connection.query(
          'UPDATE users SET role = ? WHERE role = ?',
          [normalizedRole, currentRole]
        );
        updateCount += result.affectedRows;
      }
    }
    
    console.log(`\n✅ Updated ${updateCount} user(s) with invalid roles`);

    // Étape 4: Vérifier qu'il ne reste que des valeurs valides
    console.log('\n📊 Step 4: Verifying all roles are valid...');
    const [finalRoles] = await connection.query(`
      SELECT DISTINCT role, COUNT(*) as count 
      FROM users 
      WHERE role IS NOT NULL 
      GROUP BY role
    `);
    
    console.log('Final role values:');
    console.table(finalRoles);
    
    const invalidRoles = finalRoles.filter(r => !validRoles.includes(r.role.toLowerCase()));
    if (invalidRoles.length > 0) {
      console.error('❌ Still found invalid roles:', invalidRoles);
      throw new Error('Cannot proceed: invalid roles still exist');
    }

    // Étape 5: Modifier la colonne ENUM
    console.log('\n🔧 Step 5: Modifying role column ENUM...');
    
    // D'abord, convertir en VARCHAR temporaire pour éviter les problèmes
    console.log('   Converting to VARCHAR temporarily...');
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'
    `);
    console.log('   ✅ Converted to VARCHAR');
    
    // Ensuite, convertir en ENUM
    console.log('   Converting to ENUM...');
    await connection.query(`
      ALTER TABLE users 
      MODIFY COLUMN role ENUM('admin', 'user', 'broker') NOT NULL DEFAULT 'user'
    `);
    console.log('   ✅ Converted to ENUM');

    // Étape 6: Vérifier la nouvelle structure
    console.log('\n📋 Step 6: Verifying new structure...');
    const [newColumnInfo] = await connection.query(`
      SELECT COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'
    `, [process.env.DB_NAME || 'alliance_courtage']);
    
    if (newColumnInfo.length > 0) {
      console.log('New role column type:', newColumnInfo[0].COLUMN_TYPE);
      console.log('Default value:', newColumnInfo[0].COLUMN_DEFAULT);
      console.log('Nullable:', newColumnInfo[0].IS_NULLABLE);
    }

    await connection.end();
    console.log('\n✅ Migration completed successfully!');
    console.log('✅ Role column now accepts: admin, user, broker');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

fixRoleEnumWithDataMigration();

