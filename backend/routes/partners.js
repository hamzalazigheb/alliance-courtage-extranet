const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload en mémoire (pour base64)
const logoStorage = multer.memoryStorage();

const uploadLogo = multer({
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpg|jpeg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers images sont autorisés'));
    }
  }
});

// Middleware pour gérer les erreurs multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux. Taille maximale: 5MB' });
    }
    return res.status(400).json({ error: 'Erreur upload fichier: ' + err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message || 'Erreur upload fichier' });
  }
  next();
};

// @route   GET /api/partners
// @desc    Obtenir tous les partenaires
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, search, active = true } = req.query;
    
    let sql = 'SELECT * FROM partners';
    const conditions = [];
    const params = [];
    
    if (active === 'true') {
      conditions.push('is_active = TRUE');
    }
    
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    
    if (search) {
      conditions.push('(nom LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY nom';
    
    const partners = await query(sql, params);
    
    const host = `${req.protocol}://${req.get('host')}`;
    
    // Add logoUrl for each partner
    const partnersWithLogoUrl = partners.map(partner => {
      let logoUrl = null;
      if (partner.logo_content) {
        // Logo en base64
        logoUrl = `${host}/api/partners/${partner.id}/logo`;
      } else if (partner.logo_url && partner.logo_url.trim() !== '') {
        // Ancien logo avec logo_url
        logoUrl = `${host}${partner.logo_url}`;
      }
      
      return {
        ...partner,
        logoUrl: logoUrl,
        hasLogoContent: !!partner.logo_content
      };
    });
    
    res.json(partnersWithLogoUrl);
  } catch (error) {
    console.error('Erreur get partners:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des partenaires' 
    });
  }
});

// @route   GET /api/partners/:id
// @desc    Obtenir un partenaire par ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const partners = await query(
      'SELECT * FROM partners WHERE id = ?',
      [id]
    );
    
    if (partners.length === 0) {
      return res.status(404).json({ 
        error: 'Partenaire non trouvé' 
      });
    }
    
    const host = `${req.protocol}://${req.get('host')}`;
    const partner = partners[0];
    
    let logoUrl = null;
    if (partner.logo_content) {
      logoUrl = `${host}/api/partners/${partner.id}/logo`;
    } else if (partner.logo_url && partner.logo_url.trim() !== '') {
      logoUrl = `${host}${partner.logo_url}`;
    }
    
    res.json({
      ...partner,
      logoUrl: logoUrl,
      hasLogoContent: !!partner.logo_content
    });
  } catch (error) {
    console.error('Erreur get partner:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du partenaire' 
    });
  }
});

// @route   POST /api/partners
// @desc    Créer un nouveau partenaire (avec upload de logo en base64)
// @access  Private (Admin seulement)
router.post('/', auth, authorize('admin'), uploadLogo.single('logo'), handleMulterError, async (req, res) => {
  try {
    const {
      nom,
      logo_url,
      description,
      website,
      contact_email,
      contact_phone,
      category,
      is_active
    } = req.body;
    
    // Validation des données requises
    if (!nom) {
      return res.status(400).json({ 
        error: 'Nom du partenaire requis' 
      });
    }
    
    // Gérer l'upload du logo en base64
    let finalLogoUrl = logo_url || null;
    let logoContent = null;
    
    if (req.file) {
      // Check if buffer exists
      if (!req.file.buffer) {
        return res.status(400).json({ 
          error: 'Erreur: fichier non reçu correctement' 
        });
      }
      
      // Convert file buffer to base64
      const fileBase64 = req.file.buffer.toString('base64');
      const base64Prefix = `data:${req.file.mimetype};base64,`;
      logoContent = base64Prefix + fileBase64;
      finalLogoUrl = ''; // Empty string when using base64
    }
    
    // Force is_active to true by default for new partners
    const activeStatus = is_active !== undefined ? Boolean(is_active) : true;
    
    // Convertir undefined en null pour les champs optionnels
    const finalDescription = description || null;
    const finalWebsite = website || null;
    const finalContactEmail = contact_email || null;
    const finalContactPhone = contact_phone || null;
    
    const host = `${req.protocol}://${req.get('host')}`;
    
    // Créer le partenaire
    const result = await query(
      `INSERT INTO partners 
       (nom, logo_url, logo_content, description, website, contact_email, contact_phone, category, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, finalLogoUrl, logoContent, finalDescription, finalWebsite, finalContactEmail, finalContactPhone, category, activeStatus]
    );
    
    const logoUrl = logoContent ? `${host}/api/partners/${result.insertId}/logo` : (finalLogoUrl ? `${host}${finalLogoUrl}` : null);
    
    console.log('✅ Partner created:', { 
      id: result.insertId, 
      nom, 
      category, 
      is_active: activeStatus,
      hasLogoContent: !!logoContent
    });
    
    res.status(201).json({
      message: 'Partenaire créé avec succès',
      partnerId: result.insertId,
      logoUrl: logoUrl,
      is_active: activeStatus
    });
  } catch (error) {
    console.error('Erreur create partner:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du partenaire' 
    });
  }
});

// @route   GET /api/partners/:id/logo
// @desc    Servir le logo d'un partenaire depuis la base de données (base64)
// @access  Public
// NOTE: Cette route doit être définie AVANT /:id pour éviter les conflits de routing
router.get('/:id/logo', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Récupérer le partenaire avec le contenu du logo
    const partners = await query(
      'SELECT logo_content, logo_url FROM partners WHERE id = ?',
      [id]
    );
    
    if (partners.length === 0) {
      return res.status(404).json({ error: 'Partenaire non trouvé' });
    }
    
    const partner = partners[0];
    
    // Si logo_content existe (base64), le décoder et servir
    if (partner.logo_content) {
      // Extraire le base64 du data URL
      const base64Data = partner.logo_content.replace(/^data:.*,/, '');
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      // Déterminer le type MIME
      const mimeMatch = partner.logo_content.match(/^data:([^;]+);/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.setHeader('Content-Length', imageBuffer.length);
      
      return res.send(imageBuffer);
    }
    
    // Fallback : si logo_url existe (anciens logos)
    if (partner.logo_url && partner.logo_url.trim() !== '') {
      const logoPath = path.join(__dirname, '../..', partner.logo_url);
      if (fs.existsSync(logoPath)) {
        return res.sendFile(path.resolve(logoPath));
      }
    }
    
    return res.status(404).json({ error: 'Logo non trouvé' });
  } catch (error) {
    console.error('Erreur serve logo:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du logo' 
    });
  }
});

// @route   PUT /api/partners/:id
// @desc    Mettre à jour un partenaire (avec upload de logo en base64)
// @access  Private (Admin seulement)
router.put('/:id', auth, authorize('admin'), uploadLogo.single('logo'), handleMulterError, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nom,
      logo_url,
      description,
      website,
      contact_email,
      contact_phone,
      category,
      is_active
    } = req.body;
    
    // Vérifier que le partenaire existe
    const existingPartners = await query(
      'SELECT id, logo_url, logo_content FROM partners WHERE id = ?',
      [id]
    );
    
    if (existingPartners.length === 0) {
      return res.status(404).json({ 
        error: 'Partenaire non trouvé' 
      });
    }
    
    // Gérer l'upload du nouveau logo en base64 si fourni
    let finalLogoUrl = existingPartners[0].logo_url;
    let logoContent = existingPartners[0].logo_content;
    
    if (req.file) {
      // Check if buffer exists
      if (!req.file.buffer) {
        return res.status(400).json({ 
          error: 'Erreur: fichier non reçu correctement' 
        });
      }
      
      // Convert file buffer to base64
      const fileBase64 = req.file.buffer.toString('base64');
      const base64Prefix = `data:${req.file.mimetype};base64,`;
      logoContent = base64Prefix + fileBase64;
      finalLogoUrl = ''; // Empty string when using base64
      
      // Note: Pas besoin de supprimer l'ancien logo car il est en base64 dans la DB
    } else if (logo_url) {
      // Si logo_url est fourni explicitement (pas de nouveau fichier)
      finalLogoUrl = logo_url;
      logoContent = null; // Clear base64 if setting URL
    }
    
    // Convertir undefined en null pour les champs optionnels
    const finalDescription = description !== undefined ? description : existingPartners[0].description;
    const finalWebsite = website !== undefined ? website : existingPartners[0].website;
    const finalContactEmail = contact_email !== undefined ? contact_email : existingPartners[0].contact_email;
    const finalContactPhone = contact_phone !== undefined ? contact_phone : existingPartners[0].contact_phone;
    
    const host = `${req.protocol}://${req.get('host')}`;
    
    // Mettre à jour le partenaire
    await query(
      `UPDATE partners 
       SET nom = ?, logo_url = ?, logo_content = ?, description = ?, website = ?, 
           contact_email = ?, contact_phone = ?, category = ?, is_active = ?
       WHERE id = ?`,
      [nom, finalLogoUrl, logoContent, finalDescription, finalWebsite, finalContactEmail, finalContactPhone, category, is_active, id]
    );
    
    const updatedLogoUrl = logoContent ? `${host}/api/partners/${id}/logo` : (finalLogoUrl ? `${host}${finalLogoUrl}` : null);
    
    res.json({ 
      message: 'Partenaire mis à jour avec succès',
      logoUrl: updatedLogoUrl
    });
  } catch (error) {
    console.error('Erreur update partner:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du partenaire' 
    });
  }
});

// @route   DELETE /api/partners/:id
// @desc    Supprimer un partenaire
// @access  Private (Admin seulement)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que le partenaire existe
    const existingPartners = await query(
      'SELECT id FROM partners WHERE id = ?',
      [id]
    );
    
    if (existingPartners.length === 0) {
      return res.status(404).json({ 
        error: 'Partenaire non trouvé' 
      });
    }
    
    // Supprimer le partenaire
    await query(
      'DELETE FROM partners WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Partenaire supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete partner:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du partenaire' 
    });
  }
});

// @route   GET /api/partners/categories/list
// @desc    Obtenir la liste des catégories de partenaires
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await query(
      'SELECT DISTINCT category FROM partners WHERE category IS NOT NULL ORDER BY category'
    );
    
    res.json(categories.map(cat => cat.category));
  } catch (error) {
    console.error('Erreur get categories:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des catégories' 
    });
  }
});

module.exports = router;


