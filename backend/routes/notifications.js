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
    
    // Tous les utilisateurs voient leurs notifications personnelles + les notifications globales (user_id IS NULL)
    // MAIS les utilisateurs non-admin ne voient PAS les notifications de type 'reservation' globales (pour protéger les noms)
    // MAIS ils voient les notifications de type 'reservation_public' (sans noms)
    let sql = `SELECT * FROM notifications WHERE (user_id = ? OR (user_id IS NULL AND (type = 'reservation_public' OR type != 'reservation' OR ? = 1)))`;
    const params = [req.user.id, isAdmin ? 1 : 0];
    
    if (unread_only === 'true') {
      sql += ' AND is_read = FALSE';
    }
    
    sql += ' ORDER BY created_at DESC LIMIT 50';
    
    const notifications = await query(sql, params);
    
    // Les notifications 'reservation_public' n'ont déjà pas de noms d'utilisateurs
    // Les notifications 'reservation' ne sont visibles que par les admins
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
    
    // Tous les utilisateurs voient leurs notifications personnelles + les notifications globales
    // MAIS les utilisateurs non-admin ne voient PAS les notifications de type 'reservation' globales
    // MAIS ils voient les notifications de type 'reservation_public' (sans noms)
    let sql = `SELECT COUNT(*) as count FROM notifications 
               WHERE (user_id = ? OR (user_id IS NULL AND (type = 'reservation_public' OR type != 'reservation' OR ? = 1))) AND is_read = FALSE`;
    const params = [req.user.id, isAdmin ? 1 : 0];
    
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
    
    // Can mark as read if it's user's personal notification or a global notification
    // MAIS les utilisateurs non-admin ne peuvent pas marquer les notifications de type 'reservation' globales
    // MAIS ils peuvent marquer les notifications de type 'reservation_public'
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND (user_id = ? OR (user_id IS NULL AND (type = \'reservation_public\' OR type != \'reservation\' OR ? = 1)))',
      [notificationId, req.user.id, isAdmin ? 1 : 0]
    );
    
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
    
    // Mark all notifications as read (personal + global, avec filtrage pour les non-admins)
    // Les utilisateurs peuvent marquer les notifications 'reservation_public' comme lues
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE (user_id = ? OR (user_id IS NULL AND (type = \'reservation_public\' OR type != \'reservation\' OR ? = 1))) AND is_read = FALSE',
      [req.user.id, isAdmin ? 1 : 0]
    );
    
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
