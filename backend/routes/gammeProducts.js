const express = require('express');
const router = express.Router();
const multer = require('multer');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

// Configuration Multer pour upload en mémoire
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max par fichier
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé. Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX'));
    }
  }
});

// Gestion des erreurs Multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux (max 50MB)' });
    }
    return res.status(400).json({ error: `Erreur upload: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

// Helper pour corriger l'encodage des noms de fichiers
function fixFilenameEncoding(filename) {
  try {
    return Buffer.from(filename, 'latin1').toString('utf8');
  } catch (e) {
    return filename;
  }
}

// @route   GET /api/gamme-products
// @desc    Récupérer tous les produits (avec filtres optionnels)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { client_type, family } = req.query;
    
    let sql = 'SELECT * FROM gamme_products WHERE 1=1';
    const params = [];
    
    if (client_type) {
      sql += ' AND client_type = ?';
      params.push(client_type);
    }
    
    if (family) {
      sql += ' AND family = ?';
      params.push(family);
    }
    
    sql += ' ORDER BY client_type, family, product_name';
    
    const products = await query(sql, params);
    res.json(products);
  } catch (error) {
    console.error('Erreur get gamme products:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des produits' 
    });
  }
});

// @route   POST /api/gamme-products
// @desc    Créer un nouveau produit
// @access  Private (Admin)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { client_type, family, product_name, description } = req.body;
    
    if (!client_type || !family || !product_name) {
      return res.status(400).json({ 
        error: 'Les champs client_type, family et product_name sont requis' 
      });
    }
    
    const productKey = `${client_type}_${family}_${product_name}`;
    
    // Vérifier si le produit existe déjà
    const existing = await query(
      'SELECT id FROM gamme_products WHERE product_key = ?',
      [productKey]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Ce produit existe déjà' 
      });
    }
    
    // Créer le produit
    const result = await query(
      `INSERT INTO gamme_products (product_key, client_type, family, product_name, description)
       VALUES (?, ?, ?, ?, ?)`,
      [productKey, client_type, family, product_name, description || '']
    );
    
    const newProduct = await query(
      'SELECT * FROM gamme_products WHERE id = ?',
      [result.insertId]
    );
    
    console.log(`✅ Produit créé: ${productKey}`);
    res.status(201).json({
      message: 'Produit créé avec succès',
      product: newProduct[0]
    });
  } catch (error) {
    console.error('Erreur create gamme product:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du produit' 
    });
  }
});

// @route   PUT /api/gamme-products/:id
// @desc    Mettre à jour un produit
// @access  Private (Admin)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, description } = req.body;
    
    const existing = await query(
      'SELECT * FROM gamme_products WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const product = existing[0];
    const newProductKey = `${product.client_type}_${product.family}_${product_name || product.product_name}`;
    
    await query(
      `UPDATE gamme_products 
       SET product_key = ?, product_name = ?, description = ?, updated_at = NOW()
       WHERE id = ?`,
      [newProductKey, product_name || product.product_name, description || product.description, id]
    );
    
    // Mettre à jour les fichiers associés avec la nouvelle clé
    if (newProductKey !== product.product_key) {
      await query(
        'UPDATE gamme_product_files SET product_key = ? WHERE product_key = ?',
        [newProductKey, product.product_key]
      );
    }
    
    const updated = await query(
      'SELECT * FROM gamme_products WHERE id = ?',
      [id]
    );
    
    res.json({
      message: 'Produit mis à jour avec succès',
      product: updated[0]
    });
  } catch (error) {
    console.error('Erreur update gamme product:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du produit' 
    });
  }
});

// @route   DELETE /api/gamme-products/:id
// @desc    Supprimer un produit et ses fichiers
// @access  Private (Admin)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const existing = await query(
      'SELECT product_key FROM gamme_products WHERE id = ?',
      [id]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const productKey = existing[0].product_key;
    
    // Supprimer les fichiers associés
    await query(
      'DELETE FROM gamme_product_files WHERE product_key = ?',
      [productKey]
    );
    
    // Supprimer le produit
    await query(
      'DELETE FROM gamme_products WHERE id = ?',
      [id]
    );
    
    res.json({ 
      message: 'Produit et fichiers associés supprimés avec succès' 
    });
  } catch (error) {
    console.error('Erreur delete gamme product:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du produit' 
    });
  }
});

// @route   GET /api/gamme-products/:id/files
// @desc    Récupérer les fichiers d'un produit
// @access  Public
router.get('/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await query(
      'SELECT product_key FROM gamme_products WHERE id = ?',
      [id]
    );
    
    if (product.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const files = await query(
      `SELECT id, file_name, file_size, file_type, display_order, created_at
       FROM gamme_product_files 
       WHERE product_key = ? AND file_size > 0
       ORDER BY display_order`,
      [product[0].product_key]
    );
    
    res.json(files);
  } catch (error) {
    console.error('Erreur get product files:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des fichiers' 
    });
  }
});

// @route   POST /api/gamme-products/:id/files
// @desc    Ajouter des fichiers à un produit
// @access  Private (Admin)
router.post('/:id/files', auth, authorize('admin'), upload.array('files', 10), handleMulterError, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Au moins un fichier est requis' });
    }
    
    const product = await query(
      'SELECT product_key FROM gamme_products WHERE id = ?',
      [id]
    );
    
    if (product.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const productKey = product[0].product_key;
    const uploadedFiles = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileBase64 = file.buffer.toString('base64');
      const fileName = fixFilenameEncoding(file.originalname);
      
      // Vérifier si le fichier existe déjà
      const existing = await query(
        'SELECT id FROM gamme_product_files WHERE product_key = ? AND file_name = ?',
        [productKey, fileName]
      );
      
      if (existing.length === 0) {
        const result = await query(
          `INSERT INTO gamme_product_files 
           (product_key, file_name, file_content, file_size, file_type, display_order) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [productKey, fileName, fileBase64, file.size, file.mimetype, i]
        );
        
        uploadedFiles.push({
          id: result.insertId,
          file_name: fileName,
          file_size: file.size,
          file_type: file.mimetype
        });
      }
    }
    
    res.status(201).json({
      message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Erreur upload files:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'upload des fichiers' 
    });
  }
});

// @route   GET /api/gamme-products/:id/files/:fileId/download
// @desc    Télécharger un fichier
// @access  Public
router.get('/:id/files/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const files = await query(
      'SELECT file_content, file_type, file_name FROM gamme_product_files WHERE id = ? AND file_size > 0',
      [fileId]
    );
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    const file = files[0];
    const fileBuffer = Buffer.from(file.file_content, 'base64');
    
    res.setHeader('Content-Type', file.file_type || 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.file_name)}"; filename*=UTF-8''${encodeURIComponent(file.file_name)}`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    res.send(fileBuffer);
  } catch (error) {
    console.error('Erreur download file:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du téléchargement du fichier' 
    });
  }
});

// @route   DELETE /api/gamme-products/:id/files/:fileId
// @desc    Supprimer un fichier
// @access  Private (Admin)
router.delete('/:id/files/:fileId', auth, authorize('admin'), async (req, res) => {
  try {
    const { id, fileId } = req.params;
    
    const product = await query(
      'SELECT product_key FROM gamme_products WHERE id = ?',
      [id]
    );
    
    if (product.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const result = await query(
      'DELETE FROM gamme_product_files WHERE id = ? AND product_key = ?',
      [fileId, product[0].product_key]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    res.json({ message: 'Fichier supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete file:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du fichier' 
    });
  }
});

module.exports = router;

