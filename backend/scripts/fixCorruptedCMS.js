const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la base de données (identique aux autres scripts)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alliance_courtage'
};

async function fixCorruptedCMS() {
  let connection;
  
  try {
    console.log('🔧 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connecté à la base de données\n');

    // Récupérer toutes les entrées CMS
    const [rows] = await connection.execute(
      'SELECT id, page, content FROM cms_content WHERE page IN (?, ?)',
      ['rencontres', 'gamme-financiere']
    );

    console.log(`📋 Trouvé ${rows.length} entrée(s) CMS à vérifier\n`);

    for (const row of rows) {
      console.log(`\n🔍 Vérification de: ${row.page}`);
      
      let content = row.content;
      let parsedContent = null;
      let needsFix = false;

      // Essayer de parser le JSON
      try {
        if (typeof content === 'string') {
          parsedContent = JSON.parse(content);
        } else {
          parsedContent = content;
        }
        
        // Vérifier si c'est encore une string (double-stringified)
        if (typeof parsedContent === 'string') {
          parsedContent = JSON.parse(parsedContent);
        }
        
        console.log(`  ✅ JSON valide pour ${row.page}`);
        
        // Vérifier si headerImage est très long (probablement corrompu)
        if (parsedContent.headerImage && parsedContent.headerImage.length > 50000) {
          console.log(`  ⚠️  Image très longue détectée (${parsedContent.headerImage.length} caractères)`);
          needsFix = true;
        }
      } catch (parseError) {
        console.log(`  ❌ JSON corrompu détecté: ${parseError.message}`);
        needsFix = true;
      }

      // Réparer si nécessaire
      if (needsFix) {
        console.log(`  🔧 Réparation de ${row.page}...`);
        
        let defaultContent;
        
        if (row.page === 'rencontres') {
          defaultContent = {
            title: 'RENCONTRES',
            subtitle: 'Espace dédié aux rencontres et échanges de la communauté Alliance Courtage',
            headerImage: '',
            introText: '',
            upcomingMeetings: [],
            historicalMeetings: []
          };
        } else if (row.page === 'gamme-financiere') {
          defaultContent = {
            title: 'Gamme Financière',
            subtitle: 'Découvrez notre sélection de produits financiers',
            description: '',
            headerImage: ''
          };
        } else {
          continue;
        }

        // Essayer de préserver les données valides si possible
        try {
          if (parsedContent && typeof parsedContent === 'object') {
            // Préserver les champs valides
            if (parsedContent.title && parsedContent.title.length < 500) {
              defaultContent.title = parsedContent.title;
            }
            if (parsedContent.subtitle && parsedContent.subtitle.length < 500) {
              defaultContent.subtitle = parsedContent.subtitle;
            }
            if (parsedContent.description && parsedContent.description.length < 5000) {
              defaultContent.description = parsedContent.description;
            }
            if (parsedContent.introText && parsedContent.introText.length < 5000) {
              defaultContent.introText = parsedContent.introText;
            }
            
            // Préserver l'image seulement si elle est valide (pas trop longue)
            if (parsedContent.headerImage && 
                parsedContent.headerImage.length > 0 && 
                parsedContent.headerImage.length < 50000 &&
                parsedContent.headerImage.startsWith('data:image')) {
              defaultContent.headerImage = parsedContent.headerImage;
            }
            
            // Préserver les arrays si valides
            if (row.page === 'rencontres') {
              if (Array.isArray(parsedContent.upcomingMeetings)) {
                defaultContent.upcomingMeetings = parsedContent.upcomingMeetings.filter(m => 
                  m && typeof m === 'object' && m.title && m.title.length < 500
                );
              }
              if (Array.isArray(parsedContent.historicalMeetings)) {
                defaultContent.historicalMeetings = parsedContent.historicalMeetings.filter(m => 
                  m && typeof m === 'object' && m.title && m.title.length < 500
                );
              }
            }
          }
        } catch (preserveError) {
          console.log(`  ⚠️  Impossible de préserver les données, utilisation des valeurs par défaut`);
        }

        // Sauvegarder le contenu réparé
        const fixedContent = JSON.stringify(defaultContent);
        
        await connection.execute(
          'UPDATE cms_content SET content = ?, updated_at = NOW() WHERE id = ?',
          [fixedContent, row.id]
        );
        
        console.log(`  ✅ ${row.page} réparé avec succès`);
        console.log(`     - Titre: ${defaultContent.title}`);
        console.log(`     - Image: ${defaultContent.headerImage ? 'présente (' + defaultContent.headerImage.length + ' caractères)' : 'vide'}`);
      }
    }

    console.log('\n✅ Toutes les vérifications terminées!\n');
    
    // Afficher un résumé
    const [finalRows] = await connection.execute(
      'SELECT page, LENGTH(content) as content_length FROM cms_content WHERE page IN (?, ?)',
      ['rencontres', 'gamme-financiere']
    );
    
    console.log('📊 Résumé final:');
    for (const finalRow of finalRows) {
      console.log(`   - ${finalRow.page}: ${finalRow.content_length} caractères`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

// Exécuter le script
fixCorruptedCMS();

