const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload de documents
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/financial-documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'financial-doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
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
    res.json(documents);
  } catch (error) {
    console.error('Erreur get documents:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des documents' });
  }
});

// @route   POST /api/financial-documents
// @desc    Créer un nouveau document financier
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), uploadDocument.single('file'), async (req, res) => {
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

    const filePath = `/uploads/financial-documents/${req.file.filename}`;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;

    const result = await query(
      `INSERT INTO financial_documents 
       (title, description, file_path, file_size, file_type, category, subcategory, year, uploaded_by, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true)`,
      [title, description, filePath, fileSize, fileType, category, subcategory, year || new Date().getFullYear(), uploadedBy]
    );

    console.log('✅ Document created:', { id: result.insertId, title, category });
    res.status(201).json({ 
      message: 'Document créé avec succès', 
      documentId: result.insertId 
    });
  } catch (error) {
    console.error('Erreur create document:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création du document' });
  }
});

// @route   DELETE /api/financial-documents/:id
// @desc    Supprimer un document
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer le chemin du fichier avant suppression
    const documents = await query(
      'SELECT file_path FROM financial_documents WHERE id = ?',
      [id]
    );

    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }

    // Supprimer le fichier physique
    const filePath = '.' + documents[0].file_path;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer l'enregistrement de la base de données
    await query('DELETE FROM financial_documents WHERE id = ?', [id]);

    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete document:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression du document' });
  }
});

module.exports = router;



