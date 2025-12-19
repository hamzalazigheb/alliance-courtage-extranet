const { query } = require('./config/database');

async function runMigration() {
  console.log('🔄 Exécution de la migration: ajout colonne validite_date...');
  
  try {
    // Vérifier si la colonne existe déjà
    const columns = await query(`SHOW COLUMNS FROM users LIKE 'validite_date'`);
    
    if (columns.length > 0) {
      console.log('✅ La colonne validite_date existe déjà');
    } else {
      await query(`ALTER TABLE users ADD COLUMN validite_date DATE DEFAULT NULL`);
      console.log('✅ Colonne validite_date ajoutée');
    }
    
    // Créer l'index si nécessaire
    const indexes = await query(`SHOW INDEX FROM users WHERE Key_name = 'idx_users_validite_date'`);
    if (indexes.length === 0) {
      await query(`CREATE INDEX idx_users_validite_date ON users(validite_date)`);
      console.log('✅ Index idx_users_validite_date créé');
    } else {
      console.log('✅ Index idx_users_validite_date existe déjà');
    }
    
    console.log('🎉 Migration terminée avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur migration:', error.message);
    process.exit(1);
  }
}

runMigration();

