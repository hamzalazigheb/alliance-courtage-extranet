const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage',
  charset: 'utf8mb4'
};

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

async function emptyDatabase() {
  let connection;
  
  try {
    log('🔧 Connexion à la base de données...', 'cyan');
    connection = await mysql.createConnection(dbConfig);
    log('✅ Connecté à la base de données\n', 'green');

    log('⚠️  ATTENTION: Cette opération va VIDER toutes les données (sauf les admins)!', 'yellow');
    log('⚠️  Les tables suivantes seront vidées:', 'yellow');
    log('   - favoris, notifications, reglementaire_documents, reglementaire_folders', 'yellow');
    log('   - password_reset_requests, financial_documents, formations, bordereaux', 'yellow');
    log('   - product_reservations, archives, partners, product_performances', 'yellow');
    log('   - financial_products, news, user_sessions, cms_content, simulators\n', 'yellow');
    log('✅ Les utilisateurs admin seront conservés\n', 'green');

    // Désactiver les vérifications de clés étrangères
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    log('🔓 Vérifications de clés étrangères désactivées\n', 'cyan');

    // Liste des tables à vider
    const tablesToTruncate = [
      'favoris',
      'notifications',
      'reglementaire_documents',
      'reglementaire_folders',
      'password_reset_requests',
      'financial_documents',
      'formations',
      'bordereaux',
      'product_reservations',
      'archives',
      'partners',
      'product_performances',
      'financial_products',
      'news',
      'user_sessions',
      'cms_content',
      'simulators'
    ];

    log('🗑️  Vidage des tables...', 'cyan');
    for (const table of tablesToTruncate) {
      try {
        await connection.execute(`TRUNCATE TABLE ${table}`);
        log(`   ✅ ${table} vidée`, 'green');
      } catch (error) {
        // Si la table n'existe pas, ignorer l'erreur
        if (error.code !== 'ER_NO_SUCH_TABLE') {
          log(`   ⚠️  ${table}: ${error.message}`, 'yellow');
        } else {
          log(`   ⚠️  ${table}: table n'existe pas (ignorée)`, 'yellow');
        }
      }
    }

    log('\n👥 Suppression des utilisateurs non-admin...', 'cyan');
    const [result] = await connection.execute(
      'DELETE FROM users WHERE role != "admin"'
    );
    log(`✅ ${result.affectedRows} utilisateur(s) non-admin supprimé(s)`, 'green');

    // Réactiver les vérifications de clés étrangères
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    log('🔒 Vérifications de clés étrangères réactivées\n', 'cyan');

    // Vérifier les admins restants
    log('📋 Vérification des utilisateurs admin restants...', 'cyan');
    const [admins] = await connection.execute(
      'SELECT id, email, nom, prenom, role FROM users WHERE role = "admin"'
    );
    
    if (admins.length > 0) {
      log(`\n✅ ${admins.length} admin(s) trouvé(s):`, 'green');
      admins.forEach(admin => {
        log(`   - ${admin.email} (${admin.prenom} ${admin.nom})`, 'cyan');
      });
    } else {
      log('⚠️  Aucun admin trouvé!', 'yellow');
    }

    log('\n🎉 Base de données vidée avec succès!', 'green');
    log('✅ Seuls les admins restent dans la base de données.', 'green');

  } catch (error) {
    log(`\n❌ Erreur lors du vidage de la base de données: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log('\n🔌 Connexion fermée', 'cyan');
    }
  }
}

// Exécuter le script
emptyDatabase();


