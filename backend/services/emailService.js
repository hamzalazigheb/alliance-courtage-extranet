const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

/**
 * Service d'envoi d'email pour la réinitialisation de mot de passe admin
 */

// Fonction pour charger config.env directement depuis le fichier
function loadConfigEnv() {
  // Essayer plusieurs chemins possibles
  const possiblePaths = [
    path.join(__dirname, '..', 'config.env'),  // Depuis services/config.env
    path.join(process.cwd(), 'config.env'),    // Depuis la racine du projet
    './config.env',                            // Chemin relatif
    '/app/config.env'                          // Dans Docker
  ];

  for (const configPath of possiblePaths) {
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const envKey = key.trim();
              const envValue = valueParts.join('=').trim();
              // Ne pas écraser si déjà défini dans process.env (priorité aux vars d'env)
              if (!process.env[envKey]) {
                process.env[envKey] = envValue;
              }
            }
          }
        }
        return true;
      }
    } catch (e) {
      // Continuer avec le prochain chemin
      continue;
    }
  }
  return false;
}

// Charger config.env directement depuis le fichier
loadConfigEnv();

// Aussi essayer dotenv comme fallback
try {
  require('dotenv').config({ path: './config.env' });
} catch (e) {
  // Ignorer si le fichier n'existe pas
}

// Configuration du transporteur email
const createTransporter = () => {
  // Configuration depuis les variables d'environnement
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1';
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;

  // Debug: Afficher la configuration (masquer le mot de passe)
  console.log('📧 Configuration SMTP:', {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    user: smtpUser ? '✅ Configuré' : '❌ Non configuré',
    password: smtpPassword ? '✅ Configuré' : '❌ Non configuré'
  });

  const smtpConfig = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure, // true pour 465, false pour autres ports
    auth: {
      user: smtpUser,
      pass: smtpPassword
    }
  };

  // Si les credentials ne sont pas configurés, utiliser un transporteur de test (pour dev)
  if (!smtpUser || !smtpPassword) {
    console.warn('⚠️  SMTP non configuré. Mode développement activé.');
    console.warn('⚠️  Pour la production, configurez SMTP_USER et SMTP_PASSWORD dans config.env');
    console.warn('⚠️  Ou définissez ces variables dans docker-compose.yml');
    
    // Transporteur de test qui simule l'envoi sans vraiment envoyer
    return {
      sendMail: async (mailOptions) => {
        // Simuler l'envoi et afficher dans la console
        console.log('\n' + '='.repeat(70));
        console.log('📧 EMAIL DE TEST (Mode Développement)');
        console.log('='.repeat(70));
        console.log('From:', mailOptions.from);
        console.log('To:', mailOptions.to);
        console.log('Subject:', mailOptions.subject);
        console.log('\n--- CONTENU TEXT ---');
        console.log(mailOptions.text);
        console.log('\n--- CONTENU HTML ---');
        console.log(mailOptions.html);
        console.log('='.repeat(70) + '\n');
        
        // Retourner un objet similaire à celui de nodemailer
        return {
          messageId: '<test-' + Date.now() + '@test.local>',
          accepted: [mailOptions.to],
          rejected: [],
          pending: [],
          response: '250 OK - Email simulé en mode développement'
        };
      }
    };
  }

  console.log('✅ Utilisation de SMTP réel (Mailtrap)');
  return nodemailer.createTransport(smtpConfig);
};

/**
 * Envoie un email avec le nouveau mot de passe généré
 * @param {string} email - Email du destinataire
 * @param {string} newPassword - Nouveau mot de passe généré
 * @param {string} userName - Nom de l'utilisateur (optionnel)
 * @returns {Promise<Object>}
 */
const sendPasswordResetEmail = async (email, newPassword, userName = '') => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@alliance-courtage.fr',
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe - Alliance Courtage',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
              margin: -30px -30px 30px -30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
            }
            .content {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .password-box {
              background: #f0f0f0;
              border: 2px dashed #667eea;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              margin: 20px 0;
              font-size: 18px;
              font-weight: bold;
              color: #667eea;
            }
            .warning {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🔐 Alliance Courtage</div>
              <p style="margin: 10px 0 0 0;">Réinitialisation de mot de passe</p>
            </div>
            
            <div class="content">
              <h2>Bonjour${userName ? ' ' + userName : ''},</h2>
              
              <p>Vous avez demandé la réinitialisation de votre mot de passe pour accéder à l'administration (<strong>/manage</strong>).</p>
              
              <p>Un nouveau mot de passe a été généré automatiquement pour votre compte administrateur.</p>
              
              <div class="password-box">
                Votre nouveau mot de passe :<br>
                <strong style="font-size: 22px; letter-spacing: 2px;">${newPassword}</strong>
              </div>
              
              <div class="warning">
                <strong>⚠️ Important :</strong>
                <ul style="margin: 10px 0;">
                  <li>Ce mot de passe est temporaire</li>
                  <li>Changez-le immédiatement après votre première connexion</li>
                  <li>Ne partagez jamais ce mot de passe avec personne</li>
                  <li>Si vous n'avez pas fait cette demande, contactez immédiatement le support</li>
                </ul>
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/#manage" class="button">
                  Se connecter à /manage
                </a>
              </p>
              
              <p><strong>Pour vous connecter :</strong></p>
              <ol>
                <li>Allez sur la page de connexion</li>
                <li>Entrez votre email : <strong>${email}</strong></li>
                <li>Entrez le nouveau mot de passe ci-dessus</li>
                <li>Une fois connecté, changez votre mot de passe dans votre profil</li>
              </ol>
            </div>
            
            <div class="footer">
              <p>Cet email a été envoyé automatiquement. Ne répondez pas à cet email.</p>
              <p>© ${new Date().getFullYear()} Alliance Courtage - Tous droits réservés</p>
              <p style="font-size: 10px; color: #999;">
                Si vous rencontrez des problèmes, contactez le support technique.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Réinitialisation de votre mot de passe - Alliance Courtage
        
        Bonjour${userName ? ' ' + userName : ''},
        
        Vous avez demandé la réinitialisation de votre mot de passe pour accéder à l'administration (/manage).
        
        Votre nouveau mot de passe : ${newPassword}
        
        IMPORTANT :
        - Ce mot de passe est temporaire
        - Changez-le immédiatement après votre première connexion
        - Ne partagez jamais ce mot de passe
        
        Pour vous connecter :
        1. Allez sur ${process.env.FRONTEND_URL || 'http://localhost:5173'}/#manage
        2. Entrez votre email : ${email}
        3. Entrez le nouveau mot de passe
        4. Changez votre mot de passe dans votre profil après connexion
        
        Si vous n'avez pas fait cette demande, contactez immédiatement le support.
        
        © ${new Date().getFullYear()} Alliance Courtage
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email envoyé avec succès:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    
    // Détecter les erreurs spécifiques de Mailtrap
    if (error.message && error.message.includes('email limit is reached')) {
      const customError = new Error('Limite d\'emails Mailtrap atteinte. Veuillez mettre à niveau votre plan ou utiliser un autre service SMTP.');
      customError.code = 'MAILTRAP_LIMIT_REACHED';
      customError.originalError = error;
      throw customError;
    }
    
    if (error.message && error.message.includes('Invalid login')) {
      const customError = new Error('Identifiants SMTP invalides. Vérifiez votre configuration SMTP.');
      customError.code = 'SMTP_AUTH_ERROR';
      customError.originalError = error;
      throw customError;
    }
    
    throw new Error('Erreur lors de l\'envoi de l\'email: ' + error.message);
  }
};

/**
 * Envoie un email de confirmation d'approbation de réservation
 * @param {string} email - Email du destinataire
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} productTitle - Titre du produit
 * @param {number} montant - Montant réservé
 * @returns {Promise<Object>}
 */
const sendReservationApprovedEmail = async (email, userName, productTitle, montant) => {
  try {
    console.log(`📧 Début envoi email d'approbation réservation:`);
    console.log(`   - Email destinataire: ${email}`);
    console.log(`   - Nom utilisateur: ${userName}`);
    console.log(`   - Produit: ${productTitle}`);
    console.log(`   - Montant: ${montant}`);
    
    const transporter = createTransporter();
    const montantFormatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(montant);
    
    console.log(`📧 Préparation email d'approbation pour ${email}...`);

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@alliance-courtage.fr',
      to: email,
      subject: '✅ Réservation approuvée - Alliance Courtage',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
              margin: -30px -30px 30px -30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
            }
            .content {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .success-box {
              background: #d1fae5;
              border-left: 4px solid #10b981;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box {
              background: #f0f0f0;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              background: #10b981;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">✅ Alliance Courtage</div>
              <p style="margin: 10px 0 0 0;">Réservation approuvée</p>
            </div>
            
            <div class="content">
              <h2>Bonjour ${userName},</h2>
              
              <div class="success-box">
                <strong>✅ Excellente nouvelle !</strong><br>
                Votre réservation de produit structuré a été approuvée.
              </div>
              
              <div class="info-box">
                <p><strong>Détails de votre réservation :</strong></p>
                <ul>
                  <li><strong>Produit :</strong> ${productTitle}</li>
                  <li><strong>Montant réservé :</strong> ${montantFormatted}</li>
                  <li><strong>Statut :</strong> Approuvé</li>
                </ul>
              </div>
              
              <p>Votre réservation est maintenant confirmée. Vous recevrez prochainement les informations complémentaires concernant votre produit structuré.</p>
              
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/#produits-structures" class="button">
                  Voir mes réservations
                </a>
              </p>
              
              <p>Pour toute question concernant votre réservation, n'hésitez pas à nous contacter.</p>
            </div>
            
            <div class="footer">
              <p>Cet email a été envoyé automatiquement. Ne répondez pas à cet email.</p>
              <p>© ${new Date().getFullYear()} Alliance Courtage - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Réservation approuvée - Alliance Courtage
        
        Bonjour ${userName},
        
        Excellente nouvelle ! Votre réservation de produit structuré a été approuvée.
        
        Détails de votre réservation :
        - Produit : ${productTitle}
        - Montant réservé : ${montantFormatted}
        - Statut : Approuvé
        
        Votre réservation est maintenant confirmée. Vous recevrez prochainement les informations complémentaires concernant votre produit structuré.
        
        Pour consulter vos réservations, connectez-vous à votre espace :
        ${process.env.FRONTEND_URL || 'http://localhost:5173'}/#produits-structures
        
        Pour toute question concernant votre réservation, n'hésitez pas à nous contacter.
        
        © ${new Date().getFullYear()} Alliance Courtage
      `
    };

    console.log(`📧 Envoi email d'approbation à ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email d\'approbation envoyé avec succès:', {
      messageId: info.messageId,
      to: email,
      subject: mailOptions.subject
    });
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Erreur envoi email d\'approbation:', error);
    console.error('Détails erreur:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    throw new Error('Erreur lors de l\'envoi de l\'email: ' + error.message);
  }
};

/**
 * Envoie un email de notification de rejet de réservation
 * @param {string} email - Email du destinataire
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} productTitle - Titre du produit
 * @param {number} montant - Montant réservé
 * @param {string} reason - Raison du rejet (optionnel)
 * @returns {Promise<Object>}
 */
const sendReservationRejectedEmail = async (email, userName, productTitle, montant, reason = null) => {
  try {
    const transporter = createTransporter();
    const montantFormatted = new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(montant);

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@alliance-courtage.fr',
      to: email,
      subject: '❌ Réservation rejetée - Alliance Courtage',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .header {
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
              margin: -30px -30px 30px -30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
            }
            .content {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .warning-box {
              background: #fee2e2;
              border-left: 4px solid #ef4444;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .info-box {
              background: #f0f0f0;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .reason-box {
              background: #fff7ed;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">❌ Alliance Courtage</div>
              <p style="margin: 10px 0 0 0;">Réservation rejetée</p>
            </div>
            
            <div class="content">
              <h2>Bonjour ${userName},</h2>
              
              <div class="warning-box">
                <strong>Malheureusement, votre réservation n'a pas pu être approuvée.</strong>
              </div>
              
              <div class="info-box">
                <p><strong>Détails de votre réservation :</strong></p>
                <ul>
                  <li><strong>Produit :</strong> ${productTitle}</li>
                  <li><strong>Montant réservé :</strong> ${montantFormatted}</li>
                  <li><strong>Statut :</strong> Rejetée</li>
                </ul>
              </div>
              
              ${reason ? `
                <div class="reason-box">
                  <strong>Raison du rejet :</strong><br>
                  ${reason}
                </div>
              ` : ''}
              
              <p>Nous sommes désolés que votre réservation n'ait pas pu être approuvée. Si vous avez des questions ou souhaitez effectuer une nouvelle réservation, n'hésitez pas à nous contacter.</p>
              
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/#produits-structures" class="button">
                  Voir les produits disponibles
                </a>
              </p>
              
              <p>Pour toute question, notre équipe est à votre disposition.</p>
            </div>
            
            <div class="footer">
              <p>Cet email a été envoyé automatiquement. Ne répondez pas à cet email.</p>
              <p>© ${new Date().getFullYear()} Alliance Courtage - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Réservation rejetée - Alliance Courtage
        
        Bonjour ${userName},
        
        Malheureusement, votre réservation n'a pas pu être approuvée.
        
        Détails de votre réservation :
        - Produit : ${productTitle}
        - Montant réservé : ${montantFormatted}
        - Statut : Rejetée
        ${reason ? `\nRaison du rejet : ${reason}` : ''}
        
        Nous sommes désolés que votre réservation n'ait pas pu être approuvée. Si vous avez des questions ou souhaitez effectuer une nouvelle réservation, n'hésitez pas à nous contacter.
        
        Pour consulter d'autres produits disponibles :
        ${process.env.FRONTEND_URL || 'http://localhost:5173'}/#produits-structures
        
        Pour toute question, notre équipe est à votre disposition.
        
        © ${new Date().getFullYear()} Alliance Courtage
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de rejet envoyé avec succès:', info.messageId);
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Erreur envoi email de rejet:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email: ' + error.message);
  }
};

/**
 * Envoie un email de notification de bordereau disponible
 * @param {string} email - Email du destinataire
 * @param {string} userName - Nom de l'utilisateur
 * @param {string} bordereauTitle - Titre du bordereau
 * @param {number} periodMonth - Mois de la période (1-12)
 * @param {number} periodYear - Année de la période
 * @param {string} fileUrl - URL du fichier à télécharger
 * @returns {Promise<Object>}
 */
const sendBordereauNotificationEmail = async (email, userName, bordereauTitle, periodMonth, periodYear, fileUrl) => {
  try {
    console.log(`📧 Début envoi email notification bordereau:`);
    console.log(`   - Email destinataire: ${email}`);
    console.log(`   - Nom utilisateur: ${userName}`);
    console.log(`   - Bordereau: ${bordereauTitle}`);
    console.log(`   - Période: ${periodMonth}/${periodYear}`);
    console.log(`   - File URL: ${fileUrl}`);
    
    const transporter = createTransporter();
    
    // Formatage du mois
    const monthNames = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const monthName = periodMonth ? monthNames[periodMonth - 1] : '';
    
    console.log(`📧 Préparation email notification bordereau pour ${email}...`);

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@alliance-courtage.fr',
      to: email,
      subject: `📄 Nouveau bordereau disponible - ${monthName} ${periodYear || new Date().getFullYear()} - Alliance Courtage`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 8px;
              padding: 30px;
              border: 1px solid #e0e0e0;
            }
            .header {
              background: linear-gradient(135deg, #0B1220 0%, #1D4ED8 100%);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              text-align: center;
              margin: -30px -30px 30px -30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
            }
            .content {
              background: white;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .info-box {
              background: #f0f7ff;
              border-left: 4px solid #1D4ED8;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e0e0e0;
              color: #666;
              font-size: 12px;
            }
            .button {
              display: inline-block;
              background: linear-gradient(135deg, #0B1220 0%, #1D4ED8 100%);
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📄 Alliance Courtage</div>
              <p style="margin: 10px 0 0 0;">Nouveau bordereau disponible</p>
            </div>
            
            <div class="content">
              <h2>Bonjour ${userName},</h2>
              
              <p>Un nouveau bordereau a été ajouté à votre espace comptabilité.</p>
              
              <div class="info-box">
                <p><strong>Détails du bordereau :</strong></p>
                <ul style="margin: 10px 0; padding-left: 20px;">
                  <li><strong>Titre :</strong> ${bordereauTitle}</li>
                  ${periodMonth && periodYear ? `<li><strong>Période :</strong> ${monthName} ${periodYear}</li>` : ''}
                  <li><strong>Date d'ajout :</strong> ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</li>
                </ul>
              </div>
              
              <p>Vous pouvez maintenant télécharger et consulter votre bordereau depuis votre espace comptabilité.</p>
              
              <p style="text-align: center;">
                <a href="${fileUrl}" class="button">
                  Télécharger le bordereau
                </a>
              </p>
              
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/#comptabilite" style="color: #1D4ED8; text-decoration: underline;">
                  Accéder à mon espace comptabilité
                </a>
              </p>
              
              <p>Pour toute question concernant votre bordereau, n'hésitez pas à nous contacter.</p>
            </div>
            
            <div class="footer">
              <p>Cet email a été envoyé automatiquement. Ne répondez pas à cet email.</p>
              <p>© ${new Date().getFullYear()} Alliance Courtage - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Nouveau bordereau disponible - Alliance Courtage
        
        Bonjour ${userName},
        
        Un nouveau bordereau a été ajouté à votre espace comptabilité.
        
        Détails du bordereau :
        - Titre : ${bordereauTitle}
        ${periodMonth && periodYear ? `- Période : ${monthName} ${periodYear}` : ''}
        - Date d'ajout : ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        
        Vous pouvez maintenant télécharger et consulter votre bordereau depuis votre espace comptabilité.
        
        Télécharger le bordereau : ${fileUrl}
        Accéder à mon espace comptabilité : ${process.env.FRONTEND_URL || 'http://localhost:5173'}/#comptabilite
        
        Pour toute question concernant votre bordereau, n'hésitez pas à nous contacter.
        
        © ${new Date().getFullYear()} Alliance Courtage
      `
    };

    console.log(`📧 Envoi email notification bordereau à ${email}...`);
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de notification bordereau envoyé avec succès:', {
      messageId: info.messageId,
      to: email,
      subject: mailOptions.subject
    });
    return { success: true, messageId: info.messageId };
    
  } catch (error) {
    console.error('❌ Erreur envoi email notification bordereau:', error);
    console.error('Détails erreur:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode
    });
    throw new Error('Erreur lors de l\'envoi de l\'email: ' + error.message);
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendReservationApprovedEmail,
  sendReservationRejectedEmail,
  sendBordereauNotificationEmail,
  createTransporter
};

