const { query } = require('../config/database');

async function migrateGammeProductFiles() {
  try {
    console.log('🔄 Début de la migration des fichiers Gamme Produits...');
    
    // Vérifier que la table existe
    const [tables] = await query(`SHOW TABLES LIKE 'gamme_product_files'`);
    if (tables.length === 0) {
      console.error('❌ La table gamme_product_files n\'existe pas. Veuillez d\'abord créer la table.');
      process.exit(1);
    }
    
    // Récupérer le contenu CMS
    const cmsContent = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['gamme-produits']
    );
    
    if (!cmsContent || cmsContent.length === 0) {
      console.log('ℹ️ Aucun contenu CMS trouvé pour gamme-produits');
      return;
    }
    
    let gpContent = cmsContent[0].content;
    
    // Parser le contenu
    try {
      gpContent = typeof gpContent === 'string' ? JSON.parse(gpContent) : gpContent;
      if (typeof gpContent === 'string') {
        gpContent = JSON.parse(gpContent);
      }
    } catch (parseError) {
      console.error('❌ Erreur parsing contenu CMS:', parseError);
      return;
    }
    
    if (!gpContent || !gpContent.products) {
      console.log('ℹ️ Aucun produit trouvé dans le contenu CMS');
      return;
    }
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    // Parcourir tous les produits
    Object.keys(gpContent.products).forEach((clientType) => {
      Object.keys(gpContent.products[clientType] || {}).forEach((family) => {
        const products = gpContent.products[clientType][family];
        if (Array.isArray(products)) {
          products.forEach((product) => {
            if (product.documents && Array.isArray(product.documents) && product.documents.length > 0) {
              const productKey = `${clientType}_${family}_${product.name}`;
              
              product.documents.forEach(async (doc, index) => {
                try {
                  // Vérifier si le document a du contenu base64
                  if (doc.file_content && typeof doc.file_content === 'string' && doc.file_content.length > 0) {
                    // Vérifier si le fichier existe déjà dans la table (par nom)
                    const existing = await query(
                      `SELECT id FROM gamme_product_files 
                       WHERE product_key = ? AND file_name = ?`,
                      [productKey, doc.file_name || doc.title || 'document']
                    );
                    
                    if (!existing || existing.length === 0) {
                      // Insérer dans la table
                      await query(
                        `INSERT INTO gamme_product_files 
                         (product_key, file_name, file_content, file_size, file_type, display_order) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [
                          productKey,
                          doc.file_name || doc.title || 'document',
                          doc.file_content,
                          doc.file_size || 0,
                          doc.file_type || 'application/pdf',
                          index
                        ]
                      );
                      migratedCount++;
                      console.log(`✅ Fichier migré: ${productKey} - ${doc.file_name || doc.title}`);
                    } else {
                      skippedCount++;
                      console.log(`⏭️ Fichier déjà existant (ignoré): ${productKey} - ${doc.file_name || doc.title}`);
                    }
                  } else {
                    skippedCount++;
                    console.log(`⏭️ Document sans contenu (ignoré): ${productKey} - ${doc.title || doc.file_name}`);
                  }
                } catch (error) {
                  errorCount++;
                  console.error(`❌ Erreur migration fichier ${productKey} - ${doc.file_name || doc.title}:`, error.message);
                }
              });
              
              // Nettoyer les documents du JSON (garder seulement une référence minimale pour compatibilité)
              // On garde juste le titre pour référence, mais le contenu sera chargé depuis la table
              product.documents = product.documents.map((doc) => ({
                id: doc.id || `migrated_${Date.now()}`,
                title: doc.title || doc.file_name || 'Document',
                migrated: true // Flag pour indiquer que c'est migré
              }));
            }
          });
        }
      });
    });
    
    // Sauvegarder le JSON nettoyé
    const cleanedContent = JSON.stringify(gpContent);
    await query(
      'UPDATE cms_content SET content = ? WHERE page = ?',
      [cleanedContent, 'gamme-produits']
    );
    
    console.log('\n📊 Résumé de la migration:');
    console.log(`   ✅ Fichiers migrés: ${migratedCount}`);
    console.log(`   ⏭️ Fichiers ignorés: ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`\n✅ Migration terminée! Le contenu CMS a été nettoyé.`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter la migration
(async () => {
  try {
    console.log('🔌 Connexion à la base de données...');
    await migrateGammeProductFiles();
    console.log('🔌 Terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
})();

