#!/usr/bin/env node

/**
 * Script pour attendre que MySQL soit prêt avant de démarrer le backend
 */
const mysql = require('mysql2');
// Charger les variables d'environnement (peut ne pas exister en Docker)
try {
  require('dotenv').config({ path: './config.env' });
} catch (e) {
  // Ignorer si le fichier n'existe pas
}

const maxAttempts = 30;
const delayMs = 2000; // 2 secondes entre chaque tentative

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage',
  connectTimeout: 5000
};

function waitForMySQL(attempt = 1) {
  return new Promise((resolve, reject) => {
    console.log(`⏳ Tentative ${attempt}/${maxAttempts} de connexion à MySQL (${dbConfig.host}:${dbConfig.port})...`);
    
    const connection = mysql.createConnection({
      ...dbConfig,
      // Ne pas spécifier la base de données pour la première connexion
      database: undefined
    });

    connection.connect((err) => {
      connection.end();
      
      if (err) {
        if (attempt >= maxAttempts) {
          console.error('❌ Échec: MySQL n\'est pas disponible après', maxAttempts, 'tentatives');
          reject(err);
          return;
        }
        
        console.log(`⏸️  MySQL pas encore prêt, nouvelle tentative dans ${delayMs/1000}s...`);
        setTimeout(() => {
          waitForMySQL(attempt + 1).then(resolve).catch(reject);
        }, delayMs);
        return;
      }
      
      console.log('✅ MySQL est prêt!');
      
      // Vérifier que la base de données existe
      const dbConnection = mysql.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        connectTimeout: 5000
      });
      
      dbConnection.query(`USE ${dbConfig.database}`, (dbErr) => {
        dbConnection.end();
        
        if (dbErr) {
          console.warn(`⚠️  La base de données ${dbConfig.database} n'existe pas encore, mais MySQL est prêt.`);
          console.warn('   Elle sera créée automatiquement par MySQL.');
        } else {
          console.log(`✅ Base de données ${dbConfig.database} trouvée.`);
        }
        
        resolve();
      });
    });
  });
}

// Exécuter le script
waitForMySQL()
  .then(() => {
    console.log('🚀 MySQL est prêt, démarrage du backend...');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erreur lors de l\'attente de MySQL:', err.message);
    process.exit(1);
  });

