const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Authentifier un utilisateur
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email et mot de passe requis' 
      });
    }

    // Rechercher l'utilisateur
    const users = await query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Identifiants invalides' 
      });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Identifiants invalides' 
      });
    }

    // Créer le token JWT
    const payload = {
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Sauvegarder la session
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    await query(
      'INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)',
      [user.id, token, expiresAt]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'authentification' 
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Déconnexion d'un utilisateur
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    
    // Supprimer la session
    await query(
      'DELETE FROM user_sessions WHERE token = ?',
      [token]
    );

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Erreur logout:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la déconnexion' 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Obtenir les informations de l'utilisateur connecté
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const users = await query(
      'SELECT id, email, nom, prenom, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }

    res.json({ user: users[0] });
  } catch (error) {
    console.error('Erreur get user:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des données utilisateur' 
    });
  }
});

// @route   POST /api/auth/register
// @desc    Enregistrer un nouvel utilisateur
// @access  Private (Admin seulement)
router.post('/register', auth, async (req, res) => {
  try {
    console.log('📝 Register request received:', {
      user: req.user ? { id: req.user.id, role: req.user.role } : null,
      body: { ...req.body, password: req.body.password ? '***' : undefined }
    });

    // Vérifier que l'utilisateur est admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Accès refusé. Droits administrateur requis.' 
      });
    }

    const { email, password, nom, prenom, role = 'user' } = req.body;

    // Validation des données
    if (!email || !password || !nom || !prenom) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis (email, password, nom, prenom)' 
      });
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Format d\'email invalide' 
      });
    }

    // Validation password
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Validation role
    const validRoles = ['admin', 'user', 'broker'];
    const finalRole = validRoles.includes(role) ? role : 'user';

    // Vérifier si l'utilisateur existe déjà
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        error: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Hasher le mot de passe
    let hashedPassword;
    try {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password, saltRounds);
    } catch (hashError) {
      console.error('❌ Error hashing password:', hashError);
      return res.status(500).json({ 
        error: 'Erreur lors du hachage du mot de passe' 
      });
    }

    // Créer l'utilisateur
    let result;
    try {
      result = await query(
        'INSERT INTO users (email, password, nom, prenom, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [email, hashedPassword, nom, prenom, finalRole, true]
      );
      console.log('✅ User created successfully:', { userId: result.insertId, email, role: finalRole });
    } catch (dbError) {
      console.error('❌ Database error during user creation:', dbError);
      // Vérifier si c'est une erreur de contrainte
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: 'Un utilisateur avec cet email existe déjà' 
        });
      }
      throw dbError;
    }

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      userId: result.insertId
    });

  } catch (error) {
    console.error('❌ Erreur register:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de l\'utilisateur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
