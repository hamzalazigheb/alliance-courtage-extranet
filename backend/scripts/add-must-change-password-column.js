const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage',
  charset: 'utf8mb4'
};

async function addMustChangePasswordColumn() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    connection = await mysql.createConnection(config);
    
    console.log('✅ Connecté à la base de données');
    
    // Vérifier si la colonne existe déjà
    const [columns] = await connection.query(
      `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ? 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'must_change_password'`,
      [config.database]
    );
    
    if (columns[0].count > 0) {
      console.log('⚠️  La colonne must_change_password existe déjà');
      return;
    }
    
    // Ajouter la colonne
    console.log('📝 Ajout de la colonne must_change_password...');
    await connection.query(
      `ALTER TABLE users 
       ADD COLUMN must_change_password BOOLEAN DEFAULT TRUE 
       AFTER password`
    );
    
    console.log('✅ Colonne must_change_password ajoutée');
    
    // Mettre à jour tous les utilisateurs existants pour qu'ils doivent changer leur mot de passe
    console.log('📝 Mise à jour des utilisateurs existants...');
    const [result] = await connection.query(
      'UPDATE users SET must_change_password = TRUE WHERE must_change_password IS NULL'
    );
    
    console.log(`✅ ${result.affectedRows} utilisateur(s) mis à jour`);
    console.log('✅ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la migration
addMustChangePasswordColumn()
  .then(() => {
    console.log('✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });




