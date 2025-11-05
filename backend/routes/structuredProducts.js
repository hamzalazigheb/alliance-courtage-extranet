const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { notifyAdmins } = require('./notifications');

const router = express.Router();

// Configuration de multer pour l'upload de fichiers produits structurés en mémoire (base64)
const storage = multer.memoryStorage();

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

// Middleware pour gérer les erreurs multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux. Taille maximale: 50MB' });
    }
    return res.status(400).json({ error: 'Erreur upload fichier: ' + err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message || 'Erreur upload fichier' });
  }
  next();
};

// @route   GET /api/structured-products
// @desc    Obtenir tous les produits structurés
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { assurance, category, search } = req.query;
    
    let sql = `
      SELECT a.*, u.nom as uploaded_by_nom, u.prenom as uploaded_by_prenom,
             CASE WHEN a.file_content IS NOT NULL THEN 1 ELSE 0 END as has_file_content
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
    
    const host = `${req.protocol}://${req.get('host')}`;
    
    // Ajouter fileUrl pour chaque produit
    const productsWithFileUrl = products.map(product => ({
      ...product,
      fileUrl: product.has_file_content 
        ? `${host}/api/structured-products/${product.id}/download`
        : (product.file_path ? `${host}${product.file_path}` : null)
    }));
    
    res.json(productsWithFileUrl);
  } catch (error) {
    console.error('Erreur get structured products:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des produits structurés' 
    });
  }
});

// @route   POST /api/structured-products
// @desc    Créer un nouveau produit structuré (avec upload de fichier en base64)
// @access  Private (Admin seulement)
router.post('/', auth, authorize('admin'), upload.single('file'), handleMulterError, async (req, res) => {
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
    
    // Check if buffer exists
    if (!req.file.buffer) {
      return res.status(400).json({ 
        error: 'Erreur: fichier non reçu correctement' 
      });
    }
    
    // Validation des données requises
    if (!title || !assurance || !category) {
      return res.status(400).json({ 
        error: 'Titre, assurance et catégorie requis' 
      });
    }
    
    // Convert file buffer to base64
    const fileBase64 = req.file.buffer.toString('base64');
    const base64Prefix = `data:${req.file.mimetype};base64,`;
    const fileContent = base64Prefix + fileBase64;
    
    const host = `${req.protocol}://${req.get('host')}`;
    
    // Créer le produit structuré avec file_content (base64)
    const result = await query(
      `INSERT INTO archives 
       (title, description, file_path, file_content, file_size, file_type, category, assurance, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || '',
        '', // file_path is empty string when using base64
        fileContent, // Store base64 encoded file
        req.file.size,
        req.file.mimetype,
        category,
        assurance,
        req.user.id
      ]
    );
    
    const fileUrl = `${host}/api/structured-products/${result.insertId}/download`;
    
    // Notifier tous les utilisateurs (via notification globale)
    await notifyAdmins(
      'product',
      'Nouveau produit structuré',
      `Un nouveau produit structuré "${title}" a été ajouté dans la catégorie ${category}.`,
      result.insertId,
      'structured_product'
    );

    console.log('✅ Structured product created:', { id: result.insertId, title, category, assurance });
    
    res.status(201).json({
      message: 'Produit structuré créé avec succès',
      productId: result.insertId,
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('Erreur create structured product:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du produit structuré',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

// @route   GET /api/structured-products/:id/download
// @desc    Télécharger le fichier d'un produit structuré (base64)
// @access  Public
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le produit
    const products = await query(
      'SELECT file_content, file_type, title, file_path FROM archives WHERE id = ?',
      [id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ error: 'Produit structuré non trouvé' });
    }
    
    const product = products[0];
    
    // Si file_content existe (base64), le décoder et servir
    if (product.file_content) {
      // Extraire le base64 du data URL
      const base64Data = product.file_content.replace(/^data:.*,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      // Déterminer le type MIME
      const mimeMatch = product.file_content.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : product.file_type || 'application/octet-stream';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${product.title || 'product'}.${mimeType.split('/')[1] || 'pdf'}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      return res.send(fileBuffer);
    }
    
    // Fallback pour les anciens fichiers stockés sur disque
    if (product.file_path && fs.existsSync(product.file_path)) {
      return res.download(product.file_path);
    }
    
    return res.status(404).json({ error: 'Fichier non trouvé' });
  } catch (error) {
    console.error('Erreur download structured product:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du téléchargement du produit structuré' 
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
      'SELECT file_path, file_content FROM archives WHERE id = ?',
      [id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ 
        error: 'Produit structuré non trouvé' 
      });
    }
    
    // Supprimer le fichier physique si il existe (pour les anciens fichiers)
    const filePath = products[0].file_path;
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.warn('Warning: Could not delete physical file:', unlinkError);
      }
    }
    
    // file_content (base64) sera automatiquement supprimé avec la ligne en base de données
    
    // Supprimer le produit de la base de données
    await query(
      'DELETE FROM archives WHERE id = ?',
      [id]
    );
    
    console.log(`✅ Structured product ${id} deleted successfully`);
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
      'SELECT id, title, assurance FROM archives WHERE id = ?',
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

// @route   GET /api/structured-products/reservations/all
// @desc    Récupérer toutes les réservations (Admin seulement)
// @access  Private (Admin seulement)
router.get('/reservations/all', auth, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;
    
    let sql = `
      SELECT pr.*, 
             u.nom, u.prenom, u.email,
             a.title as product_title, a.assurance, a.category
      FROM product_reservations pr
      LEFT JOIN users u ON pr.user_id = u.id
      LEFT JOIN archives a ON pr.product_id = a.id
    `;
    
    const params = [];
    if (status) {
      sql += ' WHERE pr.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY pr.created_at DESC';
    
    const reservations = await query(sql, params);
    
    res.json(reservations);
  } catch (error) {
    console.error('Erreur get all reservations:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des réservations' 
    });
  }
});

// @route   PUT /api/structured-products/reservations/:id/approve
// @desc    Approuver une réservation (Admin seulement)
// @access  Private (Admin seulement)
router.put('/reservations/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    
    // Vérifier que la réservation existe
    const reservations = await query(
      `SELECT pr.*, u.nom, u.prenom, u.email, u.id as user_id,
              a.title as product_title, a.assurance
       FROM product_reservations pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN archives a ON pr.product_id = a.id
       WHERE pr.id = ?`,
      [reservationId]
    );
    
    if (reservations.length === 0) {
      return res.status(404).json({ 
        error: 'Réservation non trouvée' 
      });
    }
    
    const reservation = reservations[0];
    
    // Vérifier que la réservation n'est pas déjà approuvée/rejetée
    if (reservation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cette réservation a déjà été ${reservation.status === 'approved' ? 'approuvée' : 'rejetée'}` 
      });
    }
    
    // Approuver la réservation
    await query(
      `UPDATE product_reservations 
       SET status = 'approved', 
           updated_at = NOW() 
       WHERE id = ?`,
      [reservationId]
    );
    
    // Notifier l'utilisateur (notification dans l'app)
    const { createNotification } = require('./notifications');
    const montantFormatted = new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(parseFloat(reservation.montant));
    
    await createNotification(
      'reservation',
      'Réservation approuvée',
      `Votre réservation de ${montantFormatted} pour le produit "${reservation.product_title}" a été approuvée.`,
      reservation.user_id,
      reservationId,
      'product_reservation'
    );
    
    // Envoyer un email à l'utilisateur
    try {
      if (!reservation.email) {
        console.warn(`⚠️  Impossible d'envoyer l'email : utilisateur #${reservation.user_id} n'a pas d'email`);
      } else {
        const { sendReservationApprovedEmail } = require('../services/emailService');
        const userName = `${reservation.prenom} ${reservation.nom}`;
        console.log(`📧 Envoi email d'approbation à ${reservation.email} pour la réservation #${reservationId}`);
        const emailResult = await sendReservationApprovedEmail(
          reservation.email,
          userName,
          reservation.product_title,
          parseFloat(reservation.montant)
        );
        console.log(`✅ Email d'approbation envoyé avec succès à ${reservation.email}`, emailResult);
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email d\'approbation:', emailError);
      console.error('Détails:', {
        message: emailError.message,
        stack: emailError.stack,
        email: reservation.email,
        userName: `${reservation.prenom} ${reservation.nom}`
      });
      // Ne pas bloquer la réponse si l'email échoue
    }
    
    res.json({
      message: 'Réservation approuvée avec succès'
    });
  } catch (error) {
    console.error('Erreur approve reservation:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'approbation de la réservation' 
    });
  }
});

// @route   PUT /api/structured-products/reservations/:id/reject
// @desc    Rejeter une réservation (Admin seulement)
// @access  Private (Admin seulement)
router.put('/reservations/:id/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const reservationId = parseInt(req.params.id);
    const { reason } = req.body;
    
    // Vérifier que la réservation existe
    const reservations = await query(
      `SELECT pr.*, u.nom, u.prenom, u.email, u.id as user_id,
              a.title as product_title, a.assurance
       FROM product_reservations pr
       LEFT JOIN users u ON pr.user_id = u.id
       LEFT JOIN archives a ON pr.product_id = a.id
       WHERE pr.id = ?`,
      [reservationId]
    );
    
    if (reservations.length === 0) {
      return res.status(404).json({ 
        error: 'Réservation non trouvée' 
      });
    }
    
    const reservation = reservations[0];
    
    // Vérifier que la réservation n'est pas déjà approuvée/rejetée
    if (reservation.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cette réservation a déjà été ${reservation.status === 'approved' ? 'approuvée' : 'rejetée'}` 
      });
    }
    
    // Rejeter la réservation
    await query(
      `UPDATE product_reservations 
       SET status = 'rejected', 
           updated_at = NOW() 
       WHERE id = ?`,
      [reservationId]
    );
    
    // Notifier l'utilisateur (notification dans l'app)
    const { createNotification } = require('./notifications');
    const montantFormatted = new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(parseFloat(reservation.montant));
    
    const rejectionMessage = reason 
      ? `Votre réservation de ${montantFormatted} pour le produit "${reservation.product_title}" a été rejetée. Raison: ${reason}`
      : `Votre réservation de ${montantFormatted} pour le produit "${reservation.product_title}" a été rejetée.`;
    
    await createNotification(
      'reservation',
      'Réservation rejetée',
      rejectionMessage,
      reservation.user_id,
      reservationId,
      'product_reservation'
    );
    
    // Envoyer un email à l'utilisateur
    try {
      const { sendReservationRejectedEmail } = require('../services/emailService');
      const userName = `${reservation.prenom} ${reservation.nom}`;
      await sendReservationRejectedEmail(
        reservation.email,
        userName,
        reservation.product_title,
        parseFloat(reservation.montant),
        reason || null
      );
    } catch (emailError) {
      console.error('Erreur envoi email de rejet:', emailError);
      // Ne pas bloquer la réponse si l'email échoue
    }
    
    res.json({
      message: 'Réservation rejetée avec succès'
    });
  } catch (error) {
    console.error('Erreur reject reservation:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du rejet de la réservation' 
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
          // Calculer le montant réservé (seulement les réservations approuvées) pour cette assurance
          const reservations = await query(
            `SELECT COALESCE(SUM(pr.montant), 0) as total_reserve
             FROM product_reservations pr
             INNER JOIN archives a ON pr.product_id = a.id
             WHERE a.assurance = ? AND pr.status = 'approved'`,
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
          console.error(`Erreur calcul montant pour ${assurance.name}:`, error);
          // Si la table product_reservations n'existe pas encore ou erreur
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
      console.error('Erreur fallback get montants:', fallbackError);
      res.status(500).json({ 
        error: 'Erreur serveur lors de la récupération des montants' 
      });
    }
  }
});

module.exports = router;









