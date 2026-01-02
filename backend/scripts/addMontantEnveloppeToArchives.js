const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addMontantEnveloppeColumn() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connexion à la base de données établie');

    // Vérifier si la colonne existe déjà
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'archives' 
      AND COLUMN_NAME = 'montant_enveloppe'
    `, [process.env.DB_NAME || 'alliance_courtage']);

    if (columns.length > 0) {
      console.log('✅ La colonne montant_enveloppe existe déjà dans la table archives');
    } else {
      // Ajouter la colonne montant_enveloppe
      await connection.execute(`
        ALTER TABLE archives 
        ADD COLUMN montant_enveloppe DECIMAL(15, 2) NULL DEFAULT 0 
        COMMENT 'Enveloppe spécifique à ce produit structuré' 
        AFTER assurance
      `);
      
      console.log('✅ Colonne montant_enveloppe ajoutée avec succès');
    }
    
    // Afficher un résumé des produits avec/sans enveloppe
    const [summary] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(montant_enveloppe) as avec_enveloppe,
        COUNT(*) - COUNT(montant_enveloppe) as sans_enveloppe,
        COALESCE(SUM(montant_enveloppe), 0) as total_enveloppes
      FROM archives 
      WHERE category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements')
    `);
    
    console.log('\n📊 Résumé des produits structurés :');
    console.log(`   Total: ${summary[0].total}`);
    console.log(`   Avec enveloppe: ${summary[0].avec_enveloppe}`);
    console.log(`   Sans enveloppe: ${summary[0].sans_enveloppe}`);
    console.log(`   Total enveloppes: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(summary[0].total_enveloppes)}`);
    
    await connection.end();
    console.log('\n✅ Script terminé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

addMontantEnveloppeColumn();



