const mysql = require('mysql2');
// Charger les variables d'environnement (le fichier config.env peut ne pas exister en Docker)
try {
  require('dotenv').config({ path: './config.env' });
} catch (e) {
  // Ignorer si le fichier n'existe pas, utiliser les variables d'environnement système
  console.log('ℹ️  config.env non trouvé, utilisation des variables d\'environnement système');
}

// Configuration de la connexion à la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage',
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Créer le pool de connexions
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Variable globale pour la connexion simple (créée lors du connect)
let connection = null;

// Fonction pour tester la connexion avec retry
const connect = (callback, retries = 5, delay = 2000) => {
  const attemptConnection = (attempt) => {
    console.log(`⏳ Tentative de connexion à MySQL (${attempt}/${retries})...`);
    
    // Créer une nouvelle connexion pour chaque tentative
    const testConnection = mysql.createConnection(dbConfig);
    
    testConnection.connect((err) => {
      if (err) {
        testConnection.end();
        
        if (attempt >= retries) {
          console.error('❌ Erreur de connexion à MySQL après', retries, 'tentatives:', err.message);
          return callback(err);
        }
        
        console.log(`⏸️  Échec de connexion, nouvelle tentative dans ${delay/1000}s...`);
        setTimeout(() => {
          attemptConnection(attempt + 1);
        }, delay);
        return;
      }
      
      // Fermer la connexion de test et créer la connexion principale
      testConnection.end();
      connection = mysql.createConnection(dbConfig);
      connection.connect((connectErr) => {
        if (connectErr) {
          console.error('❌ Erreur lors de l\'établissement de la connexion principale:', connectErr.message);
          return callback(connectErr);
        }
        console.log('✅ Connexion à MySQL établie');
        callback(null);
      });
    });
  };
  
  attemptConnection(1);
};

// Fonction pour exécuter des requêtes avec le pool
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.execute(sql, params, (err, results) => {
      if (err) {
        console.error('Erreur SQL:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Fonction pour exécuter des requêtes avec la connexion simple
const querySync = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!connection) {
      return reject(new Error('Connexion non établie. Appelez connect() d\'abord.'));
    }
    connection.execute(sql, params, (err, results) => {
      if (err) {
        console.error('Erreur SQL:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Fonction pour fermer les connexions
const close = () => {
  if (connection) {
    connection.end();
  }
  pool.end();
};

module.exports = {
  connect,
  query,
  querySync,
  close,
  pool,
  connection
};

