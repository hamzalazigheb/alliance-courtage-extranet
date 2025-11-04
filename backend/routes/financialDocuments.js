const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload en mémoire (pour base64)
const documentStorage = multer.memoryStorage();

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers documentaires sont autorisés'));
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

// @route   GET /api/financial-documents
// @desc    Obtenir tous les documents financiers
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, subcategory, year, search } = req.query;
    
    let sql = `
      SELECT fd.*, u.nom as uploaded_by_nom, u.prenom as uploaded_by_prenom
      FROM financial_documents fd
      LEFT JOIN users u ON fd.uploaded_by = u.id
      WHERE fd.is_active = true
    `;
    
    const conditions = [];
    const params = [];
    
    if (category) {
      conditions.push('fd.category = ?');
      params.push(category);
    }
    
    if (subcategory) {
      conditions.push('fd.subcategory = ?');
      params.push(subcategory);
    }
    
    if (year) {
      conditions.push('fd.year = ?');
      params.push(parseInt(year));
    }
    
    if (search) {
      conditions.push('(fd.title LIKE ? OR fd.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' AND ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY fd.created_at DESC';
    
    const documents = await query(sql, params);
    
    const host = `${req.protocol}://${req.get('host')}`;
    
    // Add fileUrl for each document
    const documentsWithFileUrl = documents.map(doc => {
      let fileUrl = null;
      if (doc.file_content) {
        // Fichier en base64
        fileUrl = `${host}/api/financial-documents/${doc.id}/download`;
      } else if (doc.file_path && doc.file_path.trim() !== '') {
        // Ancien fichier avec file_path
        fileUrl = `${host}${doc.file_path}`;
      }
      
      return {
        ...doc,
        fileUrl: fileUrl,
        hasFileContent: !!doc.file_content
      };
    });
    
    res.json(documentsWithFileUrl);
  } catch (error) {
    console.error('Erreur get documents:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des documents' });
  }
});

// @route   POST /api/financial-documents
// @desc    Créer un nouveau document financier (avec upload en base64)
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), uploadDocument.single('file'), handleMulterError, async (req, res) => {
  try {
    const { title, description, category, subcategory, year } = req.body;
    const uploadedBy = req.user?.id;

    if (!title || !category) {
      return res.status(400).json({ 
        error: 'Titre et catégorie requis' 
      });
    }

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

    // Convert file buffer to base64
    const fileBase64 = req.file.buffer.toString('base64');
    const base64Prefix = `data:${req.file.mimetype};base64,`;
    const fileContent = base64Prefix + fileBase64;

    const fileSize = req.file.size;
    const fileType = req.file.mimetype;

    const host = `${req.protocol}://${req.get('host')}`;

    const result = await query(
      `INSERT INTO financial_documents 
       (title, description, file_path, file_content, file_size, file_type, category, subcategory, year, uploaded_by, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [title, description || '', '', fileContent, fileSize, fileType, category, subcategory, year || new Date().getFullYear(), uploadedBy]
    );

    const fileUrl = `${host}/api/financial-documents/${result.insertId}/download`;

    // Notifier tous les utilisateurs (via notification globale)
    await notifyAdmins(
      'document',
      'Nouveau document financier',
      `Un nouveau document financier "${title}" a été ajouté dans la catégorie ${category}.`,
      result.insertId,
      'financial_document'
    );

    console.log('✅ Document created:', { id: result.insertId, title, category });
    res.status(201).json({ 
      message: 'Document créé avec succès', 
      documentId: result.insertId,
      fileUrl: fileUrl
    });
  } catch (error) {
    console.error('Erreur create document:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    res.status(500).json({ error: 'Erreur serveur lors de la création du document' });
  }
});

// @route   GET /api/financial-documents/:id/download
// @desc    Télécharger un document financier depuis la base de données (base64)
// @access  Public
// NOTE: Cette route doit être définie AVANT /:id pour éviter les conflits de routing
router.get('/:id/download', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le document avec le contenu du fichier
    const documents = await query(
      'SELECT file_content, file_type, title, file_path FROM financial_documents WHERE id = ? AND is_active = true',
      [id]
    );
    
    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    
    const document = documents[0];
    
    // Si file_content existe (base64), le décoder et servir
    if (document.file_content) {
      // Extraire le base64 du data URL
      const base64Data = document.file_content.replace(/^data:.*,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      // Déterminer le nom du fichier et le type MIME
      const mimeType = document.file_type || 'application/octet-stream';
      const fileName = document.title || 'document';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      return res.send(fileBuffer);
    }
    
    // Fallback : si file_path existe (anciens fichiers)
    if (document.file_path) {
      const filePath = path.join(__dirname, '../..', document.file_path);
      if (fs.existsSync(filePath)) {
        return res.sendFile(path.resolve(filePath));
      }
    }
    
    return res.status(404).json({ error: 'Fichier non trouvé' });
  } catch (error) {
    console.error('Erreur download document:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du téléchargement du document' 
    });
  }
});

// @route   DELETE /api/financial-documents/:id
// @desc    Supprimer un document
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer les informations du document avant suppression
    const documents = await query(
      'SELECT file_path FROM financial_documents WHERE id = ?',
      [id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Si file_path existe (anciens fichiers), supprimer le fichier physique
    const filePath = documents[0].file_path;
    if (filePath && filePath.trim() !== '') {
      const fullPath = path.join(__dirname, '../..', filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
    // Note: file_content (base64) est supprimé automatiquement avec l'enregistrement en DB

    // Supprimer l'enregistrement de la base de données
    await query('DELETE FROM financial_documents WHERE id = ?', [id]);

    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete document:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du document' });
  }
});

module.exports = router;



