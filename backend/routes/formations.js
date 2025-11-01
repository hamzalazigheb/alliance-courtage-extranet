const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { notifyAdmins, createNotification } = require('./notifications');

const router = express.Router();

// Configuration de multer pour l'upload de fichiers de formations
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/formations');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'formation-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, JPEG, PNG'));
    }
  }
});

// Middleware pour gérer les erreurs multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux. Taille maximale: 10MB' });
    }
    return res.status(400).json({ error: 'Erreur upload fichier: ' + err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message || 'Erreur upload fichier' });
  }
  next();
};

// @route   POST /api/formations
// @desc    Soumettre une nouvelle formation
// @access  Private
router.post('/', auth, upload.single('file'), handleMulterError, async (req, res) => {
  try {
    console.log('📝 Formation submission received:', {
      body: req.body,
      file: req.file ? { name: req.file.filename, size: req.file.size } : null,
      user: req.user ? { id: req.user.id, role: req.user.role } : null
    });

    const {
      nom_document,
      date,
      heures,
      categories,
      delivree_par,
      year
    } = req.body;
    
    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Fichier requis' 
      });
    }
    
    // Validation des données requises
    if (!nom_document || !date || !heures || !categories || !year) {
      console.error('❌ Missing required fields:', { nom_document, date, heures, categories, year });
      return res.status(400).json({ 
        error: 'Tous les champs sont requis (nom_document, date, heures, categories, year)' 
      });
    }
    
    if (!req.user || !req.user.id) {
      console.error('❌ User not found in request');
      return res.status(401).json({ 
        error: 'Utilisateur non authentifié' 
      });
    }
    
    // Parser categories si c'est une chaîne JSON
    let categoriesArray = [];
    try {
      categoriesArray = typeof categories === 'string' ? JSON.parse(categories) : categories;
      if (!Array.isArray(categoriesArray)) {
        throw new Error('Categories must be an array');
      }
    } catch (e) {
      return res.status(400).json({ 
        error: 'Categories doit être un tableau JSON valide' 
      });
    }
    
    // Obtenir le nom de l'utilisateur
    const userResult = await query(
      'SELECT nom, prenom FROM users WHERE id = ?',
      [req.user.id]
    );
    
    let userName = 'Utilisateur inconnu';
    if (userResult.length > 0) {
      const nom = userResult[0].nom || '';
      const prenom = userResult[0].prenom || '';
      userName = `${prenom} ${nom}`.trim() || nom || prenom || 'Utilisateur inconnu';
    }
    
    // Créer le chemin du fichier
    const filePath = `/uploads/formations/${req.file.filename}`;
    
    // Valider et formater la date (assurez-vous que c'est au format YYYY-MM-DD)
    let formattedDate = date;
    if (date.includes('T')) {
      // Si c'est une date ISO avec heure, extraire juste la date
      formattedDate = date.split('T')[0];
    }
    
    // Créer la formation
    const userId = parseInt(req.user.id) || req.user.id;
    const categoriesJson = JSON.stringify(categoriesArray);
    
    console.log('📋 Prepared data:', {
      userId,
      userName,
      nom_document,
      date: formattedDate,
      heures: parseInt(heures),
      categories: categoriesJson,
      delivree_par: delivree_par || null,
      filePath,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      year: parseInt(year)
    });
    
    const insertParams = [
      userId,
      userName,
      nom_document,
      formattedDate,
      parseInt(heures),
      categoriesJson,
      delivree_par || null,
      filePath,
      req.file.size,
      req.file.mimetype,
      parseInt(year)
    ];
    
    console.log('📊 Inserting formation with params:', insertParams);
    
    const result = await query(
      `INSERT INTO formations 
       (user_id, user_name, nom_document, date, heures, categories, delivree_par, file_path, file_size, file_type, year, statut) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      insertParams
    );
    
    console.log('✅ Formation created successfully with ID:', result.insertId);
    
    // Notifier tous les admins
    try {
      await notifyAdmins(
        'formation_pending',
        'Nouvelle formation en attente',
        `${userName} a soumis une nouvelle formation: "${nom_document}"`,
        result.insertId,
        'formation'
      );
      console.log('✅ Admins notified about new formation');
    } catch (notifError) {
      console.error('⚠️ Error notifying admins (non-blocking):', notifError);
      // Ne pas bloquer la réponse si la notification échoue
    }
    
    res.status(201).json({
      message: 'Formation soumise avec succès. En attente d\'approbation.',
      formationId: result.insertId
    });
  } catch (error) {
    console.error('❌ Erreur submit formation:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la soumission de la formation',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/formations
// @desc    Obtenir les formations de l'utilisateur connecté
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { year, statut } = req.query;
    
    let sql = 'SELECT * FROM formations WHERE user_id = ?';
    const params = [req.user.id];
    
    if (year) {
      sql += ' AND year = ?';
      params.push(parseInt(year));
    }
    
    if (statut) {
      sql += ' AND statut = ?';
      params.push(statut);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const formations = await query(sql, params);
    
    // Parse JSON categories
    const formationsWithParsedCategories = formations.map(formation => ({
      ...formation,
      categories: JSON.parse(formation.categories || '[]')
    }));
    
    res.json(formationsWithParsedCategories);
  } catch (error) {
    console.error('Erreur get formations:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des formations' 
    });
  }
});

// @route   GET /api/formations/pending
// @desc    Obtenir toutes les formations en attente d'approbation (Admin seulement)
// @access  Private (Admin)
router.get('/pending', auth, authorize('admin'), async (req, res) => {
  try {
    const formations = await query(
      `SELECT f.*, 
              CONCAT(COALESCE(u.prenom, ''), ' ', COALESCE(u.nom, '')) as user_name, 
              u.email as user_email 
       FROM formations f
       LEFT JOIN users u ON f.user_id = u.id
       WHERE f.statut = 'pending'
       ORDER BY f.created_at DESC`
    );
    
    // Parse JSON categories
    const formationsWithParsedCategories = formations.map(formation => ({
      ...formation,
      categories: JSON.parse(formation.categories || '[]')
    }));
    
    res.json(formationsWithParsedCategories);
  } catch (error) {
    console.error('Erreur get pending formations:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des formations en attente' 
    });
  }
});

// @route   PUT /api/formations/:id/approve
// @desc    Approuver une formation (Admin seulement)
// @access  Private (Admin)
router.put('/:id/approve', auth, authorize('admin'), async (req, res) => {
  try {
    const formationId = parseInt(req.params.id);
    
    // Vérifier que la formation existe
    const formation = await query(
      'SELECT * FROM formations WHERE id = ?',
      [formationId]
    );
    
    if (formation.length === 0) {
      return res.status(404).json({ 
        error: 'Formation non trouvée' 
      });
    }
    
    // Approuver la formation
    await query(
      `UPDATE formations 
       SET statut = 'approved', 
           approved_by = ?, 
           approved_at = NOW() 
       WHERE id = ?`,
      [req.user.id, formationId]
    );
    
    res.json({
      message: 'Formation approuvée avec succès'
    });
  } catch (error) {
    console.error('Erreur approve formation:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'approbation de la formation' 
    });
  }
});

// @route   PUT /api/formations/:id/reject
// @desc    Rejeter une formation (Admin seulement)
// @access  Private (Admin)
router.put('/:id/reject', auth, authorize('admin'), async (req, res) => {
  try {
    const formationId = parseInt(req.params.id);
    const { rejected_reason } = req.body;
    
    // Vérifier que la formation existe
    const formation = await query(
      'SELECT * FROM formations WHERE id = ?',
      [formationId]
    );
    
    if (formation.length === 0) {
      return res.status(404).json({ 
        error: 'Formation non trouvée' 
      });
    }
    
    // Rejeter la formation
    await query(
      `UPDATE formations 
       SET statut = 'rejected', 
           rejected_reason = ?,
           approved_by = ?,
           approved_at = NOW() 
       WHERE id = ?`,
      [rejected_reason || null, req.user.id, formationId]
    );
    
    res.json({
      message: 'Formation rejetée avec succès'
    });
  } catch (error) {
    console.error('Erreur reject formation:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du rejet de la formation' 
    });
  }
});

// @route   DELETE /api/formations/:id
// @desc    Supprimer une formation (propriétaire ou admin)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const formationId = parseInt(req.params.id);
    
    // Vérifier que la formation existe
    const formation = await query(
      'SELECT * FROM formations WHERE id = ?',
      [formationId]
    );
    
    if (formation.length === 0) {
      return res.status(404).json({ 
        error: 'Formation non trouvée' 
      });
    }
    
    // Vérifier les permissions (propriétaire ou admin)
    if (formation[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Vous n\'avez pas la permission de supprimer cette formation' 
      });
    }
    
    // Supprimer le fichier si il existe
    if (formation[0].file_path) {
      const filePath = path.join(__dirname, '../../', formation[0].file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Supprimer la formation
    await query('DELETE FROM formations WHERE id = ?', [formationId]);
    
    res.json({
      message: 'Formation supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur delete formation:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression de la formation' 
    });
  }
});

module.exports = router;
