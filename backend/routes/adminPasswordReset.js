const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/database');
const { sendPasswordResetEmail } = require('../services/emailService');

const router = express.Router();

/**
 * Génère un mot de passe aléatoire sécurisé
 * @param {number} length - Longueur du mot de passe (défaut: 12)
 * @returns {string}
 */
function generateSecurePassword(length = 12) {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%&*';
  const allChars = uppercase + lowercase + numbers + symbols;
  
  // Assurer au moins un caractère de chaque type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];
  
  // Compléter avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * @route   POST /api/admin-password-reset/request
 * @desc    Demande de réinitialisation automatique avec envoi d'email (ADMINS ONLY)
 * @access  Public (mais vérifie que c'est un admin)
 */
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email requis' 
      });
    }

    // Vérifier que l'utilisateur existe et est un admin
    const users = await query(
      'SELECT id, email, nom, prenom, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // Pour la sécurité, on ne révèle pas si l'email existe ou non
      return res.status(200).json({
        message: 'Si cet email correspond à un compte administrateur, vous recevrez un email avec votre nouveau mot de passe.'
      });
    }

    const user = users[0];

    // Vérifier que c'est un admin
    if (user.role !== 'admin') {
      // Pour la sécurité, on ne révèle pas si l'email existe ou non
      return res.status(200).json({
        message: 'Si cet email correspond à un compte administrateur, vous recevrez un email avec votre nouveau mot de passe.'
      });
    }

    // Générer un nouveau mot de passe sécurisé
    const newPassword = generateSecurePassword(12);

    // Hacher le nouveau mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Mettre à jour le mot de passe dans la base de données
    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );

    // Envoyer l'email avec le nouveau mot de passe
    try {
      const userName = `${user.prenom} ${user.nom}`;
      await sendPasswordResetEmail(email, newPassword, userName);
      
      console.log(`✅ Mot de passe réinitialisé et email envoyé pour: ${email}`);
      
      // Enregistrer dans password_reset_requests pour traçabilité
      try {
        await query(
          `INSERT INTO password_reset_requests (user_id, user_email, status, notes) 
           VALUES (?, ?, 'completed', 'Réinitialisation automatique via email')`,
          [user.id, user.email]
        );
      } catch (err) {
        // Ignorer si la table n'existe pas
        console.warn('⚠️  Impossible d\'enregistrer dans password_reset_requests:', err.message);
      }

      res.status(200).json({
        message: 'Un email avec votre nouveau mot de passe a été envoyé à ' + email + '. Vérifiez votre boîte de réception (et les spams).'
      });
    } catch (emailError) {
      // Si l'email échoue, on annule la réinitialisation du mot de passe
      console.error('❌ Erreur envoi email, annulation de la réinitialisation:', emailError);
      
      // Optionnel : restaurer l'ancien mot de passe (si vous le stockez)
      // Pour l'instant, on laisse le nouveau mot de passe mais on informe l'utilisateur
      
      res.status(500).json({
        error: 'Le nouveau mot de passe a été généré mais l\'envoi de l\'email a échoué. Veuillez contacter le support technique.',
        details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
      });
    }

  } catch (error) {
    console.error('Erreur admin password reset:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la réinitialisation du mot de passe' 
    });
  }
});

module.exports = router;

