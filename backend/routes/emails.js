const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');
const { sendPersonalizedEmail } = require('../services/emailService');
const { createNotification } = require('./notifications');

// @route   POST /api/emails/send
// @desc    Envoyer un email personnalisé à un ou plusieurs utilisateurs (Admin seulement)
// @access  Private (Admin seulement)
router.post('/send', auth, authorize('admin'), async (req, res) => {
  try {
    console.log('📧 Requête POST /api/emails/send reçue');
    console.log('📧 Body:', JSON.stringify(req.body, null, 2));
    
    const { userIds, userId, subject, message, template } = req.body;
    
    // Validation
    if (!subject || !message) {
      console.log('❌ Validation échouée: sujet ou message manquant');
      return res.status(400).json({ 
        error: 'Le sujet et le message sont requis' 
      });
    }
    
    // Support pour userId (un seul) ou userIds (plusieurs)
    let targetUserIds = [];
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      targetUserIds = userIds.map(id => parseInt(id));
    } else if (userId) {
      targetUserIds = [parseInt(userId)];
    } else {
      return res.status(400).json({ 
        error: 'Au moins un utilisateur doit être sélectionné' 
      });
    }
    
    // Récupérer les utilisateurs
    if (targetUserIds.length === 0) {
      return res.status(400).json({ 
        error: 'Aucun utilisateur valide sélectionné' 
      });
    }
    
    const placeholders = targetUserIds.map(() => '?').join(',');
    let users;
    try {
      users = await query(
        `SELECT id, email, nom, prenom FROM users WHERE id IN (${placeholders})`,
        targetUserIds
      );
    } catch (dbError) {
      console.error('Erreur base de données:', dbError);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des utilisateurs',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
    
    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun utilisateur trouvé' 
      });
    }
    
    // Filtrer les utilisateurs qui ont un email
    const usersWithEmail = users.filter(user => user.email);
    
    if (usersWithEmail.length === 0) {
      return res.status(400).json({ 
        error: 'Aucun des utilisateurs sélectionnés n\'a d\'adresse email' 
      });
    }
    
    // Envoyer les emails
    const results = [];
    const errors = [];
    
    for (const user of usersWithEmail) {
      try {
        const userName = `${user.prenom} ${user.nom}`;
        await sendPersonalizedEmail(
          user.email,
          userName,
          subject.trim(),
          message.trim(),
          template || 'default'
        );
        
        // Enregistrer l'email dans l'historique des notifications
        try {
          await createNotification(
            'email',
            subject.trim(),
            message.trim(),
            user.id,
            null,
            null,
            null // pas de lien pour les emails
          );
          console.log(`✅ Email enregistré dans l'historique pour ${user.email}`);
        } catch (notifError) {
          console.warn(`⚠️  Impossible d'enregistrer l'email dans l'historique:`, notifError.message);
          // On continue même si l'enregistrement échoue
        }
        
        results.push({
          userId: user.id,
          email: user.email,
          name: userName,
          success: true
        });
        
        console.log(`✅ Email personnalisé envoyé avec succès à ${user.email}`);
      } catch (emailError) {
        console.error(`❌ Erreur envoi email à ${user.email}:`, emailError);
        errors.push({
          userId: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          error: emailError.message
        });
      }
    }
    
    // Préparer la réponse
    const response = {
      message: `${results.length} email(s) envoyé(s) avec succès${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`,
      sent: results.length,
      failed: errors.length,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    };
    
    // Si tous les emails ont échoué, retourner une erreur
    if (results.length === 0) {
      return res.status(500).json({
        error: 'Aucun email n\'a pu être envoyé',
        details: errors
      });
    }
    
    // Si au moins un email a réussi, retourner un succès (même s'il y a des erreurs)
    res.status(200).json(response);
  } catch (error) {
    console.error('Erreur send email:', error);
    console.error('Détails erreur:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'envoi de l\'email',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

