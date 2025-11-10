const fs = require('fs');
const path = require('path');
const { query } = require('../config/database');

// Script pour migrer les données du fichier JSON vers la base de données
async function migrateFinancialProducts() {
  try {
    console.log('🔄 Migration des produits financiers...');
    
    // Lire le fichier JSON
    const jsonPath = path.join(__dirname, '../../src/financialProducts.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    // Migrer les fonds en euro
    for (const product of jsonData.fondsEuro) {
      const result = await query(
        `INSERT INTO financial_products 
         (isin, nom, gestionnaire, classe, pea, frais, isr, esg, volatilite_3ans, volatilite_5ans) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.isin,
          product.nom,
          product.gestionnaire,
          product.classe,
          product.pea,
          product.frais,
          product.isr,
          product.esg,
          product.volatilite3ans,
          product.volatilite5ans
        ]
      );
      
      const productId = result.insertId;
      
      // Insérer les performances
      for (const [year, performance] of Object.entries(product.performances)) {
        if (performance && year !== 'cumul2017') {
          await query(
            'INSERT INTO product_performances (product_id, year, performance) VALUES (?, ?, ?)',
            [productId, parseInt(year), performance]
          );
        }
      }
    }
    
    // Migrer les OPCI SCI
    for (const product of jsonData.opciSci) {
      const result = await query(
        `INSERT INTO financial_products 
         (isin, nom, gestionnaire, classe, pea, frais, isr, esg, volatilite_3ans, volatilite_5ans) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.isin,
          product.nom,
          product.gestionnaire,
          product.classe,
          product.pea,
          product.frais,
          product.isr,
          product.esg,
          product.volatilite3ans,
          product.volatilite5ans
        ]
      );
      
      const productId = result.insertId;
      
      // Insérer les performances
      for (const [year, performance] of Object.entries(product.performances)) {
        if (performance && year !== 'cumul2017') {
          await query(
            'INSERT INTO product_performances (product_id, year, performance) VALUES (?, ?, ?)',
            [productId, parseInt(year), performance]
          );
        }
      }
    }
    
    // Migrer les unités de compte
    for (const product of jsonData.unitesCompte) {
      const result = await query(
        `INSERT INTO financial_products 
         (isin, nom, gestionnaire, classe, pea, frais, isr, esg, volatilite_3ans, volatilite_5ans) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          product.isin,
          product.nom,
          product.gestionnaire,
          product.classe,
          product.pea,
          product.frais,
          product.isr,
          product.esg,
          product.volatilite3ans,
          product.volatilite5ans
        ]
      );
      
      const productId = result.insertId;
      
      // Insérer les performances
      for (const [year, performance] of Object.entries(product.performances)) {
        if (performance && year !== 'cumul2017') {
          await query(
            'INSERT INTO product_performances (product_id, year, performance) VALUES (?, ?, ?)',
            [productId, parseInt(year), performance]
          );
        }
      }
    }
    
    console.log('✅ Migration des produits financiers terminée');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  }
}

// Exécuter la migration si le script est appelé directement
if (require.main === module) {
  migrateFinancialProducts()
    .then(() => {
      console.log('🎉 Migration terminée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration:', error);
      process.exit(1);
    });
}

module.exports = { migrateFinancialProducts };
