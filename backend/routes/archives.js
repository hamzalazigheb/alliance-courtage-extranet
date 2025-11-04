const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload en mémoire (pour base64)
const storage = multer.memoryStorage();

// Note: /recent route is defined later in the file to avoid route conflicts

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
    
    const host = `${req.protocol}://${req.get('host')}`;
    
    // Add fileUrl for each archive
    const archivesWithFileUrl = archives.map(archive => {
      let fileUrl = null;
      if (archive.file_content) {
        // Fichier en base64
        fileUrl = `${host}/api/archives/${archive.id}/download`;
      } else if (archive.file_path && archive.file_path.trim() !== '') {
        // Ancien fichier avec file_path
        fileUrl = `${host}${archive.file_path}`;
      }
      
      return {
        ...archive,
        fileUrl: fileUrl,
        hasFileContent: !!archive.file_content
      };
    });
    
    res.json(archivesWithFileUrl);
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

// @route   GET /api/archives/:id/download
// @desc    Télécharger un fichier d'archive depuis la base de données (base64)
// @access  Public
// NOTE: Cette route doit être définie AVANT /:id pour éviter les conflits de routing
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer l'archive avec le contenu du fichier
    const archives = await query(
      'SELECT file_content, file_type, title, file_path FROM archives WHERE id = ?',
      [id]
    );
    
    if (archives.length === 0) {
      return res.status(404).json({ error: 'Archive non trouvée' });
    }
    
    const archive = archives[0];
    
    // Si file_content existe (base64), le décoder et servir
    if (archive.file_content) {
      // Extraire le base64 du data URL
      const base64Data = archive.file_content.replace(/^data:.*,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      // Déterminer le nom du fichier et le type MIME
      const mimeType = archive.file_type || 'application/octet-stream';
      const fileName = archive.title || 'archive';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      return res.send(fileBuffer);
    }
    
    // Fallback : si file_path existe (anciens fichiers)
    if (archive.file_path) {
      const filePath = path.join(__dirname, '../..', archive.file_path);
      if (fs.existsSync(filePath)) {
        return res.sendFile(path.resolve(filePath));
      }
    }
    
    return res.status(404).json({ error: 'Fichier non trouvé' });
  } catch (error) {
    console.error('Erreur download archive:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du téléchargement de l\'archive' 
    });
  }
});

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
    
    const host = `${req.protocol}://${req.get('host')}`;
    const archive = archives[0];
    
    let fileUrl = null;
    if (archive.file_content) {
      // Fichier en base64
      fileUrl = `${host}/api/archives/${archive.id}/download`;
    } else if (archive.file_path && archive.file_path.trim() !== '') {
      // Ancien fichier avec file_path
      fileUrl = `${host}${archive.file_path}`;
    }
    
    res.json({
      ...archive,
      fileUrl: fileUrl,
      hasFileContent: !!archive.file_content
    });
  } catch (error) {
    console.error('Erreur get archive:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération de l\'archive' 
    });
  }
});

// @route   POST /api/archives
// @desc    Créer une nouvelle archive (avec upload de fichier en base64)
// @access  Private (Admin seulement)
router.post('/', auth, authorize('admin'), upload.single('file'), handleMulterError, async (req, res) => {
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
    
    // Check if buffer exists
    if (!req.file.buffer) {
      return res.status(400).json({ 
        error: 'Erreur: fichier non reçu correctement' 
      });
    }

    // Vérifier que title ou originalname existe
    if (!title && !req.file.originalname) {
      return res.status(400).json({ 
        error: 'Titre requis ou nom de fichier invalide' 
      });
    }
    
    // Convert file buffer to base64
    const fileBase64 = req.file.buffer.toString('base64');
    const base64Prefix = `data:${req.file.mimetype};base64,`;
    const fileContent = base64Prefix + fileBase64;
    
    // Use filename as title if no title provided
    const fileTitle = title || req.file.originalname;
    
    // Déterminer uploaded_by: use user_id if provided, otherwise use the admin's id
    const uploadedBy = user_id ? parseInt(user_id) : req.user.id;
    
    const host = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${host}/api/archives/${null}/download`; // Will be updated after insert
    
    // Créer l'archive avec file_content (base64)
    const result = await query(
      `INSERT INTO archives 
       (title, description, file_path, file_content, file_size, file_type, category, year, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileTitle,
        description || '',
        '', // file_path is empty string when using base64
        fileContent, // Store base64 encoded file
        req.file.size,
        req.file.mimetype,
        category || 'Général',
        year ? parseInt(year) : null,
        uploadedBy
      ]
    );
    
    // Update fileUrl with the actual ID
    const finalFileUrl = `${host}/api/archives/${result.insertId}/download`;

    // Note: Bordereaux are now handled separately via /api/bordereaux
    // No longer creating bordereau records from archives

    // Notifier tous les utilisateurs (via notification globale)
    // Ne pas bloquer l'upload si la notification échoue
    try {
      await notifyAdmins(
        'archive',
        'Nouvelle archive',
        `Une nouvelle archive "${fileTitle}" a été ajoutée.`,
        result.insertId,
        'archive'
      );
    } catch (notifyError) {
      console.error('Erreur lors de la notification (non bloquant):', notifyError);
    }

    res.status(201).json({
      message: 'Archive créée avec succès',
      archiveId: result.insertId,
      filePath: '', // Empty for base64 files
      fileUrl: finalFileUrl,
      title: fileTitle,
      uploadedBy
    });
  } catch (error) {
    console.error('Erreur create archive:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de l\'archive',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    
    // Si file_path existe (anciens fichiers), supprimer le fichier physique
    const filePath = archives[0].file_path;
    if (filePath) {
      const fullPath = path.join(__dirname, '../..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    // Note: file_content (base64) est supprimé automatiquement avec l'enregistrement en DB
    
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
      `SELECT a.id as archiveId, a.title, a.file_path as filePath, 
              CASE WHEN a.file_content IS NOT NULL THEN 1 ELSE 0 END as has_file_content,
              a.created_at,
              u.id as userId, CONCAT(u.nom, ' ', u.prenom) as userLabel
       FROM archives a
       LEFT JOIN users u ON a.uploaded_by = u.id
       ORDER BY a.created_at DESC
       LIMIT ?`,
      [limit]
    );

    const host = `${req.protocol}://${req.get('host')}`;
    const result = rows.map(r => {
      let fileUrl = null;
      if (r.has_file_content) {
        fileUrl = `${host}/api/archives/${r.archiveId}/download`;
      } else if (r.filePath && r.filePath.trim() !== '') {
        fileUrl = `${host}${r.filePath}`;
      }
      
      return {
        archiveId: r.archiveId,
        title: r.title,
        filePath: r.filePath,
        fileUrl: fileUrl,
        userId: r.userId,
        userLabel: r.userLabel,
        createdAt: r.created_at
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Erreur recent archives:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des uploads récents' });
  }
});

module.exports = router;

