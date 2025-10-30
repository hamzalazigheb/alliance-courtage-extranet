const express = require('express');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/news
// @desc    Obtenir toutes les actualités
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, limit = 10, offset = 0, published = true } = req.query;
    
    let sql = `
      SELECT n.*, u.nom as author_nom, u.prenom as author_prenom
      FROM news n
      LEFT JOIN users u ON n.author_id = u.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (published === 'true') {
      conditions.push('n.is_published = TRUE');
    }
    
    if (category) {
      conditions.push('n.category = ?');
      params.push(category);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY n.published_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const news = await query(sql, params);
    
    res.json(news);
  } catch (error) {
    console.error('Erreur get news:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des actualités' 
    });
  }
});

// @route   GET /api/news/:id
// @desc    Obtenir une actualité par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const news = await query(
      `SELECT n.*, u.nom as author_nom, u.prenom as author_prenom
       FROM news n
       LEFT JOIN users u ON n.author_id = u.id
       WHERE n.id = ?`,
      [id]
    );
    
    if (news.length === 0) {
      return res.status(404).json({ 
        error: 'Actualité non trouvée' 
      });
    }
    
    res.json(news[0]);
  } catch (error) {
    console.error('Erreur get news item:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération de l\'actualité' 
    });
  }
});

// @route   POST /api/news
// @desc    Créer une nouvelle actualité
// @access  Private (Admin seulement)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      category,
      is_published = true
    } = req.body;
    
    // Validation des données requises
    if (!title || !content) {
      return res.status(400).json({ 
        error: 'Titre et contenu sont requis' 
      });
    }
    
    // Créer l'actualité
    const result = await query(
      `INSERT INTO news (title, content, excerpt, author_id, category, is_published) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, content, excerpt, req.user.id, category, is_published]
    );
    
    res.status(201).json({
      message: 'Actualité créée avec succès',
      newsId: result.insertId
    });
  } catch (error) {
    console.error('Erreur create news:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de l\'actualité' 
    });
  }
});

// @route   PUT /api/news/:id
// @desc    Mettre à jour une actualité
// @access  Private (Admin seulement)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      excerpt,
      category,
      is_published
    } = req.body;
    
    // Vérifier que l'actualité existe
    const existingNews = await query(
      'SELECT id FROM news WHERE id = ?',
      [id]
    );
    
    if (existingNews.length === 0) {
      return res.status(404).json({ 
        error: 'Actualité non trouvée' 
      });
    }
    
    // Mettre à jour l'actualité
    await query(
      `UPDATE news 
       SET title = ?, content = ?, excerpt = ?, category = ?, is_published = ?
       WHERE id = ?`,
      [title, content, excerpt, category, is_published, id]
    );
    
    res.json({ message: 'Actualité mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur update news:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour de l\'actualité' 
    });
  }
});

// @route   DELETE /api/news/:id
// @desc    Supprimer une actualité
// @access  Private (Admin seulement)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'actualité existe
    const existingNews = await query(
      'SELECT id FROM news WHERE id = ?',
      [id]
    );
    
    if (existingNews.length === 0) {
      return res.status(404).json({ 
        error: 'Actualité non trouvée' 
      });
    }
    
    // Supprimer l'actualité
    await query(
      'DELETE FROM news WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Actualité supprimée avec succès' });
  } catch (error) {
    console.error('Erreur delete news:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression de l\'actualité' 
    });
  }
});

// @route   GET /api/news/categories/list
// @desc    Obtenir la liste des catégories d'actualités
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await query(
      'SELECT DISTINCT category FROM news WHERE category IS NOT NULL ORDER BY category'
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



