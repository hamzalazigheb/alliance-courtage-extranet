const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

/**
 * Script de réinitialisation d'urgence du mot de passe admin
 * 
 * ⚠️ UTILISATION D'URGENCE SEULEMENT ⚠️
 * 
 * Ce script réinitialise le mot de passe d'un administrateur
 * sans vérification. À utiliser uniquement si tous les admins
 * ont oublié leur mot de passe.
 * 
 * Usage: node backend/scripts/resetAdminPassword.js
 */

async function resetAdminPassword() {
  const adminEmail = 'admin@alliance-courtage.fr';
  const newPassword = 'admin123'; // ⚠️ Changez après connexion !

  try {
    console.log('🔄 Connexion à la base de données...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });

    console.log('✅ Connecté à MySQL');

    // Vérifier si l'admin existe
    console.log(`\n🔍 Vérification de l'existence de l'admin: ${adminEmail}`);
    const [admins] = await connection.query(
      'SELECT id, email, nom, prenom, role FROM users WHERE email = ? AND role = ?',
      [adminEmail, 'admin']
    );

    if (admins.length === 0) {
      console.error('\n❌ ERREUR: Aucun administrateur trouvé avec cet email!');
      console.log('\n📋 Admins disponibles:');
      
      // Lister tous les admins
      const [allAdmins] = await connection.query(
        'SELECT id, email, nom, prenom FROM users WHERE role = ?',
        ['admin']
      );
      
      if (allAdmins.length > 0) {
        allAdmins.forEach(admin => {
          console.log(`  - ${admin.email} (${admin.prenom} ${admin.nom})`);
        });
        console.log('\n💡 Modifiez la variable adminEmail dans ce script pour utiliser un autre email');
      } else {
        console.log('  Aucun admin trouvé dans la base de données!');
      }
      
      await connection.end();
      process.exit(1);
    }

    const admin = admins[0];
    console.log(`✅ Admin trouvé: ${admin.prenom} ${admin.nom} (ID: ${admin.id})`);

    // Hacher le nouveau mot de passe
    console.log('\n🔐 Hachage du nouveau mot de passe...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe
    console.log('🔄 Réinitialisation du mot de passe...');
    const [result] = await connection.query(
      'UPDATE users SET password = ? WHERE email = ? AND role = ?',
      [hashedPassword, adminEmail, 'admin']
    );

    if (result.affectedRows === 0) {
      console.error('❌ ERREUR: Aucune ligne mise à jour!');
      await connection.end();
      process.exit(1);
    }

    // Afficher les informations de connexion
    console.log('\n' + '='.repeat(60));
    console.log('✅ MOT DE PASSE ADMIN RÉINITIALISÉ AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log('\n📧 Email:     ' + adminEmail);
    console.log('🔑 Mot de passe: ' + newPassword);
    console.log('👤 Utilisateur:   ' + admin.prenom + ' ' + admin.nom);
    console.log('\n' + '='.repeat(60));
    console.log('\n🔐 Vous pouvez maintenant vous connecter avec ces identifiants');
    console.log('\n⚠️  ⚠️  ⚠️  IMPORTANT ⚠️  ⚠️  ⚠️');
    console.log('Changez immédiatement le mot de passe après connexion!');
    console.log('Dans /manage → Utilisateurs → Modifier votre profil');
    console.log('\n📖 Pour plus d\'informations, consultez:');
    console.log('   ADMIN_PASSWORD_RECOVERY.md');
    console.log('\n' + '='.repeat(60));

    await connection.end();
    console.log('\n✅ Opération terminée');
    
  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('\n💡 Vérifications à effectuer:');
    console.error('   1. La base de données est-elle accessible?');
    console.error('   2. Les variables d\'environnement sont-elles correctes?');
    console.error('   3. Le fichier config.env existe-t-il?');
    console.error('\n📖 Consultez ADMIN_PASSWORD_RECOVERY.md pour plus d\'aide');
    process.exit(1);
  }
}

// Afficher un avertissement avant exécution
console.log('\n' + '⚠️'.repeat(30));
console.log('SCRIPT DE RÉINITIALISATION D\'URGENCE');
console.log('⚠️'.repeat(30));
console.log('\nCe script va réinitialiser le mot de passe admin SANS vérification.');
console.log('À utiliser uniquement en cas d\'urgence absolue.\n');

resetAdminPassword();



