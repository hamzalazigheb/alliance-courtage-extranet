const express = require('express');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/assurances
// @desc    Obtenir toutes les assurances (actives seulement pour public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { include_inactive } = req.query;
    let sql = 'SELECT * FROM assurances';
    const params = [];

    // Si ce n'est pas un admin, ne montrer que les actives
    if (!include_inactive || include_inactive !== 'true') {
      sql += ' WHERE is_active = TRUE';
    }

    sql += ' ORDER BY name ASC';

    const assurances = await query(sql, params);
    res.json(assurances);
  } catch (error) {
    console.error('Erreur get assurances:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des assurances' 
    });
  }
});

// @route   GET /api/assurances/:id
// @desc    Obtenir une assurance par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assurances = await query(
      'SELECT * FROM assurances WHERE id = ?',
      [id]
    );

    if (assurances.length === 0) {
      return res.status(404).json({ 
        error: 'Assurance non trouvée' 
      });
    }

    res.json(assurances[0]);
  } catch (error) {
    console.error('Erreur get assurance:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération de l\'assurance' 
    });
  }
});

// @route   POST /api/assurances
// @desc    Créer une nouvelle assurance
// @access  Private (Admin seulement)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { name, montant_enveloppe, color, icon, description, is_active } = req.body;

    if (!name) {
      return res.status(400).json({ 
        error: 'Le nom de l\'assurance est requis' 
      });
    }

    // Vérifier si l'assurance existe déjà
    const existing = await query(
      'SELECT id FROM assurances WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Cette assurance existe déjà' 
      });
    }

    const result = await query(
      `INSERT INTO assurances (name, montant_enveloppe, color, icon, description, is_active) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name,
        parseFloat(montant_enveloppe) || 0,
        color || 'gray',
        icon || '📄',
        description || null,
        is_active !== undefined ? is_active : true
      ]
    );

    res.status(201).json({
      message: 'Assurance créée avec succès',
      assuranceId: result.insertId
    });
  } catch (error) {
    console.error('Erreur create assurance:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de l\'assurance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/assurances/:id
// @desc    Mettre à jour une assurance
// @access  Private (Admin seulement)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, montant_enveloppe, color, icon, description, is_active } = req.body;

    // Vérifier si l'assurance existe
    const existing = await query(
      'SELECT id FROM assurances WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        error: 'Assurance non trouvée' 
      });
    }

    // Si le nom change, vérifier qu'il n'existe pas déjà
    if (name) {
      const nameCheck = await query(
        'SELECT id FROM assurances WHERE name = ? AND id != ?',
        [name, id]
      );

      if (nameCheck.length > 0) {
        return res.status(400).json({ 
          error: 'Ce nom d\'assurance est déjà utilisé' 
        });
      }
    }

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (montant_enveloppe !== undefined) {
      updates.push('montant_enveloppe = ?');
      params.push(parseFloat(montant_enveloppe) || 0);
    }
    if (color !== undefined) {
      updates.push('color = ?');
      params.push(color);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      params.push(icon);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ 
        error: 'Aucun champ à mettre à jour' 
      });
    }

    params.push(id);

    await query(
      `UPDATE assurances SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ message: 'Assurance mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur update assurance:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour de l\'assurance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   DELETE /api/assurances/:id
// @desc    Supprimer une assurance
// @access  Private (Admin seulement)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'assurance existe
    const existing = await query(
      'SELECT id, name FROM assurances WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        error: 'Assurance non trouvée' 
      });
    }

    const assuranceName = existing[0].name;

    // Vérifier si des produits utilisent cette assurance dans archives
    let productsCount = 0;
    try {
      const products = await query(
        'SELECT COUNT(*) as count FROM archives WHERE assurance = ?',
        [assuranceName]
      );
      productsCount = products[0]?.count || 0;
    } catch (checkError) {
      console.error('Erreur lors de la vérification des produits archives:', checkError);
      // Si la colonne n'existe pas ou autre erreur, on continue quand même
    }

    // Vérifier aussi dans structured_products si la table existe
    try {
      const structuredProducts = await query(
        'SELECT COUNT(*) as count FROM structured_products WHERE assurance = ?',
        [assuranceName]
      );
      productsCount += structuredProducts[0]?.count || 0;
    } catch (checkError) {
      // Table might not exist, ignore
      console.log('Note: structured_products table might not exist or column differs');
    }

    if (productsCount > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer cette assurance. ${productsCount} produit(s) l'utilise(nt) encore.` 
      });
    }

    // Supprimer l'assurance
    await query('DELETE FROM assurances WHERE id = ?', [id]);

    console.log(`✅ Assurance ${id} (${assuranceName}) supprimée avec succès`);
    res.json({ message: 'Assurance supprimée avec succès' });
  } catch (error) {
    console.error('❌ Erreur delete assurance:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression de l\'assurance',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;


