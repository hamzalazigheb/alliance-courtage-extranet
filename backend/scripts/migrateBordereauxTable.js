const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function migrateBordereauxTable() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');

    // Vérifier si la colonne archive_id existe
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bordereaux' AND COLUMN_NAME = 'archive_id'
    `, [process.env.DB_NAME || 'alliance_courtage']);

    if (columns.length > 0) {
      console.log('🔄 Migrating bordereaux table structure...');
      
      // Supprimer la clé étrangère archive_id si elle existe
      try {
        await connection.query('ALTER TABLE bordereaux DROP FOREIGN KEY fk_bordereaux_archive');
        console.log('✅ Dropped foreign key fk_bordereaux_archive');
      } catch (e) {
        console.log('⚠️ Foreign key may not exist:', e.message);
      }
      
      // Supprimer la colonne archive_id
      await connection.query('ALTER TABLE bordereaux DROP COLUMN archive_id');
      console.log('✅ Dropped archive_id column');
    }

    // Ajouter les nouvelles colonnes si elles n'existent pas
    const [newColumns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bordereaux'
    `, [process.env.DB_NAME || 'alliance_courtage']);

    const columnNames = newColumns.map(c => c.COLUMN_NAME);

    if (!columnNames.includes('title')) {
      await connection.query('ALTER TABLE bordereaux ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT "" AFTER user_id');
      console.log('✅ Added title column');
    }

    if (!columnNames.includes('description')) {
      await connection.query('ALTER TABLE bordereaux ADD COLUMN description TEXT AFTER title');
      console.log('✅ Added description column');
    }

    if (!columnNames.includes('file_path')) {
      await connection.query('ALTER TABLE bordereaux ADD COLUMN file_path VARCHAR(500) NOT NULL AFTER description');
      console.log('✅ Added file_path column');
    }

    if (!columnNames.includes('file_size')) {
      await connection.query('ALTER TABLE bordereaux ADD COLUMN file_size BIGINT AFTER file_path');
      console.log('✅ Added file_size column');
    }

    if (!columnNames.includes('file_type')) {
      await connection.query('ALTER TABLE bordereaux ADD COLUMN file_type VARCHAR(100) AFTER file_size');
      console.log('✅ Added file_type column');
    }

    if (!columnNames.includes('uploaded_by')) {
      await connection.query('ALTER TABLE bordereaux ADD COLUMN uploaded_by INT NOT NULL COMMENT "Admin who uploaded the file" AFTER period_year');
      console.log('✅ Added uploaded_by column');
      
      // Add foreign key separately, may fail if it already exists
      try {
        await connection.query('ALTER TABLE bordereaux ADD CONSTRAINT fk_bordereaux_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE');
        console.log('✅ Added uploaded_by foreign key');
      } catch (e) {
        console.log('⚠️ Foreign key may already exist or error:', e.message);
      }
    }

    if (!columnNames.includes('updated_at')) {
      await connection.query('ALTER TABLE bordereaux ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at');
      console.log('✅ Added updated_at column');
    }

    // Renommer label en title si label existe et title n'a pas de valeurs
    if (columnNames.includes('label') && !columnNames.includes('title')) {
      await connection.query('ALTER TABLE bordereaux CHANGE label title VARCHAR(255) NOT NULL');
      console.log('✅ Renamed label to title');
    }

    console.log('✅ bordereaux table migration completed successfully');

    await connection.end();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('❌ Error migrating table:', error);
    process.exit(1);
  }
}

migrateBordereauxTable();

