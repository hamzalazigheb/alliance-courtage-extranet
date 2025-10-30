const mysql = require('mysql2');
require('dotenv').config({ path: './config.env' });

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

// Créer une connexion simple pour les opérations de base
const connection = mysql.createConnection(dbConfig);

// Fonction pour tester la connexion
const connect = (callback) => {
  connection.connect((err) => {
    if (err) {
      console.error('Erreur de connexion à MySQL:', err);
      return callback(err);
    }
    console.log('✅ Connexion à MySQL établie');
    callback(null);
  });
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
  connection.end();
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

