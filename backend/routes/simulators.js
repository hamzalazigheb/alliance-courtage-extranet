const express = require('express');
const { query } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/simulators/usage
// @desc    Enregistrer l'utilisation d'un simulateur
// @access  Private
router.post('/usage', auth, async (req, res) => {
  try {
    const { simulator_type, parameters, result_summary } = req.body;
    const userId = req.user.id;

    if (!simulator_type) {
      return res.status(400).json({ 
        error: 'Le type de simulateur est requis' 
      });
    }

    // Enregistrer l'utilisation
    await query(
      `INSERT INTO simulator_usage (user_id, simulator_type, parameters, result_summary) 
       VALUES (?, ?, ?, ?)`,
      [
        userId,
        simulator_type,
        parameters ? JSON.stringify(parameters) : null,
        result_summary || null
      ]
    );

    res.json({ 
      message: 'Utilisation du simulateur enregistrée avec succès' 
    });
  } catch (error) {
    console.error('Erreur enregistrement utilisation simulateur:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'enregistrement de l\'utilisation' 
    });
  }
});

// @route   GET /api/simulators/usage
// @desc    Obtenir les statistiques d'utilisation des simulateurs (Admin seulement)
// @access  Private (Admin seulement)
router.get('/usage', auth, async (req, res) => {
  try {
    const userResult = await query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const userRole = userResult && userResult.length > 0 ? userResult[0].role : 'user';
    
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'Accès refusé : Seuls les administrateurs peuvent voir les statistiques' 
      });
    }

    const { simulator_type, user_id, start_date, end_date, limit = 100 } = req.query;

    let sql = `
      SELECT 
        su.*,
        u.nom,
        u.prenom,
        u.email
      FROM simulator_usage su
      LEFT JOIN users u ON su.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (simulator_type) {
      sql += ' AND su.simulator_type = ?';
      params.push(simulator_type);
    }

    if (user_id) {
      sql += ' AND su.user_id = ?';
      params.push(parseInt(user_id));
    }

    if (start_date) {
      sql += ' AND su.created_at >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND su.created_at <= ?';
      params.push(end_date);
    }

    sql += ' ORDER BY su.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const usage = await query(sql, params);

    // Parser les paramètres JSON
    const usageWithParsedParams = usage.map(record => ({
      ...record,
      parameters: record.parameters ? JSON.parse(record.parameters) : null
    }));

    res.json(usageWithParsedParams);
  } catch (error) {
    console.error('Erreur récupération statistiques simulateurs:', error);
    console.error('Stack trace:', error.stack);
    
    // Vérifier si c'est une erreur de table manquante
    if (error.code === 'ER_NO_SUCH_TABLE' || (error.message && (error.message.includes("doesn't exist") || (error.message.includes("Table") && error.message.includes("doesn't exist"))))) {
      return res.status(500).json({ 
        error: 'Table simulator_usage non trouvée. Veuillez exécuter le script de migration.',
        details: 'La table simulator_usage doit être créée en production.',
        solution: 'Exécutez: docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "CREATE TABLE IF NOT EXISTS simulator_usage (...)"'
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des statistiques',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/simulators/usage/stats
// @desc    Obtenir les statistiques agrégées d'utilisation (Admin seulement)
// @access  Private (Admin seulement)
router.get('/usage/stats', auth, async (req, res) => {
  try {
    const userResult = await query('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const userRole = userResult && userResult.length > 0 ? userResult[0].role : 'user';
    
    if (userRole !== 'admin') {
      return res.status(403).json({ 
        error: 'Accès refusé : Seuls les administrateurs peuvent voir les statistiques' 
      });
    }

    // Statistiques par type de simulateur
    const statsByType = await query(`
      SELECT 
        simulator_type,
        COUNT(*) as total_uses,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(created_at) as first_use,
        MAX(created_at) as last_use
      FROM simulator_usage
      GROUP BY simulator_type
      ORDER BY total_uses DESC
    `);

    // Statistiques par utilisateur
    const statsByUser = await query(`
      SELECT 
        u.id,
        u.nom,
        u.prenom,
        u.email,
        COUNT(su.id) as total_uses,
        COUNT(DISTINCT su.simulator_type) as simulators_used,
        MAX(su.created_at) as last_use
      FROM users u
      LEFT JOIN simulator_usage su ON u.id = su.user_id
      WHERE su.id IS NOT NULL
      GROUP BY u.id, u.nom, u.prenom, u.email
      ORDER BY total_uses DESC
      LIMIT 20
    `);

    // Statistiques globales
    const globalStats = await query(`
      SELECT 
        COUNT(*) as total_uses,
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT simulator_type) as total_simulators,
        MIN(created_at) as first_use_ever,
        MAX(created_at) as last_use_ever
      FROM simulator_usage
    `);

    // Statistiques par jour (30 derniers jours)
    const dailyStats = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as uses,
        COUNT(DISTINCT user_id) as users
      FROM simulator_usage
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    res.json({
      by_type: statsByType,
      by_user: statsByUser,
      global: globalStats[0] || {},
      daily: dailyStats
    });
  } catch (error) {
    console.error('Erreur récupération statistiques agrégées:', error);
    console.error('Stack trace:', error.stack);
    
    // Vérifier si c'est une erreur de table manquante
    if (error.code === 'ER_NO_SUCH_TABLE' || (error.message && (error.message.includes("doesn't exist") || (error.message.includes("Table") && error.message.includes("doesn't exist"))))) {
      return res.status(500).json({ 
        error: 'Table simulator_usage non trouvée. Veuillez exécuter le script de migration.',
        details: 'La table simulator_usage doit être créée en production.',
        solution: 'Exécutez: docker exec alliance-courtage-mysql mysql -u root -palliance2024Secure alliance_courtage -e "CREATE TABLE IF NOT EXISTS simulator_usage (...)"'
      });
    }
    
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des statistiques',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

