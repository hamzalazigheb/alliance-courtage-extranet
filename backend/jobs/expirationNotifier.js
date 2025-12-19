/**
 * Job de notification d'expiration de compte
 * À exécuter quotidiennement via cron ou manuellement
 */

const { query } = require('../config/database');
const { sendEmail } = require('../services/emailService');

const NOTIFICATION_DAYS = [7, 3, 1]; // Jours avant expiration pour notifier

async function checkExpiringAccounts() {
  console.log('🔔 Vérification des comptes expirant bientôt...');
  
  const results = {
    notified: [],
    errors: []
  };

  for (const days of NOTIFICATION_DAYS) {
    try {
      // Trouver les utilisateurs dont le compte expire dans X jours
      const expiringUsers = await query(`
        SELECT id, email, nom, prenom, denomination_sociale, validite_date
        FROM users 
        WHERE is_active = TRUE 
          AND validite_date IS NOT NULL
          AND DATE(validite_date) = DATE_ADD(CURDATE(), INTERVAL ? DAY)
      `, [days]);

      console.log(`📅 ${expiringUsers.length} compte(s) expirant dans ${days} jour(s)`);

      for (const user of expiringUsers) {
        try {
          const displayName = user.denomination_sociale || `${user.prenom} ${user.nom}`;
          const expirationDate = new Date(user.validite_date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          await sendEmail({
            to: user.email,
            subject: `⚠️ Votre accès Alliance Courtage expire dans ${days} jour${days > 1 ? 's' : ''}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
                  .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                  .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; }
                  .header h1 { margin: 0; font-size: 24px; }
                  .content { padding: 30px; }
                  .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
                  .alert-box h2 { color: #92400e; margin-top: 0; }
                  .date-box { background: #fee2e2; color: #991b1b; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; margin: 20px 0; }
                  .footer { background: #f1f5f9; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
                  .btn { display: inline-block; background: #1e40af; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 15px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>⚠️ Expiration de votre accès</h1>
                  </div>
                  <div class="content">
                    <p>Bonjour <strong>${displayName}</strong>,</p>
                    
                    <div class="alert-box">
                      <h2>Votre accès à l'extranet Alliance Courtage expire bientôt</h2>
                      <p>Il ne vous reste que <strong>${days} jour${days > 1 ? 's' : ''}</strong> avant l'expiration de votre compte.</p>
                    </div>
                    
                    <div class="date-box">
                      📅 Date d'expiration : ${expirationDate}
                    </div>
                    
                    <p>Après cette date, vous ne pourrez plus accéder à :</p>
                    <ul>
                      <li>Vos bordereaux de commissions</li>
                      <li>Les documents partenaires</li>
                      <li>Les archives et formations</li>
                    </ul>
                    
                    <p><strong>Pour renouveler votre accès</strong>, veuillez contacter l'administration Alliance Courtage.</p>
                    
                    <a href="mailto:admin@alliance-courtage.fr" class="btn">Contacter l'administration</a>
                  </div>
                  <div class="footer">
                    <p>Alliance Courtage SAS - 15, Rue Eugène Flachat, 75017 PARIS</p>
                    <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
                  </div>
                </div>
              </body>
              </html>
            `
          });

          results.notified.push({ email: user.email, days });
          console.log(`✅ Email envoyé à ${user.email} (expire dans ${days} jours)`);

        } catch (emailError) {
          results.errors.push({ email: user.email, error: emailError.message });
          console.error(`❌ Erreur envoi email à ${user.email}:`, emailError.message);
        }
      }
    } catch (error) {
      console.error(`❌ Erreur requête pour ${days} jours:`, error.message);
      results.errors.push({ days, error: error.message });
    }
  }

  console.log(`🔔 Fin vérification: ${results.notified.length} notifié(s), ${results.errors.length} erreur(s)`);
  return results;
}

// Fonction pour notifier les admins des comptes expirés
async function notifyAdminsOfExpiredAccounts() {
  try {
    // Comptes expirés aujourd'hui
    const expiredToday = await query(`
      SELECT id, email, nom, prenom, denomination_sociale, validite_date
      FROM users 
      WHERE is_active = TRUE 
        AND validite_date IS NOT NULL
        AND DATE(validite_date) = CURDATE()
    `);

    if (expiredToday.length > 0) {
      // Créer notification pour les admins
      const { createNotification } = require('../services/notificationService');
      
      for (const user of expiredToday) {
        const displayName = user.denomination_sociale || `${user.prenom} ${user.nom}`;
        await createNotification(
          null, // broadcast to admins
          'warning',
          'Compte expiré',
          `Le compte de ${displayName} (${user.email}) a expiré aujourd'hui.`,
          true // admin only
        );
      }
      
      console.log(`⚠️ ${expiredToday.length} compte(s) expiré(s) aujourd'hui - Admins notifiés`);
    }
  } catch (error) {
    console.error('Erreur notification admins:', error.message);
  }
}

module.exports = {
  checkExpiringAccounts,
  notifyAdminsOfExpiredAccounts
};

