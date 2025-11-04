const express = require('express');
const { query } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/favoris
// @desc    Obtenir tous les favoris de l'utilisateur connecté
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type } = req.query;
    
    let sql = 'SELECT * FROM `favoris` WHERE user_id = ?';
    const params = [req.user.id];
    
    if (type) {
      sql += ' AND item_type = ?';
      params.push(type);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const favoris = await query(sql, params);
    
    res.json(favoris);
  } catch (error) {
    console.error('Erreur get favoris:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des favoris' 
    });
  }
});

// @route   GET /api/favoris/check
// @desc    Vérifier si un élément est en favoris
// @access  Private
router.get('/check', auth, async (req, res) => {
  try {
    const { type, item_id } = req.query;
    
    if (!type || !item_id) {
      return res.status(400).json({ 
        error: 'type et item_id sont requis' 
      });
    }
    
    const favoris = await query(
      'SELECT id FROM `favoris` WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [req.user.id, type, item_id]
    );
    
    res.json({ 
      isFavorite: favoris.length > 0,
      favoriteId: favoris.length > 0 ? favoris[0].id : null
    });
  } catch (error) {
    console.error('Erreur check favoris:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la vérification des favoris' 
    });
  }
});

// @route   POST /api/favoris
// @desc    Ajouter un élément aux favoris
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      item_type,
      item_id,
      title,
      description,
      url,
      metadata
    } = req.body;
    
    if (!item_type || !item_id || !title) {
      return res.status(400).json({ 
        error: 'item_type, item_id et title sont requis' 
      });
    }
    
    // Vérifier si déjà en favoris
    const existing = await query(
      'SELECT id FROM `favoris` WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [req.user.id, item_type, item_id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Cet élément est déjà dans vos favoris' 
      });
    }
    
    const result = await query(
      `INSERT INTO \`favoris\` (user_id, item_type, item_id, title, description, url, metadata) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        item_type,
        item_id,
        title,
        description || '',
        url || '',
        metadata ? JSON.stringify(metadata) : null
      ]
    );
    
    const newFavorite = await query(
      'SELECT * FROM `favoris` WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(newFavorite[0]);
  } catch (error) {
    console.error('Erreur add favoris:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ 
        error: 'Cet élément est déjà dans vos favoris' 
      });
    }
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'ajout aux favoris' 
    });
  }
});

// @route   DELETE /api/favoris/:id
// @desc    Supprimer un favori
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le favori appartient à l'utilisateur
    const favoris = await query(
      'SELECT id FROM `favoris` WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (favoris.length === 0) {
      return res.status(404).json({ 
        error: 'Favori non trouvé ou accès refusé' 
      });
    }
    
    await query('DELETE FROM `favoris` WHERE id = ?', [id]);
    
    res.json({ message: 'Favori supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete favoris:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du favori' 
    });
  }
});

// @route   DELETE /api/favoris/remove
// @desc    Supprimer un favori par type et item_id
// @access  Private
router.delete('/remove', auth, async (req, res) => {
  try {
    const { type, item_id } = req.body;
    
    if (!type || !item_id) {
      return res.status(400).json({ 
        error: 'type et item_id sont requis' 
      });
    }
    
    const result = await query(
      'DELETE FROM `favoris` WHERE user_id = ? AND item_type = ? AND item_id = ?',
      [req.user.id, type, item_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: 'Favori non trouvé' 
      });
    }
    
    res.json({ message: 'Favori supprimé avec succès' });
  } catch (error) {
    console.error('Erreur remove favoris:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du favori' 
    });
  }
});

module.exports = router;

