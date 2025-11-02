const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Charger config.env directement depuis le fichier
function loadConfigEnv() {
  const configPath = path.join(__dirname, '..', 'config.env');
  console.log('📁 Tentative de lecture de:', configPath);
  
  if (fs.existsSync(configPath)) {
    console.log('✅ Fichier config.env trouvé');
    const content = fs.readFileSync(configPath, 'utf8');
    const lines = content.split('\n');
    
    const env = {};
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    // Appliquer les variables au process.env
    Object.assign(process.env, env);
    console.log('✅ Variables chargées depuis config.env');
    return env;
  } else {
    console.log('❌ Fichier config.env non trouvé');
    return null;
  }
}

async function testMailtrap() {
  console.log('🧪 Test de configuration Mailtrap (Direct)');
  console.log('='.repeat(70));

  // Charger config.env manuellement
  loadConfigEnv();

  // Aussi essayer dotenv
  try {
    require('dotenv').config({ path: './config.env' });
    console.log('✅ dotenv.config() exécuté');
  } catch (e) {
    console.log('⚠️  dotenv.config() échoué:', e.message);
  }

  console.log('\n📋 Configuration SMTP (après chargement):');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || '⚠️ Non configuré');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || '⚠️ Non configuré');
  console.log('   SMTP_SECURE:', process.env.SMTP_SECURE || '⚠️ Non configuré');
  console.log('   SMTP_USER:', process.env.SMTP_USER ? '✅ Configuré' : '❌ Non configuré');
  console.log('   SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Configuré' : '❌ Non configuré');
  console.log('   SMTP_FROM:', process.env.SMTP_FROM || '⚠️ Non configuré');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('\n❌ ERREUR: SMTP_USER ou SMTP_PASSWORD non configuré!');
    console.error('   Vérifiez que config.env contient ces variables.');
    
    // Afficher les variables d'environnement disponibles
    console.log('\n📋 Variables d\'environnement disponibles (commençant par SMTP):');
    Object.keys(process.env)
      .filter(k => k.startsWith('SMTP'))
      .forEach(k => {
        if (k.includes('PASSWORD')) {
          console.log(`   ${k}: ${process.env[k] ? '✅ Configuré' : '❌ Non configuré'}`);
        } else {
          console.log(`   ${k}: ${process.env[k] || '❌ Non configuré'}`);
        }
      });
    
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  console.log('\n🔌 Test de connexion SMTP...');
  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie!');
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    process.exit(1);
  }

  console.log('\n📤 Envoi email de test...');
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'test@example.com',
      subject: '🧪 Test Mailtrap - Alliance Courtage',
      html: '<h1>Test Mailtrap</h1><p>Configuration OK! Les emails fonctionnent.</p>'
    });
    console.log('✅ Email envoyé avec succès!');
    console.log('   Message ID:', info.messageId);
    console.log('\n📬 Vérifiez votre inbox Mailtrap: https://mailtrap.io');
    console.log('   L\'email devrait apparaître dans votre sandbox.');
  } catch (error) {
    console.error('❌ Erreur envoi:', error.message);
    process.exit(1);
  }
}

testMailtrap().catch(console.error);

