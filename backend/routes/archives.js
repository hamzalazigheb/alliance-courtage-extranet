const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Sauvegarder dans le dossier uploads à la racine du projet
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// @route   GET /api/archives/recent
// @desc    Obtenir les derniers fichiers uploadés (admin)
// @access  Private (Admin seulement)
router.get('/recent', auth, authorize('admin'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const rows = await query(
      `SELECT a.id as archiveId, a.title, a.file_path as filePath, a.created_at,
              u.id as userId, CONCAT(u.nom, ' ', u.prenom) as userLabel
       FROM archives a
       LEFT JOIN users u ON a.uploaded_by = u.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );

    const host = `${req.protocol}://${req.get('host')}`;
    const result = rows.map(r => ({
      archiveId: r.archiveId,
      title: r.title,
      filePath: r.filePath,
      fileUrl: `${host}${r.filePath}`,
      userId: r.userId,
      userLabel: r.userLabel,
      createdAt: r.created_at
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur recent archives:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des uploads récents' });
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB par défaut
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement certains types de fichiers
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    // Le nom du fichier doit commencer par une lettre (y compris lettres accentuées)
    const beginsWithLetter = /^[A-Za-zÀ-ÿ]/.test(path.basename(file.originalname));
    
    if (mimetype && extname && beginsWithLetter) {
      return cb(null, true);
    } else {
      const reason = !beginsWithLetter
        ? 'Le nom du fichier doit commencer par une lettre'
        : 'Type de fichier non autorisé';
      cb(new Error(reason));
    }
  }
});

// @route   GET /api/archives
// @desc    Obtenir toutes les archives
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, year, search, user_id } = req.query;
    
    let sql = `
      SELECT a.*, u.nom as uploaded_by_nom, u.prenom as uploaded_by_prenom
      FROM archives a
      LEFT JOIN users u ON a.uploaded_by = u.id
    `;
    
    const conditions = [];
    const params = [];
    
    if (category) {
      conditions.push('a.category = ?');
      params.push(category);
    }
    
    if (year) {
      conditions.push('a.year = ?');
      params.push(parseInt(year));
    }
    
    if (search) {
      conditions.push('(a.title LIKE ? OR a.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (user_id) {
      conditions.push('a.uploaded_by = ?');
      params.push(parseInt(user_id));
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY a.created_at DESC';
    
    const archives = await query(sql, params);
    
    res.json(archives);
  } catch (error) {
    console.error('Erreur get archives:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des archives' 
    });
  }
});

// @route   GET /api/archives/recent
// @desc    Obtenir les derniers fichiers uploadés (admin)
// @access  Private (Admin seulement)
// moved earlier before '/:id' to avoid route conflict

// @route   GET /api/archives/:id
// @desc    Obtenir une archive par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const archives = await query(
      `SELECT a.*, u.nom as uploaded_by_nom, u.prenom as uploaded_by_prenom
       FROM archives a
       LEFT JOIN users u ON a.uploaded_by = u.id
       WHERE a.id = ?`,
      [id]
    );
    
    if (archives.length === 0) {
      return res.status(404).json({ 
        error: 'Archive non trouvée' 
      });
    }
    
    res.json(archives[0]);
  } catch (error) {
    console.error('Erreur get archive:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération de l\'archive' 
    });
  }
});

// @route   POST /api/archives
// @desc    Créer une nouvelle archive (avec upload de fichier)
// @access  Private (Admin seulement)
router.post('/', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      year,
      user_id
    } = req.body;
    
    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Fichier requis' 
      });
    }
    
    // Use filename as title if no title provided
    const fileTitle = title || req.file.originalname;
    
    // Créer l'archive - changer le chemin pour qu'il soit servable
    const filePath = `/uploads/${req.file.filename}`;
    
    // Déterminer uploaded_by: use user_id if provided, otherwise use the admin's id
    const uploadedBy = user_id ? parseInt(user_id) : req.user.id;
    
    // Créer l'archive
    const result = await query(
      `INSERT INTO archives 
       (title, description, file_path, file_size, file_type, category, year, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileTitle,
        description || '',
        filePath,
        req.file.size,
        req.file.mimetype,
        category || 'Général',
        year ? parseInt(year) : null,
        uploadedBy
      ]
    );
    
    const fileUrl = `${req.protocol}://${req.get('host')}${filePath}`;

    // Try to derive period from filename like *_YYYY-MM* or *MM-YYYY*
    let periodMonth = null;
    let periodYear = null;
    const baseName = path.basename(req.file.originalname);
    const m1 = baseName.match(/(20\d{2})[-_\s]?(0[1-9]|1[0-2])/); // YYYY-MM
    const m2 = baseName.match(/(0[1-9]|1[0-2])[-_\s]?(20\d{2})/); // MM-YYYY
    if (m1) { periodYear = parseInt(m1[1], 10); periodMonth = parseInt(m1[2], 10); }
    else if (m2) { periodYear = parseInt(m2[2], 10); periodMonth = parseInt(m2[1], 10); }

    // Create bordereau record linked to this archive
    try {
      await query(
        `INSERT INTO bordereaux (user_id, archive_id, label, period_month, period_year) VALUES (?, ?, ?, ?, ?)`,
        [uploadedBy, result.insertId, fileTitle, periodMonth, periodYear]
      );
    } catch (e) {
      console.warn('⚠️ Could not insert into bordereaux:', e.message);
    }
    res.status(201).json({
      message: 'Archive créée avec succès',
      archiveId: result.insertId,
      filePath,
      fileUrl,
      title: fileTitle,
      uploadedBy
    });
  } catch (error) {
    console.error('Erreur create archive:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de l\'archive' 
    });
  }
});

// @route   PUT /api/archives/:id
// @desc    Mettre à jour une archive
// @access  Private (Admin seulement)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      year
    } = req.body;
    
    // Vérifier que l'archive existe
    const existingArchives = await query(
      'SELECT id FROM archives WHERE id = ?',
      [id]
    );
    
    if (existingArchives.length === 0) {
      return res.status(404).json({ 
        error: 'Archive non trouvée' 
      });
    }
    
    // Mettre à jour l'archive
    await query(
      `UPDATE archives 
       SET title = ?, description = ?, category = ?, year = ?
       WHERE id = ?`,
      [title, description, category, year ? parseInt(year) : null, id]
    );
    
    res.json({ message: 'Archive mise à jour avec succès' });
  } catch (error) {
    console.error('Erreur update archive:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour de l\'archive' 
    });
  }
});

// @route   DELETE /api/archives/:id
// @desc    Supprimer une archive
// @access  Private (Admin seulement)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer les informations de l'archive
    const archives = await query(
      'SELECT file_path FROM archives WHERE id = ?',
      [id]
    );
    
    if (archives.length === 0) {
      return res.status(404).json({ 
        error: 'Archive non trouvée' 
      });
    }
    
    // Supprimer le fichier physique
    const filePath = archives[0].file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Supprimer l'archive de la base de données
    await query(
      'DELETE FROM archives WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Archive supprimée avec succès' });
  } catch (error) {
    console.error('Erreur delete archive:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression de l\'archive' 
    });
  }
});

// @route   GET /api/archives/categories/list
// @desc    Obtenir la liste des catégories d'archives
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await query(
      'SELECT DISTINCT category FROM archives WHERE category IS NOT NULL ORDER BY category'
    );
    
    res.json(categories.map(cat => cat.category));
  } catch (error) {
    console.error('Erreur get categories:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des catégories' 
    });
  }
});

// @route   GET /api/archives/years/list
// @desc    Obtenir la liste des années d'archives
// @access  Public
router.get('/years/list', async (req, res) => {
  try {
    const years = await query(
      'SELECT DISTINCT year FROM archives WHERE year IS NOT NULL ORDER BY year DESC'
    );
    
    res.json(years.map(year => year.year));
  } catch (error) {
    console.error('Erreur get years:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des années' 
    });
  }
});

// @route   GET /api/archives/recent
// @desc    Obtenir les derniers fichiers uploadés (admin)
// @access  Private (Admin seulement)
router.get('/recent', auth, authorize('admin'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const rows = await query(
      `SELECT a.id as archiveId, a.title, a.file_path as filePath, a.created_at,
              u.id as userId, CONCAT(u.nom, ' ', u.prenom) as userLabel
       FROM archives a
       LEFT JOIN users u ON a.uploaded_by = u.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );

    const host = `${req.protocol}://${req.get('host')}`;
    const result = rows.map(r => ({
      archiveId: r.archiveId,
      title: r.title,
      filePath: r.filePath,
      fileUrl: `${host}${r.filePath}`,
      userId: r.userId,
      userLabel: r.userLabel,
      createdAt: r.created_at
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur recent archives:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des uploads récents' });
  }
});

module.exports = router;

