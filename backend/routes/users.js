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
    
    // Construire la requête SELECT - essayer d'inclure toutes les colonnes
    // On essaie d'abord avec toutes les colonnes, puis on fait un fallback si nécessaire
    let selectFields = [
      'id', 
      'email', 
      'nom', 
      'prenom', 
      'denomination_sociale',
      'telephone',
      'code_postal',
      'role', 
      'is_active', 
      'created_at'
    ];
    
    let sql = `SELECT ${selectFields.join(', ')} FROM users`;
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
    
    console.log('📋 Requête SQL GET /api/users:', sql);
    
    let users;
    try {
      users = await query(sql, params);
    } catch (sqlError) {
      // Si erreur (colonnes n'existent pas), réessayer sans les colonnes optionnelles
      if (sqlError.code === 'ER_BAD_FIELD_ERROR') {
        console.warn('⚠️  Certaines colonnes n\'existent pas, utilisation des colonnes de base');
        const baseFields = ['id', 'email', 'nom', 'prenom', 'role', 'is_active', 'created_at'];
        sql = `SELECT ${baseFields.join(', ')} FROM users`;
        if (conditions.length > 0) {
          sql += ' WHERE ' + conditions.join(' AND ');
        }
        sql += ' ORDER BY nom, prenom';
        users = await query(sql, params);
      } else {
        throw sqlError;
      }
    }
    
    console.log('📊 Utilisateurs récupérés:', users.length);
    if (users.length > 0) {
      console.log('📝 Premier utilisateur (exemple):', {
        id: users[0].id,
        nom: users[0].nom,
        prenom: users[0].prenom,
        denomination_sociale: users[0].denomination_sociale,
        telephone: users[0].telephone,
        code_postal: users[0].code_postal
      });
    }
    
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
      is_active,
      denomination_sociale,
      telephone,
      code_postal
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
    
    // Vérifier quelles colonnes existent dans la table
    let availableColumns = [];
    try {
      const columnInfo = await query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'`,
        [process.env.DB_NAME || 'alliance_courtage']
      );
      availableColumns = columnInfo.map(col => col.COLUMN_NAME);
    } catch (colError) {
      console.warn('⚠️  Impossible de vérifier les colonnes, utilisation de toutes les colonnes par défaut');
      // Colonnes de base toujours présentes
      availableColumns = ['id', 'email', 'nom', 'prenom', 'role', 'is_active', 'password', 'created_at'];
    }
    
    // Construire dynamiquement la requête de mise à jour (seulement pour les colonnes qui existent)
    const updates = [];
    const values = [];
    
    if (email !== undefined && availableColumns.includes('email')) {
      updates.push('email = ?');
      values.push(email);
    }
    if (nom !== undefined && availableColumns.includes('nom')) {
      updates.push('nom = ?');
      values.push(nom);
    }
    if (prenom !== undefined && availableColumns.includes('prenom')) {
      updates.push('prenom = ?');
      values.push(prenom);
    }
    if (role !== undefined && availableColumns.includes('role')) {
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
    if (is_active !== undefined && availableColumns.includes('is_active')) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    if (denomination_sociale !== undefined && availableColumns.includes('denomination_sociale')) {
      updates.push('denomination_sociale = ?');
      values.push(denomination_sociale || null);
    } else if (denomination_sociale !== undefined) {
      console.warn('⚠️  Colonne denomination_sociale n\'existe pas, ignorée');
    }
    if (telephone !== undefined && availableColumns.includes('telephone')) {
      updates.push('telephone = ?');
      values.push(telephone || null);
    } else if (telephone !== undefined) {
      console.warn('⚠️  Colonne telephone n\'existe pas, ignorée');
    }
    if (code_postal !== undefined && availableColumns.includes('code_postal')) {
      updates.push('code_postal = ?');
      values.push(code_postal || null);
    } else if (code_postal !== undefined) {
      console.warn('⚠️  Colonne code_postal n\'existe pas, ignorée');
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
      console.error('SQL Error code:', dbError.code);
      console.error('SQL Error message:', dbError.sqlMessage);
      console.error('SQL State:', dbError.sqlState);
      
      // Gérer spécifiquement l'erreur de role ENUM
      if (dbError.code === 'WARN_DATA_TRUNCATED' && dbError.sqlMessage && dbError.sqlMessage.includes('role')) {
        return res.status(400).json({ 
          error: 'Rôle invalide. Valeurs autorisées: admin, user, broker' 
        });
      }
      
      // Gérer les erreurs de colonnes manquantes
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        const missingColumn = dbError.sqlMessage.match(/Unknown column '([^']+)'/);
        if (missingColumn) {
          return res.status(400).json({ 
            error: `Colonne non trouvée: ${missingColumn[1]}. Cette colonne n'existe pas dans la base de données.`,
            details: 'Certaines colonnes optionnelles (denomination_sociale, telephone, code_postal) peuvent ne pas exister en production.'
          });
        }
      }
      
      // Gérer les erreurs de contrainte
      if (dbError.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ 
          error: 'Cette valeur existe déjà dans la base de données (contrainte unique violée)' 
        });
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('❌ Erreur update user:', error);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Si l'erreur a déjà été gérée dans le try/catch interne, ne pas la re-gérer
    if (error.handled) {
      return;
    }
    
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour de l\'utilisateur',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      sqlError: process.env.NODE_ENV === 'development' ? {
        code: error.code,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      } : undefined
    });
  }
});

// @route   PUT /api/users/:id/profile
// @desc    Mettre à jour le profil de l'utilisateur connecté (nom, prenom - email ne peut pas être modifié)
// @access  Private (Utilisateur peut modifier son propre profil)
router.put('/:id/profile', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, prenom } = req.body;
    
    // Vérifier que l'utilisateur modifie son propre profil
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez modifier que votre propre profil' 
      });
    }
    
    // Validation des données
    if (!nom || !prenom) {
      return res.status(400).json({ 
        error: 'Le nom et le prénom sont requis' 
      });
    }
    
    // Vérifier que l'utilisateur existe
    const existingUsers = await query(
      'SELECT id, email FROM users WHERE id = ?',
      [id]
    );
    
    if (existingUsers.length === 0) {
      return res.status(404).json({ 
        error: 'Utilisateur non trouvé' 
      });
    }
    
    // Mettre à jour le profil (sans l'email)
    await query(
      'UPDATE users SET nom = ?, prenom = ? WHERE id = ?',
      [nom, prenom, id]
    );
    
    console.log('✅ Profile updated:', { userId: id, nom, prenom });
    
    res.json({ 
      message: 'Profil mis à jour avec succès',
      user: {
        id: parseInt(id),
        nom,
        prenom,
        email: existingUsers[0].email
      }
    });
  } catch (error) {
    console.error('Erreur update profile:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la mise à jour du profil' 
    });
  }
});


// @route   PUT /api/users/:id/password
// @desc    Changer le mot de passe de l'utilisateur connecté
// @access  Private (Utilisateur peut modifier son propre mot de passe)
router.put('/:id/password', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Vérifier que l'utilisateur modifie son propre mot de passe
    if (parseInt(id) !== req.user.id) {
      return res.status(403).json({ 
        error: 'Vous ne pouvez modifier que votre propre mot de passe' 
      });
    }
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Le mot de passe actuel et le nouveau mot de passe sont requis' 
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
    
    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Mot de passe actuel incorrect' 
      });
    }
    
    // Hacher le nouveau mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Mettre à jour le mot de passe
    await query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );
    
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Erreur update password:', error);
    res.status(500).json({ 
      error: 'Erreur serveur lors de la modification du mot de passe' 
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


