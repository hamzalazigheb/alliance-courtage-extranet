const { query } = require('../config/database');

async function checkGammeProductFiles() {
  try {
    console.log('🔍 Vérification des fichiers dans le JSON CMS...\n');
    
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
    
    let totalDocuments = 0;
    let documentsWithContent = 0;
    let documentsWithoutContent = 0;
    
    // Parcourir tous les produits
    Object.keys(gpContent.products).forEach((clientType) => {
      Object.keys(gpContent.products[clientType] || {}).forEach((family) => {
        const products = gpContent.products[clientType][family];
        if (Array.isArray(products)) {
          products.forEach((product) => {
            if (product.documents && Array.isArray(product.documents) && product.documents.length > 0) {
              const productKey = `${clientType}_${family}_${product.name}`;
              console.log(`\n📦 Produit: ${productKey}`);
              console.log(`   Nombre de documents: ${product.documents.length}`);
              
              product.documents.forEach((doc, index) => {
                totalDocuments++;
                const hasContent = doc.file_content && typeof doc.file_content === 'string' && doc.file_content.length > 0;
                const contentLength = doc.file_content ? doc.file_content.length : 0;
                
                console.log(`   📄 Document ${index + 1}:`);
                console.log(`      - Nom: ${doc.file_name || doc.title || 'N/A'}`);
                console.log(`      - Taille contenu: ${contentLength} caractères`);
                console.log(`      - A du contenu: ${hasContent ? '✅ OUI' : '❌ NON'}`);
                console.log(`      - Type: ${doc.file_type || 'N/A'}`);
                console.log(`      - Taille fichier: ${doc.file_size || 'N/A'} bytes`);
                
                if (hasContent) {
                  documentsWithContent++;
                  // Afficher un aperçu du contenu (premiers 100 caractères)
                  const preview = doc.file_content.substring(0, 100);
                  console.log(`      - Aperçu contenu: ${preview}...`);
                } else {
                  documentsWithoutContent++;
                  console.log(`      - ⚠️ Pas de contenu base64 à migrer`);
                }
              });
            }
          });
        }
      });
    });
    
    console.log(`\n📊 Résumé:`);
    console.log(`   Total documents: ${totalDocuments}`);
    console.log(`   Documents avec contenu: ${documentsWithContent}`);
    console.log(`   Documents sans contenu: ${documentsWithoutContent}`);
    
    // Vérifier aussi ce qui est dans la table
    console.log(`\n🔍 Vérification de la table gamme_product_files...`);
    const filesInTable = await query('SELECT COUNT(*) as count FROM gamme_product_files');
    console.log(`   Fichiers dans la table: ${filesInTable[0].count}`);
    
    if (filesInTable[0].count > 0) {
      const sampleFiles = await query('SELECT product_key, file_name, file_size FROM gamme_product_files LIMIT 5');
      console.log(`   Exemples de fichiers dans la table:`);
      sampleFiles.forEach(file => {
        console.log(`      - ${file.product_key}: ${file.file_name} (${file.file_size} bytes)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  }
}

// Exécuter
(async () => {
  try {
    console.log('🔌 Connexion à la base de données...');
    await checkGammeProductFiles();
    console.log('\n🔌 Terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
})();

