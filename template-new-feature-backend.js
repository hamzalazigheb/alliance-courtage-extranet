/**
 * Template pour créer une nouvelle route backend
 * 
 * Instructions:
 * 1. Copiez ce fichier vers backend/routes/votreFonctionnalite.js
 * 2. Remplacez "votreFonctionnalite" par le nom de votre fonctionnalité
 * 3. Adaptez les routes selon vos besoins
 * 4. Ajoutez la route dans backend/server.js
 */

const express = require('express');
const multer = require('multer');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Configuration multer si vous avez besoin d'upload de fichiers
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// ============================================
// ROUTES PUBLIQUES (sans authentification)
// ============================================

// GET /api/votre-fonctionnalite/public
router.get('/public', async (req, res) => {
  try {
    // Votre logique ici
    const results = await query('SELECT * FROM votre_table LIMIT 10');
    res.json(results);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTES PROTÉGÉES (authentification requise)
// ============================================

// GET /api/votre-fonctionnalite
// Récupérer tous les éléments (accessible à tous les utilisateurs connectés)
router.get('/', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const results = await query(
      'SELECT * FROM votre_table ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [parseInt(limit), parseInt(offset)]
    );
    
    res.json(results);
  } catch (error) {
    console.error('Erreur get:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la récupération' });
  }
});

// GET /api/votre-fonctionnalite/:id
// Récupérer un élément par ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const results = await query(
      'SELECT * FROM votre_table WHERE id = ?',
      [id]
    );
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Non trouvé' });
    }
    
    res.json(results[0]);
  } catch (error) {
    console.error('Erreur get by id:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ============================================
// ROUTES ADMIN (admin seulement)
// ============================================

// POST /api/votre-fonctionnalite
// Créer un nouvel élément (admin seulement)
router.post('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { title, description, data } = req.body;
    
    // Validation
    if (!title) {
      return res.status(400).json({ error: 'Titre requis' });
    }
    
    const result = await query(
      'INSERT INTO votre_table (title, description, data, created_by) VALUES (?, ?, ?, ?)',
      [title, description || '', JSON.stringify(data), req.user.id]
    );
    
    res.status(201).json({
      message: 'Créé avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur create:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
});

// POST /api/votre-fonctionnalite/upload
// Upload de fichier (admin seulement)
router.post('/upload', auth, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Fichier requis' });
    }
    
    // Convertir en base64 si nécessaire
    const fileBase64 = req.file.buffer.toString('base64');
    const fileContent = `data:${req.file.mimetype};base64,${fileBase64}`;
    
    const result = await query(
      'INSERT INTO votre_table (title, file_content, file_type, file_size) VALUES (?, ?, ?, ?)',
      [req.file.originalname, fileContent, req.file.mimetype, req.file.size]
    );
    
    res.status(201).json({
      message: 'Fichier uploadé avec succès',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'upload' });
  }
});

// PUT /api/votre-fonctionnalite/:id
// Mettre à jour un élément (admin seulement)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, data } = req.body;
    
    // Vérifier que l'élément existe
    const existing = await query('SELECT id FROM votre_table WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Non trouvé' });
    }
    
    await query(
      'UPDATE votre_table SET title = ?, description = ?, data = ? WHERE id = ?',
      [title, description, JSON.stringify(data), id]
    );
    
    res.json({ message: 'Mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur update:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la mise à jour' });
  }
});

// DELETE /api/votre-fonctionnalite/:id
// Supprimer un élément (admin seulement)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'élément existe
    const existing = await query('SELECT id FROM votre_table WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Non trouvé' });
    }
    
    await query('DELETE FROM votre_table WHERE id = ?', [id]);
    
    res.json({ message: 'Supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete:', error);
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
});

module.exports = router;

