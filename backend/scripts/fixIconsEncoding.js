const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/config.env' });

async function fixIconsEncoding() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'alliance-courtage-mysql',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'alliance2024Secure',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connecté à la base de données');

    // Corrections pour chaque famille
    const corrections = {
      'epargne': { label: 'Épargne', icon: '💰' },
      'retraite': { label: 'Retraite', icon: '👴' },
      'prevoyance': { label: 'Prévoyance', icon: '🛡️' },
      'sante': { label: 'Santé', icon: '❤️' },
      'cif': { label: 'CIF', icon: '📊' }
    };

    console.log('\n🔧 Correction des labels et icônes...\n');

    for (const [value, data] of Object.entries(corrections)) {
      const [result] = await connection.execute(
        'UPDATE gamme_families SET label = ?, icon = ? WHERE value = ?',
        [data.label, data.icon, value]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✅ ${value.padEnd(12)} -> ${data.label.padEnd(15)} ${data.icon}`);
      } else {
        console.log(`⚠️  ${value.padEnd(12)} -> Famille non trouvée`);
      }
    }

    // Vérifier les résultats
    console.log('\n📊 Vérification des données corrigées:\n');
    const [families] = await connection.query(
      'SELECT value, label, icon, display_order FROM gamme_families ORDER BY display_order'
    );

    families.forEach(f => {
      console.log(`   ${f.icon}  ${f.label.padEnd(15)} (${f.value})`);
    });

    console.log('\n✅ Correction des icônes et labels terminée!');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixIconsEncoding();

