const { query } = require('../config/database');

async function testAPI() {
  try {
    console.log('🔍 Test de l\'API Gamme Produits Files...\n');
    
    // Vérifier les fichiers dans la table
    const files = await query('SELECT * FROM gamme_product_files');
    console.log(`📊 Fichiers dans la table: ${files.length}\n`);
    
    files.forEach(file => {
      console.log(`📄 Fichier:`);
      console.log(`   - ID: ${file.id}`);
      console.log(`   - Product Key: ${file.product_key}`);
      console.log(`   - File Name: ${file.file_name}`);
      console.log(`   - File Size: ${file.file_size} bytes`);
      console.log(`   - File Type: ${file.file_type}`);
      console.log(`   - Content Length: ${file.file_content ? file.file_content.length : 0} caractères`);
      console.log('');
    });
    
    // Tester la requête pour un produit spécifique
    const testProductKey = 'professionnel_cif_test';
    console.log(`\n🔍 Test pour product_key: ${testProductKey}`);
    const testFiles = await query(
      'SELECT id, file_name, file_size, file_type FROM gamme_product_files WHERE product_key = ?',
      [testProductKey]
    );
    
    if (testFiles.length > 0) {
      console.log(`✅ ${testFiles.length} fichier(s) trouvé(s) pour ${testProductKey}:`);
      testFiles.forEach(f => {
        console.log(`   - ${f.file_name} (${f.file_size} bytes)`);
      });
    } else {
      console.log(`❌ Aucun fichier trouvé pour ${testProductKey}`);
    }
    
    // Vérifier si le produit existe dans le JSON CMS
    console.log(`\n🔍 Vérification du produit dans le JSON CMS...`);
    const cmsContent = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['gamme-produits']
    );
    
    if (cmsContent && cmsContent.length > 0) {
      let gpContent = cmsContent[0].content;
      gpContent = typeof gpContent === 'string' ? JSON.parse(gpContent) : gpContent;
      if (typeof gpContent === 'string') {
        gpContent = JSON.parse(gpContent);
      }
      
      const products = gpContent.products?.professionnel?.cif || [];
      const testProduct = products.find(p => p.name === 'test');
      
      if (testProduct) {
        console.log(`✅ Produit "test" trouvé dans professionnel/cif`);
        console.log(`   - Nom: ${testProduct.name}`);
        console.log(`   - Description: ${testProduct.description || 'N/A'}`);
      } else {
        console.log(`❌ Produit "test" NON trouvé dans professionnel/cif`);
        console.log(`   Produits disponibles: ${products.map(p => p.name).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

(async () => {
  await testAPI();
  process.exit(0);
})();

