const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { notifyAdmins } = require('./notifications');

// Helper function pour fixer l'encodage du nom de fichier
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

// @route   PUT /api/cms/gamme-produits/family
// @desc    Update a single family in Gamme Produits (faster than saving everything)
// @access  Private
router.put('/gamme-produits/family', auth, async (req, res) => {
  const startTime = Date.now();
  try {
    const { clientType, family, products } = req.body;
    
    if (!clientType || !family || !Array.isArray(products)) {
      return res.status(400).json({
        error: 'Paramètres manquants: clientType, family, et products (array) sont requis'
      });
    }

    const familyDataSize = JSON.stringify(products).length / 1024 / 1024;
    console.log(`💾 PUT /api/cms/gamme-produits/family - ${clientType}/${family} (${familyDataSize.toFixed(2)} MB)`);
    
    // Charger le contenu complet actuel
    const existing = await query(
      'SELECT content FROM cms_content WHERE page = ?',
      ['gamme-produits']
    );

    let gpContent;
    if (existing.length > 0) {
      let contentString = existing[0].content;
      gpContent = typeof contentString === 'string' ? JSON.parse(contentString) : contentString;
      if (typeof gpContent === 'string') {
        gpContent = JSON.parse(gpContent);
      }
    } else {
      // Initialiser structure par défaut
      gpContent = {
        products: {
          particulier: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
          professionnel: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] },
          entreprise: { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] }
        }
      };
    }

    // Mettre à jour la famille spécifique
    if (!gpContent.products) gpContent.products = {};
    if (!gpContent.products[clientType]) {
      gpContent.products[clientType] = { epargne: [], retraite: [], prevoyance: [], sante: [], cif: [] };
    }

    // Remplacer la famille entière
    gpContent.products[clientType][family] = products;

    // Sauvegarder le contenu mis à jour
    const contentString = JSON.stringify(gpContent);
    const totalSize = contentString.length / 1024 / 1024;
    
      await query(
        'UPDATE cms_content SET content = ?, updated_at = NOW() WHERE page = ?',
        [contentString, 'gamme-produits']
      );

    const duration = Date.now() - startTime;
    console.log(`✅ Famille ${clientType}/${family} sauvegardée en ${duration}ms (${totalSize.toFixed(2)} MB total)`);
    
    res.json({ 
      message: `Famille ${family} sauvegardée avec succès`,
      duration: `${duration}ms`,
      familySize: `${familyDataSize.toFixed(2)} MB`,
      totalSize: `${totalSize.toFixed(2)} MB`,
      productsCount: products.length
    });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erreur update family après ${duration}ms:`, error);
    res.status(500).json({
      error: 'Erreur serveur lors de la mise à jour de la famille',
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

// --- Gamme Produits Files Management ---
// Configuration multer pour gamme produits (même config que structured products)
const gammeProductStorage = multer.memoryStorage();
const uploadGammeProduct = multer({
  storage: gammeProductStorage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5000 * 1024 * 1024 // 5GB par défaut
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les documents
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
      cb(new Error('Type de fichier non autorisé pour les produits. Formats acceptés: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX'));
    }
  }
});

// Middleware pour gérer les erreurs multer pour gamme produits
const handleGammeProductMulterError = (err, req, res, next) => {
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

// @route   POST /api/cms/gamme-produits/files
// @desc    Upload files for a gamme product (duplique dans toutes les familles où le produit existe)
// @access  Private (Admin)
router.post('/gamme-produits/files', auth, authorize('admin'), uploadGammeProduct.array('files', 10), handleGammeProductMulterError, async (req, res) => {
  try {
    const { productKey, clientType, productName } = req.body; // Format: "particulier_epargne_Assurance vie"
    
    if (!productKey) {
      return res.status(400).json({ error: 'productKey est requis' });
    }
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Au moins un fichier est requis' });
    }
    
    // Parser la clé produit pour extraire clientType et productName
    const parts = productKey.split('_');
    let clientTypeParsed = clientType || parts[0];
    let productNameParsed = productName || parts.slice(2).join('_');
    
    // Si on a clientType et productName, chercher dans toutes les familles
    const families = ['epargne', 'retraite', 'prevoyance', 'sante', 'cif'];
    const uploadedFiles = [];
    
    // Vérifier dans quelles familles le produit existe
    let productFamilies = [];
    try {
      const cmsContent = await query(
        'SELECT content FROM cms_content WHERE page = ?',
        ['gamme-produits']
      );
      
      if (cmsContent && cmsContent.length > 0) {
        let gpContent = cmsContent[0].content;
        gpContent = typeof gpContent === 'string' ? JSON.parse(gpContent) : gpContent;
        if (typeof gpContent === 'string') {
          gpContent = JSON.parse(gpContent);
        }
        
        // Trouver toutes les familles où ce produit existe
        if (gpContent.products && gpContent.products[clientTypeParsed]) {
          families.forEach(family => {
            const products = gpContent.products[clientTypeParsed][family] || [];
            const productExists = products.some(p => {
              const pName = typeof p === 'string' ? p : (p.name || '');
              return pName === productNameParsed;
            });
            if (productExists) {
              productFamilies.push(family);
            }
          });
        }
      }
    } catch (error) {
      console.warn('Erreur lors de la recherche des familles, utilisation de la famille de la clé:', error);
    }
    
    // Si aucune famille trouvée, utiliser la famille de la clé originale
    if (productFamilies.length === 0 && parts.length >= 2) {
      productFamilies = [parts[1]]; // Utiliser la famille de la clé originale
    }
    
    // Si toujours aucune famille, utiliser toutes les familles par défaut
    if (productFamilies.length === 0) {
      productFamilies = families;
    }
    
    console.log(`📦 Upload fichier pour produit "${productNameParsed}" (${clientTypeParsed}) dans ${productFamilies.length} famille(s): ${productFamilies.join(', ')}`);
    
    // Uploader chaque fichier dans toutes les familles où le produit existe
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const fileBase64 = file.buffer.toString('base64');
      const fileName = fixFilenameEncoding(file.originalname);
      
      for (const family of productFamilies) {
        const fullProductKey = `${clientTypeParsed}_${family}_${productNameParsed}`;
        
        // Vérifier si le fichier existe déjà pour cette famille
        const existing = await query(
          `SELECT id FROM gamme_product_files 
           WHERE product_key = ? AND file_name = ?`,
          [fullProductKey, fileName]
        );
        
        if (!existing || existing.length === 0) {
          const result = await query(
            `INSERT INTO gamme_product_files 
             (product_key, file_name, file_content, file_size, file_type, display_order) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [fullProductKey, fileName, fileBase64, file.size, file.mimetype, i]
          );
          
          uploadedFiles.push({
            id: result.insertId,
            product_key: fullProductKey,
            file_name: fileName,
            file_size: file.size,
            file_type: file.mimetype
          });
          
          console.log(`✅ Fichier uploadé: ${fullProductKey} - ${fileName}`);
        } else {
          console.log(`⏭️ Fichier déjà existant (ignoré): ${fullProductKey} - ${fileName}`);
        }
      }
    }
    
    const uniqueFamilies = [...new Set(uploadedFiles.map(f => f.product_key.split('_')[1]))];
    
    res.status(201).json({
      message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès dans ${uniqueFamilies.length} famille(s)`,
      files: uploadedFiles,
      families: uniqueFamilies
    });
  } catch (error) {
    console.error('Erreur upload fichiers gamme produit:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'upload des fichiers' 
    });
  }
});

// @route   GET /api/cms/gamme-produits/files/:productKey
// @desc    Get all files for a gamme product (cherche dans toutes les familles du même produit)
// @access  Public
router.get('/gamme-produits/files/:productKey', async (req, res) => {
  try {
    const { productKey } = req.params;
    const decodedProductKey = decodeURIComponent(productKey);
    
    // Parser la clé produit pour extraire clientType et productName
    const parts = decodedProductKey.split('_');
    
    let files = [];
    
    if (parts.length >= 3) {
      // Format: clientType_family_productName
      const clientType = parts[0];
      const productName = parts.slice(2).join('_'); // En cas de nom avec underscore
      
      // Chercher dans toutes les familles possibles
      const families = ['epargne', 'retraite', 'prevoyance', 'sante', 'cif'];
      
      for (const family of families) {
        const searchKey = `${clientType}_${family}_${productName}`;
        const familyFiles = await query(
          `SELECT id, file_name, file_size, file_type, display_order, created_at, product_key
           FROM gamme_product_files 
           WHERE product_key = ? AND file_size > 0
           ORDER BY display_order`,
          [searchKey]
        );
        files = files.concat(familyFiles);
      }
      
      // Dédupliquer par file_name et file_size pour éviter les doublons
      const uniqueFiles = [];
      const seenKeys = new Set();
      files.forEach(file => {
        const key = `${file.file_name}_${file.file_size}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueFiles.push(file);
        }
      });
      
      // Trier par display_order puis par created_at
      uniqueFiles.sort((a, b) => {
        if (a.display_order !== b.display_order) {
          return a.display_order - b.display_order;
        }
        return new Date(a.created_at) - new Date(b.created_at);
      });
      
      files = uniqueFiles;
    } else {
      // Format simple, chercher directement
      files = await query(
        `SELECT id, file_name, file_size, file_type, display_order, created_at, product_key
         FROM gamme_product_files 
         WHERE product_key = ? AND file_size > 0
         ORDER BY display_order`,
        [decodedProductKey]
      );
    }
    
    res.json(files);
  } catch (error) {
    console.error('Erreur get gamme product files:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des fichiers' 
    });
  }
});

// @route   GET /api/cms/gamme-produits/files/:productKey/:fileId/download
// @desc    Download a specific file (cherche par ID uniquement, indépendamment de la famille)
// @access  Public
router.get('/gamme-produits/files/:productKey/:fileId/download', async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Chercher le fichier par ID uniquement (peu importe la famille)
    const files = await query(
      `SELECT file_content, file_type, file_name 
       FROM gamme_product_files 
       WHERE id = ? AND file_size > 0`,
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
    console.error('Erreur download gamme product file:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du téléchargement du fichier' 
    });
  }
});

// @route   DELETE /api/cms/gamme-produits/files/:productKey/:fileId
// @desc    Delete a file (supprime dans toutes les familles où il existe)
// @access  Private (Admin)
router.delete('/gamme-produits/files/:productKey/:fileId', auth, authorize('admin'), async (req, res) => {
  try {
    const { productKey, fileId } = req.params;
    const decodedProductKey = decodeURIComponent(productKey);
    
    // Récupérer le fichier pour obtenir son nom
    const fileInfo = await query(
      `SELECT file_name FROM gamme_product_files WHERE id = ?`,
      [fileId]
    );
    
    if (fileInfo.length === 0) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    const fileName = fileInfo[0].file_name;
    
    // Parser la clé pour trouver toutes les familles
    const parts = decodedProductKey.split('_');
    let deletedCount = 0;
    
    if (parts.length >= 3) {
      const clientType = parts[0];
      const productName = parts.slice(2).join('_');
      const families = ['epargne', 'retraite', 'prevoyance', 'sante', 'cif'];
      
      // Supprimer le fichier dans toutes les familles où il existe
      for (const family of families) {
        const fullProductKey = `${clientType}_${family}_${productName}`;
        const result = await query(
          `DELETE FROM gamme_product_files 
           WHERE product_key = ? AND file_name = ?`,
          [fullProductKey, fileName]
        );
        deletedCount += result.affectedRows;
      }
    } else {
      // Supprimer uniquement pour la clé spécifiée
      const result = await query(
        `DELETE FROM gamme_product_files 
         WHERE id = ? AND product_key = ?`,
        [fileId, decodedProductKey]
      );
      deletedCount = result.affectedRows;
    }
    
    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    res.json({ 
      message: `Fichier supprimé avec succès (${deletedCount} occurrence(s))`,
      deletedCount 
    });
  } catch (error) {
    console.error('Erreur delete gamme product file:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression du fichier' 
    });
  }
});

// @route   PUT /api/cms/gamme-produits/files/:productKey/:fileId
// @desc    Replace a file (remplace dans toutes les familles où il existe)
// @access  Private (Admin)
router.put('/gamme-produits/files/:productKey/:fileId', auth, authorize('admin'), uploadGammeProduct.single('file'), handleGammeProductMulterError, async (req, res) => {
  try {
    const { productKey, fileId } = req.params;
    const decodedProductKey = decodeURIComponent(productKey);
    
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    
    // Récupérer le fichier existant pour obtenir son nom
    const existingFile = await query(
      `SELECT file_name, product_key FROM gamme_product_files WHERE id = ?`,
      [fileId]
    );
    
    if (existingFile.length === 0) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    const oldFileName = existingFile[0].file_name;
    const fileContent = req.file.buffer.toString('base64');
    const newFileName = fixFilenameEncoding(req.file.originalname);
    
    // Parser la clé pour trouver toutes les familles
    const parts = decodedProductKey.split('_');
    let updatedCount = 0;
    
    if (parts.length >= 3) {
      const clientType = parts[0];
      const productName = parts.slice(2).join('_');
      const families = ['epargne', 'retraite', 'prevoyance', 'sante', 'cif'];
      
      // Remplacer le fichier dans toutes les familles où il existe
      for (const family of families) {
        const fullProductKey = `${clientType}_${family}_${productName}`;
        const result = await query(
          `UPDATE gamme_product_files 
           SET file_name = ?, 
               file_content = ?, 
               file_size = ?, 
               file_type = ?
           WHERE product_key = ? AND file_name = ?`,
          [newFileName, fileContent, req.file.size, req.file.mimetype, fullProductKey, oldFileName]
        );
        updatedCount += result.affectedRows;
      }
    } else {
      // Remplacer uniquement pour la clé spécifiée
      const result = await query(
        `UPDATE gamme_product_files 
         SET file_name = ?, 
             file_content = ?, 
             file_size = ?, 
             file_type = ?
         WHERE id = ? AND product_key = ?`,
        [newFileName, fileContent, req.file.size, req.file.mimetype, fileId, decodedProductKey]
      );
      updatedCount = result.affectedRows;
    }
    
    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }
    
    res.json({ 
      message: `Fichier remplacé avec succès (${updatedCount} occurrence(s))`,
      updatedCount 
    });
  } catch (error) {
    console.error('Erreur replace gamme product file:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du remplacement du fichier' 
    });
  }
});

module.exports = router;
