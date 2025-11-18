const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Charger la configuration
function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.env');
  const config = {};
  
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  }
  
  return config;
}

async function listTables(connectionName, config) {
  try {
    console.log(`\n📊 ${connectionName}:`);
    console.log('='.repeat(80));
    
    const connection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: parseInt(config.port) || 3306,
      user: config.user || 'root',
      password: config.password || '',
      database: config.database || 'alliance_courtage'
    });
    
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]).sort();
    
    console.log(`Nombre de tables: ${tableNames.length}`);
    console.log('');
    console.log('Tables:');
    tableNames.forEach((table, index) => {
      console.log(`  ${(index + 1).toString().padStart(2)}. ${table}`);
    });
    
    // Afficher le nombre de lignes pour chaque table
    console.log('');
    console.log('Nombre de lignes par table:');
    for (const table of tableNames) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        const count = rows[0].count;
        console.log(`  ${table.padEnd(40)} ${count.toString().padStart(10)} lignes`);
      } catch (err) {
        console.log(`  ${table.padEnd(40)} (erreur: ${err.message})`);
      }
    }
    
    await connection.end();
    return tableNames;
  } catch (error) {
    console.error(`❌ Erreur de connexion à ${connectionName}:`, error.message);
    return [];
  }
}

async function main() {
  const localConfig = loadConfig();
  
  console.log('📋 Liste des tables - Base de données locale');
  console.log('='.repeat(80));
  
  const localTables = await listTables('LOCAL', {
    host: localConfig.DB_HOST || 'localhost',
    port: localConfig.DB_PORT || 3306,
    user: localConfig.DB_USER || 'root',
    password: localConfig.DB_PASSWORD || '',
    database: localConfig.DB_NAME || 'alliance_courtage'
  });
  
  console.log('');
  console.log('💡 Pour comparer avec la production, utilisez:');
  console.log('   node scripts/compareDatabases.js');
  console.log('   ou');
  console.log('   .\\scripts\\compareDatabases.ps1');
  console.log('');
}

main().catch(console.error);

