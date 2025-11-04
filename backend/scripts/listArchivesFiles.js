const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../config.env' });

async function listArchivesFiles() {
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
    console.log('📁 LISTE DE TOUS LES FICHIERS DANS LA TABLE ARCHIVES\n');
    console.log('═'.repeat(100));

    // Récupérer tous les fichiers
    const [files] = await connection.query(`
      SELECT 
        a.id,
        a.title,
        a.description,
        a.file_path,
        a.file_size,
        a.file_type,
        a.category,
        a.year,
        a.uploaded_by,
        a.created_at,
        u.nom as uploaded_by_nom,
        u.prenom as uploaded_by_prenom,
        u.email as uploaded_by_email
      FROM archives a
      LEFT JOIN users u ON a.uploaded_by = u.id
      ORDER BY a.created_at DESC
    `);

    if (files.length === 0) {
      console.log('❌ Aucun fichier trouvé dans la table archives');
    } else {
      console.log(`\n📊 Total: ${files.length} fichier(s)\n`);
      console.log('─'.repeat(100));
      
      files.forEach((file, index) => {
        console.log(`\n${index + 1}. ID: ${file.id}`);
        console.log(`   📄 Titre: ${file.title || 'N/A'}`);
        console.log(`   📝 Description: ${file.description || 'N/A'}`);
        console.log(`   📂 Chemin: ${file.file_path}`);
        console.log(`   💾 Taille: ${file.file_size ? (file.file_size / 1024).toFixed(2) + ' KB' : 'N/A'}`);
        console.log(`   🏷️  Type: ${file.file_type || 'N/A'}`);
        console.log(`   📁 Catégorie: ${file.category || 'N/A'}`);
        console.log(`   📅 Année: ${file.year || 'N/A'}`);
        console.log(`   👤 Uploadé par: ${file.uploaded_by_prenom || ''} ${file.uploaded_by_nom || ''} (${file.uploaded_by_email || 'N/A'}) [ID: ${file.uploaded_by}]`);
        console.log(`   🕒 Date de création: ${file.created_at ? new Date(file.created_at).toLocaleString('fr-FR') : 'N/A'}`);
        console.log('─'.repeat(100));
      });

      // Statistiques
      console.log('\n\n📊 STATISTIQUES\n');
      console.log('─'.repeat(100));
      
      const [stats] = await connection.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT uploaded_by) as total_uploaders,
          COUNT(DISTINCT category) as total_categories,
          SUM(file_size) as total_size,
          AVG(file_size) as avg_size
        FROM archives
      `);

      const stat = stats[0];
      console.log(`   Total fichiers: ${stat.total}`);
      console.log(`   Total uploaders: ${stat.total_uploaders}`);
      console.log(`   Total catégories: ${stat.total_categories}`);
      console.log(`   Taille totale: ${stat.total_size ? (stat.total_size / (1024 * 1024)).toFixed(2) + ' MB' : '0 MB'}`);
      console.log(`   Taille moyenne: ${stat.avg_size ? (stat.avg_size / 1024).toFixed(2) + ' KB' : '0 KB'}`);

      // Par catégorie
      const [byCategory] = await connection.query(`
        SELECT category, COUNT(*) as count
        FROM archives
        WHERE category IS NOT NULL
        GROUP BY category
        ORDER BY count DESC
      `);

      if (byCategory.length > 0) {
        console.log('\n   📁 Par catégorie:');
        byCategory.forEach(cat => {
          console.log(`      - ${cat.category || 'Non catégorisé'}: ${cat.count} fichier(s)`);
        });
      }

      // Par année
      const [byYear] = await connection.query(`
        SELECT year, COUNT(*) as count
        FROM archives
        WHERE year IS NOT NULL
        GROUP BY year
        ORDER BY year DESC
      `);

      if (byYear.length > 0) {
        console.log('\n   📅 Par année:');
        byYear.forEach(yr => {
          console.log(`      - ${yr.year}: ${yr.count} fichier(s)`);
        });
      }
    }

    await connection.end();
    console.log('\n✅ Database connection closed\n');
  } catch (error) {
    console.error('❌ Error listing archives:', error);
    process.exit(1);
  }
}

listArchivesFiles();

