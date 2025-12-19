const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { createNotification } = require('./notifications');

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

    // Rechercher l'utilisateur (sans filtrer par is_active pour pouvoir donner un message approprié)
    // Note: validite_date peut ne pas exister dans certaines versions de la base de données
    const users = await query(
      'SELECT id, email, nom, prenom, role, password, is_active, created_at FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'Identifiants invalides' 
      });
    }

    const user = users[0];

    // Vérifier si l'utilisateur est actif AVANT de vérifier le mot de passe
    if (!user.is_active) {
      return res.status(403).json({ 
        error: 'Votre compte est inactif. Veuillez contacter l\'administration pour réactiver votre accès.',
        code: 'ACCOUNT_INACTIVE'
      });
    }

    // Vérifier si le compte a expiré (date de validité dépassée) - seulement si la colonne existe
    // Note: On vérifie d'abord si validite_date existe dans le résultat
    if (user.validite_date !== undefined && user.validite_date !== null && new Date(user.validite_date) < new Date()) {
      return res.status(403).json({ 
        error: 'Votre compte a expiré. Veuillez contacter l\'administration pour renouveler votre accès.',
        code: 'ACCOUNT_EXPIRED'
      });
    }

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

    const user = users[0];

    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
        created_at: user.created_at
      }
    });
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

    const { email, password, nom, prenom, denomination_sociale, role, telephone, code_postal } = req.body;
    
    // Normaliser les valeurs optionnelles (chaînes vides -> null)
    const normalizedDenominationSociale = denomination_sociale && denomination_sociale.trim() !== '' ? denomination_sociale.trim() : null;
    const normalizedTelephone = telephone && telephone.trim() !== '' ? telephone.trim() : null;
    const normalizedCodePostal = code_postal && code_postal.trim() !== '' ? code_postal.trim() : null;
    
    console.log('📝 Données reçues:', {
      email,
      nom,
      prenom,
      denomination_sociale: normalizedDenominationSociale,
      telephone: normalizedTelephone,
      code_postal: normalizedCodePostal,
      role
    });

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

    // Validation role - must be one of the ENUM values
    const validRoles = ['admin', 'user', 'broker'];
    const finalRole = role && validRoles.includes(role) ? role : 'user';
    
    // Ensure role is exactly one of the allowed values (case-sensitive)
    if (!validRoles.includes(finalRole)) {
      console.error('❌ Invalid role value:', finalRole);
      return res.status(400).json({ 
        error: `Rôle invalide. Valeurs autorisées: ${validRoles.join(', ')}` 
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
      // Vérifier si les colonnes optionnelles existent
      let hasDenominationSociale = false;
      let hasTelephone = false;
      let hasCodePostal = false;
      try {
        const columns = await query(
          `SELECT COLUMN_NAME 
           FROM INFORMATION_SCHEMA.COLUMNS 
           WHERE TABLE_SCHEMA = DATABASE() 
           AND TABLE_NAME = 'users' 
           AND COLUMN_NAME IN ('denomination_sociale', 'telephone', 'code_postal')`
        );
        const existingColumns = columns.map(col => col.COLUMN_NAME);
        hasDenominationSociale = existingColumns.includes('denomination_sociale');
        hasTelephone = existingColumns.includes('telephone');
        hasCodePostal = existingColumns.includes('code_postal');
      } catch (checkError) {
        console.warn('⚠️  Erreur vérification colonnes:', checkError);
      }
      
      // Construire la requête dynamiquement selon les colonnes disponibles
      const baseFields = ['email', 'password', 'nom', 'prenom'];
      const baseValues = [email, hashedPassword, nom, prenom];
      
      if (hasDenominationSociale) {
        baseFields.push('denomination_sociale');
        baseValues.push(normalizedDenominationSociale);
      }
      
      if (hasTelephone) {
        baseFields.push('telephone');
        baseValues.push(normalizedTelephone);
      }
      
      if (hasCodePostal) {
        baseFields.push('code_postal');
        baseValues.push(normalizedCodePostal);
      }
      
      baseFields.push('role', 'is_active');
      baseValues.push(finalRole, true);
      
      // Ajouter date de validité si fournie
      if (req.body.validite_date) {
        baseFields.push('validite_date');
        baseValues.push(req.body.validite_date);
      }
      
      const placeholders = baseFields.map(() => '?').join(', ');
      const sql = `INSERT INTO users (${baseFields.join(', ')}) VALUES (${placeholders})`;
      
      console.log('📝 Création utilisateur - SQL:', sql);
      console.log('📝 Création utilisateur - Valeurs:', baseValues.map((v, i) => `${baseFields[i]}: ${v === null ? 'NULL' : (typeof v === 'string' && v.length > 20 ? v.substring(0, 20) + '...' : v)}`));
      
      result = await query(sql, baseValues);
      console.log('✅ User created successfully:', { 
        userId: result.insertId, 
        email, 
        role: finalRole, 
        denomination_sociale: normalizedDenominationSociale, 
        telephone: normalizedTelephone, 
        code_postal: normalizedCodePostal 
      });
      
      // Vérifier que les données ont bien été sauvegardées
      const [savedUser] = await query(
        `SELECT ${baseFields.join(', ')} FROM users WHERE id = ?`,
        [result.insertId]
      );
      console.log('🔍 Utilisateur sauvegardé (vérification):', savedUser);
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

    // Create admin notification for new user
    try {
      await createNotification(
        'user_created',
        '👤 Nouvel utilisateur créé',
        `Un nouvel utilisateur a été créé : ${prenom} ${nom} (${email}) - Rôle: ${finalRole}`,
        null, // Send to all admins
        result.insertId,
        'user'
      );
    } catch (notifError) {
      console.warn('⚠️ Could not create notification:', notifError.message);
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
