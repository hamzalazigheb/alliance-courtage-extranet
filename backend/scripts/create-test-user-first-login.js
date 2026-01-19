const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage',
  charset: 'utf8mb4'
};

async function createTestUserFirstLogin() {
  let connection;
  try {
    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connecté à la base de données');

    const email = 'nouvel-user@test.fr';
    const password = 'temp-password';
    const nom = 'Nouvel';
    const prenom = 'User';
    const role = 'user';

    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await connection.query(
      'SELECT id, email FROM users WHERE email = ?',
      [email]
    );

    // Vérifier si la colonne must_change_password existe
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'must_change_password'`,
      [config.database]
    );
    
    const hasMustChangePassword = columns.length > 0;

    if (existingUsers.length > 0) {
      console.log('⚠️  L\'utilisateur existe déjà. Mise à jour...');
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Mettre à jour avec must_change_password = TRUE
      if (hasMustChangePassword) {
        await connection.query(
          'UPDATE users SET password = ?, nom = ?, prenom = ?, is_active = TRUE, must_change_password = TRUE WHERE email = ?',
          [hashedPassword, nom, prenom, email]
        );
      } else {
        await connection.query(
          'UPDATE users SET password = ?, nom = ?, prenom = ?, is_active = TRUE WHERE email = ?',
          [hashedPassword, nom, prenom, email]
        );
      }
      
      console.log('✅ Utilisateur mis à jour avec must_change_password = TRUE');
    } else {
      console.log('📝 Création du nouvel utilisateur...');
      
      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Créer l'utilisateur avec must_change_password = TRUE
      if (hasMustChangePassword) {
        await connection.query(
          'INSERT INTO users (email, password, nom, prenom, role, is_active, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [email, hashedPassword, nom, prenom, role, true, true]
        );
      } else {
        await connection.query(
          'INSERT INTO users (email, password, nom, prenom, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          [email, hashedPassword, nom, prenom, role, true]
        );
        console.log('⚠️  Colonne must_change_password n\'existe pas. Créez-la d\'abord.');
      }
      
      console.log('✅ Utilisateur créé avec succès!');
    }
    
    console.log('\n📋 Informations de connexion:');
    console.log('   Email:', email);
    console.log('   Mot de passe:', password);
    console.log('   must_change_password: TRUE');
    console.log('\n✅ Opération terminée avec succès!');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

createTestUserFirstLogin()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });


