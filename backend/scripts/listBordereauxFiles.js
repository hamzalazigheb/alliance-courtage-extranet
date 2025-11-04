const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../config.env' });

async function listBordereauxFiles() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connected to MySQL\n');
    console.log('📋 LISTE DE TOUS LES BORDEREAUX DANS LA TABLE BORDEREAUX\n');
    console.log('═'.repeat(100));

    // Récupérer tous les bordereaux
    const [bordereaux] = await connection.query(`
      SELECT 
        b.id,
        b.title,
        b.description,
        b.file_path,
        b.file_size,
        b.file_type,
        b.period_month,
        b.period_year,
        b.uploaded_by,
        b.created_at,
        u.nom as user_nom,
        u.prenom as user_prenom,
        u.email as user_email,
        uploader.nom as uploaded_by_nom,
        uploader.prenom as uploaded_by_prenom,
        uploader.email as uploaded_by_email
      FROM bordereaux b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN users uploader ON b.uploaded_by = uploader.id
      ORDER BY b.created_at DESC
    `);

    if (bordereaux.length === 0) {
      console.log('❌ Aucun bordereau trouvé dans la table bordereaux');
    } else {
      console.log(`\n📊 Total: ${bordereaux.length} bordereau(x)\n`);
      console.log('─'.repeat(100));
      
      bordereaux.forEach((bord, index) => {
        console.log(`\n${index + 1}. ID: ${bord.id}`);
        console.log(`   📄 Titre: ${bord.title || 'N/A'}`);
        console.log(`   📝 Description: ${bord.description || 'N/A'}`);
        console.log(`   📂 Chemin: ${bord.file_path}`);
        console.log(`   💾 Taille: ${bord.file_size ? (bord.file_size / 1024).toFixed(2) + ' KB' : 'N/A'}`);
        console.log(`   🏷️  Type: ${bord.file_type || 'N/A'}`);
        console.log(`   👤 Destinataire: ${bord.user_prenom || ''} ${bord.user_nom || ''} (${bord.user_email || 'N/A'}) [ID: ${bord.user_id}]`);
        if (bord.period_year) {
          const monthName = bord.period_month ? 
            new Date(2000, bord.period_month - 1).toLocaleString('fr-FR', { month: 'long' }) : 'N/A';
          console.log(`   📅 Période: ${monthName} ${bord.period_year}`);
        }
        console.log(`   👤 Uploadé par: ${bord.uploaded_by_prenom || ''} ${bord.uploaded_by_nom || ''} (${bord.uploaded_by_email || 'N/A'}) [ID: ${bord.uploaded_by}]`);
        console.log(`   🕒 Date de création: ${bord.created_at ? new Date(bord.created_at).toLocaleString('fr-FR') : 'N/A'}`);
        console.log('─'.repeat(100));
      });

      // Statistiques
      console.log('\n\n📊 STATISTIQUES\n');
      console.log('─'.repeat(100));
      
      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT user_id) as total_users,
          COUNT(DISTINCT uploaded_by) as total_uploaders,
          SUM(file_size) as total_size,
          AVG(file_size) as avg_size
        FROM bordereaux
      `);

      const stat = stats[0];
      console.log(`   Total bordereaux: ${stat.total}`);
      console.log(`   Total destinataires: ${stat.total_users}`);
      console.log(`   Total uploaders: ${stat.total_uploaders}`);
      console.log(`   Taille totale: ${stat.total_size ? (stat.total_size / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB'}`);
      console.log(`   Taille moyenne: ${stat.avg_size ? (stat.avg_size / 1024).toFixed(2) + ' KB' : '0 KB'}`);

      // Par utilisateur
      const [byUser] = await connection.query(`
        SELECT 
          u.id,
          u.nom,
          u.prenom,
          u.email,
          COUNT(*) as count
        FROM bordereaux b
        LEFT JOIN users u ON b.user_id = u.id
        GROUP BY u.id, u.nom, u.prenom, u.email
        ORDER BY count DESC
      `);

      if (byUser.length > 0) {
        console.log('\n   👥 Par destinataire:');
        byUser.forEach(user => {
          console.log(`      - ${user.prenom || ''} ${user.nom || ''} (${user.email || 'N/A'}): ${user.count} bordereau(x)`);
        });
      }

      // Par année
      const [byYear] = await connection.query(`
        SELECT period_year, COUNT(*) as count
        FROM bordereaux
        WHERE period_year IS NOT NULL
        GROUP BY period_year
        ORDER BY period_year DESC
      `);

      if (byYear.length > 0) {
        console.log('\n   📅 Par année:');
        byYear.forEach(yr => {
          console.log(`      - ${yr.period_year}: ${yr.count} bordereau(x)`);
        });
      }

      // Par mois
      const [byMonth] = await connection.query(`
        SELECT period_month, period_year, COUNT(*) as count
        FROM bordereaux
        WHERE period_month IS NOT NULL AND period_year IS NOT NULL
        GROUP BY period_month, period_year
        ORDER BY period_year DESC, period_month DESC
      `);

      if (byMonth.length > 0) {
        console.log('\n   📆 Par mois/année:');
        byMonth.forEach(m => {
          const monthName = new Date(2000, m.period_month - 1).toLocaleString('fr-FR', { month: 'long' });
          console.log(`      - ${monthName} ${m.period_year}: ${m.count} bordereau(x)`);
        });
      }
    }

    await connection.end();
    console.log('\n✅ Database connection closed\n');
  } catch (error) {
    console.error('❌ Error listing bordereaux:', error);
    process.exit(1);
  }
}

listBordereauxFiles();

