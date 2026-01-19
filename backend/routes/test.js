const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage',
  charset: 'utf8mb4'
};

// Route pour réinitialiser l'utilisateur de test pour les tests de première connexion
router.post('/reset-user-first-login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }
    
    const connection = await mysql.createConnection(config);
    
    // Vérifier si la colonne must_change_password existe
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME = 'must_change_password'`,
      [config.database]
    );
    
    const hasMustChangePassword = columns.length > 0;
    
    if (hasMustChangePassword) {
      await connection.query(
        'UPDATE users SET must_change_password = TRUE WHERE email = ?',
        [email]
      );
    }
    
    await connection.end();
    
    res.json({ success: true, message: 'Utilisateur réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

module.exports = router;

