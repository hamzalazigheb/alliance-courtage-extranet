const nodemailer = require('nodemailer');
require('dotenv').config({ path: './config.env' });

async function testMailtrap() {
  console.log('🧪 Test de configuration Mailtrap');
  console.log('='.repeat(70));

  // Afficher la configuration
  console.log('\n📋 Configuration SMTP:');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || '⚠️ Non configuré');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || '⚠️ Non configuré');
  console.log('   SMTP_SECURE:', process.env.SMTP_SECURE || '⚠️ Non configuré');
  console.log('   SMTP_USER:', process.env.SMTP_USER ? '✅ Configuré (' + process.env.SMTP_USER + ')' : '❌ Non configuré');
  console.log('   SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Configuré (****)' : '❌ Non configuré');
  console.log('   SMTP_FROM:', process.env.SMTP_FROM || '⚠️ Non configuré');
  console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || '⚠️ Non configuré');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('\n❌ ERREUR: SMTP_USER ou SMTP_PASSWORD non configuré!');
    console.error('   Vérifiez que config.env contient ces variables.');
    process.exit(1);
  }

  // Créer le transporteur
  console.log('\n📧 Création du transporteur SMTP...');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_SECURE === '1',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Tester la connexion
  console.log('\n🔌 Test de connexion à Mailtrap...');
  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie!');
  } catch (error) {
    console.error('❌ Erreur de connexion SMTP:', error.message);
    console.error('   Code:', error.code);
    console.error('   Response:', error.response);
    process.exit(1);
  }

  // Envoyer un email de test
  console.log('\n📤 Envoi d\'un email de test...');
  const testEmail = 'test@example.com'; // Email de test (sera capturé par Mailtrap)
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: '🧪 Test Mailtrap - Alliance Courtage',
      html: `
        <h1>Test Mailtrap</h1>
        <p>Cet email est un test de configuration Mailtrap.</p>
        <p>Si vous voyez cet email dans votre inbox Mailtrap, la configuration est correcte!</p>
        <p><strong>Date:</strong> ${new Date().toISOString()}</p>
      `,
      text: `
        Test Mailtrap
        
        Cet email est un test de configuration Mailtrap.
        Si vous voyez cet email dans votre inbox Mailtrap, la configuration est correcte!
        
        Date: ${new Date().toISOString()}
      `
    });

    console.log('✅ Email envoyé avec succès!');
    console.log('   Message ID:', info.messageId);
    console.log('   Accepted:', info.accepted);
    console.log('   Rejected:', info.rejected);
    
    console.log('\n✅ Test réussi!');
    console.log('📬 Vérifiez votre inbox Mailtrap: https://mailtrap.io');
    console.log('   Vous devriez voir l\'email "🧪 Test Mailtrap - Alliance Courtage"');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi:', error.message);
    console.error('   Code:', error.code);
    console.error('   Response:', error.response);
    process.exit(1);
  }
}

testMailtrap().catch(console.error);

