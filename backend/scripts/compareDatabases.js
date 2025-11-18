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

// Configuration locale (depuis config.env)
const localConfig = loadConfig();

// Configuration production (à adapter selon votre environnement)
const prodConfig = {
  host: process.env.PROD_DB_HOST || 'localhost',
  port: parseInt(process.env.PROD_DB_PORT) || 3306,
  user: process.env.PROD_DB_USER || 'root',
  password: process.env.PROD_DB_PASSWORD || '',
  database: process.env.PROD_DB_NAME || 'alliance_courtage'
};

async function getTables(connection) {
  const [tables] = await connection.execute('SHOW TABLES');
  return tables.map(row => Object.values(row)[0]);
}

async function getTableStructure(connection, tableName) {
  const [columns] = await connection.execute(`DESCRIBE ${tableName}`);
  return columns.map(col => ({
    Field: col.Field,
    Type: col.Type,
    Null: col.Null,
    Key: col.Key,
    Default: col.Default,
    Extra: col.Extra
  }));
}

async function getTableIndexes(connection, tableName) {
  const [indexes] = await connection.execute(`SHOW INDEXES FROM ${tableName}`);
  return indexes;
}

async function compareDatabases() {
  let localConn, prodConn;
  
  try {
    console.log('🔍 Comparaison des bases de données');
    console.log('='.repeat(80));
    console.log('');
    
    // Connexion locale
    console.log('📡 Connexion à la base de données locale...');
    localConn = await mysql.createConnection({
      host: localConfig.DB_HOST || 'localhost',
      port: parseInt(localConfig.DB_PORT) || 3306,
      user: localConfig.DB_USER || 'root',
      password: localConfig.DB_PASSWORD || '',
      database: localConfig.DB_NAME || 'alliance_courtage'
    });
    console.log('✅ Connecté à la base locale');
    console.log('');
    
    // Connexion production
    console.log('📡 Connexion à la base de données de production...');
    console.log(`   Host: ${prodConfig.host}:${prodConfig.port}`);
    console.log(`   Database: ${prodConfig.database}`);
    
    // Demander les identifiants de production si non fournis
    if (!process.env.PROD_DB_PASSWORD) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const password = await new Promise(resolve => {
        rl.question('Mot de passe DB production (ou Entrée si vide): ', resolve);
      });
      
      if (password) {
        prodConfig.password = password;
      }
      
      rl.close();
    }
    
    prodConn = await mysql.createConnection(prodConfig);
    console.log('✅ Connecté à la base de production');
    console.log('');
    
    // Récupérer les tables
    console.log('📊 Récupération des tables...');
    const localTables = await getTables(localConn);
    const prodTables = await getTables(prodConn);
    
    console.log(`   Local: ${localTables.length} tables`);
    console.log(`   Production: ${prodTables.length} tables`);
    console.log('');
    
    // Comparer les tables
    const allTables = [...new Set([...localTables, ...prodTables])].sort();
    
    const onlyLocal = localTables.filter(t => !prodTables.includes(t));
    const onlyProd = prodTables.filter(t => !localTables.includes(t));
    const common = localTables.filter(t => prodTables.includes(t));
    
    // Afficher les résultats
    console.log('📋 RÉSULTATS DE LA COMPARAISON');
    console.log('='.repeat(80));
    console.log('');
    
    if (onlyLocal.length > 0) {
      console.log('⚠️  Tables uniquement en LOCAL:');
      onlyLocal.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('');
    }
    
    if (onlyProd.length > 0) {
      console.log('⚠️  Tables uniquement en PRODUCTION:');
      onlyProd.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('');
    }
    
    if (common.length > 0) {
      console.log(`✅ Tables communes (${common.length}):`);
      common.forEach(table => {
        console.log(`   - ${table}`);
      });
      console.log('');
      
      // Comparer la structure des tables communes
      console.log('🔍 Comparaison de la structure des tables communes...');
      console.log('');
      
      const differences = [];
      
      for (const table of common) {
        const localStruct = await getTableStructure(localConn, table);
        const prodStruct = await getTableStructure(prodConn, table);
        
        const localFields = localStruct.map(c => c.Field);
        const prodFields = prodStruct.map(c => c.Field);
        
        const onlyLocalFields = localFields.filter(f => !prodFields.includes(f));
        const onlyProdFields = prodFields.filter(f => !localFields.includes(f));
        const commonFields = localFields.filter(f => prodFields.includes(f));
        
        // Vérifier les différences de structure
        const fieldDiffs = [];
        for (const field of commonFields) {
          const localField = localStruct.find(c => c.Field === field);
          const prodField = prodStruct.find(c => c.Field === field);
          
          if (JSON.stringify(localField) !== JSON.stringify(prodField)) {
            fieldDiffs.push({
              field,
              local: localField,
              prod: prodField
            });
          }
        }
        
        if (onlyLocalFields.length > 0 || onlyProdFields.length > 0 || fieldDiffs.length > 0) {
          differences.push({
            table,
            onlyLocalFields,
            onlyProdFields,
            fieldDiffs
          });
        }
      }
      
      if (differences.length > 0) {
        console.log('⚠️  DIFFÉRENCES DÉTECTÉES:');
        console.log('');
        
        differences.forEach(diff => {
          console.log(`📌 Table: ${diff.table}`);
          
          if (diff.onlyLocalFields.length > 0) {
            console.log('   Colonnes uniquement en LOCAL:');
            diff.onlyLocalFields.forEach(field => {
              console.log(`      - ${field}`);
            });
          }
          
          if (diff.onlyProdFields.length > 0) {
            console.log('   Colonnes uniquement en PRODUCTION:');
            diff.onlyProdFields.forEach(field => {
              console.log(`      - ${field}`);
            });
          }
          
          if (diff.fieldDiffs.length > 0) {
            console.log('   Colonnes avec différences:');
            diff.fieldDiffs.forEach(({ field, local, prod }) => {
              console.log(`      - ${field}:`);
              console.log(`        LOCAL:     ${JSON.stringify(local)}`);
              console.log(`        PRODUCTION: ${JSON.stringify(prod)}`);
            });
          }
          
          console.log('');
        });
      } else {
        console.log('✅ Toutes les tables communes ont la même structure!');
        console.log('');
      }
    }
    
    // Résumé
    console.log('📊 RÉSUMÉ');
    console.log('='.repeat(80));
    console.log(`   Tables locales: ${localTables.length}`);
    console.log(`   Tables production: ${prodTables.length}`);
    console.log(`   Tables communes: ${common.length}`);
    console.log(`   Tables uniquement locales: ${onlyLocal.length}`);
    console.log(`   Tables uniquement production: ${onlyProd.length}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('   SQL:', error.sqlMessage);
    }
    process.exit(1);
  } finally {
    if (localConn) await localConn.end();
    if (prodConn) await prodConn.end();
  }
}

// Exécuter la comparaison
compareDatabases().catch(console.error);


