const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

// @route   GET /api/dashboard/monthly-stats
// @desc    Obtenir les statistiques mensuelles pour les charts
// @access  Private (Admin seulement)
router.get('/monthly-stats', auth, authorize('admin'), async (req, res) => {
  try {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = [];
    
    // Get data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthName = months[date.getMonth()];
      
      // Users created this month
      const usersResult = await query(
        `SELECT COUNT(*) as count FROM users 
         WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?`,
        [year, month]
      );
      
      // Archives created this month
      const archivesResult = await query(
        `SELECT COUNT(*) as count FROM archives 
         WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?`,
        [year, month]
      );
      
      // Financial documents created this month
      const documentsResult = await query(
        `SELECT COUNT(*) as count FROM financial_documents 
         WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?`,
        [year, month]
      );
      
      data.push({
        month: monthName,
        users: usersResult[0]?.count || 0,
        archives: archivesResult[0]?.count || 0,
        documents: documentsResult[0]?.count || 0
      });
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erreur get monthly stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// @route   GET /api/dashboard/activity
// @desc    Obtenir l'activité récente
// @access  Private (Admin seulement)
router.get('/activity', auth, authorize('admin'), async (req, res) => {
  try {
    const activities = [];
    
    // Recent users
    const recentUsers = await query(
      `SELECT id, CONCAT(prenom, ' ', nom) as name, 'user' as type, created_at 
       FROM users ORDER BY created_at DESC LIMIT 3`
    );
    recentUsers.forEach(u => activities.push({
      id: `user-${u.id}`,
      type: 'user',
      description: `Nouvel utilisateur: ${u.name}`,
      time: u.created_at
    }));
    
    // Recent archives
    const recentArchives = await query(
      `SELECT id, title, 'archive' as type, created_at 
       FROM archives ORDER BY created_at DESC LIMIT 3`
    );
    recentArchives.forEach(a => activities.push({
      id: `archive-${a.id}`,
      type: 'archive',
      description: `Archive: ${a.title}`,
      time: a.created_at
    }));
    
    // Recent partners
    const recentPartners = await query(
      `SELECT id, name, 'partner' as type, created_at 
       FROM partners ORDER BY created_at DESC LIMIT 3`
    );
    recentPartners.forEach(p => activities.push({
      id: `partner-${p.id}`,
      type: 'partner',
      description: `Partenaire: ${p.name}`,
      time: p.created_at
    }));
    
    // Sort by time and return top 10
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    
    res.json(activities.slice(0, 10));
  } catch (error) {
    console.error('Erreur get activity:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;

