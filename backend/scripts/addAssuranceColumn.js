const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

async function addAssuranceColumn() {
  let connection;
  
  try {
    // Connexion à la base de données
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage'
    });

    console.log('✅ Connexion à la base de données réussie');

    // Vérifier si la colonne assurance existe déjà
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'archives' AND COLUMN_NAME = 'assurance'
    `, [process.env.DB_NAME || 'alliance_courtage']);

    if (columns.length === 0) {
      // Ajouter la colonne assurance
      await connection.execute(`
        ALTER TABLE archives 
        ADD COLUMN assurance VARCHAR(100) DEFAULT NULL
      `);
      console.log('✅ Colonne "assurance" ajoutée à la table archives');
    } else {
      console.log('ℹ️  Colonne "assurance" existe déjà');
    }

    // Insérer quelques données de test pour les produits structurés
    const testProducts = [
      {
        title: 'Stratégie Patrimoine S Total Dividende',
        description: 'Produit structuré avec sous-jacent Euro Stoxx 50',
        assurance: 'SwissLife',
        category: 'Épargne',
        file_path: './uploads/test_swisslife.pdf',
        file_size: 245760,
        file_type: 'application/pdf',
        uploaded_by: 1
      },
      {
        title: 'Stratégie Patrimoine S Taux Mai 2025',
        description: 'Produit structuré avec coupon 3% annuel',
        assurance: 'CARDIF',
        category: 'Épargne',
        file_path: './uploads/test_cardif.pdf',
        file_size: 189440,
        file_type: 'application/pdf',
        uploaded_by: 1
      },
      {
        title: 'Stratégie Patrimoine S Dividende Avril 2025',
        description: 'Produit structuré avec sous-jacent CAC 40',
        assurance: 'Abeille Assurances',
        category: 'Retraite',
        file_path: './uploads/test_abeille.pdf',
        file_size: 312320,
        file_type: 'application/pdf',
        uploaded_by: 1
      }
    ];

    // Vérifier si des produits structurés existent déjà
    const [existingProducts] = await connection.execute(`
      SELECT COUNT(*) as count FROM archives WHERE assurance IS NOT NULL
    `);

    if (existingProducts[0].count === 0) {
      console.log('📝 Insertion des produits structurés de test...');
      
      for (const product of testProducts) {
        await connection.execute(`
          INSERT INTO archives 
          (title, description, assurance, category, file_path, file_size, file_type, uploaded_by, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          product.title,
          product.description,
          product.assurance,
          product.category,
          product.file_path,
          product.file_size,
          product.file_type,
          product.uploaded_by
        ]);
      }
      
      console.log('✅ Produits structurés de test insérés');
    } else {
      console.log('ℹ️  Des produits structurés existent déjà');
    }

    // Vérifier les données
    const [products] = await connection.execute(`
      SELECT a.*, u.nom as uploaded_by_nom, u.prenom as uploaded_by_prenom
      FROM archives a
      LEFT JOIN users u ON a.uploaded_by = u.id
      WHERE a.assurance IS NOT NULL
      ORDER BY a.created_at DESC
    `);

    console.log(`📊 ${products.length} produits structurés trouvés:`);
    products.forEach(product => {
      console.log(`  - ${product.title} (${product.assurance})`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le script
addAssuranceColumn();

