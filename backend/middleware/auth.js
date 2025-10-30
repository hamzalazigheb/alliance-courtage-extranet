const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Middleware d'authentification
const auth = async (req, res, next) => {
  try {
    // Récupérer le token depuis les headers
    const token = req.header('x-auth-token');

    if (!token) {
      return res.status(401).json({ 
        error: 'Token d\'authentification manquant' 
      });
    }

    // Vérifier le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier que la session existe encore
    const sessions = await query(
      'SELECT * FROM user_sessions WHERE token = ? AND expires_at > NOW()',
      [token]
    );

    if (sessions.length === 0) {
      return res.status(401).json({ 
        error: 'Session expirée' 
      });
    }

    // Ajouter l'utilisateur à la requête
    req.user = decoded.user;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token invalide' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expiré' 
      });
    }

    console.error('Erreur auth middleware:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'authentification' 
    });
  }
};

// Middleware pour vérifier les rôles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentification requise' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Droits insuffisants' 
      });
    }

    next();
  };
};

module.exports = { auth, authorize };



