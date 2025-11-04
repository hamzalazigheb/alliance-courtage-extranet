const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload en mémoire (pour base64)
const storage = multer.memoryStorage();

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
    // Le nom du fichier doit commencer par une lettre
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

// @route   GET /api/bordereaux
// @desc    Obtenir les bordereaux (admin voit tout, user voit seulement les siens)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let sql = `
      SELECT b.*, 
             u.nom as user_nom, u.prenom as user_prenom, u.email as user_email,
             admin.nom as uploaded_by_nom, admin.prenom as uploaded_by_prenom,
             CASE WHEN b.file_content IS NOT NULL THEN 1 ELSE 0 END as has_file_content
      FROM bordereaux b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN users admin ON b.uploaded_by = admin.id
    `;
    
    const conditions = [];
    const params = [];
    
    // Si user_id est fourni dans la query, l'utiliser (pour ComptabilitePage où même les admins voient seulement leurs fichiers)
    if (req.query.user_id) {
      conditions.push('b.user_id = ?');
      params.push(parseInt(req.query.user_id));
    } else if (req.user.role !== 'admin') {
      // Si pas de user_id dans query ET utilisateur n'est pas admin, filtrer par son user_id
      conditions.push('b.user_id = ?');
      params.push(req.user.id);
    }
    // Si admin ET pas de user_id dans query → voir tous les fichiers (pour GestionComptabilitePage)
    
    if (req.query.year) {
      conditions.push('b.period_year = ?');
      params.push(parseInt(req.query.year));
    }
    
    if (req.query.month) {
      conditions.push('b.period_month = ?');
      params.push(parseInt(req.query.month));
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY b.created_at DESC';
    
    const bordereaux = await query(sql, params);
    
    const host = `${req.protocol}://${req.get('host')}`;
    const result = bordereaux.map(b => ({
      id: b.id,
      userId: b.user_id,
      userLabel: b.user_nom && b.user_prenom ? `${b.user_prenom} ${b.user_nom}` : `User #${b.user_id}`,
      userEmail: b.user_email,
      title: b.title,
      description: b.description || '',
      filePath: b.file_path, // Keep for backward compatibility
      fileUrl: (b.has_file_content || b.file_content) ? `${host}/api/bordereaux/${b.id}/download` : (b.file_path ? `${host}${b.file_path}` : null),
      hasFileContent: !!(b.has_file_content || b.file_content), // Indicates if file is stored in DB
      fileSize: b.file_size,
      fileType: b.file_type,
      periodMonth: b.period_month,
      periodYear: b.period_year,
      uploadedBy: b.uploaded_by,
      uploadedByLabel: b.uploaded_by_nom && b.uploaded_by_prenom ? `${b.uploaded_by_prenom} ${b.uploaded_by_nom}` : 'Admin',
      createdAt: b.created_at,
      updatedAt: b.updated_at
    }));
    
    res.json(result);
  } catch (error) {
    console.error('Erreur get bordereaux:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des bordereaux' 
    });
  }
});

// @route   POST /api/bordereaux
// @desc    Créer un nouveau bordereau (admin seulement)
// @access  Private (Admin seulement)
router.post('/', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const {
      title,
      description,
      user_id,
      period_month,
      period_year,
      display_date
    } = req.body;
    
    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Fichier requis' 
      });
    }
    
    // Vérifier que user_id est fourni
    if (!user_id) {
      return res.status(400).json({ 
        error: 'user_id requis' 
      });
    }
    
    // Use filename as title if no title provided
    const fileTitle = title || req.file.originalname;
    
    // Check if buffer exists
    if (!req.file.buffer) {
      return res.status(400).json({ 
        error: 'Erreur: fichier non reçu correctement' 
      });
    }
    
    // Convert file buffer to base64
    const fileBase64 = req.file.buffer.toString('base64');
    const base64Prefix = `data:${req.file.mimetype};base64,`;
    const fileContent = base64Prefix + fileBase64;
    
    // Log file size for debugging
    console.log(`Uploading file: ${fileTitle}, Size: ${req.file.size} bytes, Base64 size: ${fileContent.length} chars`);
    
    // Try to derive period from filename if not provided
    let finalPeriodMonth = period_month ? parseInt(period_month) : null;
    let finalPeriodYear = period_year ? parseInt(period_year) : null;
    
    if (!finalPeriodMonth || !finalPeriodYear) {
      const baseName = path.basename(req.file.originalname);
      const m1 = baseName.match(/(20\d{2})[-_\s]?(0[1-9]|1[0-2])/); // YYYY-MM
      const m2 = baseName.match(/(0[1-9]|1[0-2])[-_\s]?(20\d{2})/); // MM-YYYY
      if (m1) { 
        finalPeriodYear = parseInt(m1[1], 10); 
        finalPeriodMonth = parseInt(m1[2], 10); 
      } else if (m2) { 
        finalPeriodYear = parseInt(m2[2], 10); 
        finalPeriodMonth = parseInt(m2[1], 10); 
      }
    }
    
    // Utiliser la date d'affichage configurée ou la date actuelle
    let displayDateValue = display_date ? new Date(display_date) : new Date();
    
    // Créer le bordereau avec file_content (base64) au lieu de file_path
    // Note: file_path peut être NOT NULL dans la table, donc on met une chaîne vide
    // Si display_date est fourni, on l'utilise pour created_at (pour l'affichage)
    const result = await query(
      `INSERT INTO bordereaux 
       (user_id, title, description, file_path, file_content, file_size, file_type, period_month, period_year, uploaded_by, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parseInt(user_id),
        fileTitle,
        description || '',
        '', // file_path is empty string when using base64 (column may be NOT NULL)
        fileContent, // Store base64 encoded file
        req.file.size,
        req.file.mimetype,
        finalPeriodMonth,
        finalPeriodYear,
        req.user.id,
        displayDateValue.toISOString().slice(0, 19).replace('T', ' ') // Format MySQL datetime
      ]
    );
    
    const fileUrl = `${req.protocol}://${req.get('host')}/api/bordereaux/${result.insertId}/download`;
    
    // Récupérer les informations de l'utilisateur
    const users = await query('SELECT nom, prenom FROM users WHERE id = ?', [user_id]);
    const user = users[0];
    const userLabel = user ? `${user.prenom} ${user.nom}` : `User #${user_id}`;
    
    res.status(201).json({
      message: 'Bordereau créé avec succès',
      bordereauId: result.insertId,
      filePath: null, // No file path when using base64
      fileUrl,
      title: fileTitle,
      userId: parseInt(user_id),
      userLabel,
      periodMonth: finalPeriodMonth,
      periodYear: finalPeriodYear
    });
  } catch (error) {
    console.error('Erreur create bordereau:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du bordereau',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/bordereaux/recent
// @desc    Obtenir les derniers bordereaux uploadés (admin seulement)
// @access  Private (Admin seulement)
router.get('/recent', auth, authorize('admin'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    // Utiliser l'interpolation directe pour LIMIT car MySQL ne supporte pas bien LIMIT avec paramètres préparés
    const rows = await query(
      `SELECT b.id as bordereauId, b.title, b.file_path as filePath, b.created_at,
              u.id as userId, CONCAT(u.prenom, ' ', u.nom) as userLabel
       FROM bordereaux b
       LEFT JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC
       LIMIT ${limit}`
    );

    const host = `${req.protocol}://${req.get('host')}`;
    const result = rows.map(r => ({
      bordereauId: r.bordereauId,
      title: r.title,
      filePath: r.filePath,
      fileUrl: `${host}${r.filePath}`,
      userId: r.userId,
      userLabel: r.userLabel,
      createdAt: r.created_at
    }));

    res.json(result);
  } catch (error) {
    console.error('Erreur recent bordereaux:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des bordereaux récents' });
  }
});

// @route   GET /api/bordereaux/:id/download
// @desc    Télécharger un bordereau depuis la base de données (base64)
// @access  Private
router.get('/:id/download', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le bordereau avec le contenu du fichier
    const bordereaux = await query(
      'SELECT file_content, file_type, title FROM bordereaux WHERE id = ?',
      [id]
    );
    
    if (bordereaux.length === 0) {
      return res.status(404).json({ error: 'Bordereau non trouvé' });
    }
    
    const bordereau = bordereaux[0];
    
    // Vérifier les permissions : admin ou propriétaire
    if (req.user.role !== 'admin') {
      const userBordereaux = await query('SELECT user_id FROM bordereaux WHERE id = ?', [id]);
      if (userBordereaux.length === 0 || userBordereaux[0].user_id !== req.user.id) {
        return res.status(403).json({ error: 'Accès refusé' });
      }
    }
    
    // Si file_content existe (base64), le décoder et servir
    if (bordereau.file_content) {
      // Extraire le base64 du data URL (data:mime/type;base64,base64string)
      const base64Data = bordereau.file_content.replace(/^data:.*,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      // Déterminer le nom du fichier et le type MIME
      const mimeType = bordereau.file_type || 'application/octet-stream';
      const fileName = bordereau.title || 'bordereau';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      return res.send(fileBuffer);
    }
    
    // Fallback : si file_path existe (anciens fichiers)
    const bordereauWithPath = await query('SELECT file_path FROM bordereaux WHERE id = ?', [id]);
    if (bordereauWithPath[0] && bordereauWithPath[0].file_path) {
      const filePath = path.join(__dirname, '../..', bordereauWithPath[0].file_path);
      if (fs.existsSync(filePath)) {
        return res.sendFile(path.resolve(filePath));
      }
    }
    
    return res.status(404).json({ error: 'Fichier non trouvé' });
  } catch (error) {
    console.error('Erreur download bordereau:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du téléchargement du bordereau' 
    });
  }
});

// @route   DELETE /api/bordereaux/:id
// @desc    Supprimer un bordereau (admin seulement)
// @access  Private (Admin seulement)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le bordereau existe
    const bordereaux = await query('SELECT id, file_path FROM bordereaux WHERE id = ?', [id]);
    
    if (bordereaux.length === 0) {
      return res.status(404).json({ error: 'Bordereau non trouvé' });
    }
    
    const bordereau = bordereaux[0];
    
    // Si file_path existe (anciens fichiers), supprimer le fichier physique
    if (bordereau.file_path) {
      const filePath = path.join(__dirname, '../..', bordereau.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    // Note: file_content (base64) est supprimé automatiquement avec l'enregistrement en DB
    
    // Supprimer l'enregistrement de la base de données
    await query('DELETE FROM bordereaux WHERE id = ?', [id]);
    
    res.json({ message: 'Bordereau supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete bordereau:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du bordereau' 
    });
  }
});

module.exports = router;

