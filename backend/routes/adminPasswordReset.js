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

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Format d\'email invalide' 
      });
    }

    console.log(`🔍 Recherche de l'utilisateur admin avec l'email: ${email}`);

    // Vérifier que l'utilisateur existe et est un admin
    let users;
    try {
      users = await query(
        'SELECT id, email, nom, prenom, role FROM users WHERE email = ?',
        [email]
      );
      console.log(`📊 Résultat de la requête: ${users.length} utilisateur(s) trouvé(s)`);
    } catch (dbError) {
      console.error('❌ Erreur base de données lors de la recherche:', dbError);
      throw new Error(`Erreur base de données: ${dbError.message}`);
    }

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
    console.log(`🔑 Mot de passe généré pour l'utilisateur ${user.id}`);

    // Hacher le nouveau mot de passe
    let hashedPassword;
    try {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      console.log(`✅ Mot de passe hashé avec succès`);
    } catch (hashError) {
      console.error('❌ Erreur lors du hachage du mot de passe:', hashError);
      throw new Error(`Erreur lors du hachage du mot de passe: ${hashError.message}`);
    }

    // Mettre à jour le mot de passe dans la base de données
    try {
      await query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      console.log(`✅ Mot de passe mis à jour dans la base de données pour l'utilisateur ${user.id}`);
    } catch (updateError) {
      console.error('❌ Erreur lors de la mise à jour du mot de passe:', updateError);
      throw new Error(`Erreur lors de la mise à jour du mot de passe: ${updateError.message}`);
    }

    // TOUJOURS logger le mot de passe dans les logs (même si l'email réussit)
    console.log('\n' + '='.repeat(80));
    console.log('🔐 RÉINITIALISATION DE MOT DE PASSE ADMIN');
    console.log('='.repeat(80));
    console.log(`👤 Utilisateur: ${user.prenom} ${user.nom} (${email})`);
    console.log(`🆔 ID: ${user.id}`);
    console.log(`📅 Date: ${new Date().toLocaleString('fr-FR')}`);
    console.log('');
    console.log('🔑 NOUVEAU MOT DE PASSE:');
    console.log('   ' + '─'.repeat(76));
    console.log('   ' + newPassword);
    console.log('   ' + '─'.repeat(76));
    console.log('');
    console.log('⚠️  IMPORTANT: Ce mot de passe est visible dans les logs du serveur.');
    console.log('⚠️  Changez-le immédiatement après la première connexion.');
    console.log('='.repeat(80) + '\n');

    // Envoyer l'email avec le nouveau mot de passe
    try {
      const userName = `${user.prenom} ${user.nom}`;
      await sendPasswordResetEmail(email, newPassword, userName);
      
      console.log(`✅ Email envoyé avec succès pour: ${email}`);
      
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
        message: 'Un email avec votre nouveau mot de passe a été envoyé à ' + email + '. Vérifiez votre boîte de réception (et les spams). Le mot de passe est également disponible dans les logs du serveur.'
      });
    } catch (emailError) {
      // IMPORTANT: Le mot de passe a DÉJÀ été réinitialisé dans la base de données
      // L'échec de l'email ne change rien - le mot de passe est valide
      console.error('❌ Erreur envoi email:', emailError.message);
      console.log('');
      console.log('✅ IMPORTANT: Le mot de passe a été RÉINITIALISÉ avec succès dans la base de données.');
      console.log('✅ Le mot de passe est disponible dans les logs ci-dessus (section "🔐 RÉINITIALISATION DE MOT DE PASSE ADMIN").');
      console.log('✅ Vous pouvez vous connecter avec ce nouveau mot de passe même si l\'email n\'a pas été envoyé.');
      console.log('');
      
      // Détecter le type d'erreur
      const isMailtrapLimit = emailError.code === 'MAILTRAP_LIMIT_REACHED' || 
                              (emailError.message && (
                                emailError.message.includes('email limit is reached') ||
                                emailError.message.includes('The email limit is reached') ||
                                emailError.message.includes('limit is reached')
                              ));
      
      let errorMessage = 'Le nouveau mot de passe a été généré mais l\'envoi de l\'email a échoué. Le mot de passe est disponible dans les logs du serveur.';
      let errorDetails = {};
      
      if (isMailtrapLimit) {
        errorMessage = 'Limite d\'emails Mailtrap atteinte. Le mot de passe a été réinitialisé. Consultez les logs du serveur pour récupérer le mot de passe.';
        errorDetails = {
          suggestion: 'Veuillez mettre à niveau votre plan Mailtrap ou configurer un autre service SMTP (Gmail, SendGrid, etc.)',
          mailtrapUpgrade: 'https://mailtrap.io/billing/plans/testing',
          note: 'Le mot de passe a été affiché dans les logs du serveur ci-dessus.'
        };
      } else {
        errorDetails = {
          message: emailError.message,
          suggestion: 'Vérifiez la configuration SMTP dans config.env ou contactez le support technique.',
          note: 'Le mot de passe a été affiché dans les logs du serveur ci-dessus.'
        };
      }
      
      res.status(500).json({
        error: errorMessage,
        details: errorDetails
      });
    }

  } catch (error) {
    console.error('❌ Erreur admin password reset:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      sqlState: error.sqlState,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de la réinitialisation du mot de passe',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

