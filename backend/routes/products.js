const express = require('express');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Obtenir tous les produits financiers
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let sql = `
      SELECT fp.*, 
             GROUP_CONCAT(
               CONCAT(pp.year, ':', pp.performance) 
               ORDER BY pp.year 
               SEPARATOR ','
             ) as performances
      FROM financial_products fp
      LEFT JOIN product_performances pp ON fp.id = pp.product_id
    `;
    
    const conditions = [];
    const params = [];
    
    if (category) {
      conditions.push('fp.classe = ?');
      params.push(category);
    }
    
    if (search) {
      conditions.push('(fp.nom LIKE ? OR fp.gestionnaire LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' GROUP BY fp.id ORDER BY fp.nom';
    
    const products = await query(sql, params);
    
    // Transformer les performances en objet
    const formattedProducts = products.map(product => {
      const performances = {};
      if (product.performances) {
        product.performances.split(',').forEach(perf => {
          const [year, performance] = perf.split(':');
          performances[year] = performance;
        });
      }
      
      return {
        ...product,
        performances,
        pea: Boolean(product.pea),
        isr: Boolean(product.isr)
      };
    });
    
    res.json(formattedProducts);
  } catch (error) {
    console.error('Erreur get products:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des produits' 
    });
  }
});

// @route   GET /api/products/:id
// @desc    Obtenir un produit financier par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const products = await query(
      'SELECT * FROM financial_products WHERE id = ?',
      [id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ 
        error: 'Produit non trouvé' 
      });
    }
    
    const product = products[0];
    
    // Récupérer les performances
    const performances = await query(
      'SELECT year, performance FROM product_performances WHERE product_id = ? ORDER BY year',
      [id]
    );
    
    const performancesObj = {};
    performances.forEach(perf => {
      performancesObj[perf.year] = perf.performance;
    });
    
    res.json({
      ...product,
      performances: performancesObj,
      pea: Boolean(product.pea),
      isr: Boolean(product.isr)
    });
  } catch (error) {
    console.error('Erreur get product:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du produit' 
    });
  }
});

// @route   POST /api/products
// @desc    Créer un nouveau produit financier
// @access  Private (Admin seulement)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      isin,
      nom,
      gestionnaire,
      classe,
      pea = false,
      frais,
      isr = false,
      esg = 0,
      volatilite_3ans,
      volatilite_5ans,
      performances = {}
    } = req.body;
    
    // Validation des données requises
    if (!nom || !gestionnaire) {
      return res.status(400).json({ 
        error: 'Nom et gestionnaire sont requis' 
      });
    }
    
    // Insérer le produit
    const result = await query(
      `INSERT INTO financial_products 
       (isin, nom, gestionnaire, classe, pea, frais, isr, esg, volatilite_3ans, volatilite_5ans) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [isin, nom, gestionnaire, classe, pea, frais, isr, esg, volatilite_3ans, volatilite_5ans]
    );
    
    const productId = result.insertId;
    
    // Insérer les performances
    for (const [year, performance] of Object.entries(performances)) {
      if (performance) {
        await query(
          'INSERT INTO product_performances (product_id, year, performance) VALUES (?, ?, ?)',
          [productId, parseInt(year), performance]
        );
      }
    }
    
    res.status(201).json({
      message: 'Produit créé avec succès',
      productId
    });
  } catch (error) {
    console.error('Erreur create product:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du produit' 
    });
  }
});

// @route   PUT /api/products/:id
// @desc    Mettre à jour un produit financier
// @access  Private (Admin seulement)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      isin,
      nom,
      gestionnaire,
      classe,
      pea = false,
      frais,
      isr = false,
      esg = 0,
      volatilite_3ans,
      volatilite_5ans,
      performances = {}
    } = req.body;
    
    // Vérifier que le produit existe
    const existingProducts = await query(
      'SELECT id FROM financial_products WHERE id = ?',
      [id]
    );
    
    if (existingProducts.length === 0) {
      return res.status(404).json({ 
        error: 'Produit non trouvé' 
      });
    }
    
    // Mettre à jour le produit
    await query(
      `UPDATE financial_products 
       SET isin = ?, nom = ?, gestionnaire = ?, classe = ?, pea = ?, 
           frais = ?, isr = ?, esg = ?, volatilite_3ans = ?, volatilite_5ans = ?
       WHERE id = ?`,
      [isin, nom, gestionnaire, classe, pea, frais, isr, esg, volatilite_3ans, volatilite_5ans, id]
    );
    
    // Supprimer les anciennes performances
    await query(
      'DELETE FROM product_performances WHERE product_id = ?',
      [id]
    );
    
    // Insérer les nouvelles performances
    for (const [year, performance] of Object.entries(performances)) {
      if (performance) {
        await query(
          'INSERT INTO product_performances (product_id, year, performance) VALUES (?, ?, ?)',
          [id, parseInt(year), performance]
        );
      }
    }
    
    res.json({ message: 'Produit mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur update product:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du produit' 
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Supprimer un produit financier
// @access  Private (Admin seulement)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le produit existe
    const existingProducts = await query(
      'SELECT id FROM financial_products WHERE id = ?',
      [id]
    );
    
    if (existingProducts.length === 0) {
      return res.status(404).json({ 
        error: 'Produit non trouvé' 
      });
    }
    
    // Supprimer le produit (les performances seront supprimées automatiquement par CASCADE)
    await query(
      'DELETE FROM financial_products WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete product:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du produit' 
    });
  }
});

// @route   GET /api/products/categories/list
// @desc    Obtenir la liste des catégories de produits
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await query(
      'SELECT DISTINCT classe as category FROM financial_products WHERE classe IS NOT NULL ORDER BY classe'
    );
    
    res.json(categories.map(cat => cat.category));
  } catch (error) {
    console.error('Erreur get categories:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des catégories' 
    });
  }
});

module.exports = router;



