const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/password-reset/request
// @desc    Request password reset (user initiates)
// @access  Public
router.post('/request', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email requis' 
      });
    }

    // Check if user exists
    const users = await query(
      'SELECT id, email, nom, prenom FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun utilisateur trouvé avec cet email' 
      });
    }

    const user = users[0];

    // Check if there's already a pending request
    const existingRequests = await query(
      'SELECT id FROM password_reset_requests WHERE user_id = ? AND status = "pending"',
      [user.id]
    );

    if (existingRequests.length > 0) {
      return res.status(400).json({ 
        error: 'Une demande de réinitialisation est déjà en attente' 
      });
    }

    // Create password reset request
    await query(
      `INSERT INTO password_reset_requests (user_id, user_email, status) VALUES (?, ?, 'pending')`,
      [user.id, user.email]
    );

    console.log(`✅ Password reset requested for: ${user.email}`);

    res.status(201).json({
      message: 'Demande de réinitialisation envoyée avec succès. Un administrateur va traiter votre demande.'
    });

  } catch (error) {
    console.error('Erreur password reset request:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la demande de réinitialisation' 
    });
  }
});

// @route   GET /api/password-reset/requests
// @desc    Get all password reset requests (admin only)
// @access  Private (Admin)
router.get('/requests', auth, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.query;

    let sql = `
      SELECT 
        prr.id,
        prr.user_id,
        prr.user_email,
        prr.status,
        prr.requested_at,
        prr.completed_at,
        prr.notes,
        u.nom,
        u.prenom,
        u.is_active as user_is_active
      FROM password_reset_requests prr
      LEFT JOIN users u ON prr.user_id = u.id
    `;

    const params = [];

    if (status) {
      sql += ' WHERE prr.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY prr.requested_at DESC';

    const requests = await query(sql, params);

    res.json(requests);
  } catch (error) {
    console.error('Erreur get password reset requests:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des demandes' 
    });
  }
});

// @route   PUT /api/password-reset/requests/:id/complete
// @desc    Complete password reset (admin resets the password)
// @access  Private (Admin)
router.put('/requests/:id/complete', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password, notes } = req.body;

    if (!new_password) {
      return res.status(400).json({ 
        error: 'Nouveau mot de passe requis' 
      });
    }

    // Get the request
    const requests = await query(
      'SELECT user_id, status FROM password_reset_requests WHERE id = ?',
      [id]
    );

    if (requests.length === 0) {
      return res.status(404).json({ 
        error: 'Demande non trouvée' 
      });
    }

    const request = requests[0];

    if (request.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cette demande a déjà été traitée' 
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    // Update user password
    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, request.user_id]
    );

    // Update request status
    await query(
      `UPDATE password_reset_requests 
       SET status = 'completed', completed_at = NOW(), completed_by = ?, notes = ?
       WHERE id = ?`,
      [req.user.id, notes || null, id]
    );

    console.log(`✅ Password reset completed for user ${request.user_id}`);

    res.json({
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur complete password reset:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la réinitialisation du mot de passe' 
    });
  }
});

// @route   DELETE /api/password-reset/requests/:id
// @desc    Cancel password reset request
// @access  Private (Admin)
router.delete('/requests/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Update request status to cancelled
    await query(
      `UPDATE password_reset_requests 
       SET status = 'cancelled', completed_at = NOW(), completed_by = ?, notes = ?
       WHERE id = ?`,
      [req.user.id, notes || null, id]
    );

    console.log(`✅ Password reset request ${id} cancelled`);

    res.json({
      message: 'Demande annulée avec succès'
    });

  } catch (error) {
    console.error('Erreur cancel password reset:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de l\'annulation de la demande' 
    });
  }
});

module.exports = router;


