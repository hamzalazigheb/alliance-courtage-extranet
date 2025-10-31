const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload de fichiers produits structurés
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const structuredProductsPath = path.join(uploadPath, 'structured-products');
    
    if (!fs.existsSync(structuredProductsPath)) {
      fs.mkdirSync(structuredProductsPath, { recursive: true });
    }
    cb(null, structuredProductsPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const assurance = req.body.assurance || 'unknown';
    const safeAssurance = assurance.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `product_${safeAssurance}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB par défaut
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les documents de produits structurés
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé pour les produits structurés'));
    }
  }
});

// @route   GET /api/structured-products
// @desc    Obtenir tous les produits structurés
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { assurance, category, search } = req.query;
    
    let sql = `
      SELECT a.*, u.nom as uploaded_by_nom, u.prenom as uploaded_by_prenom
      FROM archives a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements')
    `;
    
    const conditions = [];
    const params = [];
    
    if (assurance) {
      conditions.push('a.assurance = ?');
      params.push(assurance);
    }
    
    if (category) {
      conditions.push('a.category = ?');
      params.push(category);
    }
    
    if (search) {
      conditions.push('(a.title LIKE ? OR a.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY a.created_at DESC';
    
    const products = await query(sql, params);
    
    res.json(products);
  } catch (error) {
    console.error('Erreur get structured products:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des produits structurés' 
    });
  }
});

// @route   POST /api/structured-products
// @desc    Créer un nouveau produit structuré (avec upload de fichier)
// @access  Private (Admin seulement)
router.post('/', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const {
      title,
      description,
      assurance,
      category
    } = req.body;
    
    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Fichier requis' 
      });
    }
    
    // Validation des données requises
    if (!title || !assurance || !category) {
      return res.status(400).json({ 
        error: 'Titre, assurance et catégorie requis' 
      });
    }
    
    // Créer le produit structuré
    const result = await query(
      `INSERT INTO archives 
       (title, description, file_path, file_size, file_type, category, assurance, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        category,
        assurance,
        req.user.id
      ]
    );
    
    res.status(201).json({
      message: 'Produit structuré créé avec succès',
      productId: result.insertId
    });
  } catch (error) {
    console.error('Erreur create structured product:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du produit structuré' 
    });
  }
});

// @route   GET /api/structured-products/assurances
// @desc    Obtenir la liste des assurances
// @access  Public
router.get('/assurances', async (req, res) => {
  try {
    const assurances = await query(
      `SELECT DISTINCT assurance FROM archives 
       WHERE assurance IS NOT NULL 
       AND category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements')
       ORDER BY assurance`
    );
    
    res.json(assurances.map(a => a.assurance));
  } catch (error) {
    console.error('Erreur get assurances:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des assurances' 
    });
  }
});

// @route   GET /api/structured-products/categories
// @desc    Obtenir la liste des catégories de produits structurés
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(
      `SELECT DISTINCT category FROM archives 
       WHERE category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements')
       ORDER BY category`
    );
    
    res.json(categories.map(c => c.category));
  } catch (error) {
    console.error('Erreur get categories:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des catégories' 
    });
  }
});

// @route   DELETE /api/structured-products/:id
// @desc    Supprimer un produit structuré
// @access  Private (Admin seulement)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer les informations du produit
    const products = await query(
      'SELECT file_path FROM archives WHERE id = ?',
      [id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ 
        error: 'Produit structuré non trouvé' 
      });
    }
    
    // Supprimer le fichier physique
    const filePath = products[0].file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Supprimer le produit de la base de données
    await query(
      'DELETE FROM archives WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Produit structuré supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete structured product:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du produit structuré' 
    });
  }
});

module.exports = router;








