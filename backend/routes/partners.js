const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configuration de multer pour l'upload de logos
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Upload to root uploads folder, not backend/uploads
    const uploadPath = path.join(__dirname, '../../uploads/partners-logos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'partner-logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

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
    
    res.json(partners);
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
    
    res.json(partners[0]);
  } catch (error) {
    console.error('Erreur get partner:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du partenaire' 
    });
  }
});

// @route   POST /api/partners
// @desc    Créer un nouveau partenaire
// @access  Private (Admin seulement)
router.post('/', auth, authorize('admin'), uploadLogo.single('logo'), async (req, res) => {
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
    
    // Gérer l'upload du logo
    let finalLogoUrl = logo_url || null;
    if (req.file) {
      finalLogoUrl = `/uploads/partners-logos/${req.file.filename}`;
    }
    
    // Force is_active to true by default for new partners
    const activeStatus = is_active !== undefined ? Boolean(is_active) : true;
    
    // Convertir undefined en null pour les champs optionnels
    const finalDescription = description || null;
    const finalWebsite = website || null;
    const finalContactEmail = contact_email || null;
    const finalContactPhone = contact_phone || null;
    
    // Créer le partenaire
    const result = await query(
      `INSERT INTO partners 
       (nom, logo_url, description, website, contact_email, contact_phone, category, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nom, finalLogoUrl, finalDescription, finalWebsite, finalContactEmail, finalContactPhone, category, activeStatus]
    );
    
    console.log('✅ Partner created:', { 
      id: result.insertId, 
      nom, 
      category, 
      is_active: activeStatus 
    });
    
    res.status(201).json({
      message: 'Partenaire créé avec succès',
      partnerId: result.insertId,
      is_active: activeStatus
    });
  } catch (error) {
    console.error('Erreur create partner:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du partenaire' 
    });
  }
});

// @route   PUT /api/partners/:id
// @desc    Mettre à jour un partenaire
// @access  Private (Admin seulement)
router.put('/:id', auth, authorize('admin'), uploadLogo.single('logo'), async (req, res) => {
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
      'SELECT id, logo_url FROM partners WHERE id = ?',
      [id]
    );
    
    if (existingPartners.length === 0) {
      return res.status(404).json({ 
        error: 'Partenaire non trouvé' 
      });
    }
    
    // Gérer l'upload du nouveau logo si fourni
    let finalLogoUrl = existingPartners[0].logo_url;
    if (req.file) {
      finalLogoUrl = `/uploads/partners-logos/${req.file.filename}`;
      // Optionnel: supprimer l'ancien logo
      if (existingPartners[0].logo_url && existingPartners[0].logo_url.startsWith('/uploads/')) {
        const oldLogoPath = '.' + existingPartners[0].logo_url;
        if (fs.existsSync(oldLogoPath)) {
          fs.unlinkSync(oldLogoPath);
        }
      }
    } else if (logo_url) {
      finalLogoUrl = logo_url;
    }
    
    // Convertir undefined en null pour les champs optionnels
    const finalDescription = description !== undefined ? description : existingPartners[0].description;
    const finalWebsite = website !== undefined ? website : existingPartners[0].website;
    const finalContactEmail = contact_email !== undefined ? contact_email : existingPartners[0].contact_email;
    const finalContactPhone = contact_phone !== undefined ? contact_phone : existingPartners[0].contact_phone;
    
    // Mettre à jour le partenaire
    await query(
      `UPDATE partners 
       SET nom = ?, logo_url = ?, description = ?, website = ?, 
           contact_email = ?, contact_phone = ?, category = ?, is_active = ?
       WHERE id = ?`,
      [nom, finalLogoUrl, finalDescription, finalWebsite, finalContactEmail, finalContactPhone, category, is_active, id]
    );
    
    res.json({ message: 'Partenaire mis à jour avec succès' });
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


