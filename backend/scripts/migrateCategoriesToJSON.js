#!/usr/bin/env node

/**
 * Script de migration: Convertir toutes les catégories simples en JSON array
 * Exemple: "Retraite" devient ["Retraite"]
 */

const mysql = require('mysql2/promise');

// Charger les variables d'environnement
try {
  require('dotenv').config({ path: './config.env' });
} catch (e) {
  console.log('ℹ️  config.env non trouvé, utilisation des variables d\'environnement système');
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage'
};

async function migrateCategories() {
  let connection;
  
  try {
    console.log('🔌 Connexion à la base de données...');
    console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connecté à MySQL\n');

    // Récupérer tous les produits avec des catégories simples (non-JSON)
    console.log('📋 Recherche des produits avec catégories simples...');
    const [products] = await connection.execute(
      `SELECT id, title, category 
       FROM archives 
       WHERE category IS NOT NULL 
       AND category NOT LIKE '[%'
       AND category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements')`
    );

    if (products.length === 0) {
      console.log('✅ Aucune migration nécessaire! Tous les produits sont déjà au bon format.');
      return;
    }

    console.log(`📊 ${products.length} produit(s) à migrer:\n`);
    
    // Afficher un aperçu
    products.slice(0, 5).forEach(p => {
      console.log(`   - ${p.title} (ID: ${p.id})`);
      console.log(`     Ancien: "${p.category}"`);
      console.log(`     Nouveau: ["${p.category}"]`);
      console.log('');
    });
    
    if (products.length > 5) {
      console.log(`   ... et ${products.length - 5} autre(s)\n`);
    }

    // Demander confirmation (simulation - en production, utiliser readline)
    console.log('⚠️  ATTENTION: Cette opération va modifier les catégories de tous ces produits.');
    console.log('⚠️  Assurez-vous d\'avoir fait une sauvegarde de la base de données!\n');
    
    // En production, décommenter ces lignes pour demander confirmation:
    /*
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('Voulez-vous continuer? (oui/non): ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'oui') {
      console.log('❌ Migration annulée.');
      return;
    }
    */

    // Migration
    console.log('🔄 Migration en cours...\n');
    let successCount = 0;
    let errorCount = 0;

    for (const product of products) {
      try {
        const newCategory = JSON.stringify([product.category]);
        await connection.execute(
          'UPDATE archives SET category = ? WHERE id = ?',
          [newCategory, product.id]
        );
        successCount++;
        console.log(`✅ ${product.id} - ${product.title}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ ${product.id} - ${product.title}: ${error.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Migration terminée!`);
    console.log(`   Réussis: ${successCount}`);
    console.log(`   Erreurs: ${errorCount}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée.');
    }
  }
}

// Exécuter
migrateCategories()
  .then(() => {
    console.log('\n✅ Script terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  });

