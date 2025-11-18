const mysql = require('mysql2/promise');
const path = require('path');

// Charger la configuration depuis le dossier backend
const configPath = path.join(__dirname, '..', 'config.env');
require('dotenv').config({ path: configPath });

async function addCategoryColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'gnca_extranet'
    });

    console.log('🔌 Connexion à la base de données établie');

    // Vérifier si la colonne existe déjà
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'archives' 
      AND COLUMN_NAME = 'category'
    `, [process.env.DB_NAME || 'gnca_extranet']);

    if (columns.length > 0) {
      console.log('✅ La colonne category existe déjà dans la table archives');
    } else {
      // Ajouter la colonne category
      await connection.execute(`
        ALTER TABLE archives 
        ADD COLUMN category VARCHAR(100) DEFAULT 'Non classé' AFTER type
      `);
      
      console.log('✅ Colonne category ajoutée avec succès');
    }
    
    // Mettre à jour les bordereaux 2024 si le titre ou le nom de fichier contient "2024"
    const [updated] = await connection.execute(`
      UPDATE archives 
      SET category = 'Bordereaux 2024' 
      WHERE (title LIKE '%2024%' OR file_name LIKE '%2024%' OR description LIKE '%2024%')
      AND (category IS NULL OR category = 'Non classé' OR category = '')
    `);
    
    console.log(`✅ ${updated.affectedRows} archives mises à jour avec la catégorie "Bordereaux 2024"`);
    
    // Afficher les catégories existantes
    const [categories] = await connection.execute(`
      SELECT DISTINCT category, COUNT(*) as count 
      FROM archives 
      WHERE category IS NOT NULL 
      GROUP BY category 
      ORDER BY category
    `);
    
    console.log('\n📊 Catégories existantes :');
    categories.forEach(cat => {
      console.log(`   - ${cat.category}: ${cat.count} fichier(s)`);
    });
    
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ La colonne category existe déjà');
    } else {
      console.error('❌ Erreur:', error.message);
      console.error('Stack:', error.stack);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

addCategoryColumn();

