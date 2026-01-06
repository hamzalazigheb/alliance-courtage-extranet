const { query } = require('../config/database');

async function deleteAllGammeProducts() {
  try {
    console.log('🔌 Connexion à MySQL...');
    await query('SELECT 1');
    console.log('✅ Connexion réussie!');

    console.log('');
    console.log('⚠️  ATTENTION : Cette action va supprimer TOUS les produits de Gamme Produits !');
    console.log('');

    // Compter les produits avant suppression
    const countProducts = await query('SELECT COUNT(*) as total FROM gamme_products');
    const totalProducts = countProducts[0].total;

    const countFiles = await query('SELECT COUNT(*) as total FROM gamme_product_files');
    const totalFiles = countFiles[0].total;

    console.log(`📊 État actuel de la base de données :`);
    console.log(`   📦 Produits : ${totalProducts}`);
    console.log(`   📄 Fichiers : ${totalFiles}`);
    console.log('');

    if (totalProducts === 0 && totalFiles === 0) {
      console.log('✅ Les tables sont déjà vides, rien à supprimer.');
      process.exit(0);
      return;
    }

    console.log('🗑️  Suppression en cours...');
    console.log('');

    // Supprimer tous les fichiers
    console.log('1️⃣  Suppression des fichiers...');
    await query('DELETE FROM gamme_product_files');
    console.log('   ✅ Tous les fichiers supprimés');

    // Supprimer tous les produits
    console.log('2️⃣  Suppression des produits...');
    await query('DELETE FROM gamme_products');
    console.log('   ✅ Tous les produits supprimés');

    // Réinitialiser les auto-increment
    console.log('3️⃣  Réinitialisation des compteurs...');
    await query('ALTER TABLE gamme_product_files AUTO_INCREMENT = 1');
    await query('ALTER TABLE gamme_products AUTO_INCREMENT = 1');
    console.log('   ✅ Compteurs réinitialisés');

    console.log('');
    console.log('✅ ========================================');
    console.log('✅ Suppression terminée avec succès !');
    console.log('✅ ========================================');
    console.log('');
    console.log(`📊 Résumé :`);
    console.log(`   🗑️  ${totalProducts} produit(s) supprimé(s)`);
    console.log(`   🗑️  ${totalFiles} fichier(s) supprimé(s)`);
    console.log('');
    console.log('💡 Vous pouvez maintenant créer de nouveaux produits via l\'interface.');
    console.log('');

  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error);
    process.exit(1);
  } finally {
    console.log('🔌 Script terminé');
    process.exit(0);
  }
}

deleteAllGammeProducts();

