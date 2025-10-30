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
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Accès refusé. Droits administrateur requis.' 
      });
    }

    const { email, password, nom, prenom, role = 'broker' } = req.body;

    // Validation des données
    if (!email || !password || !nom || !prenom) {
      return res.status(400).json({ 
        error: 'Tous les champs sont requis' 
      });
    }

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
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    const result = await query(
      'INSERT INTO users (email, password, nom, prenom, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, nom, prenom, role]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      userId: result.insertId
    });

  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la création de l\'utilisateur' 
    });
  }
});

module.exports = router;
