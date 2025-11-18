const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Charger la configuration
function loadConfig() {
  const configPath = path.join(__dirname, '..', 'config.env');
  const config = {};
  
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          config[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
  }
  
  return config;
}

async function checkTableExists(connection, tableName) {
  try {
    const [rows] = await connection.execute(
      `SELECT COUNT(*) as count FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
      ['alliance_courtage', tableName]
    );
    return rows[0].count > 0;
  } catch (error) {
    return false;
  }
}

async function createPartnerContactsTable(connection) {
  try {
    const exists = await checkTableExists(connection, 'partner_contacts');
    if (exists) {
      console.log('✅ Table partner_contacts existe déjà');
      return true;
    }
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS partner_contacts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        partner_id INT NOT NULL,
        fonction VARCHAR(100) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        telephone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
        INDEX idx_partner_id (partner_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Table partner_contacts créée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur création partner_contacts:', error.message);
    return false;
  }
}

async function createPartnerDocumentsTable(connection) {
  try {
    const exists = await checkTableExists(connection, 'partner_documents');
    if (exists) {
      console.log('✅ Table partner_documents existe déjà');
      return true;
    }
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS partner_documents (
        id INT PRIMARY KEY AUTO_INCREMENT,
        partner_id INT NOT NULL,
        title VARCHAR(255) NOT NULL COMMENT 'Titre du document (ex: Convention de distribution)',
        description TEXT COMMENT 'Description optionnelle',
        file_path VARCHAR(500) COMMENT 'Chemin du fichier (ancien système)',
        file_content LONGTEXT COMMENT 'Contenu du fichier en base64',
        file_size BIGINT COMMENT 'Taille du fichier en octets',
        file_type VARCHAR(100) COMMENT 'Type MIME du fichier',
        document_type VARCHAR(100) COMMENT 'Type de document: convention, brochure, autre',
        uploaded_by INT COMMENT 'ID utilisateur qui a uploade',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_partner_id (partner_id),
        INDEX idx_document_type (document_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ Table partner_documents créée avec succès');
    return true;
  } catch (error) {
    console.error('❌ Erreur création partner_documents:', error.message);
    return false;
  }
}

async function main() {
  const config = loadConfig();
  
  console.log('🔄 Migration de la base de données de production');
  console.log('='.repeat(80));
  console.log('');
  
  // Configuration de connexion
  const dbConfig = {
    host: process.env.DB_HOST || config.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || config.DB_PORT || '3306'),
    user: process.env.DB_USER || config.DB_USER || 'root',
    password: process.env.DB_PASSWORD || config.DB_PASSWORD || '',
    database: process.env.DB_NAME || config.DB_NAME || 'alliance_courtage'
  };
  
  console.log('📡 Connexion à la base de données...');
  console.log(`   Host: ${dbConfig.host}:${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log('');
  
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connecté à la base de données');
    console.log('');
    
    // Vérifier les tables existantes
    console.log('🔍 Vérification des tables existantes...');
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    console.log(`   ${tableNames.length} tables trouvées`);
    console.log('');
    
    // Vérifier si les nouvelles tables existent
    const hasContacts = tableNames.includes('partner_contacts');
    const hasDocuments = tableNames.includes('partner_documents');
    
    console.log('📊 État des nouvelles tables:');
    console.log(`   partner_contacts: ${hasContacts ? '✅ Existe' : '❌ Manquante'}`);
    console.log(`   partner_documents: ${hasDocuments ? '✅ Existe' : '❌ Manquante'}`);
    console.log('');
    
    if (hasContacts && hasDocuments) {
      console.log('✅ Toutes les tables nécessaires existent déjà!');
      console.log('   Aucune migration nécessaire.');
      await connection.end();
      return;
    }
    
    console.log('🚀 Création des tables manquantes...');
    console.log('');
    
    // Créer les tables manquantes
    let success = true;
    
    if (!hasContacts) {
      console.log('📝 Création de partner_contacts...');
      success = await createPartnerContactsTable(connection) && success;
    }
    
    if (!hasDocuments) {
      console.log('📝 Création de partner_documents...');
      success = await createPartnerDocumentsTable(connection) && success;
    }
    
    console.log('');
    
    if (success) {
      console.log('✅ Migration terminée avec succès!');
      console.log('');
      console.log('📋 Tables créées:');
      if (!hasContacts) console.log('   ✅ partner_contacts');
      if (!hasDocuments) console.log('   ✅ partner_documents');
    } else {
      console.log('⚠️  Migration terminée avec des erreurs');
      console.log('   Vérifiez les messages ci-dessus');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
    if (error.sqlMessage) {
      console.error('   SQL:', error.sqlMessage);
    }
    if (connection) await connection.end();
    process.exit(1);
  }
}

main().catch(console.error);


