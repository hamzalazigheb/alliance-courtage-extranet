const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../config.env' });

async function checkHelloProducts() {
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
    
    // Récupérer tous les produits "hello"
    console.log('📊 Tous les produits nommés "hello":');
    const [products] = await connection.query(`
      SELECT id, title, category, assurance, montant_enveloppe, montant_total_global, created_at 
      FROM archives 
      WHERE title = 'hello'
      ORDER BY created_at DESC
    `);
    
    console.log(`\n✅ ${products.length} produit(s) trouvé(s):\n`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ID: ${product.id}`);
      console.log(`   Assurance: ${product.assurance}`);
      console.log(`   Montant enveloppe: ${product.montant_enveloppe} €`);
      console.log(`   Montant total global: ${product.montant_total_global} €`);
      console.log(`   Créé le: ${product.created_at}`);
      console.log('');
    });
    
    // Récupérer les réservations pour ces produits
    console.log('\n📋 Réservations pour les produits "hello":');
    const [reservations] = await connection.query(`
      SELECT pr.id, pr.product_id, pr.montant, pr.status, pr.assurance_name, pr.created_at,
             u.nom, u.prenom
      FROM product_reservations pr
      LEFT JOIN users u ON pr.user_id = u.id
      WHERE pr.product_id IN (SELECT id FROM archives WHERE title = 'hello')
      ORDER BY pr.created_at DESC
    `);
    
    if (reservations.length === 0) {
      console.log('❌ Aucune réservation trouvée pour les produits "hello"');
    } else {
      console.log(`✅ ${reservations.length} réservation(s) trouvée(s):\n`);
      let totalReserved = 0;
      let totalApproved = 0;
      
      reservations.forEach((res, index) => {
        console.log(`${index + 1}. Réservation ID: ${res.id}`);
        console.log(`   Produit ID: ${res.product_id}`);
        console.log(`   Utilisateur: ${res.nom} ${res.prenom}`);
        console.log(`   Montant: ${res.montant} €`);
        console.log(`   Status: ${res.status}`);
        console.log(`   Assurance: ${res.assurance_name}`);
        console.log(`   Créé le: ${res.created_at}`);
        console.log('');
        
        totalReserved += parseFloat(res.montant);
        if (res.status === 'approved') {
          totalApproved += parseFloat(res.montant);
        }
      });
      
      console.log(`\n📊 Totaux:`);
      console.log(`   Total réservations: ${totalReserved.toFixed(2)} €`);
      console.log(`   Total approuvées: ${totalApproved.toFixed(2)} €`);
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

checkHelloProducts();

