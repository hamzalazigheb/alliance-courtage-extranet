const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../config.env' });

async function checkMontantEnveloppeData() {
  let connection;
  
  try {
    console.log('🔌 Connexion à MySQL...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage'
    });
    
    console.log('✅ Connexion réussie!\n');
    
    // Récupérer les produits structurés
    console.log('📊 Produits structurés dans la base de données:');
    const [products] = await connection.query(`
      SELECT id, title, category, assurance, montant_enveloppe, date_strike, created_at 
      FROM archives 
      WHERE category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements')
         OR category LIKE '%"Épargne"%'
         OR category LIKE '%"Retraite"%'
         OR category LIKE '%"Prévoyance"%'
         OR category LIKE '%"Santé"%'
         OR category LIKE '%"CIF"%'
         OR category LIKE '%"Investissements"%'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    if (products.length === 0) {
      console.log('❌ Aucun produit structuré trouvé dans la base de données');
    } else {
      console.log(`✅ ${products.length} produit(s) trouvé(s):\n`);
      products.forEach((product, index) => {
        console.log(`${index + 1}. 📦 ${product.title}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Catégorie: ${product.category}`);
        console.log(`   Assurance: ${product.assurance}`);
        console.log(`   💰 Montant Enveloppe: ${product.montant_enveloppe || '0.00'} €`);
        console.log(`   📅 Date Strike: ${product.date_strike || 'N/A'}`);
        console.log(`   🕐 Créé le: ${product.created_at}`);
        console.log('');
      });
      
      // Statistiques
      const productsWithMontant = products.filter(p => p.montant_enveloppe && p.montant_enveloppe > 0);
      const productsWithoutMontant = products.filter(p => !p.montant_enveloppe || p.montant_enveloppe === 0);
      
      console.log('📈 Statistiques:');
      console.log(`   ✅ Produits avec montant enveloppe: ${productsWithMontant.length}`);
      console.log(`   ⚠️  Produits sans montant enveloppe (ou = 0): ${productsWithoutMontant.length}`);
      
      if (productsWithoutMontant.length > 0) {
        console.log('\n⚠️  Les produits sans montant enveloppe ne s\'afficheront pas correctement dans le tableau récapitulatif.');
        console.log('   Ces produits ont probablement été créés avant l\'ajout de la colonne montant_enveloppe.');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

checkMontantEnveloppeData();

