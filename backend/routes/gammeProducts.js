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

// ============================================
// FAMILIES API - Gestion des familles en base de données
// ============================================

// @route   GET /api/gamme-products/families
// @desc    Récupérer toutes les familles
// @access  Public
router.get('/families', async (req, res) => {
  try {
    // Récupérer les familles de la table gamme_families (filtrer les entrées vides)
    const families = await query(
      `SELECT * FROM gamme_families 
       WHERE label IS NOT NULL AND label != '' AND TRIM(label) != ''
       AND value IS NOT NULL AND value != '' AND TRIM(value) != ''
       ORDER BY display_order, label`
    );
    
    // Double vérification côté JavaScript
    const validFamilies = families.filter(f => 
      f.label && f.label.trim() && f.value && f.value.trim()
    );
    
    res.json(validFamilies);
  } catch (error) {
    console.error('Erreur get families:', error);
    // Si la table n'existe pas, retourner les familles par défaut
    res.json([
      { value: 'epargne', label: 'Épargne', icon: '💰', display_order: 1 },
      { value: 'retraite', label: 'Retraite', icon: '👴', display_order: 2 },
      { value: 'prevoyance', label: 'Prévoyance', icon: '🛡️', display_order: 3 },
      { value: 'sante', label: 'Santé', icon: '❤️', display_order: 4 },
      { value: 'cif', label: 'CIF', icon: '📊', display_order: 5 }
    ]);
  }
});

// @route   POST /api/gamme-products/families
// @desc    Créer une nouvelle famille
// @access  Private (Admin)
router.post('/families', auth, authorize('admin'), async (req, res) => {
  try {
    const { value, label, icon, nom } = req.body;
    
    // Accepter soit "label" soit "nom" comme nom de la famille
    const rawLabel = label || nom || '';
    const familyLabel = rawLabel.trim();
    
    // Validation stricte - le nom ne doit pas être vide
    if (!familyLabel || familyLabel.length === 0) {
      return res.status(400).json({ error: 'Le nom de la famille est requis et ne peut pas être vide' });
    }
    
    // Validation longueur minimale
    if (familyLabel.length < 2) {
      return res.status(400).json({ error: 'Le nom de la famille doit contenir au moins 2 caractères' });
    }
    
    // Générer automatiquement la valeur (slug) à partir du label
    const familyValue = (value || familyLabel.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]/g, '_') // Remplacer les caractères spéciaux
      .replace(/_+/g, '_') // Éviter les underscores multiples
      .replace(/^_|_$/g, '')).trim(); // Enlever underscores au début/fin + trim
    
    // Validation de la valeur générée
    if (!familyValue || familyValue.length === 0) {
      return res.status(400).json({ error: 'Impossible de générer un identifiant valide pour cette famille' });
    }
    
    // Vérifier si la famille existe déjà
    const existing = await query(
      'SELECT id FROM gamme_families WHERE value = ?',
      [familyValue]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cette famille existe déjà' });
    }
    
    // Obtenir le prochain display_order
    const maxOrder = await query(
      'SELECT MAX(display_order) as max_order FROM gamme_families'
    );
    const nextOrder = (maxOrder[0]?.max_order || 0) + 1;
    
    // Insérer la nouvelle famille
    const result = await query(
      `INSERT INTO gamme_families (value, label, icon, display_order) VALUES (?, ?, ?, ?)`,
      [familyValue, familyLabel, icon || '📁', nextOrder]
    );
    
    const newFamily = {
      id: result.insertId,
      value: familyValue,
      label: familyLabel,
      icon: icon || '📁',
      display_order: nextOrder
    };
    
    console.log(`✅ Famille créée: ${familyLabel} (${familyValue})`);
    res.status(201).json({
      message: 'Famille créée avec succès',
      family: newFamily
    });
  } catch (error) {
    console.error('Erreur create family:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la famille' });
  }
});

// @route   DELETE /api/gamme-products/families/:value
// @desc    Supprimer une famille
// @access  Private (Admin)
router.delete('/families/:value', auth, authorize('admin'), async (req, res) => {
  try {
    const { value } = req.params;
    
    // Vérifier si des produits utilisent cette famille
    const productsCount = await query(
      'SELECT COUNT(*) as count FROM gamme_products WHERE family = ?',
      [value]
    );
    
    if (productsCount[0].count > 0) {
      return res.status(400).json({ 
        error: `Impossible de supprimer: ${productsCount[0].count} produit(s) utilisent cette famille`
      });
    }
    
    // Supprimer la famille
    const result = await query(
      'DELETE FROM gamme_families WHERE value = ?',
      [value]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Famille non trouvée' });
    }
    
    console.log(`🗑️ Famille supprimée: ${value}`);
    res.json({ message: 'Famille supprimée avec succès' });
  } catch (error) {
    console.error('Erreur delete family:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la famille' });
  }
});

// ============================================
// PRODUCTS API
// ============================================

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

// @route   POST /api/gamme-products/create-with-files
// @desc    Créer des produits avec fichiers en une seule requête (optimisé)
// @access  Private (Admin)
router.post('/create-with-files', auth, authorize('admin'), upload.array('files', 10), handleMulterError, async (req, res) => {
  try {
    const { client_types, families, product_name, description } = req.body;
    
    // Valider les données
    if (!client_types || !families || !product_name) {
      return res.status(400).json({ 
        error: 'Les champs client_types, families et product_name sont requis' 
      });
    }

    // Parser les tableaux JSON
    const clientTypesArray = JSON.parse(client_types);
    const familiesArray = JSON.parse(families);

    if (!Array.isArray(clientTypesArray) || clientTypesArray.length === 0) {
      return res.status(400).json({ error: 'client_types doit être un tableau non vide' });
    }

    if (!Array.isArray(familiesArray) || familiesArray.length === 0) {
      return res.status(400).json({ error: 'families doit être un tableau non vide' });
    }
    
    // Nettoyer et valider les familles (enlever les valeurs vides)
    const validFamilies = familiesArray
      .map(f => (typeof f === 'string' ? f.trim() : String(f).trim()))
      .filter(f => f && f.length > 0);
    
    if (validFamilies.length === 0) {
      return res.status(400).json({ error: 'Aucune famille valide fournie' });
    }
    
    console.log(`📋 Familles reçues:`, familiesArray);
    console.log(`✅ Familles valides:`, validFamilies);

    const createdProducts = [];
    const errors = [];

    // Créer tous les produits
    for (const client_type of clientTypesArray) {
      for (const family of validFamilies) {
        // S'assurer que la famille est une chaîne valide
        const familyValue = (typeof family === 'string' ? family.trim() : String(family).trim());
        if (!familyValue || familyValue.length === 0) {
          console.warn(`⚠️  Famille vide ignorée pour client_type=${client_type}`);
          continue;
        }
        
        const productKey = `${client_type}_${familyValue}_${product_name}`;
        
        try {
          // Vérifier si le produit existe déjà
          const existing = await query(
            'SELECT id FROM gamme_products WHERE product_key = ?',
            [productKey]
          );
          
          if (existing.length > 0) {
            console.log(`⏭️  Produit déjà existant: ${productKey}`);
            createdProducts.push({
              id: existing[0].id,
              product_key: productKey,
              already_exists: true
            });
            continue;
          }
          
          // Créer le produit avec validation stricte
          const result = await query(
            `INSERT INTO gamme_products (product_key, client_type, family, product_name, description)
             VALUES (?, ?, ?, ?, ?)`,
            [productKey, client_type, familyValue, product_name, description || '']
          );
          
          createdProducts.push({
            id: result.insertId,
            product_key: productKey,
            already_exists: false
          });
          
          console.log(`✅ Produit créé: ${productKey} (family="${familyValue}")`);
        } catch (error) {
          console.error(`❌ Erreur création produit ${productKey}:`, error);
          errors.push({ productKey, error: error.message });
        }
      }
    }

    // Uploader les fichiers pour tous les produits créés
    let totalFilesUploaded = 0;
    if (req.files && req.files.length > 0) {
      for (const product of createdProducts) {
        try {
          for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const fileBase64 = file.buffer.toString('base64');
            const fileName = fixFilenameEncoding(file.originalname);
            
            // Vérifier si le fichier existe déjà pour ce produit
            const existing = await query(
              'SELECT id FROM gamme_product_files WHERE product_key = ? AND file_name = ?',
              [product.product_key, fileName]
            );
            
            if (existing.length === 0) {
              const insertResult = await query(
                `INSERT INTO gamme_product_files 
                 (product_key, file_name, file_content, file_size, file_type, display_order) 
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [product.product_key, fileName, fileBase64, file.size, file.mimetype, i]
              );
              totalFilesUploaded++;
              console.log(`✅ Fichier "${fileName}" uploadé pour ${product.product_key} (ID: ${insertResult.insertId}, Taille: ${file.size} bytes)`);
            } else {
              console.log(`⏭️  Fichier "${fileName}" déjà existant pour ${product.product_key}`);
            }
          }
        } catch (error) {
          console.error(`⚠️  Erreur upload fichiers pour ${product.product_key}:`, error);
        }
      }
    }

    res.status(201).json({
      message: `${createdProducts.length} produit(s) créé(s) avec ${totalFilesUploaded} fichier(s) uploadé(s)`,
      products: createdProducts,
      files_uploaded: totalFilesUploaded,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Erreur create gamme products with files:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création des produits avec fichiers' 
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

// @route   DELETE /api/gamme-products/:id/files/:fileId?deleteFromAllFamilies=true
// @desc    Supprimer un fichier
// @access  Private (Admin)
router.delete('/:id/files/:fileId', auth, authorize('admin'), async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const { deleteFromAllFamilies } = req.query;
    
    const product = await query(
      'SELECT product_key, product_name FROM gamme_products WHERE id = ?',
      [id]
    );
    
    if (product.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }
    
    const productKey = product[0].product_key;
    const productName = product[0].product_name;
    
    // Récupérer le nom du fichier depuis son ID
    const fileInfo = await query(
      'SELECT file_name FROM gamme_product_files WHERE id = ?',
      [fileId]
    );
    
    if (fileInfo.length === 0) {
      console.log(`⏭️ Fichier ${fileId} inexistant`);
      return res.json({ message: 'Fichier déjà supprimé' });
    }
    
    const fileName = fileInfo[0].file_name;
    
    if (deleteFromAllFamilies === 'true') {
      // Supprimer de TOUTES les familles où ce produit existe
      // Trouver tous les product_keys pour ce nom de produit
      const allProducts = await query(
        'SELECT product_key FROM gamme_products WHERE product_name = ?',
        [productName]
      );
      
      let deletedCount = 0;
      for (const prod of allProducts) {
        const result = await query(
          'DELETE FROM gamme_product_files WHERE product_key = ? AND file_name = ?',
          [prod.product_key, fileName]
        );
        deletedCount += result.affectedRows;
      }
      
      console.log(`✅ Fichier "${fileName}" supprimé de ${deletedCount} famille(s)`);
      return res.json({ 
        message: 'Fichier supprimé avec succès',
        deletedCount 
      });
    } else {
      // Supprimer UNIQUEMENT de ce produit
      const result = await query(
        'DELETE FROM gamme_product_files WHERE id = ? AND product_key = ?',
        [fileId, productKey]
      );
      
      if (result.affectedRows === 0) {
        console.log(`⏭️ Fichier ${fileId} non trouvé pour product_key=${productKey}`);
        return res.json({ message: 'Fichier non trouvé pour ce produit' });
      }
      
      console.log(`✅ Fichier ID ${fileId} supprimé de ${productKey}`);
      return res.json({ message: 'Fichier supprimé avec succès' });
    }
  } catch (error) {
    console.error('Erreur delete file:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du fichier' 
    });
  }
});

module.exports = router;

