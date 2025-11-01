const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

async function exportLocalDatabase() {
  console.log('📤 Export de la base de données locale...\n');

  try {
    // Lire la configuration depuis config.env
    const configEnvPath = path.join(__dirname, '../config.env');
    
    let dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'alliance_courtage'
    };

    // Essayer de lire config.env
    try {
      const configEnv = await fs.readFile(configEnvPath, 'utf8');
      configEnv.split('\n').forEach(line => {
        if (line.startsWith('DB_HOST=')) dbConfig.host = line.split('=')[1].trim();
        if (line.startsWith('DB_USER=')) dbConfig.user = line.split('=')[1].trim();
        if (line.startsWith('DB_PASSWORD=')) dbConfig.password = line.split('=')[1].trim();
        if (line.startsWith('DB_NAME=')) dbConfig.database = line.split('=')[1].trim();
      });
    } catch (error) {
      console.log('⚠️  config.env non trouvé, utilisation des valeurs par défaut');
    }

    console.log('📊 Configuration:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log('');

    // Nom du fichier de backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupFile = path.join(__dirname, `../backup_local_${timestamp}.sql`);

    console.log('⏳ Export en cours...');

    // Commande mysqldump
    const passwordArg = dbConfig.password ? `-p${dbConfig.password}` : '';
    const dumpCommand = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} ${passwordArg} ${dbConfig.database} > "${backupFile}"`;

    await execPromise(dumpCommand, {
      cwd: path.join(__dirname, '..'),
      shell: true
    });

    // Vérifier que le fichier existe
    const stats = await fs.stat(backupFile);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('');
    console.log('✅ Export réussi !');
    console.log(`📁 Fichier: ${backupFile}`);
    console.log(`📦 Taille: ${fileSizeMB} MB`);
    console.log('');
    console.log('📝 Prochaines étapes:');
    console.log('   1. Copiez ce fichier vers votre serveur');
    console.log('   2. Sur le serveur, exécutez:');
    console.log(`      docker exec -i alliance-courtage-mysql mysql -u root -p'VOTRE_PASSWORD' < backup_local_${timestamp}.sql`);
    console.log('');

  } catch (error) {
    console.error('');
    console.error('❌ Erreur lors de l\'export:', error.message);
    console.error('');
    console.log('💡 Essayez manuellement:');
    console.log('   mysqldump -u root -p alliance_courtage > backup_local.sql');
    console.log('');
    
    // Si c'est Windows, donner des instructions spécifiques
    if (process.platform === 'win32') {
      console.log('💡 Sur Windows, assurez-vous que mysqldump est dans votre PATH');
      console.log('   Ou utilisez MySQL Workbench → Data Export');
      console.log('');
    }
    
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  exportLocalDatabase();
}

module.exports = { exportLocalDatabase };

