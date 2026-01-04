const express = require('express');
const multer = require('multer');
const router = express.Router();
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { notifyAdmins } = require('./notifications');

// Configuration de multer pour l'upload de PDF
const pdfStorage = multer.memoryStorage();

const uploadPDF = multer({
  storage: pdfStorage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max pour les PDF
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les PDF
    if (file.mimetype === 'application/pdf') {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF sont autorisés'));
    }
  }
});

// Configuration de multer pour l'upload d'images en mémoire (base64)
const imageStorage = multer.memoryStorage();

const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max pour les images
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les images
    const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp)$/;
    const isValidMimeType = allowedMimeTypes.test(file.mimetype);
    
    if (isValidMimeType) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers images sont autorisés (JPEG, PNG, GIF, WebP)'));
    }
  }
});

// Middleware pour gérer les erreurs multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Fichier trop volumineux. Taille maximale: 10MB' });
    }
    return res.status(400).json({ error: 'Erreur upload fichier: ' + err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message || 'Erreur upload fichier' });
  }
  next();
};

// @route   GET /api/cms/home
// @desc    Get CMS content for home page
// @access  Private
router.get('/home', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['home']
    );
    
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      // Return empty/default content if not found
      res.json({ 
        page: 'home',
        content: JSON.stringify({
          welcomeTitle: 'Bienvenue chez Alliance Courtage',
          news: [],
          services: [],
          contact: {
            phone: '07.45.06.43.88',
            email: 'contact@alliance-courtage.fr'
          }
        })
      });
    }
  } catch (error) {
    console.error('Erreur get CMS content:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du contenu CMS' 
    });
  }
});

// @route   PUT /api/cms/home
// @desc    Update CMS content for home page
// @access  Private
router.put('/home', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    // Check if content exists
    const existing = await query(
      'SELECT id FROM cms_content WHERE page = ?',
      ['home']
    );
    
    if (existing.length > 0) {
      // Update existing
      await query(
        'UPDATE cms_content SET content = ?, updated_at = NOW() WHERE page = ?',
        [content, 'home']
      );
      res.json({ message: 'Contenu CMS mis à jour avec succès' });
    } else {
      // Insert new
      await query(
        'INSERT INTO cms_content (page, content, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        ['home', content]
      );
      res.json({ message: 'Contenu CMS créé avec succès' });
    }
  } catch (error) {
    console.error('Erreur update CMS content:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du contenu CMS' 
    });
  }
});

// --- Gamme Produits CMS ---
// @route   GET /api/cms/gamme-produits
// @desc    Get CMS content for Gamme Produits page
// @access  Private
router.get('/gamme-produits', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['gamme-produits']
    );

    if (result.length > 0) {
      const content = result[0].content;
      const contentLength = typeof content === 'string' ? content.length : JSON.stringify(content).length;
      console.log(`📥 GET /api/cms/gamme-produits - Taille du contenu: ${(contentLength / 1024).toFixed(2)} KB`);
      
      // Essayer de parser pour compter les documents
      try {
        let parsed = typeof content === 'string' ? JSON.parse(content) : content;
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        
        let totalDocuments = 0;
        if (parsed && parsed.products) {
          Object.keys(parsed.products).forEach((clientKey) => {
            Object.keys(parsed.products[clientKey] || {}).forEach((familyKey) => {
              const products = parsed.products[clientKey][familyKey];
              if (Array.isArray(products)) {
                products.forEach((p) => {
                  if (p && p.documents && Array.isArray(p.documents)) {
                    totalDocuments += p.documents.length;
                  }
                });
              }
            });
          });
        }
        console.log(`📊 Total documents dans le contenu chargé: ${totalDocuments}`);
      } catch (parseError) {
        console.warn('⚠️  Erreur parsing contenu pour logs:', parseError.message);
      }
      
      res.json(result[0]);
    } else {
      res.json({
        page: 'gamme-produits',
        content: JSON.stringify({
          products: {
            particulier: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
            professionnel: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
            entreprise: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] }
          }
        })
      });
    }
  } catch (error) {
    console.error('Erreur get CMS content (gamme-produits):', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération du contenu CMS (gamme-produits)'
    });
  }
});

// @route   PUT /api/cms/gamme-produits
// @desc    Update CMS content for Gamme Produits page
// @access  Private
router.put('/gamme-produits', auth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { content } = req.body;
    
    // Préparer le contenu rapidement (sans parsing lourd)
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    const contentLength = contentString.length;
    const contentSizeMB = contentLength / 1024 / 1024;
    
    // Log minimal (non bloquant)
    console.log(`💾 PUT /api/cms/gamme-produits - Taille: ${contentSizeMB.toFixed(2)} MB`);
    
    // Vérifier la taille avant de continuer (5GB = 5120 MB)
    if (contentSizeMB > 5120) {
      return res.status(400).json({
        error: `Le contenu est trop volumineux (${contentSizeMB.toFixed(2)} MB, max 5120MB)`
      });
    }

    // Vérifier si l'entrée existe (requête rapide)
    const existing = await query(
      'SELECT id FROM cms_content WHERE page = ?',
      ['gamme-produits']
    );

    // Sauvegarder immédiatement (sans parsing supplémentaire)
    if (existing.length > 0) {
      await query(
        'UPDATE cms_content SET content = ?, updated_at = NOW() WHERE page = ?',
        [contentString, 'gamme-produits']
      );
    } else {
      await query(
        'INSERT INTO cms_content (page, content, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        ['gamme-produits', contentString]
      );
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Contenu CMS (gamme-produits) sauvegardé en ${duration}ms`);
    
    // Répondre immédiatement
    res.json({ 
      message: 'Contenu CMS (gamme-produits) mis à jour avec succès',
      duration: `${duration}ms`,
      size: `${contentSizeMB.toFixed(2)} MB`
    });
    
    // Logs détaillés en arrière-plan (non bloquants)
    setImmediate(() => {
    try {
      let parsed = typeof content === 'string' ? JSON.parse(content) : content;
      if (typeof parsed === 'string') {
        parsed = JSON.parse(parsed);
      }
      
      let totalDocuments = 0;
      if (parsed && parsed.products) {
        Object.keys(parsed.products).forEach((clientKey) => {
          Object.keys(parsed.products[clientKey] || {}).forEach((familyKey) => {
            const products = parsed.products[clientKey][familyKey];
            if (Array.isArray(products)) {
              products.forEach((p) => {
                if (p && p.documents && Array.isArray(p.documents)) {
                  totalDocuments += p.documents.length;
                }
              });
            }
          });
        });
      }
        console.log(`📊 Total documents sauvegardés: ${totalDocuments}`);
    } catch (parseError) {
        // Ignorer les erreurs de parsing pour les logs
      }
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erreur update CMS content (gamme-produits) après ${duration}ms:`, error);
    res.status(500).json({
      error: 'Erreur serveur lors de la mise à jour du contenu CMS (gamme-produits)',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- Produits Structurés CMS ---
// @route   GET /api/cms/produits-structures
// @desc    Get CMS content for Produits Structurés page
// @access  Private
router.get('/produits-structures', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['produits-structures']
    );

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json({
        page: 'produits-structures',
        content: JSON.stringify({
          title: 'Produits Structurés',
          subtitle: 'Consultez tous les produits structurés par assurance',
          description: 'Découvrez notre gamme complète de produits structurés adaptés à vos besoins d\'investissement et de protection.',
          headerImage: '',
          introText: ''
        })
      });
    }
  } catch (error) {
    console.error('Erreur get CMS content (produits-structures):', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération du contenu CMS (produits-structures)'
    });
  }
});

// @route   PUT /api/cms/produits-structures
// @desc    Update CMS content for Produits Structurés page
// @access  Private
router.put('/produits-structures', auth, async (req, res) => {
  try {
    const { content } = req.body;

    const existing = await query(
      'SELECT id FROM cms_content WHERE page = ?',
      ['produits-structures']
    );

    if (existing.length > 0) {
      await query(
        'UPDATE cms_content SET content = ?, updated_at = NOW() WHERE page = ?',
        [content, 'produits-structures']
      );
      res.json({ message: 'Contenu CMS (produits-structures) mis à jour avec succès' });
    } else {
      await query(
        'INSERT INTO cms_content (page, content, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        ['produits-structures', content]
      );
      res.json({ message: 'Contenu CMS (produits-structures) créé avec succès' });
    }
  } catch (error) {
    console.error('Erreur update CMS content (produits-structures):', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la mise à jour du contenu CMS (produits-structures)'
    });
  }
});

// --- Rencontres CMS ---
// @route   GET /api/cms/rencontres
// @desc    Get CMS content for Rencontres page
// @access  Private
router.get('/rencontres', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['rencontres']
    );

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json({
        page: 'rencontres',
        content: JSON.stringify({
          title: 'RENCONTRES',
          subtitle: 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
          headerImage: '',
          introText: '',
          upcomingMeetings: [
            {
              title: 'Assemblée Générale 2025',
              date: '15 Mars 2025',
              description: 'Assemblée générale annuelle d\'Alliance Courtage avec présentation des résultats et perspectives 2025.',
              location: 'Paris, France',
              time: '14h00 - 18h00',
              color: 'indigo'
            },
            {
              title: 'Formation Réglementation',
              date: '22 Avril 2025',
              description: 'Formation sur les nouvelles réglementations en assurance et finance pour les membres Alliance Courtage.',
              location: 'Lyon, France',
              time: '9h00 - 17h00',
              color: 'purple'
            }
          ],
          historicalMeetings: [
            {
              title: 'Rencontre Régionale Sud',
              date: 'Marseille, 15 Décembre 2024',
              reportUrl: ''
            },
            {
              title: 'Formation Produits Structurés',
              date: 'Paris, 8 Novembre 2024',
              reportUrl: ''
            },
            {
              title: 'Assemblée Générale 2024',
              date: 'Paris, 20 Mars 2024',
              reportUrl: ''
            }
          ]
        })
      });
    }
  } catch (error) {
    console.error('Erreur get CMS content (rencontres):', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération du contenu CMS (rencontres)'
    });
  }
});

// @route   PUT /api/cms/rencontres
// @desc    Update CMS content for Rencontres page
// @access  Private
router.put('/rencontres', auth, async (req, res) => {
  try {
    console.log('📝 PUT /api/cms/rencontres - Début');
    const { content } = req.body;

    if (!content) {
      console.error('❌ Aucun contenu fourni');
      return res.status(400).json({
        error: 'Le contenu est requis'
      });
    }

    // Log la taille du contenu pour diagnostiquer
    const contentLength = typeof content === 'string' ? content.length : JSON.stringify(content).length;
    console.log(`📝 Taille du contenu: ${(contentLength / 1024).toFixed(2)} KB`);

    // Valider que le contenu est un JSON valide
    let parsedContent;
    try {
      if (typeof content === 'string') {
        parsedContent = JSON.parse(content);
      } else {
        parsedContent = content;
      }
      console.log('✅ JSON valide');
    } catch (validateError) {
      console.error('❌ JSON invalide:', validateError.message);
      return res.status(400).json({
        error: 'Le contenu JSON fourni est invalide',
        details: process.env.NODE_ENV === 'development' ? validateError.message : undefined
      });
    }

    // Handle double-stringified JSON
    if (typeof parsedContent === 'string') {
      try {
        parsedContent = JSON.parse(parsedContent);
      } catch (e) {
        console.warn('⚠️  Tentative de double parsing échouée');
      }
    }

    // Convertir en string si nécessaire
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    console.log(`📝 Contenu à sauvegarder (${(contentString.length / 1024).toFixed(2)} KB)`);

    const existing = await query(
      'SELECT id FROM cms_content WHERE page = ?',
      ['rencontres']
    );

    console.log(`📝 Entrée existante: ${existing.length > 0 ? 'Oui' : 'Non'}`);

    // Check if there are new upcoming meetings (simple check: if array has items, notify)
    // Note: For production, you might want to track which meetings were already notified
    if (parsedContent && parsedContent.upcomingMeetings && Array.isArray(parsedContent.upcomingMeetings) && parsedContent.upcomingMeetings.length > 0) {
      // Notify about the most recent meeting
      const latestMeeting = parsedContent.upcomingMeetings[0];
      if (latestMeeting && latestMeeting.title) {
        try {
          console.log('📧 Notification des admins pour nouvelle rencontre...');
          await notifyAdmins(
            'meeting',
            'Nouvelle rencontre',
            `Une nouvelle rencontre "${latestMeeting.title}" est prévue${latestMeeting.date ? ` le ${latestMeeting.date}` : ''}.`,
            null,
            'meeting'
          );
          console.log('✅ Admins notifiés');
        } catch (notifError) {
          console.error('⚠️  Erreur notification admins (non-blocking):', notifError);
          // Ne pas bloquer la sauvegarde si la notification échoue
        }
      }
    }

    if (existing.length > 0) {
      console.log('📝 Mise à jour de l\'entrée existante...');
      await query(
        'UPDATE cms_content SET content = ?, updated_at = NOW() WHERE page = ?',
        [contentString, 'rencontres']
      );
      console.log('✅ Contenu mis à jour avec succès');
      res.json({ message: 'Contenu CMS (rencontres) mis à jour avec succès' });
    } else {
      console.log('📝 Création d\'une nouvelle entrée...');
      await query(
        'INSERT INTO cms_content (page, content, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        ['rencontres', contentString]
      );
      console.log('✅ Contenu créé avec succès');
      res.json({ message: 'Contenu CMS (rencontres) créé avec succès' });
    }
  } catch (error) {
    console.error('❌ Erreur update CMS content (rencontres):', error);
    console.error('Détails erreur:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Erreur serveur lors de la mise à jour du contenu CMS (rencontres)',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- Gamme Financière CMS ---
// @route   GET /api/cms/gamme-financiere
// @desc    Get CMS content for Gamme Financière page
// @access  Private
router.get('/gamme-financiere', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['gamme-financiere']
    );

    if (result.length > 0) {
      // Valider et nettoyer le JSON si nécessaire
      try {
        let content = result[0].content;
        
        // Si c'est une string, essayer de parser pour valider
        if (typeof content === 'string') {
          JSON.parse(content);
        }
        
        res.json(result[0]);
      } catch (parseError) {
        console.error('JSON corrompu pour gamme-financiere, retour des valeurs par défaut:', parseError);
        // Retourner des valeurs par défaut si le JSON est corrompu
        res.json({
          page: 'gamme-financiere',
          content: JSON.stringify({
            title: 'Gamme Financière',
            subtitle: 'Découvrez notre sélection de produits financiers',
            description: 'Explorez notre gamme complète de produits financiers conçus pour répondre à vos besoins d\'investissement et de gestion patrimoniale.',
            headerImage: ''
          })
        });
      }
    } else {
      res.json({
        page: 'gamme-financiere',
        content: JSON.stringify({
          title: 'Gamme Financière',
          subtitle: 'Découvrez notre sélection de produits financiers',
          description: 'Explorez notre gamme complète de produits financiers conçus pour répondre à vos besoins d\'investissement et de gestion patrimoniale.',
          headerImage: ''
        })
      });
    }
  } catch (error) {
    console.error('Erreur get CMS content (gamme-financiere):', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération du contenu CMS (gamme-financiere)'
    });
  }
});

// @route   PUT /api/cms/gamme-financiere
// @desc    Update CMS content for Gamme Financière page
// @access  Private
router.put('/gamme-financiere', auth, async (req, res) => {
  try {
    console.log('📝 PUT /api/cms/gamme-financiere - Début');
    const { content } = req.body;

    if (!content) {
      console.error('❌ Aucun contenu fourni');
      return res.status(400).json({
        error: 'Le contenu est requis'
      });
    }

    // Log la taille du contenu pour diagnostiquer
    const contentLength = typeof content === 'string' ? content.length : JSON.stringify(content).length;
    console.log(`📝 Taille du contenu: ${(contentLength / 1024).toFixed(2)} KB`);

    // Valider que le contenu est un JSON valide
    let parsedContent;
    try {
      if (typeof content === 'string') {
        parsedContent = JSON.parse(content);
      } else {
        parsedContent = content;
      }
      console.log('✅ JSON valide');
    } catch (validateError) {
      console.error('❌ JSON invalide:', validateError.message);
      return res.status(400).json({
        error: 'Le contenu JSON fourni est invalide',
        details: process.env.NODE_ENV === 'development' ? validateError.message : undefined
      });
    }

    // Convertir en string si nécessaire
    const contentString = typeof content === 'string' ? content : JSON.stringify(content);
    console.log(`📝 Contenu à sauvegarder (${(contentString.length / 1024).toFixed(2)} KB)`);

    const existing = await query(
      'SELECT id FROM cms_content WHERE page = ?',
      ['gamme-financiere']
    );

    console.log(`📝 Entrée existante: ${existing.length > 0 ? 'Oui' : 'Non'}`);

    if (existing.length > 0) {
      console.log('📝 Mise à jour de l\'entrée existante...');
      await query(
        'UPDATE cms_content SET content = ?, updated_at = NOW() WHERE page = ?',
        [contentString, 'gamme-financiere']
      );
      console.log('✅ Contenu mis à jour avec succès');
      res.json({ message: 'Contenu CMS (gamme-financiere) mis à jour avec succès' });
    } else {
      console.log('📝 Création d\'une nouvelle entrée...');
      await query(
        'INSERT INTO cms_content (page, content, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        ['gamme-financiere', contentString]
      );
      console.log('✅ Contenu créé avec succès');
      res.json({ message: 'Contenu CMS (gamme-financiere) créé avec succès' });
    }
  } catch (error) {
    console.error('❌ Erreur update CMS content (gamme-financiere):', error);
    console.error('Détails erreur:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });
    res.status(500).json({
      error: 'Erreur serveur lors de la mise à jour du contenu CMS (gamme-financiere)',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// --- Partenaires CMS ---
// @route   GET /api/cms/partenaires
// @desc    Get CMS content for Partenaires page
// @access  Private
router.get('/partenaires', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['partenaires']
    );

    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.json({
        page: 'partenaires',
        content: JSON.stringify({
          title: 'Nos Partenaires',
          subtitle: 'Découvrez nos partenaires de confiance',
          description: 'Nous collaborons avec des partenaires de confiance pour vous offrir les meilleures solutions et services adaptés à vos besoins.',
          headerImage: ''
        })
      });
    }
  } catch (error) {
    console.error('Erreur get CMS content (partenaires):', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la récupération du contenu CMS (partenaires)'
    });
  }
});

// @route   PUT /api/cms/partenaires
// @desc    Update CMS content for Partenaires page
// @access  Private
router.put('/partenaires', auth, async (req, res) => {
  try {
    const { content } = req.body;

    const existing = await query(
      'SELECT id FROM cms_content WHERE page = ?',
      ['partenaires']
    );

    if (existing.length > 0) {
      await query(
        'UPDATE cms_content SET content = ?, updated_at = NOW() WHERE page = ?',
        [content, 'partenaires']
      );
      res.json({ message: 'Contenu CMS (partenaires) mis à jour avec succès' });
    } else {
      await query(
        'INSERT INTO cms_content (page, content, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        ['partenaires', content]
      );
      res.json({ message: 'Contenu CMS (partenaires) créé avec succès' });
    }
  } catch (error) {
    console.error('Erreur update CMS content (partenaires):', error);
    res.status(500).json({
      error: 'Erreur serveur lors de la mise à jour du contenu CMS (partenaires)'
    });
  }
});

// @route   POST /api/cms/upload-image
// @desc    Upload an image and return base64 data URL
// @access  Private (Admin seulement)
router.post('/upload-image', auth, authorize('admin'), uploadImage.single('image'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Aucun fichier image fourni' 
      });
    }

    // Check if buffer exists
    if (!req.file.buffer) {
      return res.status(400).json({ 
        error: 'Erreur: fichier non reçu correctement' 
      });
    }

    console.log('📤 Upload image reçu:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer.length
    });

    // Convert file buffer to base64
    const fileBase64 = req.file.buffer.toString('base64');
    const base64Prefix = `data:${req.file.mimetype};base64,`;
    const dataUrl = base64Prefix + fileBase64;

    console.log('✅ Image convertie en base64:', {
      base64Length: fileBase64.length,
      dataUrlLength: dataUrl.length,
      prefix: base64Prefix,
      startsWith: dataUrl.substring(0, 50)
    });

    res.json({
      success: true,
      imageUrl: dataUrl,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    console.error('❌ Erreur upload image CMS:', error);
    
    // Gérer les erreurs multer
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Fichier trop volumineux. Taille maximale: 10MB' });
      }
      return res.status(400).json({ error: 'Erreur upload fichier: ' + error.message });
    }
    
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'upload de l\'image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/cms/upload-newsletter-pdf
// @desc    Upload a PDF file for newsletter and return file URL
// @access  Private (Admin seulement)
router.post('/upload-newsletter-pdf', auth, authorize('admin'), uploadPDF.single('pdf'), handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'Aucun fichier PDF fourni' 
      });
    }

    // Check if buffer exists
    if (!req.file.buffer) {
      return res.status(400).json({ 
        error: 'Erreur: fichier non reçu correctement' 
      });
    }

    console.log('📤 Upload PDF newsletter reçu:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer.length
    });

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `newsletter_${timestamp}_${sanitizedName}`;
    const filePath = `/uploads/newsletters/${filename}`;

    // In production, you would save the file to disk or cloud storage
    // For now, we'll store it in base64 in the database or use a file system
    // For simplicity, we'll return a URL that can be used to access the file
    
    // Save file to uploads/newsletters directory (server serves /uploads from ../uploads)
    const fs = require('fs');
    const path = require('path');
    const uploadDir = path.join(__dirname, '../../uploads/newsletters');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const fullPath = path.join(uploadDir, filename);
    fs.writeFileSync(fullPath, req.file.buffer);
    
    console.log('✅ PDF newsletter sauvegardé:', {
      filename,
      path: fullPath,
      size: req.file.size
    });

    // Return the URL to access the file (server serves /uploads from ../uploads)
    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/newsletters/${filename}`;

    res.json({
      success: true,
      fileUrl: fileUrl,
      filePath: filePath,
      filename: filename,
      size: req.file.size
    });
  } catch (error) {
    console.error('❌ Erreur upload PDF newsletter:', error);
    
    // Gérer les erreurs multer
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Fichier trop volumineux. Taille maximale: 50MB' });
      }
      return res.status(400).json({ error: 'Erreur upload fichier: ' + error.message });
    }
    
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'upload du PDF',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
