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
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB par défaut
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement certains types de fichiers
    const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif)$/i;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    
    // MIME types autorisés (incluant les types Excel spécifiques)
    const allowedMimeTypes = [
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/octet-stream', // generic binary (browsers sometimes send this for XLS)
      'application/x-msexcel',
      'application/excel',
      'application/x-excel'
    ];
    
    // Pattern pour les autres types de fichiers
    const allowedMimePatterns = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt|jpg|jpeg|png|gif|msword|officedocument|image/i;
    const mimetype = allowedMimePatterns.test(file.mimetype) || 
                     allowedMimeTypes.includes(file.mimetype);
    
    // Le nom du fichier doit commencer par une lettre
    const beginsWithLetter = /^[A-Za-zÀ-ÿ]/.test(path.basename(file.originalname));
    
    if (mimetype && extname && beginsWithLetter) {
      return cb(null, true);
    } else {
      const reason = !beginsWithLetter
        ? 'Le nom du fichier doit commencer par une lettre'
        : !extname
        ? 'Extension de fichier non autorisée. Types acceptés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, JPEG, PNG, GIF'
        : 'Type de fichier non autorisé. Vérifiez que le fichier est bien un fichier Excel (.xls ou .xlsx)';
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
      const year = parseInt(req.query.year);
      // Inclure aussi les bordereaux où period_year est NULL mais created_at correspond
      conditions.push('(b.period_year = ? OR (b.period_year IS NULL AND YEAR(b.created_at) = ?))');
      params.push(year, year);
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
      display_date,
      bulk_upload // Flag pour indiquer si c'est un upload en masse
    } = req.body;
    
    // Debug: Log the bulk_upload value
    console.log(`📋 Upload bordereau - bulk_upload reçu:`, {
      bulk_upload: bulk_upload,
      type: typeof bulk_upload,
      isTrue: bulk_upload === 'true',
      isTrueBoolean: bulk_upload === true,
      bodyKeys: Object.keys(req.body),
      bodyValues: req.body,
      rawBody: req.body
    });
    
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
      
      // Pattern 1: YYYY-MM ou YYYY_MM ou YYYY MM ou YYYY/MM
      const m1 = baseName.match(/(20\d{2})[-_\s\/]?(0[1-9]|1[0-2])/);
      // Pattern 2: MM-YYYY ou MM_YYYY ou MM YYYY ou MM/YYYY
      const m2 = baseName.match(/(0[1-9]|1[0-2])[-_\s\/]?(20\d{2})/);
      // Pattern 3: MM YY (2 chiffres pour l'année) - ex: "01 24" = janvier 2024
      const m3 = baseName.match(/(0[1-9]|1[0-2])[-_\s\/]?(\d{2})(?![0-9])/);
      
      if (m1) { 
        finalPeriodYear = parseInt(m1[1], 10); 
        finalPeriodMonth = parseInt(m1[2], 10); 
      } else if (m2) { 
        finalPeriodYear = parseInt(m2[2], 10); 
        finalPeriodMonth = parseInt(m2[1], 10); 
      } else if (m3) {
        // MM YY -> 20YY (ex: "01 24" = janvier 2024)
        const year = 2000 + parseInt(m3[2], 10);
        finalPeriodYear = year;
        finalPeriodMonth = parseInt(m3[1], 10);
      }
    }
    
    // Fallback final : utiliser la date actuelle si toujours NULL
    if (!finalPeriodYear) {
      finalPeriodYear = new Date().getFullYear();
    }
    if (!finalPeriodMonth) {
      finalPeriodMonth = new Date().getMonth() + 1;
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
    const users = await query('SELECT nom, prenom, email FROM users WHERE id = ?', [user_id]);
    const user = users[0];
    const userLabel = user ? `${user.prenom} ${user.nom}` : `User #${user_id}`;
    
    // Envoyer un email à l'utilisateur pour tous les uploads de bordereaux
    // (l'utilisateur doit toujours être notifié quand un bordereau est uploadé)
    try {
      console.log(`📧 Tentative d'envoi email notification bordereau:`);
      console.log(`   - User ID: ${user_id}`);
      console.log(`   - User Email: ${user ? user.email : 'N/A'}`);
      console.log(`   - User Label: ${userLabel}`);
      console.log(`   - Bordereau: ${fileTitle}`);
      console.log(`   - Période: ${finalPeriodMonth}/${finalPeriodYear}`);
      console.log(`   - Bulk upload flag: ${bulk_upload} (type: ${typeof bulk_upload})`);
      
      if (!user || !user.email) {
        console.warn(`⚠️  Impossible d'envoyer l'email : utilisateur #${user_id} n'a pas d'email`);
      } else {
        const { sendBordereauNotificationEmail } = require('../services/emailService');
        console.log(`📧 Envoi email de notification bordereau à ${user.email}...`);
        const emailResult = await sendBordereauNotificationEmail(
          user.email,
          userLabel,
          fileTitle,
          finalPeriodMonth,
          finalPeriodYear,
          fileUrl
        );
        console.log(`✅ Email de notification bordereau envoyé avec succès à ${user.email}`, emailResult);
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email notification bordereau (non-blocking):', emailError);
      console.error('Détails erreur:', {
        message: emailError.message,
        stack: emailError.stack,
        code: emailError.code,
        response: emailError.response,
        responseCode: emailError.responseCode
      });
      // Ne pas bloquer la réponse si l'email échoue
    }
    
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
              CASE WHEN b.file_content IS NOT NULL THEN 1 ELSE 0 END as has_file_content,
              u.id as userId, CONCAT(u.prenom, ' ', u.nom) as userLabel
       FROM bordereaux b
       LEFT JOIN users u ON b.user_id = u.id
       ORDER BY b.created_at DESC
       LIMIT ${limit}`
    );

    const host = `${req.protocol}://${req.get('host')}`;
    // Filtrer les lignes avec des données invalides et mapper les données valides
    const result = rows
      .filter(r => r && r.bordereauId && r.title) // Filtrer les valeurs null/undefined
      .map(r => {
        let fileUrl = null;
        if (r.has_file_content) {
          // Fichier en base64 - utiliser la route /download
          fileUrl = `${host}/api/bordereaux/${r.bordereauId}/download`;
        } else if (r.filePath && r.filePath.trim() !== '') {
          // Ancien fichier avec file_path
          fileUrl = `${host}${r.filePath}`;
        }
        
        return {
          archiveId: r.bordereauId,
          title: r.title || 'Sans titre',
          filePath: r.filePath,
          fileUrl: fileUrl,
          hasFileContent: !!r.has_file_content,
          userId: r.userId || null,
          userLabel: r.userLabel || 'Inconnu',
          createdAt: r.created_at || new Date().toISOString()
        };
      });

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

// @route   PUT /api/bordereaux/:id
// @desc    Modifier un bordereau (admin seulement) - principalement pour changer la période
// @access  Private (Admin seulement)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { period_year, period_month, period_day, display_date, title, description } = req.body;
    
    // Vérifier que le bordereau existe
    const bordereaux = await query('SELECT id FROM bordereaux WHERE id = ?', [id]);
    
    if (bordereaux.length === 0) {
      return res.status(404).json({ error: 'Bordereau non trouvé' });
    }
    
    // Construire la requête UPDATE dynamiquement
    const updates = [];
    const values = [];
    
    if (period_year !== undefined) {
      updates.push('period_year = ?');
      values.push(period_year ? parseInt(period_year) : null);
    }
    
    if (period_month !== undefined) {
      updates.push('period_month = ?');
      values.push(period_month ? parseInt(period_month) : null);
    }
    
    // Si display_date est fourni, l'utiliser pour created_at (date d'affichage)
    if (display_date !== undefined) {
      try {
        const displayDateValue = new Date(display_date);
        if (!isNaN(displayDateValue.getTime())) {
          updates.push('created_at = ?');
          values.push(displayDateValue.toISOString().slice(0, 19).replace('T', ' '));
        }
      } catch (dateError) {
        console.error('Erreur parsing display_date:', dateError);
      }
    }
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune modification à effectuer' });
    }
    
    values.push(id);
    
    await query(
      `UPDATE bordereaux SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({ message: 'Bordereau modifié avec succès' });
  } catch (error) {
    console.error('Erreur update bordereau:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la modification du bordereau' 
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

