/**
 * Job de clôture automatique des produits structurés
 * À exécuter quotidiennement via cron ou manuellement
 * 
 * Un produit est automatiquement clôturé si :
 * 1. Le montant réservé (approuvé) >= montant enveloppe (disponible = 0)
 * 2. La date actuelle est > date_strike + 30 jours
 */

const { query } = require('../config/database');

async function autoCloseProducts() {
  console.log('🔒 Vérification des produits à clôturer automatiquement...');
  
  const results = {
    closedByEnvelope: [],
    closedByDate: [],
    errors: []
  };

  try {
    // 1. Clôturer les produits dont l'enveloppe est épuisée (disponible = 0)
    console.log('\n📊 Recherche des produits avec enveloppe épuisée...');
    
    const productsToCloseByEnvelope = await query(`
      SELECT 
        a.id, 
        a.title, 
        a.montant_enveloppe,
        COALESCE(SUM(CASE WHEN pr.status = 'approved' THEN pr.montant ELSE 0 END), 0) as montant_reserve
      FROM archives a
      LEFT JOIN product_reservations pr ON a.id = pr.product_id
      WHERE (a.is_closed = FALSE OR a.is_closed IS NULL)
        AND (
          a.category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements')
          OR a.category LIKE '%"Épargne"%'
          OR a.category LIKE '%"Retraite"%'
          OR a.category LIKE '%"Prévoyance"%'
          OR a.category LIKE '%"Santé"%'
          OR a.category LIKE '%"CIF"%'
          OR a.category LIKE '%"Investissements"%'
        )
      GROUP BY a.id
      HAVING a.montant_enveloppe IS NOT NULL 
        AND a.montant_enveloppe > 0 
        AND montant_reserve >= a.montant_enveloppe
    `);

    console.log(`   ${productsToCloseByEnvelope.length} produit(s) avec enveloppe épuisée`);

    for (const product of productsToCloseByEnvelope) {
      try {
        await query('UPDATE archives SET is_closed = TRUE WHERE id = ?', [product.id]);
        results.closedByEnvelope.push({
          id: product.id,
          title: product.title,
          reason: 'Enveloppe épuisée',
          enveloppe: product.montant_enveloppe,
          reserve: product.montant_reserve
        });
        console.log(`   ✅ Clôturé: "${product.title}" (enveloppe: ${product.montant_enveloppe}€, réservé: ${product.montant_reserve}€)`);
      } catch (error) {
        results.errors.push({
          id: product.id,
          title: product.title,
          error: error.message
        });
        console.error(`   ❌ Erreur pour "${product.title}":`, error.message);
      }
    }

    // 2. Clôturer les produits dont la date de strike est dépassée de 30 jours
    console.log('\n📅 Recherche des produits avec date de strike dépassée de 30 jours...');
    
    const productsToCloseByDate = await query(`
      SELECT id, title, date_strike
      FROM archives
      WHERE (is_closed = FALSE OR is_closed IS NULL)
        AND date_strike IS NOT NULL
        AND DATE(date_strike) < DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        AND (
          category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements')
          OR category LIKE '%"Épargne"%'
          OR category LIKE '%"Retraite"%'
          OR category LIKE '%"Prévoyance"%'
          OR category LIKE '%"Santé"%'
          OR category LIKE '%"CIF"%'
          OR category LIKE '%"Investissements"%'
        )
    `);

    console.log(`   ${productsToCloseByDate.length} produit(s) avec date de strike > 30 jours`);

    for (const product of productsToCloseByDate) {
      try {
        await query('UPDATE archives SET is_closed = TRUE WHERE id = ?', [product.id]);
        results.closedByDate.push({
          id: product.id,
          title: product.title,
          reason: 'Date de strike + 30 jours dépassée',
          dateStrike: product.date_strike
        });
        console.log(`   ✅ Clôturé: "${product.title}" (date strike: ${new Date(product.date_strike).toLocaleDateString('fr-FR')})`);
      } catch (error) {
        results.errors.push({
          id: product.id,
          title: product.title,
          error: error.message
        });
        console.error(`   ❌ Erreur pour "${product.title}":`, error.message);
      }
    }

    // Résumé
    const totalClosed = results.closedByEnvelope.length + results.closedByDate.length;
    console.log('\n📋 Résumé de la clôture automatique:');
    console.log(`   - Produits clôturés (enveloppe épuisée): ${results.closedByEnvelope.length}`);
    console.log(`   - Produits clôturés (date strike + 30j): ${results.closedByDate.length}`);
    console.log(`   - Total clôturés: ${totalClosed}`);
    console.log(`   - Erreurs: ${results.errors.length}`);

    return results;

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    results.errors.push({ global: error.message });
    return results;
  }
}

// Exécution directe si appelé depuis la ligne de commande
if (require.main === module) {
  autoCloseProducts()
    .then((results) => {
      console.log('\n✅ Job de clôture automatique terminé');
      process.exit(results.errors.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { autoCloseProducts };

