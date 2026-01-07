/**
 * Script pour créer la table gamme_families
 * Usage: node backend/scripts/createGammeFamiliesTable.js
 */

const mysql = require('mysql2/promise');
const path = require('path');

// Charger les variables d'environnement depuis config.env
try {
  require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });
} catch (e) {
  console.log('ℹ️  config.env non trouvé, utilisation des variables par défaut');
}

async function createGammeFamiliesTable() {
  console.log('🔌 Connexion à MySQL...');
  console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   User: ${process.env.DB_USER || 'root'}`);
  console.log(`   Database: ${process.env.DB_NAME || 'alliance_courtage'}`);
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alliance_courtage'
  });

  try {
    console.log('✅ Connexion réussie!\n');

    // Créer la table gamme_families
    console.log('📋 Création de la table gamme_families...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS gamme_families (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(100) NOT NULL UNIQUE,
        label VARCHAR(255) NOT NULL,
        icon VARCHAR(20) DEFAULT '📁',
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table gamme_families créée!\n');

    // Insérer les familles par défaut
    console.log('📦 Insertion des familles par défaut...');
    const defaultFamilies = [
      { value: 'epargne', label: 'Épargne', icon: '💰', display_order: 1 },
      { value: 'retraite', label: 'Retraite', icon: '👴', display_order: 2 },
      { value: 'prevoyance', label: 'Prévoyance', icon: '🛡️', display_order: 3 },
      { value: 'sante', label: 'Santé', icon: '❤️', display_order: 4 },
      { value: 'cif', label: 'CIF', icon: '📊', display_order: 5 }
    ];

    for (const family of defaultFamilies) {
      try {
        await connection.execute(
          `INSERT IGNORE INTO gamme_families (value, label, icon, display_order) VALUES (?, ?, ?, ?)`,
          [family.value, family.label, family.icon, family.display_order]
        );
        console.log(`   ✅ ${family.label} (${family.value})`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`   ⏭️  ${family.label} existe déjà`);
        } else {
          throw err;
        }
      }
    }

    // Afficher les familles
    console.log('\n📊 Familles dans la base de données:');
    const [rows] = await connection.execute('SELECT * FROM gamme_families ORDER BY display_order');
    console.table(rows);

    console.log('\n✅ ========================================');
    console.log('✅ Table gamme_families prête !');
    console.log('✅ ========================================\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    await connection.end();
    console.log('🔌 Connexion fermée');
  }
}

// Exécuter le script
createGammeFamiliesTable()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script échoué:', error);
    process.exit(1);
  });

