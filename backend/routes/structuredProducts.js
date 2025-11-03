const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { notifyAdmins } = require('./notifications');

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
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB par défaut
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
// @desc    Obtenir la liste des assurances (depuis la table assurances)
// @access  Public
router.get('/assurances', async (req, res) => {
  try {
    // Récupérer depuis la table assurances au lieu de archives
    const assurances = await query(
      `SELECT id, name, montant_enveloppe, color, icon, is_active 
       FROM assurances 
       WHERE is_active = TRUE 
       ORDER BY name`
    );
    
    res.json(assurances);
  } catch (error) {
    console.error('Erreur get assurances:', error);
    // Fallback : récupérer depuis archives si la table assurances n'existe pas
    try {
      const fallbackAssurances = await query(
        `SELECT DISTINCT assurance as name FROM archives 
         WHERE assurance IS NOT NULL 
         AND category IN ('Épargne', 'Retraite', 'Prévoyance', 'Santé', 'CIF', 'Investissements')
         ORDER BY assurance`
      );
      res.json(fallbackAssurances.map(a => ({ name: a.name })));
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Erreur serveur lors de la récupération des assurances' 
      });
    }
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

// @route   POST /api/structured-products/:id/reservations
// @desc    Créer une réservation de montant pour un produit structuré
// @access  Private
router.post('/:id/reservations', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { montant, notes } = req.body;
    
    // Validation
    if (!montant || isNaN(montant) || parseFloat(montant) <= 0) {
      return res.status(400).json({ 
        error: 'Montant invalide. Le montant doit être un nombre positif.' 
      });
    }
    
    // Vérifier que le produit existe
    const products = await query(
      'SELECT id, title FROM archives WHERE id = ?',
      [id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ 
        error: 'Produit structuré non trouvé' 
      });
    }
    
    const product = products[0];
    
    // Récupérer les informations de l'utilisateur
    const users = await query(
      'SELECT id, nom, prenom, email FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    const user = users[0];
    
    // Créer la réservation
    const result = await query(
      `INSERT INTO product_reservations (product_id, user_id, montant, notes, status) 
       VALUES (?, ?, ?, ?, 'pending')`,
      [id, req.user.id, parseFloat(montant), notes || null]
    );
    
    // Notifier les admins
    const userName = `${user.prenom} ${user.nom}`;
    const montantFormatted = new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(parseFloat(montant));
    
    await notifyAdmins(
      'reservation',
      'Nouvelle réservation de produit',
      `${userName} a réservé ${montantFormatted} pour le produit "${product.title}"`,
      result.insertId,
      'product_reservation'
    );
    
    res.status(201).json({
      message: 'Réservation créée avec succès',
      reservationId: result.insertId
    });
  } catch (error) {
    console.error('Erreur create reservation:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de la réservation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/structured-products/:id/reservations
// @desc    Récupérer les réservations d'un produit structuré
// @access  Private (Admin seulement)
router.get('/:id/reservations', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const reservations = await query(
      `SELECT pr.*, u.nom, u.prenom, u.email, a.title as product_title
       FROM product_reservations pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN archives a ON pr.product_id = a.id
       WHERE pr.product_id = ?
       ORDER BY pr.created_at DESC`,
      [id]
    );
    
    res.json(reservations);
  } catch (error) {
    console.error('Erreur get reservations:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des réservations' 
    });
  }
});

// @route   GET /api/structured-products/reservations/my
// @desc    Récupérer les réservations de l'utilisateur connecté
// @access  Private
router.get('/reservations/my', auth, async (req, res) => {
  try {
    const reservations = await query(
      `SELECT pr.*, a.title as product_title, a.assurance
       FROM product_reservations pr
       LEFT JOIN archives a ON pr.product_id = a.id
       WHERE pr.user_id = ?
       ORDER BY pr.created_at DESC`,
      [req.user.id]
    );
    
    res.json(reservations);
  } catch (error) {
    console.error('Erreur get my reservations:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération de vos réservations' 
    });
  }
});

// @route   GET /api/structured-products/assurances/montants
// @desc    Obtenir les montants enveloppe et réservés par assurance
// @access  Public
router.get('/assurances/montants', async (req, res) => {
  try {
    // Récupérer toutes les assurances avec leur montant enveloppe
    const assurances = await query(
      `SELECT id, name, montant_enveloppe 
       FROM assurances 
       WHERE is_active = TRUE`
    );

    // Pour chaque assurance, calculer le montant total réservé
    const result = await Promise.all(
      assurances.map(async (assurance) => {
        try {
          const reservations = await query(
            `SELECT COALESCE(SUM(pr.montant), 0) as total_reserve
             FROM product_reservations pr
             INNER JOIN archives a ON pr.product_id = a.id
             WHERE a.assurance = ? AND pr.status = 'pending'`,
            [assurance.name]
          );

          const totalReserve = parseFloat(reservations[0]?.total_reserve || 0);
          const montantRestant = parseFloat(assurance.montant_enveloppe) - totalReserve;

          return {
            assurance: assurance.name,
            montant_enveloppe: parseFloat(assurance.montant_enveloppe),
            montant_reserve: totalReserve,
            montant_restant: montantRestant
          };
        } catch (error) {
          // Si la table product_reservations n'existe pas encore
          return {
            assurance: assurance.name,
            montant_enveloppe: parseFloat(assurance.montant_enveloppe),
            montant_reserve: 0,
            montant_restant: parseFloat(assurance.montant_enveloppe)
          };
        }
      })
    );

    res.json(result);
  } catch (error) {
    console.error('Erreur get montants assurances:', error);
    // Fallback : retourner juste les montants enveloppe
    try {
      const assurances = await query(
        `SELECT name, montant_enveloppe 
         FROM assurances 
         WHERE is_active = TRUE`
      );
      res.json(assurances.map(a => ({
        assurance: a.name,
        montant_enveloppe: parseFloat(a.montant_enveloppe),
        montant_reserve: 0,
        montant_restant: parseFloat(a.montant_enveloppe)
      })));
    } catch (fallbackError) {
      res.status(500).json({ 
        error: 'Erreur serveur lors de la récupération des montants' 
      });
    }
  }
});

module.exports = router;









