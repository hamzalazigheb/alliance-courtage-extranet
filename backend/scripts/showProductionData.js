const mysql = require('mysql2/promise');
const readline = require('readline');

// Configuration pour se connecter au conteneur MySQL de production
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage'
};

// Demander le mot de passe si non fourni
async function getPassword() {
  if (config.password) {
    return config.password;
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Mot de passe MySQL (ou Entrée si vide): ', (password) => {
      rl.close();
      resolve(password || '');
    });
  });
}

async function getTables(connection) {
  const [tables] = await connection.execute('SHOW TABLES');
  return tables.map(row => Object.values(row)[0]);
}

async function getTableRowCount(connection, tableName) {
  try {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
    return rows[0].count;
  } catch (error) {
    return -1;
  }
}

async function getTableData(connection, tableName, limit = 10) {
  try {
    const [rows] = await connection.execute(`SELECT * FROM ${tableName} LIMIT ${limit}`);
    return rows;
  } catch (error) {
    return null;
  }
}

async function showTableStructure(connection, tableName) {
  try {
    const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
    return columns;
  } catch (error) {
    return null;
  }
}

async function main() {
  try {
    console.log('🔍 Connexion à la base de données de production...');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log('');
    
    const password = await getPassword();
    config.password = password;
    
    const connection = await mysql.createConnection(config);
    console.log('✅ Connecté à la base de données');
    console.log('');
    
    // Récupérer toutes les tables
    console.log('📊 Récupération des tables...');
    const tables = await getTables(connection);
    console.log(`✅ ${tables.length} tables trouvées`);
    console.log('');
    
    // Afficher le résumé
    console.log('='.repeat(80));
    console.log('📋 RÉSUMÉ DES TABLES');
    console.log('='.repeat(80));
    console.log('');
    
    const tableInfo = [];
    for (const table of tables) {
      const count = await getTableRowCount(connection, table);
      tableInfo.push({ name: table, count });
      console.log(`   ${table.padEnd(40)} ${count.toString().padStart(10)} lignes`);
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('');
    
    // Demander quelle table afficher en détail
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('💡 Options:');
    console.log('   - Entrez un nom de table pour voir ses données');
    console.log('   - Entrez "all" pour voir toutes les données (peut être long)');
    console.log('   - Entrez "structure" pour voir la structure de toutes les tables');
    console.log('   - Entrez "quit" pour quitter');
    console.log('');
    
    const askTable = () => {
      rl.question('Quelle table voulez-vous voir? (ou "all"/"structure"/"quit"): ', async (answer) => {
        if (answer.toLowerCase() === 'quit' || answer.toLowerCase() === 'q') {
          rl.close();
          await connection.end();
          console.log('👋 Au revoir!');
          process.exit(0);
        }
        
        if (answer.toLowerCase() === 'structure') {
          console.log('');
          console.log('='.repeat(80));
          console.log('📐 STRUCTURE DE TOUTES LES TABLES');
          console.log('='.repeat(80));
          console.log('');
          
          for (const table of tables) {
            const structure = await showTableStructure(connection, table);
            if (structure) {
              console.log(`\n📌 Table: ${table}`);
              console.log('-'.repeat(80));
              console.log('Colonne'.padEnd(30) + 'Type'.padEnd(20) + 'Null'.padEnd(10) + 'Key'.padEnd(10) + 'Default');
              console.log('-'.repeat(80));
              structure.forEach(col => {
                console.log(
                  col.Field.padEnd(30) +
                  col.Type.padEnd(20) +
                  col.Null.padEnd(10) +
                  (col.Key || '').padEnd(10) +
                  (col.Default || 'NULL')
                );
              });
              console.log('');
            }
          }
          
          askTable();
          return;
        }
        
        if (answer.toLowerCase() === 'all') {
          console.log('');
          console.log('='.repeat(80));
          console.log('📊 TOUTES LES DONNÉES');
          console.log('='.repeat(80));
          console.log('');
          
          for (const table of tables) {
            const count = await getTableRowCount(connection, table);
            console.log(`\n📌 Table: ${table} (${count} lignes)`);
            console.log('='.repeat(80));
            
            if (count > 0) {
              const data = await getTableData(connection, table, 100); // Limite à 100 pour éviter trop de données
              if (data && data.length > 0) {
                // Afficher les colonnes
                const columns = Object.keys(data[0]);
                console.log('Colonnes:', columns.join(', '));
                console.log('');
                
                // Afficher les données (limitées)
                data.forEach((row, index) => {
                  console.log(`Ligne ${index + 1}:`);
                  columns.forEach(col => {
                    let value = row[col];
                    if (value === null) value = 'NULL';
                    if (typeof value === 'string' && value.length > 100) {
                      value = value.substring(0, 100) + '...';
                    }
                    console.log(`  ${col}: ${value}`);
                  });
                  console.log('');
                });
                
                if (count > 100) {
                  console.log(`... et ${count - 100} autres lignes`);
                }
              } else {
                console.log('Aucune donnée');
              }
            } else {
              console.log('Table vide');
            }
            console.log('');
          }
          
          askTable();
          return;
        }
        
        // Afficher une table spécifique
        if (tables.includes(answer)) {
          const count = await getTableRowCount(connection, answer);
          console.log('');
          console.log('='.repeat(80));
          console.log(`📊 Table: ${answer} (${count} lignes)`);
          console.log('='.repeat(80));
          console.log('');
          
          // Structure
          const structure = await showTableStructure(connection, answer);
          if (structure) {
            console.log('📐 Structure:');
            console.log('-'.repeat(80));
            console.log('Colonne'.padEnd(30) + 'Type'.padEnd(20) + 'Null'.padEnd(10) + 'Key'.padEnd(10) + 'Default');
            console.log('-'.repeat(80));
            structure.forEach(col => {
              console.log(
                col.Field.padEnd(30) +
                col.Type.padEnd(20) +
                col.Null.padEnd(10) +
                (col.Key || '').padEnd(10) +
                (col.Default || 'NULL')
              );
            });
            console.log('');
          }
          
          // Données
          if (count > 0) {
            console.log('📄 Données (premières 50 lignes):');
            console.log('-'.repeat(80));
            const data = await getTableData(connection, answer, 50);
            if (data && data.length > 0) {
              // Afficher en format tableau
              const columns = Object.keys(data[0]);
              
              // En-tête
              console.log(columns.join(' | '));
              console.log('-'.repeat(80));
              
              // Données
              data.forEach(row => {
                const values = columns.map(col => {
                  let value = row[col];
                  if (value === null) return 'NULL';
                  if (typeof value === 'string' && value.length > 50) {
                    value = value.substring(0, 50) + '...';
                  }
                  return String(value);
                });
                console.log(values.join(' | '));
              });
              
              if (count > 50) {
                console.log(`\n... et ${count - 50} autres lignes`);
              }
            }
          } else {
            console.log('Table vide');
          }
          
          console.log('');
          askTable();
        } else {
          console.log(`❌ Table "${answer}" non trouvée`);
          console.log(`Tables disponibles: ${tables.join(', ')}`);
          console.log('');
          askTable();
        }
      });
    };
    
    askTable();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('   SQL:', error.sqlMessage);
    }
    process.exit(1);
  }
}

main().catch(console.error);

