const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/cms/home
// @desc    Get CMS content for home page
// @access  Private
router.get('/home', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['home']
    );
    
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      // Return empty/default content if not found
      res.json({ 
        page: 'home',
        content: JSON.stringify({
          welcomeTitle: 'Bienvenue chez Alliance Courtage',
          news: [],
          newsletter: null,
          services: [],
          contact: {
            phone: '',
            email: '',
            location: ''
          }
        })
      });
    }
  } catch (error) {
    console.error('Erreur get CMS content:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du contenu CMS' 
    });
  }
});

// @route   PUT /api/cms/home
// @desc    Update CMS content for home page
// @access  Private
router.put('/home', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    // Check if content exists
    const existing = await query(
      'SELECT id FROM cms_content WHERE page = ?',
      ['home']
    );
    
    if (existing.length > 0) {
      // Update existing
      await query(
        'UPDATE cms_content SET content = ?, updated_at = NOW() WHERE page = ?',
        [content, 'home']
      );
      res.json({ message: 'Contenu CMS mis à jour avec succès' });
    } else {
      // Insert new
      await query(
        'INSERT INTO cms_content (page, content, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        ['home', content]
      );
      res.json({ message: 'Contenu CMS créé avec succès' });
    }
  } catch (error) {
    console.error('Erreur update CMS content:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du contenu CMS' 
    });
  }
});

module.exports = router;

// --- Gamme Produits CMS ---
// @route   GET /api/cms/gamme-produits
// @desc    Get CMS content for Gamme Produits page
// @access  Private
router.get('/gamme-produits', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['gamme-produits']
    );

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json({
        page: 'gamme-produits',
        content: JSON.stringify({
          title: 'Gamme Produits',
          subtitle: 'Découvrez nos solutions adaptées à chaque type de client et de produit',
          catalogue: {
            title: 'Téléchargez notre catalogue produits',
            badge: 'Catalogue 2025',
            description: "Découvrez notre gamme complète de produits d'assurance et d'investissement pour tous vos besoins.",
            fileUrl: '/catalogue-produits-2025.pdf',
            updatedAtLabel: 'Mise à jour 2025',
            downloadLabel: 'Télécharger le PDF'
          },
          products: {
            particulier: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
            professionnel: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
            entreprise: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] }
          }
        })
      });
    }
  } catch (error) {
    console.error('Erreur get CMS content (gamme-produits):', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération du contenu CMS (gamme-produits)'
    });
  }
});

// @route   PUT /api/cms/gamme-produits
// @desc    Update CMS content for Gamme Produits page
// @access  Private
router.put('/gamme-produits', auth, async (req, res) => {
  try {
    const { content } = req.body;

    const existing = await query(
      'SELECT id FROM cms_content WHERE page = ?',
      ['gamme-produits']
    );

    if (existing.length > 0) {
      await query(
        'UPDATE cms_content SET content = ?, updated_at = NOW() WHERE page = ?',
        [content, 'gamme-produits']
      );
      res.json({ message: 'Contenu CMS (gamme-produits) mis à jour avec succès' });
    } else {
      await query(
        'INSERT INTO cms_content (page, content, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        ['gamme-produits', content]
      );
      res.json({ message: 'Contenu CMS (gamme-produits) créé avec succès' });
    }
  } catch (error) {
    console.error('Erreur update CMS content (gamme-produits):', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la mise à jour du contenu CMS (gamme-produits)'
    });
  }
});

