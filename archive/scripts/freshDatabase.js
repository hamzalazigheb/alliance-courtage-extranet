const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Configuration de connexion
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: 'utf8mb4'
};

const dbName = process.env.DB_NAME || 'alliance_courtage';

// Admin credentials (peut être modifié avant exécution)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alliance-courtage.fr';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const ADMIN_NOM = process.env.ADMIN_NOM || 'Admin';
const ADMIN_PRENOM = process.env.ADMIN_PRENOM || 'Alliance';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Script SQL complet pour créer toutes les tables
const createAllTablesSQL = `
-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  role ENUM('admin', 'broker', 'client') DEFAULT 'broker',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  profile_photo LONGTEXT,
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des actualités
CREATE TABLE IF NOT EXISTS news (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  author_id INT,
  category VARCHAR(100),
  is_published BOOLEAN DEFAULT TRUE,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des produits financiers
CREATE TABLE IF NOT EXISTS financial_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  isin VARCHAR(50),
  nom VARCHAR(255) NOT NULL,
  gestionnaire VARCHAR(255) NOT NULL,
  classe VARCHAR(10),
  pea BOOLEAN DEFAULT FALSE,
  frais VARCHAR(20),
  isr BOOLEAN DEFAULT FALSE,
  esg INT DEFAULT 0,
  volatilite_3ans VARCHAR(20),
  volatilite_5ans VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des performances des produits
CREATE TABLE IF NOT EXISTS product_performances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  year INT NOT NULL,
  performance VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES financial_products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_year (product_id, year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des partenaires
CREATE TABLE IF NOT EXISTS partners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500),
  logo_content LONGTEXT,
  description TEXT,
  website VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des archives
CREATE TABLE IF NOT EXISTS archives (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  category VARCHAR(100),
  year INT,
  uploaded_by INT,
  uploaded_by_prenom VARCHAR(100),
  uploaded_by_nom VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des simulateurs
CREATE TABLE IF NOT EXISTS simulators (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des sessions utilisateur
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sessions_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table CMS Content
CREATE TABLE IF NOT EXISTS cms_content (
  id INT PRIMARY KEY AUTO_INCREMENT,
  page VARCHAR(100) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des produits structurés
CREATE TABLE IF NOT EXISTS structured_products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assurance VARCHAR(255),
  category VARCHAR(100),
  file_path VARCHAR(500),
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des réservations de produits
CREATE TABLE IF NOT EXISTS product_reservations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  user_id INT NOT NULL,
  montant DECIMAL(15, 2) NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_product_id (product_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des assurances
CREATE TABLE IF NOT EXISTS assurances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) UNIQUE NOT NULL,
  montant_enveloppe DECIMAL(15, 2) DEFAULT 0,
  color VARCHAR(50),
  icon VARCHAR(10),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des bordereaux
CREATE TABLE IF NOT EXISTS bordereaux (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  period_month INT,
  period_year INT,
  uploaded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_period (period_year, period_month)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des formations
CREATE TABLE IF NOT EXISTS formations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  category VARCHAR(100),
  user_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des documents financiers
CREATE TABLE IF NOT EXISTS financial_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  year INT,
  file_path VARCHAR(500),
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_category (category),
  INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des demandes de réinitialisation de mot de passe
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  status ENUM('pending', 'completed', 'expired') DEFAULT 'pending',
  completed_by INT,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_token (token),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des dossiers réglementaires
CREATE TABLE IF NOT EXISTS reglementaire_folders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  parent_id INT,
  order_index INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES reglementaire_folders(id) ON DELETE CASCADE,
  INDEX idx_parent_id (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des documents réglementaires
CREATE TABLE IF NOT EXISTS reglementaire_documents (
  id INT PRIMARY KEY AUTO_INCREMENT,
  folder_id INT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500),
  file_content LONGTEXT,
  file_size BIGINT,
  file_type VARCHAR(100),
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (folder_id) REFERENCES reglementaire_folders(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_folder_id (folder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  related_id INT,
  related_type VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des favoris
CREATE TABLE IF NOT EXISTS \`favoris\` (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  item_type VARCHAR(50) NOT NULL COMMENT 'Type: document, product, archive, etc.',
  item_id INT NOT NULL COMMENT 'ID de l element favori',
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url VARCHAR(500),
  metadata TEXT COMMENT 'JSON pour stocker des infos supplémentaires',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_item_type (item_type),
  INDEX idx_item_id (item_id),
  INDEX idx_created_at (created_at),
  UNIQUE KEY unique_user_item (user_id, item_type, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function createFreshDatabase() {
  let connection;
  
  try {
    log('\n🚀 Installation de la Base de Données - Alliance Courtage', 'cyan');
    log('='.repeat(60), 'cyan');
    
    // Connexion sans base de données
    log('\n📡 Connexion à MySQL...', 'blue');
    connection = await mysql.createConnection(config);
    log('✅ Connecté à MySQL', 'green');
    
    // Créer la base de données
    log('\n📦 Création de la base de données...', 'blue');
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    log(`✅ Base de données "${dbName}" créée`, 'green');
    
    // Utiliser la base de données
    await connection.query(`USE \`${dbName}\``);
    log(`✅ Base de données "${dbName}" sélectionnée`, 'green');
    
    // Supprimer toutes les tables existantes (si nécessaire)
    log('\n🗑️  Nettoyage des tables existantes...', 'yellow');
    const [tables] = await connection.query('SHOW TABLES');
    if (tables.length > 0) {
      // Désactiver les checks de foreign keys temporairement
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      
      for (const table of tables) {
        const tableName = Object.values(table)[0];
        await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
      }
      
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      log(`✅ ${tables.length} table(s) supprimée(s)`, 'green');
    } else {
      log('ℹ️  Aucune table existante', 'blue');
    }
    
    // Créer toutes les tables
    log('\n🏗️  Création des tables...', 'blue');
    const statements = createAllTablesSQL.split(';').filter(stmt => stmt.trim());
    let tablesCreated = 0;
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement + ';');
          tablesCreated++;
        } catch (error) {
          log(`⚠️  Erreur lors de la création d'une table: ${error.message}`, 'yellow');
        }
      }
    }
    
    log(`✅ ${tablesCreated} table(s) créée(s)`, 'green');
    
    // Créer l'utilisateur admin
    log('\n👤 Création de l\'utilisateur administrateur...', 'blue');
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    // Insérer l'admin
    await connection.query(
      `INSERT INTO users (email, password, nom, prenom, role, is_active) 
       VALUES (?, ?, ?, ?, 'admin', TRUE)`,
      [ADMIN_EMAIL, hashedPassword, ADMIN_NOM, ADMIN_PRENOM]
    );
    
    log('✅ Utilisateur administrateur créé', 'green');
    
    // Afficher les informations de connexion
    log('\n' + '='.repeat(60), 'cyan');
    log('🎉 Base de données installée avec succès !', 'green');
    log('='.repeat(60), 'cyan');
    log('\n📋 Informations de connexion Admin:', 'blue');
    log(`   📧 Email: ${ADMIN_EMAIL}`, 'cyan');
    log(`   🔑 Mot de passe: ${ADMIN_PASSWORD}`, 'cyan');
    log(`   👤 Nom: ${ADMIN_PRENOM} ${ADMIN_NOM}`, 'cyan');
    log(`   🎭 Rôle: Admin`, 'cyan');
    log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion !', 'yellow');
    log('\n📝 Pour modifier les credentials admin:', 'blue');
    log('   Éditez backend/config.env et relancez ce script', 'blue');
    log('   Variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NOM, ADMIN_PRENOM', 'blue');
    log('\n' + '='.repeat(60) + '\n', 'cyan');
    
  } catch (error) {
    log(`\n❌ Erreur lors de l'installation: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log('✅ Connexion fermée', 'green');
    }
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createFreshDatabase();
}

module.exports = { createFreshDatabase };

