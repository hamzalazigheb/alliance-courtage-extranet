-- Script d'initialisation MySQL pour Docker
-- Ce script sera exécuté automatiquement lors du premier démarrage du conteneur MySQL

-- Créer la base de données (déjà créée par les variables d'environnement)
USE alliance_courtage;

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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
);

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
);

-- Table des performances des produits
CREATE TABLE IF NOT EXISTS product_performances (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  year INT NOT NULL,
  performance VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES financial_products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_product_year (product_id, year)
);

-- Table des partenaires
CREATE TABLE IF NOT EXISTS partners (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nom VARCHAR(255) NOT NULL,
  logo_url VARCHAR(500),
  description TEXT,
  website VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table des archives
CREATE TABLE IF NOT EXISTS archives (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_path VARCHAR(500) NOT NULL,
  file_size INT,
  file_type VARCHAR(50),
  category VARCHAR(100),
  year INT,
  uploaded_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

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
);

-- Table des sessions utilisateur
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_news_published ON news(is_published, published_at);
CREATE INDEX idx_products_class ON financial_products(classe);
CREATE INDEX idx_partners_category ON partners(category);
CREATE INDEX idx_archives_category ON archives(category);
CREATE INDEX idx_sessions_token ON user_sessions(token);

-- Données de test
INSERT IGNORE INTO users (email, password, nom, prenom, role) VALUES 
('admin@alliance-courtage.fr', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Alliance', 'admin');

INSERT IGNORE INTO news (title, content, excerpt, author_id, category) VALUES 
('Nouvelle réglementation assurance', 'Contenu de l\'actualité sur la nouvelle réglementation...', 'Résumé de l\'actualité', 1, 'Réglementaire'),
('Tendances du marché 2024', 'Analyse des tendances du marché financier...', 'Analyse des tendances', 1, 'Marché'),
('Formation des courtiers', 'Nouvelle session de formation disponible...', 'Formation disponible', 1, 'Formation');

INSERT IGNORE INTO partners (nom, description, category) VALUES 
('Swiss Life', 'Assureur leader en France', 'Assurance'),
('Cardif', 'Spécialiste de l\'épargne', 'Épargne'),
('MMA', 'Mutuelle d\'assurance', 'Mutuelle'),
('Abeille Vie', 'Assureur vie', 'Assurance Vie');

INSERT IGNORE INTO simulators (nom, description, category) VALUES 
('Simulateur de Prêt', 'Calcul des mensualités de prêt', 'Prêt'),
('Simulateur d\'Épargne', 'Projection d\'épargne', 'Épargne'),
('Simulateur de Retraite', 'Calcul de la retraite', 'Retraite');






