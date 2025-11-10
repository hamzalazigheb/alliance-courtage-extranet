const { query } = require('../config/database');

async function testUserColumns() {
  try {
    console.log('🔍 Test des colonnes utilisateur...\n');
    
    // 1. Vérifier que les colonnes existent
    console.log('1️⃣ Vérification des colonnes...');
    const columns = await query(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'users' 
       AND COLUMN_NAME IN ('denomination_sociale', 'telephone', 'code_postal')
       ORDER BY ORDINAL_POSITION`
    );
    
    if (columns.length === 0) {
      console.log('❌ Aucune colonne trouvée !');
      console.log('   Exécutez: node scripts/addAllUserColumns.js');
      process.exit(1);
    }
    
    console.log('✅ Colonnes trouvées:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // 2. Récupérer quelques utilisateurs avec ces colonnes
    console.log('\n2️⃣ Récupération des utilisateurs...');
    const users = await query(
      `SELECT id, nom, prenom, email, denomination_sociale, telephone, code_postal 
       FROM users 
       ORDER BY id DESC 
       LIMIT 5`
    );
    
    console.log(`✅ ${users.length} utilisateur(s) récupéré(s):\n`);
    users.forEach((user, index) => {
      console.log(`Utilisateur #${index + 1} (ID: ${user.id}):`);
      console.log(`   Nom: ${user.nom} ${user.prenom}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Dénomination sociale: ${user.denomination_sociale || '(vide/null)'}`);
      console.log(`   Téléphone: ${user.telephone || '(vide/null)'}`);
      console.log(`   Code postal: ${user.code_postal || '(vide/null)'}`);
      console.log('');
    });
    
    // 3. Vérifier si des utilisateurs ont des valeurs dans ces colonnes
    console.log('3️⃣ Statistiques...');
    const stats = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(denomination_sociale) as avec_denomination,
        COUNT(telephone) as avec_telephone,
        COUNT(code_postal) as avec_code_postal
       FROM users`
    );
    
    const stat = stats[0];
    console.log(`   Total utilisateurs: ${stat.total}`);
    console.log(`   Avec dénomination sociale: ${stat.avec_denomination}`);
    console.log(`   Avec téléphone: ${stat.avec_telephone}`);
    console.log(`   Avec code postal: ${stat.avec_code_postal}`);
    
    console.log('\n✅ Test terminé !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Détails:', error.message);
    process.exit(1);
  }
}

testUserColumns();

