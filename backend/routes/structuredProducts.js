const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { notifyAdmins } = require('./notifications');

const router = express.Router();

// Fonction pour corriger l'encodage des noms de fichiers
function fixFilenameEncoding(filename) {
  try {
    // Si le nom de fichier est déjà en UTF-8 valide, le retourner
    if (Buffer.from(filename, 'utf8').toString('utf8') === filename) {
      return filename;
    }
    
    // Essayer de décoder depuis latin1 vers UTF-8 (problème courant)
    const buffer = Buffer.from(filename, 'latin1');
    return buffer.toString('utf8');
  } catch (error) {
    console.error('Erreur encodage filename:', error);
    return filename;
  }
}

// Configuration de multer pour l'upload de fichiers produits structurés en mémoire (base64)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5000 * 1024 * 1024 // 5GB par défaut
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les documents de produits structurés
    const allowedExtensions = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i;
    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    
    // MIME types autorisés (incluant les types Excel spécifiques)
    const excelMimeTypes = [
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
    ];
    
    // Pattern pour les autres types de fichiers
    const allowedMimePatterns = /pdf|doc|docx|xls|xlsx|ppt|pptx/i;
    const mimetype = allowedMimePatterns.test(file.mimetype) || 
                     excelMimeTypes.includes(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé pour les produits structurés. Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX'));
    }
  }
});

// Middleware pour gérer les erreurs multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux. Taille maximale: 5GB' });
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
             CASE WHEN a.file_content IS NOT NULL THEN 1 ELSE 0 END as has_file_content,
             COUNT(pf.id) as files_count
      FROM archives a
      LEFT JOIN users u ON a.uploaded_by = u.id
      LEFT JOIN product_files pf ON a.id = pf.product_id
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
    
    sql += ' GROUP BY a.id ORDER BY a.created_at DESC';
    
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
router.post('/', auth, authorize('admin'), upload.array('files', 10), handleMulterError, async (req, res) => {
  try {
    const {
      title,
      description,
      assurances, // Peut être un JSON array ou une string
      assurance, // Ancien format pour compatibilité
      category,
      montant_enveloppe
    } = req.body;
    
    // Vérifier qu'au moins un fichier a été uploadé
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'Au moins un fichier est requis' 
      });
    }
    
    // Parser les assurances (peut être JSON string ou array)
    // Format attendu: [{name: string, montant: string}, ...] ou [string, ...]
    let assurancesArray = [];
    if (assurances) {
      try {
        assurancesArray = typeof assurances === 'string' ? JSON.parse(assurances) : assurances;
        if (!Array.isArray(assurancesArray)) {
          assurancesArray = [assurancesArray];
        }
      } catch (e) {
        // Si ce n'est pas du JSON valide, traiter comme une string simple
        assurancesArray = [assurances];
      }
    } else if (assurance) {
      // Compatibilité avec l'ancien format
      assurancesArray = [assurance];
    }
    
    // Extraire les noms des assurances (si c'est un tableau d'objets {name, montant})
    const assurancesNames = assurancesArray.map(a => {
      if (typeof a === 'object' && a.name) {
        return a.name;
      }
      return a; // Si c'est déjà une string
    });
    
    // Validation des données requises
    if (!title || assurancesNames.length === 0 || !category) {
      return res.status(400).json({ 
        error: 'Titre, au moins une assurance et catégorie requis' 
      });
    }
    
    // Vérifier que tous les montants sont fournis si c'est un tableau d'objets
    if (assurancesArray.length > 0 && typeof assurancesArray[0] === 'object') {
      const missingMontants = assurancesArray.filter(a => !a.montant || parseFloat(a.montant) <= 0);
      if (missingMontants.length > 0) {
      return res.status(400).json({ 
          error: 'Tous les montants enveloppe doivent être remplis et positifs' 
      });
      }
    }
    
    // Validation du montant enveloppe (requis et doit être un nombre positif)
    if (!montant_enveloppe) {
      return res.status(400).json({ 
        error: 'Le montant enveloppe est requis' 
      });
    }
    
    const montantEnveloppe = parseFloat(montant_enveloppe);
    if (isNaN(montantEnveloppe) || montantEnveloppe < 0) {
      return res.status(400).json({ 
        error: 'Le montant enveloppe doit être un nombre positif' 
      });
    }
    
    const host = `${req.protocol}://${req.get('host')}`;
    
    // NOUVELLE LOGIQUE: Créer un produit SÉPARÉ pour chaque assurance
    // Cela permet de supprimer/modifier chaque produit indépendamment
    const createdProducts = [];
    
    // Boucle sur chaque assurance
    for (const assuranceItem of assurancesArray) {
      const assuranceName = typeof assuranceItem === 'object' && assuranceItem.name 
        ? assuranceItem.name 
        : assuranceItem;
      const assuranceMontant = typeof assuranceItem === 'object' && assuranceItem.montant 
        ? parseFloat(assuranceItem.montant) 
        : montantEnveloppe;
      
      // Créer un produit pour cette assurance
      let result;
      try {
        // Essayer d'insérer avec montant_enveloppe
        result = await query(
          `INSERT INTO archives 
           (title, description, category, assurance, uploaded_by, montant_enveloppe) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            title,
            description || '',
            category,
            assuranceName, // Stocker le nom de l'assurance uniquement (pas de JSON)
            req.user.id,
            assuranceMontant
          ]
        );
      } catch (error) {
        // Si la colonne n'existe pas, insérer sans montant_enveloppe
        if (error.code === 'ER_BAD_FIELD_ERROR' || error.message.includes('montant_enveloppe')) {
          console.warn('Colonne montant_enveloppe non trouvée, insertion sans cette colonne');
          result = await query(
            `INSERT INTO archives 
             (title, description, category, assurance, uploaded_by) 
             VALUES (?, ?, ?, ?, ?)`,
            [
              title,
              description || '',
              category,
              assuranceName,
              req.user.id
            ]
          );
        } else {
          throw error;
        }
      }
      
      const productId = result.insertId;
      createdProducts.push({ id: productId, assurance: assuranceName, montant: assuranceMontant });
      
      // Dupliquer chaque fichier pour ce produit
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const fileBase64 = file.buffer.toString('base64');
        const fileName = fixFilenameEncoding(file.originalname);
        
        await query(
          `INSERT INTO product_files 
           (product_id, file_name, file_content, file_size, file_type, display_order) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            productId,
            fileName,
            fileBase64,
            file.size,
            file.mimetype,
            i // Ordre d'affichage
          ]
        );
      }
    }
    
    // Notifier tous les utilisateurs (via notification globale)
    // Utiliser le premier productId pour la notification
    await notifyAdmins(
      'product',
      'Nouveau produit structuré',
      `Un nouveau produit structuré "${title}" a été ajouté dans la catégorie ${category} pour ${createdProducts.length} assurance(s) avec ${req.files.length} fichier(s) chacun.`,
      createdProducts[0].id,
      'structured_product'
    );

    console.log('✅ Structured products created:', { 
      products: createdProducts, 
      title, 
      category, 
      filesCount: req.files.length
    });
    
    res.status(201).json({
      message: `${createdProducts.length} produit(s) structuré(s) créé(s) avec succès (un par assurance)`,
      products: createdProducts,
      filesCount: req.files.length
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

// @route   GET /api/structured-products/:id/files
// @desc    Récupérer tous les fichiers d'un produit
// @access  Public
router.get('/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    
    const files = await query(
      'SELECT id, file_name, file_size, file_type, display_order, created_at FROM product_files WHERE product_id = ? ORDER BY display_order',
      [id]
    );
    
    res.json(files);
  } catch (error) {
    console.error('Erreur get product files:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des fichiers' 
    });
  }
});

// @route   GET /api/structured-products/:id/files/:fileId/download
// @desc    Télécharger un fichier spécifique
// @access  Public
router.get('/:id/files/:fileId/download', async (req, res) => {
  try {
    const { id, fileId } = req.params;
    
    const files = await query(
      'SELECT file_content, file_type, file_name FROM product_files WHERE id = ? AND product_id = ?',
      [fileId, id]
    );
    
    if (files.length === 0) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    const file = files[0];
    const fileBuffer = Buffer.from(file.file_content, 'base64');
    
    const extension = path.extname(file.file_name).replace('.', '').toLowerCase() || 'pdf';
    
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

// @route   DELETE /api/structured-products/:id/files/:fileId
// @desc    Supprimer un fichier spécifique
// @access  Private (Admin seulement)
// @route   PUT /api/structured-products/:id/files/:fileId
// @desc    Remplacer un fichier d'un produit
// @access  Admin
router.put('/:id/files/:fileId', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const { id, fileId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Vérifier que le fichier appartient au produit
    const [existingFile] = await query(
      'SELECT id FROM product_files WHERE id = ? AND product_id = ?',
      [fileId, id]
    );

    if (!existingFile) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Encoder le nouveau fichier en base64
    const fileContent = req.file.buffer.toString('base64');
    const fileName = fixFilenameEncoding(req.file.originalname);

    // Mettre à jour le fichier
    await query(
      `UPDATE product_files 
       SET file_name = ?, 
           file_content = ?, 
           file_size = ?, 
           file_type = ?
       WHERE id = ? AND product_id = ?`,
      [
        fileName,
        fileContent,
        req.file.size,
        req.file.mimetype,
        fileId,
        id
      ]
    );

    res.json({ 
      message: 'Fichier remplacé avec succès',
      file: {
        id: fileId,
        name: fileName,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Erreur replace file:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du remplacement du fichier' 
    });
  }
});

router.delete('/:id/files/:fileId', auth, authorize('admin'), async (req, res) => {
  try {
    const { id, fileId } = req.params;
    
    await query(
      'DELETE FROM product_files WHERE id = ? AND product_id = ?',
      [fileId, id]
    );
    
    res.json({ message: 'Fichier supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete file:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du fichier' 
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
      // Extraire le base64 (avec ou sans préfixe data:)
      let base64Data = product.file_content;
      let mimeType = product.file_type || 'application/octet-stream';
      
      // Si c'est un data URL, extraire le MIME et le base64
      if (product.file_content.startsWith('data:')) {
      const mimeMatch = product.file_content.match(/^data:([^;]+);/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
        base64Data = product.file_content.replace(/^data:.*,/, '');
      }
      
      const fileBuffer = Buffer.from(base64Data, 'base64');
      
      // Mapper les types MIME vers les extensions correctes
      const mimeToExt = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'application/vnd.ms-powerpoint': 'ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
        'application/octet-stream': 'xls', // Fallback pour Excel mal détecté
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'text/plain': 'txt'
      };
      
      // Utiliser l'extension du fichier original si disponible, sinon utiliser le mapping MIME
      let extension = 'pdf';
      if (product.file_path && product.file_path.includes('.')) {
        // Extraire l'extension du nom de fichier original stocké dans file_path
        const originalExt = path.extname(product.file_path).replace('.', '').toLowerCase();
        extension = originalExt || mimeToExt[mimeType] || 'pdf';
      } else {
        // Utiliser le mapping MIME, avec fallback intelligent pour Excel
        extension = mimeToExt[mimeType] || 'pdf';
      }
      
      // Log pour debug
      console.log('📥 Download structured product:', {
        id,
        title: product.title,
        file_path: product.file_path,
        mimeType,
        extension
      });
      
      const safeTitle = (product.title || 'product').replace(/[^a-zA-Z0-9À-ÿ\s\-_]/g, '');
      const filename = `${safeTitle}.${extension}`;
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
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
// @route   PUT /api/structured-products/:id/file
// @desc    Mettre à jour le fichier d'un produit structuré
// @access  Private (Admin seulement)
router.put('/:id/file', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Vérifier que le produit existe
    const products = await query(
      'SELECT id, file_path FROM archives WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Produit structuré non trouvé' });
    }

    // Supprimer l'ancien fichier physique si il existe
    const oldFilePath = products[0].file_path;
    if (oldFilePath && fs.existsSync(oldFilePath)) {
      try {
        fs.unlinkSync(oldFilePath);
        console.log(`✅ Old file deleted: ${oldFilePath}`);
      } catch (unlinkError) {
        console.warn('Warning: Could not delete old physical file:', unlinkError);
      }
    }

    // Convertir le fichier en base64
    const fileContent = file.buffer.toString('base64');
    const fileSize = file.size;
    const fileType = file.mimetype;
    const fileName = fixFilenameEncoding(file.originalname);

    // Mettre à jour le produit avec le nouveau fichier
    await query(
      `UPDATE archives 
       SET file_content = ?, 
           file_size = ?, 
           file_type = ?,
           file_path = ?
       WHERE id = ?`,
      [fileContent, fileSize, fileType, fileName, id]
    );

    console.log(`✅ File updated for structured product ${id}`);
    res.json({ 
      message: 'Fichier mis à jour avec succès',
      file: {
        name: fileName,
        size: fileSize,
        type: fileType
      }
    });
  } catch (error) {
    console.error('Erreur update file:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du fichier' 
    });
  }
});

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
    const { montant, notes, assurance_name } = req.body;
    
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
    
    // Parser les assurances du produit pour valider que l'assurance_name existe
    let productAssurances = [];
    try {
      const parsed = JSON.parse(product.assurance);
      if (Array.isArray(parsed)) {
        if (parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0].name) {
          productAssurances = parsed.map(a => a.name);
        } else {
          productAssurances = parsed;
        }
      }
    } catch (e) {
      productAssurances = [product.assurance];
    }
    
    // Si assurance_name est fourni, valider qu'il existe dans le produit
    let finalAssuranceName = assurance_name;
    if (assurance_name && !productAssurances.includes(assurance_name)) {
      return res.status(400).json({ 
        error: `L'assurance "${assurance_name}" n'existe pas pour ce produit` 
      });
    }
    
    // Si pas d'assurance_name fourni, prendre la première assurance du produit
    if (!finalAssuranceName && productAssurances.length > 0) {
      finalAssuranceName = productAssurances[0];
    }
    
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
    
    // Créer la réservation avec assurance_name
    const result = await query(
      `INSERT INTO product_reservations (product_id, assurance_name, user_id, montant, notes, status) 
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [id, finalAssuranceName, req.user.id, parseFloat(montant), notes || null]
    );
    
    // Notifier les admins (avec le nom de l'utilisateur)
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
    
    // Notifier tous les utilisateurs (sans le nom de l'utilisateur)
    const { createNotification } = require('./notifications');
    await createNotification(
      'reservation_public',
      'Nouvelle réservation',
      `Un utilisateur a réservé ${montantFormatted} pour le produit "${product.title}"`,
      null, // user_id = NULL pour notification globale
      result.insertId,
      'product_reservation',
      null // pas de lien
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
             a.title as product_title, 
             COALESCE(pr.assurance_name, a.assurance) as assurance,
             a.category
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
          // Calculer le montant réservé (seulement les réservations approuvées) pour cette assurance spécifique
          // Utilise assurance_name pour filtrer uniquement les réservations de cette assurance
          const reservations = await query(
            `SELECT COALESCE(SUM(pr.montant), 0) as total_reserve
             FROM product_reservations pr
             WHERE pr.assurance_name = ? AND pr.status = 'approved'`,
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









