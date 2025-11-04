const express = require('express');
const multer = require('multer');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configuration Multer pour l'upload de fichiers en mémoire (base64)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

// ============================================
// FOLDERS (Dossiers)
// ============================================

// @route   GET /api/reglementaire/folders
// @desc    Récupérer tous les dossiers réglementaires
// @access  Private
router.get('/folders', auth, async (req, res) => {
  try {
    const folders = await query(
      'SELECT * FROM reglementaire_folders WHERE is_active = TRUE ORDER BY display_order ASC'
    );
    
    res.json(folders);
  } catch (error) {
    console.error('Erreur get folders:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des dossiers' 
    });
  }
});

// @route   GET /api/reglementaire/folders/:id
// @desc    Récupérer un dossier par ID
// @access  Private
router.get('/folders/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const folders = await query(
      'SELECT * FROM reglementaire_folders WHERE id = ?',
      [id]
    );
    
    if (folders.length === 0) {
      return res.status(404).json({ error: 'Dossier non trouvé' });
    }
    
    res.json(folders[0]);
  } catch (error) {
    console.error('Erreur get folder:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du dossier' 
    });
  }
});

// @route   POST /api/reglementaire/folders
// @desc    Créer un nouveau dossier
// @access  Private (Admin seulement)
router.post('/folders', auth, authorize('admin'), async (req, res) => {
  try {
    const { title, display_order } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Le titre est requis' });
    }
    
    const result = await query(
      'INSERT INTO reglementaire_folders (title, display_order) VALUES (?, ?)',
      [title, display_order || 0]
    );
    
    const folderId = result.insertId;
    const folders = await query(
      'SELECT * FROM reglementaire_folders WHERE id = ?',
      [folderId]
    );
    
    res.status(201).json(folders[0]);
  } catch (error) {
    console.error('Erreur create folder:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du dossier' 
    });
  }
});

// @route   PUT /api/reglementaire/folders/:id
// @desc    Mettre à jour un dossier
// @access  Private (Admin seulement)
router.put('/folders/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, display_order, is_active } = req.body;
    
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }
    
    values.push(id);
    
    await query(
      `UPDATE reglementaire_folders SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const folders = await query(
      'SELECT * FROM reglementaire_folders WHERE id = ?',
      [id]
    );
    
    res.json(folders[0]);
  } catch (error) {
    console.error('Erreur update folder:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du dossier' 
    });
  }
});

// @route   DELETE /api/reglementaire/folders/:id
// @desc    Supprimer un dossier (soft delete)
// @access  Private (Admin seulement)
router.delete('/folders/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete: désactiver le dossier
    await query(
      'UPDATE reglementaire_folders SET is_active = FALSE WHERE id = ?',
      [id]
    );
    
    // Désactiver aussi tous les documents du dossier
    await query(
      'UPDATE reglementaire_documents SET is_active = FALSE WHERE folder_id = ?',
      [id]
    );
    
    res.json({ message: 'Dossier supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete folder:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du dossier' 
    });
  }
});

// ============================================
// DOCUMENTS
// ============================================

// @route   GET /api/reglementaire/documents
// @desc    Récupérer tous les documents (optionnel: filtrer par folder_id)
// @access  Private
router.get('/documents', auth, async (req, res) => {
  try {
    const { folder_id } = req.query;
    
    let sql = `
      SELECT 
        d.*,
        CASE WHEN d.file_content IS NOT NULL THEN 1 ELSE 0 END as has_file_content,
        f.title as folder_title
      FROM reglementaire_documents d
      LEFT JOIN reglementaire_folders f ON d.folder_id = f.id
      WHERE d.is_active = TRUE
    `;
    const params = [];
    
    if (folder_id) {
      sql += ' AND d.folder_id = ?';
      params.push(folder_id);
    }
    
    sql += ' ORDER BY d.display_order ASC, d.created_at DESC';
    
    const documents = await query(sql, params);
    
    // Construire fileUrl pour chaque document
    const host = `${req.protocol}://${req.get('host')}`;
    const documentsWithUrls = documents.map(doc => {
      const fileUrl = doc.has_file_content 
        ? `${host}/api/reglementaire/documents/${doc.id}/download`
        : doc.file_path || null;
      return {
        ...doc,
        fileUrl
      };
    });
    
    res.json(documentsWithUrls);
  } catch (error) {
    console.error('Erreur get documents:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des documents' 
    });
  }
});

// @route   GET /api/reglementaire/documents/:id
// @desc    Récupérer un document par ID
// @access  Private
router.get('/documents/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const documents = await query(
      `SELECT 
        d.*,
        CASE WHEN d.file_content IS NOT NULL THEN 1 ELSE 0 END as has_file_content,
        f.title as folder_title
      FROM reglementaire_documents d
      LEFT JOIN reglementaire_folders f ON d.folder_id = f.id
      WHERE d.id = ?`,
      [id]
    );
    
    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    
    const doc = documents[0];
    const host = `${req.protocol}://${req.get('host')}`;
    const fileUrl = doc.has_file_content 
      ? `${host}/api/reglementaire/documents/${doc.id}/download`
      : doc.file_path || null;
    
    res.json({ ...doc, fileUrl });
  } catch (error) {
    console.error('Erreur get document:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du document' 
    });
  }
});

// @route   GET /api/reglementaire/documents/:id/download
// @desc    Télécharger un document (base64 ou fichier)
// @access  Private
router.get('/documents/:id/download', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const documents = await query(
      'SELECT file_content, file_type, name, file_path FROM reglementaire_documents WHERE id = ?',
      [id]
    );
    
    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    
    const doc = documents[0];
    
    // Si file_content existe (base64), le décoder et servir
    if (doc.file_content) {
      const base64Data = doc.file_content.replace(/^data:.*,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      // Déterminer le type MIME
      const mimeMatch = doc.file_content.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : doc.file_type || 'application/pdf';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.name)}"`);
      res.setHeader('Content-Length', fileBuffer.length);
      
      return res.send(fileBuffer);
    }
    
    // Fallback pour les anciens fichiers (file_path)
    if (doc.file_path) {
      return res.redirect(doc.file_path);
    }
    
    return res.status(404).json({ error: 'Fichier non trouvé' });
  } catch (error) {
    console.error('Erreur download document:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du téléchargement du document' 
    });
  }
});

// @route   POST /api/reglementaire/documents
// @desc    Créer un nouveau document
// @access  Private (Admin seulement)
router.post('/documents', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const { folder_id, name, document_date, document_type, display_order } = req.body;
    
    if (!folder_id || !name) {
      return res.status(400).json({ 
        error: 'Le dossier et le nom sont requis' 
      });
    }
    
    let fileContent = null;
    let filePath = '';
    let fileSize = null;
    let fileType = null;
    
    // Si un fichier est uploadé, le convertir en base64
    if (req.file && req.file.buffer) {
      const fileBase64 = req.file.buffer.toString('base64');
      const base64Prefix = `data:${req.file.mimetype};base64,`;
      fileContent = base64Prefix + fileBase64;
      fileSize = req.file.size;
      fileType = req.file.mimetype;
    }
    
    const result = await query(
      `INSERT INTO reglementaire_documents 
       (folder_id, name, document_date, document_type, file_content, file_path, file_size, file_type, display_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        folder_id,
        name,
        document_date || null,
        document_type || null,
        fileContent,
        filePath,
        fileSize,
        fileType,
        display_order || 0
      ]
    );
    
    const documentId = result.insertId;
    const documents = await query(
      `SELECT 
        d.*,
        CASE WHEN d.file_content IS NOT NULL THEN 1 ELSE 0 END as has_file_content,
        f.title as folder_title
      FROM reglementaire_documents d
      LEFT JOIN reglementaire_folders f ON d.folder_id = f.id
      WHERE d.id = ?`,
      [documentId]
    );
    
    const doc = documents[0];
    const host = `${req.protocol}://${req.get('host')}`;
    const fileUrl = doc.has_file_content 
      ? `${host}/api/reglementaire/documents/${doc.id}/download`
      : null;
    
    // Notifier tous les utilisateurs (via notification globale)
    await notifyAdmins(
      'document',
      'Nouveau document réglementaire',
      `Un nouveau document réglementaire "${name}" a été ajouté dans le dossier "${doc.folder_title || 'N/A'}".`,
      documentId,
      'reglementaire_document'
    );

    res.status(201).json({ ...doc, fileUrl });
  } catch (error) {
    console.error('Erreur create document:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du document' 
    });
  }
});

// @route   PUT /api/reglementaire/documents/:id
// @desc    Mettre à jour un document
// @access  Private (Admin seulement)
router.put('/documents/:id', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const { folder_id, name, document_date, document_type, display_order, is_active } = req.body;
    
    // Récupérer le document existant
    const existingDocs = await query(
      'SELECT * FROM reglementaire_documents WHERE id = ?',
      [id]
    );
    
    if (existingDocs.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    
    const existingDoc = existingDocs[0];
    
    // Préparer les mises à jour
    const updates = [];
    const values = [];
    
    if (folder_id !== undefined) {
      updates.push('folder_id = ?');
      values.push(folder_id);
    }
    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (document_date !== undefined) {
      updates.push('document_date = ?');
      values.push(document_date);
    }
    if (document_type !== undefined) {
      updates.push('document_type = ?');
      values.push(document_type);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    
    // Gérer le nouveau fichier uploadé
    if (req.file && req.file.buffer) {
      const fileBase64 = req.file.buffer.toString('base64');
      const base64Prefix = `data:${req.file.mimetype};base64,`;
      updates.push('file_content = ?');
      updates.push('file_path = ?');
      updates.push('file_size = ?');
      updates.push('file_type = ?');
      values.push(base64Prefix + fileBase64);
      values.push(''); // Clear file_path
      values.push(req.file.size);
      values.push(req.file.mimetype);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }
    
    values.push(id);
    
    await query(
      `UPDATE reglementaire_documents SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    const documents = await query(
      `SELECT 
        d.*,
        CASE WHEN d.file_content IS NOT NULL THEN 1 ELSE 0 END as has_file_content,
        f.title as folder_title
      FROM reglementaire_documents d
      LEFT JOIN reglementaire_folders f ON d.folder_id = f.id
      WHERE d.id = ?`,
      [id]
    );
    
    const doc = documents[0];
    const host = `${req.protocol}://${req.get('host')}`;
    const fileUrl = doc.has_file_content 
      ? `${host}/api/reglementaire/documents/${doc.id}/download`
      : doc.file_path || null;
    
    res.json({ ...doc, fileUrl });
  } catch (error) {
    console.error('Erreur update document:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du document' 
    });
  }
});

// @route   DELETE /api/reglementaire/documents/:id
// @desc    Supprimer un document (soft delete)
// @access  Private (Admin seulement)
router.delete('/documents/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    await query(
      'UPDATE reglementaire_documents SET is_active = FALSE WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete document:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du document' 
    });
  }
});

module.exports = router;

