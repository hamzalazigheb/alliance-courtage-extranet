const express = require('express');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Obtenir les notifications de l'utilisateur connecté
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { unread_only } = req.query;
    
    // Récupérer le rôle de l'utilisateur
    const userResult = await query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const userRole = userResult && userResult.length > 0 ? userResult[0].role : 'user';
    const isAdmin = userRole === 'admin';
    
    // Construire la requête SQL avec une logique plus claire
    let sql;
    const params = [];
    
    if (isAdmin) {
      // Admins voient toutes les notifications (personnelles + globales)
      sql = `SELECT * FROM notifications WHERE (user_id = ? OR user_id IS NULL)`;
      params.push(req.user.id);
    } else {
      // Utilisateurs non-admin voient :
      // - Leurs notifications personnelles (user_id = leur ID)
      // - Notifications globales SAUF 'reservation', 'user_created', 'formation_pending'
      // - Notifications 'reservation_public'
      sql = `SELECT * FROM notifications WHERE (
        user_id = ? OR 
        (user_id IS NULL AND (
          type = 'reservation_public' OR 
          (type != 'reservation' AND type != 'user_created' AND type != 'formation_pending')
        ))
      )`;
      params.push(req.user.id);
    }
    
    if (unread_only === 'true') {
      sql += ' AND is_read = FALSE';
    }
    
    sql += ' ORDER BY created_at DESC LIMIT 50';
    
    const notifications = await query(sql, params);
    
    res.json(notifications);
  } catch (error) {
    console.error('Erreur get notifications:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des notifications' 
    });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Obtenir le nombre de notifications non lues
// @access  Private
router.get('/unread-count', auth, async (req, res) => {
  try {
    // Récupérer le rôle de l'utilisateur
    const userResult = await query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const userRole = userResult && userResult.length > 0 ? userResult[0].role : 'user';
    const isAdmin = userRole === 'admin';
    
    let sql;
    const params = [];
    
    if (isAdmin) {
      sql = `SELECT COUNT(*) as count FROM notifications 
             WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE`;
      params.push(req.user.id);
    } else {
      sql = `SELECT COUNT(*) as count FROM notifications 
             WHERE (
               user_id = ? OR 
               (user_id IS NULL AND (
                 type = 'reservation_public' OR 
                 (type != 'reservation' AND type != 'user_created' AND type != 'formation_pending')
               ))
             ) AND is_read = FALSE`;
      params.push(req.user.id);
    }
    
    const result = await query(sql, params);
    
    res.json({ count: result[0]?.count || 0 });
  } catch (error) {
    console.error('Erreur get unread count:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération du compteur' 
    });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Marquer une notification comme lue
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    
    // Récupérer le rôle de l'utilisateur
    const userResult = await query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const userRole = userResult && userResult.length > 0 ? userResult[0].role : 'user';
    const isAdmin = userRole === 'admin';
    
    let sql;
    const params = [notificationId, req.user.id];
    
    if (isAdmin) {
      sql = `UPDATE notifications SET is_read = TRUE 
             WHERE id = ? AND (user_id = ? OR user_id IS NULL)`;
    } else {
      sql = `UPDATE notifications SET is_read = TRUE 
             WHERE id = ? AND (
               user_id = ? OR 
               (user_id IS NULL AND (
                 type = 'reservation_public' OR 
                 (type != 'reservation' AND type != 'user_created' AND type != 'formation_pending')
               ))
             )`;
    }
    
    await query(sql, params);
    
    res.json({ message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Erreur mark notification as read:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour de la notification' 
    });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Marquer toutes les notifications comme lues
// @access  Private
router.put('/read-all', auth, async (req, res) => {
  try {
    // Récupérer le rôle de l'utilisateur
    const userResult = await query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const userRole = userResult && userResult.length > 0 ? userResult[0].role : 'user';
    const isAdmin = userRole === 'admin';
    
    let sql;
    const params = [req.user.id];
    
    if (isAdmin) {
      sql = `UPDATE notifications SET is_read = TRUE 
             WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE`;
    } else {
      sql = `UPDATE notifications SET is_read = TRUE 
             WHERE (
               user_id = ? OR 
               (user_id IS NULL AND (
                 type = 'reservation_public' OR 
                 (type != 'reservation' AND type != 'user_created' AND type != 'formation_pending')
               ))
             ) AND is_read = FALSE`;
    }
    
    await query(sql, params);
    
    res.json({ message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur mark all notifications as read:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour des notifications' 
    });
  }
});

// Fonction utilitaire pour créer une notification (peut être utilisée depuis d'autres routes)
async function createNotification(type, title, message, userId = null, relatedId = null, relatedType = null, link = null) {
  try {
    // Vérifier si la colonne link existe
    let hasLinkColumn = false;
    try {
      const columns = await query(
        `SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'notifications' 
         AND COLUMN_NAME = 'link'`
      );
      hasLinkColumn = columns && columns.length > 0 && columns[0]?.count > 0;
    } catch (checkError) {
      console.warn('Erreur vérification colonne link:', checkError);
      hasLinkColumn = false;
    }
    
    // Si la colonne n'existe pas et qu'un lien est fourni, essayer de l'ajouter
    if (!hasLinkColumn && link) {
      try {
        await query(`ALTER TABLE notifications ADD COLUMN link VARCHAR(500) NULL AFTER related_type`);
        hasLinkColumn = true;
        console.log('✅ Colonne link ajoutée à la table notifications');
      } catch (alterError) {
        // Si l'ajout échoue, ignorer et continuer sans la colonne
        console.warn('⚠️  Impossible d\'ajouter la colonne link:', alterError.message);
        hasLinkColumn = false;
      }
    }
    
    // Construire la requête selon la présence de la colonne
    let sql, values;
    if (hasLinkColumn) {
      sql = `INSERT INTO notifications (user_id, type, title, message, related_id, related_type, link) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`;
      values = [userId, type, title, message, relatedId, relatedType, link];
    } else {
      sql = `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
             VALUES (?, ?, ?, ?, ?, ?)`;
      values = [userId, type, title, message, relatedId, relatedType];
    }
    
    const result = await query(sql, values);
    return result.insertId;
  } catch (error) {
    console.error('Erreur création notification:', error);
    console.error('Détails:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    return null;
  }
}

// Fonction pour notifier tous les utilisateurs (admins et utilisateurs normaux)
// Crée une notification globale (user_id = NULL) visible par tous les utilisateurs
async function notifyAdmins(type, title, message, relatedId = null, relatedType = null) {
  try {
    // Créer une notification globale pour tous les admins (user_id = NULL)
    const result = await createNotification(type, title, message, null, relatedId, relatedType);
    return result ? 1 : 0;
  } catch (error) {
    console.error('Erreur notification admins:', error);
    return 0;
  }
}

// @route   GET /api/notifications/history
// @desc    Obtenir l'historique des notifications envoyées (Admin seulement)
// @access  Private (Admin seulement)
router.get('/history', auth, authorize('admin'), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Récupérer toutes les notifications avec les informations des destinataires
    const sql = `
      SELECT 
        n.id,
        n.type,
        n.title,
        n.message,
        n.link,
        n.user_id,
        n.created_at,
        n.is_read,
        u.email as recipient_email,
        u.nom as recipient_nom,
        u.prenom as recipient_prenom,
        u.denomination_sociale as recipient_cabinet,
        CASE 
          WHEN n.user_id IS NULL THEN 'Tous les utilisateurs'
          ELSE CONCAT(COALESCE(u.denomination_sociale, CONCAT(u.prenom, ' ', u.nom)), ' (', u.email, ')')
        END as recipient_display
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const notifications = await query(sql, [parseInt(limit), parseInt(offset)]);
    
    // Compter le total
    const countResult = await query('SELECT COUNT(*) as total FROM notifications');
    const total = countResult[0]?.total || 0;
    
    res.json({
      notifications,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Erreur get notification history:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération de l\'historique' 
    });
  }
});

// @route   POST /api/notifications/broadcast
// @desc    Créer une notification globale pour tous les utilisateurs (Admin seulement)
// @access  Private (Admin seulement)
router.post('/broadcast', auth, authorize('admin'), async (req, res) => {
  try {
    const { type, title, message, link } = req.body;
    
    // Validation
    if (!title || !message) {
      return res.status(400).json({ 
        error: 'Le titre et le message sont requis' 
      });
    }
    
    // Créer une notification globale (user_id = NULL) visible par tous les utilisateurs
    const result = await createNotification(
      type || 'info',
      title,
      message,
      null, // user_id = NULL pour notification globale
      null,
      null,
      link || null // Lien optionnel
    );
    
    if (!result) {
      return res.status(500).json({ 
        error: 'Erreur lors de la création de la notification. Vérifiez les logs du serveur pour plus de détails.' 
      });
    }
    
    // Récupérer le nombre total d'utilisateurs pour information
    let userCount = 0;
    try {
      const users = await query('SELECT COUNT(*) as count FROM users WHERE role != "admin"');
      userCount = users && users.length > 0 ? (users[0]?.count || 0) : 0;
    } catch (countError) {
      console.warn('Erreur comptage utilisateurs:', countError);
    }
    
    res.status(201).json({
      message: 'Notification envoyée à tous les utilisateurs',
      notificationId: result,
      recipientCount: userCount
    });
  } catch (error) {
    console.error('Erreur broadcast notification:', error);
    console.error('Détails:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'envoi de la notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/notifications/send-bulk
// @desc    Envoyer une notification à plusieurs utilisateurs spécifiques (Admin seulement)
// @access  Private (Admin seulement)
router.post('/send-bulk', auth, authorize('admin'), async (req, res) => {
  try {
    const { userIds, type, title, message, link } = req.body;
    
    // Validation
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ 
        error: 'La liste des IDs utilisateurs est requise' 
      });
    }
    
    if (!title || !message) {
      return res.status(400).json({ 
        error: 'Le titre et le message sont requis' 
      });
    }
    
    // Vérifier que les utilisateurs existent
    const placeholders = userIds.map(() => '?').join(',');
    const users = await query(
      `SELECT id, email, nom, prenom, denomination_sociale FROM users WHERE id IN (${placeholders})`,
      userIds
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun utilisateur trouvé' 
      });
    }
    
    // Créer une notification pour chaque utilisateur
    const results = [];
    const errors = [];
    
    for (const user of users) {
      try {
        const result = await createNotification(
          type || 'info',
          title,
          message,
          user.id,
          null,
          null,
          link || null
        );
        
        if (result) {
          results.push({
            userId: user.id,
            email: user.email,
            nom: user.nom,
            prenom: user.prenom,
            notificationId: result
          });
        } else {
          errors.push({
            userId: user.id,
            email: user.email,
            error: 'Erreur lors de la création de la notification'
          });
        }
      } catch (error) {
        console.error(`Erreur notification pour utilisateur ${user.id}:`, error);
        errors.push({
          userId: user.id,
          email: user.email,
          error: error.message
        });
      }
    }
    
    res.status(201).json({
      message: `${results.length} notification(s) envoyée(s) avec succès`,
      sent: results.length,
      failed: errors.length,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Erreur send-bulk notification:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'envoi des notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   POST /api/notifications/send
// @desc    Envoyer une notification à un utilisateur spécifique (Admin seulement)
// @access  Private (Admin seulement)
router.post('/send', auth, authorize('admin'), async (req, res) => {
  try {
    const { userId, type, title, message, link } = req.body;
    
    // Validation
    if (!userId || !title || !message) {
      return res.status(400).json({ 
        error: 'L\'ID utilisateur, le titre et le message sont requis' 
      });
    }
    
    // Vérifier que l'utilisateur existe
    const users = await query('SELECT id, email, nom, prenom FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    const user = users[0];
    
    // Créer une notification individuelle pour cet utilisateur
    const result = await createNotification(
      type || 'info',
      title,
      message,
      userId, // user_id spécifique pour notification individuelle
      null,
      null,
      link || null // Lien optionnel
    );
    
    if (!result) {
      return res.status(500).json({ 
        error: 'Erreur lors de la création de la notification. Vérifiez les logs du serveur pour plus de détails.' 
      });
    }
    
    res.status(201).json({
      message: `Notification envoyée à ${user.prenom} ${user.nom} (${user.email})`,
      notificationId: result,
      recipient: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom
      }
    });
  } catch (error) {
    console.error('Erreur send notification:', error);
    console.error('Détails:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'envoi de la notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.notifyAdmins = notifyAdmins;
