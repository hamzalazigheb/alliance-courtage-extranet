const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addReglementaireTables() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');

    // Créer la table reglementaire_folders
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reglementaire_folders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL COMMENT 'Titre du dossier (ex: "0. CLIENTS")',
        display_order INT DEFAULT 0 COMMENT 'Ordre d''affichage',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order (display_order),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table reglementaire_folders created');

    // Créer la table reglementaire_documents
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reglementaire_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        folder_id INT NOT NULL,
        name VARCHAR(255) NOT NULL COMMENT 'Nom du document',
        document_date VARCHAR(50) COMMENT 'Date du document (format: DD/MM/YYYY)',
        document_type VARCHAR(100) COMMENT 'Type de document (Procédure, Guide, Modèle, etc.)',
        file_content LONGTEXT COMMENT 'Contenu du fichier en base64',
        file_path VARCHAR(500) NULL COMMENT 'Chemin du fichier (pour fichiers anciens)',
        file_size BIGINT COMMENT 'Taille du fichier en bytes',
        file_type VARCHAR(100) COMMENT 'Type MIME du fichier',
        display_order INT DEFAULT 0 COMMENT 'Ordre d''affichage dans le dossier',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (folder_id) REFERENCES reglementaire_folders(id) ON DELETE CASCADE,
        INDEX idx_folder (folder_id),
        INDEX idx_order (display_order),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table reglementaire_documents created');

    // Migrer les données existantes depuis le code statique
    console.log('\n📦 Migrating existing data...');
    
    const existingFolders = [
      { title: "0. CLIENTS", order: 0 },
      { title: "1. CONFLITS D'INTÉRÊT", order: 1 },
      { title: "2. CONTRÔLE ET LUTTE CONTRE LA FRAUDE", order: 2 },
      { title: "3. DISTRIBUTION", order: 3 },
      { title: "4. GOUVERNANCE", order: 4 },
      { title: "5. LCB-FT", order: 5 },
      { title: "6. PCA", order: 6 },
      { title: "7. PRÉSENTATION DU CABINET", order: 7 },
      { title: "8. RGPD", order: 8 },
      { title: "9. TRAITEMENT DES RÉCLAMATIONS", order: 9 }
    ];

    const existingDocuments = [
      // 0. CLIENTS
      { folder: 0, name: "Procedure_kit_reglementaire_clients_assurance", date: "15/01/2024", type: "Procédure" },
      { folder: 0, name: "Parcours client - Assurance vie", date: "12/01/2024", type: "Guide" },
      { folder: 0, name: "Parcours client - Assurance non-vie", date: "10/01/2024", type: "Guide" },
      { folder: 0, name: "Questionnaire client type", date: "08/01/2024", type: "Modèle" },
      // 1. CONFLITS D'INTÉRÊT
      { folder: 1, name: "Procédure de prévention et gestion des Conflits d'intérêts", date: "10/07/2020", type: "Procédure" },
      { folder: 1, name: "Déclaration de conflit d'intérêt", date: "05/01/2024", type: "Modèle" },
      { folder: 1, name: "Registre des conflits d'intérêt", date: "03/01/2024", type: "Modèle" },
      // 2. CONTRÔLE ET LUTTE CONTRE LA FRAUDE
      { folder: 2, name: "Procédure de détection de fraude", date: "20/01/2024", type: "Procédure" },
      { folder: 2, name: "Signalement suspicion de fraude", date: "18/01/2024", type: "Modèle" },
      { folder: 2, name: "Checklist vigilance anti-fraude", date: "15/01/2024", type: "Checklist" },
      // 3. DISTRIBUTION
      { folder: 3, name: "Procédure de distribution des produits", date: "22/01/2024", type: "Procédure" },
      { folder: 3, name: "Convention de distribution type", date: "20/01/2024", type: "Modèle" },
      { folder: 3, name: "Guide des bonnes pratiques distribution", date: "18/01/2024", type: "Guide" },
      // 4. GOUVERNANCE
      { folder: 4, name: "Organigramme de gouvernance", date: "25/01/2024", type: "Organigramme" },
      { folder: 4, name: "Procédure de prise de décision", date: "23/01/2024", type: "Procédure" },
      { folder: 4, name: "Règlement intérieur", date: "21/01/2024", type: "Règlement" },
      // 5. LCB-FT
      { folder: 5, name: "Procédure - LAB-FT (MAJ 13 11 2020)", date: "10/07/2020", type: "Procédure" },
      { folder: 5, name: "Questionnaire Risques LCB-FT (MAJ 13 11 2020)", date: "10/07/2020", type: "Questionnaire" },
      { folder: 5, name: "Note Veille Courtiers - Application du gel des avoirs", date: "10/07/2020", type: "Note" },
      // 6. PCA
      { folder: 6, name: "Plan de Continuité d'Activité", date: "28/01/2024", type: "Plan" },
      { folder: 6, name: "Procédure de crise", date: "26/01/2024", type: "Procédure" },
      { folder: 6, name: "Test PCA annuel", date: "24/01/2024", type: "Modèle" },
      // 7. PRÉSENTATION DU CABINET
      { folder: 7, name: "Note mentions légales obligatoires IAS (08 11 2019)", date: "10/07/2020", type: "Note" },
      { folder: 7, name: "Présentation cabinet type", date: "30/01/2024", type: "Présentation" },
      { folder: 7, name: "Brochure commerciale", date: "28/01/2024", type: "Brochure" },
      // 8. RGPD
      { folder: 8, name: "Procédure RGPD cabinet", date: "02/02/2024", type: "Procédure" },
      { folder: 8, name: "Registre des traitements", date: "31/01/2024", type: "Modèle" },
      { folder: 8, name: "Formulaire consentement client", date: "29/01/2024", type: "Modèle" },
      // 9. TRAITEMENT DES RÉCLAMATIONS
      { folder: 9, name: "Procédure de traitement des réclamations", date: "05/02/2024", type: "Procédure" },
      { folder: 9, name: "Registre des réclamations", date: "03/02/2024", type: "Modèle" },
      { folder: 9, name: "Modèle de réponse réclamation", date: "01/02/2024", type: "Modèle" }
    ];

    // Vérifier si des dossiers existent déjà
    const [existingFoldersCheck] = await connection.query('SELECT COUNT(*) as count FROM reglementaire_folders');
    
    if (existingFoldersCheck[0].count === 0) {
      // Insérer les dossiers
      for (const folder of existingFolders) {
        await connection.query(
          'INSERT INTO reglementaire_folders (title, display_order) VALUES (?, ?)',
          [folder.title, folder.order]
        );
      }
      console.log(`✅ Inserted ${existingFolders.length} folders`);
      
      // Récupérer les IDs des dossiers insérés
      const [insertedFolders] = await connection.query('SELECT id, display_order FROM reglementaire_folders ORDER BY display_order');
      
      // Insérer les documents
      for (const doc of existingDocuments) {
        const folderId = insertedFolders[doc.folder].id;
        await connection.query(
          'INSERT INTO reglementaire_documents (folder_id, name, document_date, document_type, display_order) VALUES (?, ?, ?, ?, ?)',
          [folderId, doc.name, doc.date, doc.type, doc.folder * 10 + existingDocuments.filter(d => d.folder === doc.folder).indexOf(doc)]
        );
      }
      console.log(`✅ Inserted ${existingDocuments.length} documents`);
    } else {
      console.log('ℹ️ Folders already exist, skipping data migration');
    }

    await connection.end();
    console.log('\n✅ Database migration completed successfully');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

addReglementaireTables();

