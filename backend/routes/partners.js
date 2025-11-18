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
    const { category, search, active } = req.query;
    
    let sql = 'SELECT * FROM partners';
    const conditions = [];
    const params = [];
    
    // Gérer le paramètre active : si 'false' est passé explicitement, on récupère tous les partenaires
    // Sinon, par défaut, on ne récupère que les actifs
    if (active === 'false' || active === false) {
      // Ne pas ajouter de condition, récupérer tous les partenaires
    } else if (active === 'true' || active === true || active === undefined) {
      // Par défaut, récupérer uniquement les partenaires actifs
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
    
    // Récupérer les contacts et documents pour tous les partenaires
    const partnerIds = partners.map(p => p.id);
    let contactsMap = {};
    let documentsMap = {};
    
    if (partnerIds.length > 0) {
      const placeholders = partnerIds.map(() => '?').join(',');
      
      // Récupérer les contacts
      const contacts = await query(
        `SELECT * FROM partner_contacts WHERE partner_id IN (${placeholders}) ORDER BY fonction, nom, prenom`,
        partnerIds
      );
      
      // Grouper les contacts par partner_id
      contacts.forEach(contact => {
        if (!contactsMap[contact.partner_id]) {
          contactsMap[contact.partner_id] = [];
        }
        contactsMap[contact.partner_id].push(contact);
      });
      
      // Récupérer les documents
      const documents = await query(
        `SELECT id, partner_id, title, description, file_type, file_size, document_type, 
                created_at, updated_at, uploaded_by
         FROM partner_documents 
         WHERE partner_id IN (${placeholders}) 
         ORDER BY document_type, title`,
        partnerIds
      );
      
      // Grouper les documents par partner_id et ajouter l'URL de téléchargement
      documents.forEach(doc => {
        if (!documentsMap[doc.partner_id]) {
          documentsMap[doc.partner_id] = [];
        }
        documentsMap[doc.partner_id].push({
          ...doc,
          downloadUrl: `${host}/api/partners/${doc.partner_id}/documents/${doc.id}/download`
        });
      });
    }
    
    // Add logoUrl, contacts and documents for each partner
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
        hasLogoContent: !!partner.logo_content,
        contacts: contactsMap[partner.id] || [],
        documents: documentsMap[partner.id] || []
      };
    });
    
    res.json(partnersWithLogoUrl);
  } catch (error) {
    console.error('Erreur get partners:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des partenaires',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// ROUTES POUR LA GESTION DES CONTACTS
// (Doivent être définies AVANT /:id pour éviter les conflits)
// ============================================

// @route   GET /api/partners/:id/contacts
// @desc    Obtenir tous les contacts d'un partenaire
// @access  Public
router.get('/:id/contacts', async (req, res) => {
  try {
    const { id } = req.params;
    
    const contacts = await query(
      'SELECT * FROM partner_contacts WHERE partner_id = ? ORDER BY fonction, nom, prenom',
      [id]
    );
    
    res.json(contacts);
  } catch (error) {
    console.error('Erreur get contacts:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des contacts' 
    });
  }
});

// @route   POST /api/partners/:id/contacts
// @desc    Créer un nouveau contact pour un partenaire
// @access  Private (Admin seulement)
router.post('/:id/contacts', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { fonction, nom, prenom, email, telephone } = req.body;
    
    // Validation
    if (!fonction || !nom || !prenom || !email) {
      return res.status(400).json({ 
        error: 'Fonction, nom, prénom et email sont requis' 
      });
    }
    
    // Vérifier que le partenaire existe
    const partners = await query('SELECT id FROM partners WHERE id = ?', [id]);
    if (partners.length === 0) {
      return res.status(404).json({ 
        error: 'Partenaire non trouvé' 
      });
    }
    
    // Créer le contact
    const result = await query(
      `INSERT INTO partner_contacts (partner_id, fonction, nom, prenom, email, telephone) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, fonction, nom, prenom, email, telephone || null]
    );
    
    res.status(201).json({
      message: 'Contact créé avec succès',
      contactId: result.insertId
    });
  } catch (error) {
    console.error('Erreur create contact:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création du contact' 
    });
  }
});

// @route   PUT /api/partners/:id/contacts/:contactId
// @desc    Mettre à jour un contact
// @access  Private (Admin seulement)
router.put('/:id/contacts/:contactId', auth, authorize('admin'), async (req, res) => {
  try {
    const { id, contactId } = req.params;
    const { fonction, nom, prenom, email, telephone } = req.body;
    
    // Validation
    if (!fonction || !nom || !prenom || !email) {
      return res.status(400).json({ 
        error: 'Fonction, nom, prénom et email sont requis' 
      });
    }
    
    // Vérifier que le contact existe et appartient au partenaire
    const contacts = await query(
      'SELECT id FROM partner_contacts WHERE id = ? AND partner_id = ?',
      [contactId, id]
    );
    
    if (contacts.length === 0) {
      return res.status(404).json({ 
        error: 'Contact non trouvé' 
      });
    }
    
    // Mettre à jour le contact
    await query(
      `UPDATE partner_contacts 
       SET fonction = ?, nom = ?, prenom = ?, email = ?, telephone = ?
       WHERE id = ? AND partner_id = ?`,
      [fonction, nom, prenom, email, telephone || null, contactId, id]
    );
    
    res.json({ message: 'Contact mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur update contact:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du contact' 
    });
  }
});

// @route   DELETE /api/partners/:id/contacts/:contactId
// @desc    Supprimer un contact
// @access  Private (Admin seulement)
router.delete('/:id/contacts/:contactId', auth, authorize('admin'), async (req, res) => {
  try {
    const { id, contactId } = req.params;
    
    // Vérifier que le contact existe et appartient au partenaire
    const contacts = await query(
      'SELECT id FROM partner_contacts WHERE id = ? AND partner_id = ?',
      [contactId, id]
    );
    
    if (contacts.length === 0) {
      return res.status(404).json({ 
        error: 'Contact non trouvé' 
      });
    }
    
    // Supprimer le contact
    await query(
      'DELETE FROM partner_contacts WHERE id = ? AND partner_id = ?',
      [contactId, id]
    );
    
    res.json({ message: 'Contact supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete contact:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du contact' 
    });
  }
});

// ============================================
// ROUTES POUR LA GESTION DES DOCUMENTS
// (Doivent être définies AVANT /:id pour éviter les conflits)
// ============================================

// Configuration multer pour les documents
const documentStorage = multer.memoryStorage();
const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|xls|xlsx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf' || 
                     file.mimetype === 'application/msword' || 
                     file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (mimetype || extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF, Word, Excel et texte sont autorisés'));
    }
  }
});

// @route   GET /api/partners/:id/documents
// @desc    Obtenir tous les documents d'un partenaire
// @access  Public
router.get('/:id/documents', async (req, res) => {
  try {
    const { id } = req.params;
    
    const documents = await query(
      `SELECT id, partner_id, title, description, file_type, file_size, document_type, 
              created_at, updated_at, uploaded_by
       FROM partner_documents 
       WHERE partner_id = ? 
       ORDER BY document_type, title`,
      [id]
    );
    
    const host = `${req.protocol}://${req.get('host')}`;
    
    // Ajouter l'URL de téléchargement pour chaque document
    const documentsWithUrl = documents.map(doc => ({
      ...doc,
      downloadUrl: `${host}/api/partners/${id}/documents/${doc.id}/download`
    }));
    
    res.json(documentsWithUrl);
  } catch (error) {
    console.error('Erreur get documents:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des documents' 
    });
  }
});

// @route   GET /api/partners/:id/documents/:documentId/download
// @desc    Télécharger un document
// @access  Public
router.get('/:id/documents/:documentId/download', async (req, res) => {
  try {
    const { id, documentId } = req.params;
    
    const documents = await query(
      'SELECT file_content, file_type, title FROM partner_documents WHERE id = ? AND partner_id = ?',
      [documentId, id]
    );
    
    if (documents.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    
    const document = documents[0];
    
    if (!document.file_content) {
      return res.status(404).json({ error: 'Contenu du document non trouvé' });
    }
    
    // Extraire le base64 du data URL
    const base64Data = document.file_content.replace(/^data:.*,/, '');
    const fileBuffer = Buffer.from(base64Data, 'base64');
    
    // Déterminer le type MIME
    const mimeMatch = document.file_content.match(/^data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : document.file_type || 'application/pdf';
    
    // Nom du fichier
    const fileName = document.title.replace(/[^a-zA-Z0-9.-]/g, '_') + '.pdf';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    
    res.send(fileBuffer);
  } catch (error) {
    console.error('Erreur download document:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du téléchargement du document' 
    });
  }
});

// @route   POST /api/partners/:id/documents
// @desc    Uploader un document pour un partenaire
// @access  Private (Admin seulement)
router.post('/:id/documents', auth, authorize('admin'), uploadDocument.single('document'), handleMulterError, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, document_type } = req.body;
    const userId = req.user?.id;
    
    // Validation
    if (!title) {
      return res.status(400).json({ 
        error: 'Le titre du document est requis' 
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Le fichier est requis' 
      });
    }
    
    // Vérifier que le partenaire existe
    const partners = await query('SELECT id FROM partners WHERE id = ?', [id]);
    if (partners.length === 0) {
      return res.status(404).json({ 
        error: 'Partenaire non trouvé' 
      });
    }
    
    // Convertir le fichier en base64
    const fileBase64 = req.file.buffer.toString('base64');
    const base64Prefix = `data:${req.file.mimetype};base64,`;
    const fileContent = base64Prefix + fileBase64;
    
    // Créer le document
    const result = await query(
      `INSERT INTO partner_documents 
       (partner_id, title, description, file_content, file_size, file_type, document_type, uploaded_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, 
        title, 
        description || null, 
        fileContent, 
        req.file.size, 
        req.file.mimetype, 
        document_type || 'convention',
        userId || null
      ]
    );
    
    res.status(201).json({
      message: 'Document uploadé avec succès',
      documentId: result.insertId
    });
  } catch (error) {
    console.error('Erreur upload document:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'upload du document' 
    });
  }
});

// @route   DELETE /api/partners/:id/documents/:documentId
// @desc    Supprimer un document
// @access  Private (Admin seulement)
router.delete('/:id/documents/:documentId', auth, authorize('admin'), async (req, res) => {
  try {
    const { id, documentId } = req.params;
    
    // Vérifier que le document existe et appartient au partenaire
    const documents = await query(
      'SELECT id FROM partner_documents WHERE id = ? AND partner_id = ?',
      [documentId, id]
    );
    
    if (documents.length === 0) {
      return res.status(404).json({ 
        error: 'Document non trouvé' 
      });
    }
    
    // Supprimer le document
    await query(
      'DELETE FROM partner_documents WHERE id = ? AND partner_id = ?',
      [documentId, id]
    );
    
    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete document:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du document' 
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
    
    // Récupérer les contacts du partenaire
    const contacts = await query(
      'SELECT * FROM partner_contacts WHERE partner_id = ? ORDER BY fonction, nom, prenom',
      [id]
    );
    
    // Récupérer les documents du partenaire
    const documents = await query(
      `SELECT id, partner_id, title, description, file_type, file_size, document_type, 
              created_at, updated_at, uploaded_by
       FROM partner_documents 
       WHERE partner_id = ? 
       ORDER BY document_type, title`,
      [id]
    );
    
    // Utiliser la variable host déjà déclarée plus haut
    const documentsWithUrl = documents.map(doc => ({
      ...doc,
      downloadUrl: `${host}/api/partners/${id}/documents/${doc.id}/download`
    }));
    
    res.json({
      ...partner,
      logoUrl: logoUrl,
      hasLogoContent: !!partner.logo_content,
      contacts: contacts,
      documents: documentsWithUrl
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


