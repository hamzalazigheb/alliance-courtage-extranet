const db = require('./config/database');

async function fixFileTypeColumns() {
  const tables = [
    'archives',
    'financial_documents',
    'bordereaux',
    'formations',
    'partner_documents',
    'reglementaire_documents'
  ];

  for (const table of tables) {
    try {
      await db.query(`ALTER TABLE ${table} MODIFY COLUMN file_type VARCHAR(255)`);
      console.log(`✅ ${table}.file_type -> VARCHAR(255)`);
    } catch (e) {
      if (e.code === 'ER_NO_SUCH_TABLE') {
        console.log(`⚠️ Table ${table} n'existe pas`);
      } else if (e.code === 'ER_BAD_FIELD_ERROR') {
        console.log(`⚠️ Colonne file_type n'existe pas dans ${table}`);
      } else {
        console.log(`❌ Erreur ${table}: ${e.message}`);
      }
    }
  }

  console.log('\n✅ Terminé!');
  process.exit(0);
}

fixFileTypeColumns();




