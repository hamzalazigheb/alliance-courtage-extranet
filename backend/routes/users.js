const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Obtenir tous les utilisateurs
// @access  Private (Admin seulement)
router.get('/', auth, authorize('admin'), async (req, res) => {
  try {
    const { role, active, search } = req.query;
    
    let sql = 'SELECT id, email, nom, prenom, role, is_active, created_at FROM users';
    const conditions = [];
    const params = [];
    
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    
    if (active !== undefined) {
      conditions.push('is_active = ?');
      params.push(active === 'true');
    }
    
    if (search) {
      conditions.push('(nom LIKE ? OR prenom LIKE ? OR email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    sql += ' ORDER BY nom, prenom';
    
    const users = await query(sql, params);
    
    res.json(users);
  } catch (error) {
    console.error('Erreur get users:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des utilisateurs' 
    });
  }
});

// @route   GET /api/users/:id
// @desc    Obtenir un utilisateur par ID
// @access  Private (Admin seulement)
router.get('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const users = await query(
      'SELECT id, email, nom, prenom, role, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Erreur get user:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération de l\'utilisateur' 
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Mettre à jour un utilisateur
// @access  Private (Admin seulement)
router.put('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      nom,
      prenom,
      role,
      is_active
    } = req.body;
    
    // Vérifier que l'utilisateur existe
    const existingUsers = await query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    if (email) {
      const emailUsers = await query(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, id]
      );
      
      if (emailUsers.length > 0) {
        return res.status(400).json({ 
          error: 'Cet email est déjà utilisé par un autre utilisateur' 
        });
      }
    }
    
    // Construire dynamiquement la requête de mise à jour
    const updates = [];
    const values = [];
    
    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }
    if (nom !== undefined) {
      updates.push('nom = ?');
      values.push(nom);
    }
    if (prenom !== undefined) {
      updates.push('prenom = ?');
      values.push(prenom);
    }
    if (role !== undefined) {
      // Validation role - must be one of the ENUM values
      const validRoles = ['admin', 'user', 'broker'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ 
          error: `Rôle invalide. Valeurs autorisées: ${validRoles.join(', ')}` 
        });
      }
      updates.push('role = ?');
      values.push(role);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucun champ à mettre à jour' });
    }
    
    values.push(id);
    
    // Mettre à jour l'utilisateur
    try {
      await query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
      
      console.log('✅ User updated successfully:', { id, updates: updates.join(', ') });
      res.json({ message: 'Utilisateur mis à jour avec succès' });
    } catch (dbError) {
      console.error('❌ Database error during user update:', dbError);
      
      // Gérer spécifiquement l'erreur de role ENUM
      if (dbError.code === 'WARN_DATA_TRUNCATED' && dbError.sqlMessage && dbError.sqlMessage.includes('role')) {
        return res.status(400).json({ 
          error: 'Rôle invalide. Valeurs autorisées: admin, user, broker' 
        });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('❌ Erreur update user:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour de l\'utilisateur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   PUT /api/users/:id/profile
// @desc    Mettre à jour le profil de l'utilisateur connecté (nom, prenom, email)
// @access  Private (Utilisateur peut modifier son propre profil)
router.put('/:id/profile', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom, email } = req.body;
    
    // Vérifier que l'utilisateur modifie son propre profil
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez modifier que votre propre profil' 
      });
    }
    
    // Validation des données
    if (!nom || !prenom || !email) {
      return res.status(400).json({ 
        error: 'Nom, prénom et email sont requis' 
      });
    }
    
    // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        error: 'Cet email est déjà utilisé par un autre utilisateur' 
      });
    }
    
    // Mettre à jour le profil
    await query(
      'UPDATE users SET nom = ?, prenom = ?, email = ? WHERE id = ?',
      [nom, prenom, email, id]
    );
    
    res.json({ message: 'Profil mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur update profile:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du profil' 
    });
  }
});

// @route   PUT /api/users/:id/change-password
// @desc    Changer le mot de passe de l'utilisateur connecté (nécessite le mot de passe actuel)
// @access  Private (Utilisateur peut changer son propre mot de passe)
router.put('/:id/change-password', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Vérifier que l'utilisateur change son propre mot de passe
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez changer que votre propre mot de passe' 
      });
    }
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Mot de passe actuel et nouveau mot de passe requis' 
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
      });
    }
    
    // Vérifier que l'utilisateur existe et récupérer le mot de passe actuel
    const users = await query(
      'SELECT id, password FROM users WHERE id = ?',
      [id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    const user = users[0];
    
    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Mot de passe actuel incorrect' 
      });
    }
    
    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Mettre à jour le mot de passe
    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    res.json({ message: 'Mot de passe changé avec succès' });
  } catch (error) {
    console.error('Erreur change password:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors du changement de mot de passe' 
    });
  }
});

// @route   PUT /api/users/:id/password
// @desc    Changer le mot de passe d'un utilisateur (admin seulement)
// @access  Private (Admin seulement)
router.put('/:id/password', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    // Validation du mot de passe
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        error: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }
    
    // Vérifier que l'utilisateur existe
    const existingUsers = await query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Mettre à jour le mot de passe
    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    res.json({ message: 'Mot de passe mis à jour avec succès' });
  } catch (error) {
    console.error('Erreur update password:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du mot de passe' 
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Supprimer un utilisateur
// @access  Private (Admin seulement)
router.delete('/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier que l'utilisateur existe
    const existingUsers = await query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    // Empêcher la suppression de son propre compte
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ 
        error: 'Vous ne pouvez pas supprimer votre propre compte' 
      });
    }
    
    // Supprimer les sessions de l'utilisateur
    await query(
      'DELETE FROM user_sessions WHERE user_id = ?',
      [id]
    );
    
    // Supprimer l'utilisateur
    await query(
      'DELETE FROM users WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur delete user:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la suppression de l\'utilisateur' 
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Obtenir les statistiques des utilisateurs
// @access  Private (Admin seulement)
router.get('/stats/overview', auth, authorize('admin'), async (req, res) => {
  try {
    // Statistiques générales
    const totalUsers = await query('SELECT COUNT(*) as count FROM users');
    const activeUsers = await query('SELECT COUNT(*) as count FROM users WHERE is_active = TRUE');
    const adminUsers = await query('SELECT COUNT(*) as count FROM users WHERE role = "admin"');
    const brokerUsers = await query('SELECT COUNT(*) as count FROM users WHERE role = "broker"');
    
    // Utilisateurs créés ce mois
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const newThisMonth = await query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= ?',
      [thisMonth]
    );
    
    res.json({
      total: totalUsers[0].count,
      active: activeUsers[0].count,
      admins: adminUsers[0].count,
      brokers: brokerUsers[0].count,
      newThisMonth: newThisMonth[0].count
    });
  } catch (error) {
    console.error('Erreur get user stats:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la récupération des statistiques' 
    });
  }
});

module.exports = router;


