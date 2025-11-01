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
    
    // Les admins voient leurs notifications personnelles + les notifications globales (user_id IS NULL)
    // Les utilisateurs normaux voient seulement leurs notifications personnelles
    let sql = `SELECT * FROM notifications WHERE (user_id = ?`;
    const params = [req.user.id];
    
    if (req.user.role === 'admin') {
      sql += ` OR user_id IS NULL`;
    }
    
    sql += `)`;
    
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
    let sql = `SELECT COUNT(*) as count FROM notifications 
               WHERE (user_id = ?`;
    const params = [req.user.id];
    
    if (req.user.role === 'admin') {
      sql += ` OR user_id IS NULL`;
    }
    
    sql += ') AND is_read = FALSE';
    
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
    
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND (user_id = ? OR user_id IS NULL)',
      [notificationId, req.user.id]
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
    await query(
      'UPDATE notifications SET is_read = TRUE WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE',
      [req.user.id]
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
async function createNotification(type, title, message, userId = null, relatedId = null, relatedType = null) {
  try {
    const result = await query(
      `INSERT INTO notifications (user_id, type, title, message, related_id, related_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, title, message, relatedId, relatedType]
    );
    return result.insertId;
  } catch (error) {
    console.error('Erreur création notification:', error);
    return null;
  }
}

// Fonction pour notifier tous les admins
// Crée une notification globale (user_id = NULL) visible par tous les admins
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

module.exports = router;
module.exports.createNotification = createNotification;
module.exports.notifyAdmins = notifyAdmins;
