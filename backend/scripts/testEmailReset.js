/**
 * Script de test pour la réinitialisation de mot de passe avec email
 * 
 * Usage: node backend/scripts/testEmailReset.js [email]
 * Exemple: node backend/scripts/testEmailReset.js admin@alliance-courtage.fr
 */

require('dotenv').config({ path: './config.env' });
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { sendPasswordResetEmail } = require('../services/emailService');

async function testEmailReset() {
  const email = process.argv[2] || 'admin@alliance-courtage.fr';
  
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST DE RÉINITIALISATION EMAIL');
  console.log('='.repeat(60));
  console.log(`📧 Email à tester: ${email}\n`);

  try {
    // 1. Vérifier la connexion à la base de données
    console.log('🔄 Étape 1: Vérification de la connexion à la base de données...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage',
      charset: 'utf8mb4'
    });
    console.log('✅ Connecté à la base de données\n');

    // 2. Vérifier que l'utilisateur existe et est admin
    console.log('🔄 Étape 2: Vérification de l\'utilisateur...');
    const [users] = await connection.query(
      'SELECT id, email, nom, prenom, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      console.error('❌ ERREUR: Aucun utilisateur trouvé avec cet email!');
      await connection.end();
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Utilisateur trouvé: ${user.prenom} ${user.nom}`);
    
    if (user.role !== 'admin') {
      console.warn(`⚠️  ATTENTION: Cet utilisateur n'est pas un admin (role: ${user.role})`);
      console.warn('   La route /api/admin-password-reset fonctionne uniquement pour les admins\n');
    } else {
      console.log('✅ Utilisateur est un admin\n');
    }

    // 3. Générer un mot de passe de test
    console.log('🔄 Étape 3: Génération d\'un mot de passe de test...');
    const testPassword = 'TestPassword123!@#';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    console.log(`✅ Mot de passe généré: ${testPassword}\n`);

    // 4. Vérifier la configuration SMTP
    console.log('🔄 Étape 4: Vérification de la configuration SMTP...');
    console.log('   SMTP_HOST:', process.env.SMTP_HOST || '⚠️ Non configuré');
    console.log('   SMTP_PORT:', process.env.SMTP_PORT || '⚠️ Non configuré');
    console.log('   SMTP_USER:', process.env.SMTP_USER ? '✅ Configuré' : '⚠️ Non configuré');
    console.log('   SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Configuré' : '⚠️ Non configuré');
    console.log('   SMTP_FROM:', process.env.SMTP_FROM || process.env.SMTP_USER || '⚠️ Non configuré');
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('\n⚠️  ATTENTION: SMTP non configuré. Le système utilisera un transporteur de test.');
      console.warn('   Les emails seront affichés dans la console mais ne seront pas réellement envoyés.\n');
    } else {
      console.log('\n✅ Configuration SMTP détectée\n');
    }

    // 5. Test d'envoi d'email
    console.log('🔄 Étape 5: Test d\'envoi d\'email...');
    try {
      const userName = `${user.prenom} ${user.nom}`;
      const result = await sendPasswordResetEmail(email, testPassword, userName);
      
      console.log('✅ Email envoyé avec succès!');
      console.log('   Message ID:', result.messageId);
      
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.log('\n📋 Email de test (affiché dans la console en mode dev)');
        console.log('   Vérifiez les logs du serveur pour voir le contenu de l\'email\n');
      } else {
        console.log(`\n📧 Vérifiez votre boîte de réception: ${email}`);
        console.log('   N\'oubliez pas de vérifier aussi les spams!\n');
      }
    } catch (emailError) {
      console.error('❌ ERREUR lors de l\'envoi de l\'email:');
      console.error('   ', emailError.message);
      console.error('\n💡 Solutions possibles:');
      console.error('   1. Vérifiez vos credentials SMTP');
      console.error('   2. Pour Gmail, utilisez un mot de passe d\'application');
      console.error('   3. Vérifiez les paramètres de pare-feu');
      await connection.end();
      process.exit(1);
    }

    // 6. Test de l'API complète (optionnel - nécessite le serveur en cours d'exécution)
    console.log('\n🔄 Étape 6: Test de l\'API complète (optionnel)...');
    console.log('   Pour tester l\'API complète:');
    console.log('   1. Démarrez le serveur backend: npm start');
    console.log('   2. Allez sur http://localhost:5173');
    console.log('   3. Cliquez sur "Mot de passe oublié ?"');
    console.log(`   4. Entrez l'email: ${email}`);
    console.log('   5. Vérifiez votre boîte de réception\n');

    await connection.end();

    console.log('='.repeat(60));
    console.log('✅ TEST TERMINÉ AVEC SUCCÈS!');
    console.log('='.repeat(60));
    console.log('\n📝 Résumé:');
    console.log(`   ✅ Utilisateur: ${user.prenom} ${user.nom} (${email})`);
    console.log(`   ✅ Rôle: ${user.role}`);
    console.log(`   ✅ Email testé: ${email}`);
    console.log(`   ✅ Mot de passe test: ${testPassword}`);
    console.log('\n⚠️  NOTE: Le mot de passe n\'a PAS été modifié dans la base.');
    console.log('   Ce script teste uniquement l\'envoi d\'email.\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('\n💡 Vérifications:');
    console.error('   1. La base de données est-elle accessible?');
    console.error('   2. Le fichier config.env existe-t-il?');
    console.error('   3. Les variables d\'environnement sont-elles correctes?');
    process.exit(1);
  }
}

// Lancer le test
testEmailReset();

