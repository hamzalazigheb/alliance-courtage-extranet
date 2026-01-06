const { query } = require('../config/database');

async function syncGammeProductsFromJSON() {
  try {
    console.log('🔌 Connexion à MySQL...');
    // Tester la connexion avec une requête simple
    await query('SELECT 1');
    console.log('✅ Connexion réussie!');

    // Lire le CMS content pour gamme-produits
    console.log('📖 Lecture du CMS content...');
    const cmsData = await query(
      `SELECT content FROM cms_content WHERE page_name = 'gamme-produits' ORDER BY id DESC LIMIT 1`
    );

    if (cmsData.length === 0) {
      console.log('⚠️ Aucun contenu CMS trouvé pour gamme-produits');
      return;
    }

    let content = cmsData[0].content;
    
    // Parser le JSON (peut être double-encodé)
    if (typeof content === 'string') {
      content = JSON.parse(content);
    }
    if (typeof content === 'string') {
      content = JSON.parse(content);
    }

    if (!content.products) {
      console.log('⚠️ Pas de produits dans le CMS');
      return;
    }

    console.log('📦 Synchronisation des produits...');
    let totalSynced = 0;
    let totalSkipped = 0;

    for (const clientType of Object.keys(content.products)) {
      for (const family of Object.keys(content.products[clientType])) {
        const products = content.products[clientType][family];
        
        if (!Array.isArray(products)) continue;

        for (const product of products) {
          const productName = typeof product === 'string' ? product : product.name;
          const description = typeof product === 'object' ? (product.description || '') : '';
          const productKey = `${clientType}_${family}_${productName}`;

          try {
            // Vérifier si le produit existe déjà
            const existing = await query(
              `SELECT id FROM gamme_products WHERE product_key = ?`,
              [productKey]
            );

            if (existing.length === 0) {
              // Créer le produit
              await query(
                `INSERT INTO gamme_products 
                 (product_key, client_type, family, product_name, description) 
                 VALUES (?, ?, ?, ?, ?)`,
                [productKey, clientType, family, productName, description]
              );
              console.log(`✅ Produit créé: ${productKey}`);
              totalSynced++;
            } else {
              console.log(`⏭️ Produit existe déjà: ${productKey}`);
              totalSkipped++;
            }
          } catch (err) {
            console.error(`❌ Erreur pour ${productKey}:`, err.message);
          }
        }
      }
    }

    console.log('');
    console.log('📊 RÉSUMÉ:');
    console.log(`   ✅ Produits créés: ${totalSynced}`);
    console.log(`   ⏭️ Produits existants (ignorés): ${totalSkipped}`);
    console.log(`   📦 Total traités: ${totalSynced + totalSkipped}`);

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
  } finally {
    console.log('🔌 Script terminé');
    process.exit(0);
  }
}

syncGammeProductsFromJSON();

