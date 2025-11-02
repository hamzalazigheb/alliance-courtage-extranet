# 🧪 Tester Mailtrap sur le Serveur

## Solution 1 : Copier le script dans le container (Rapide)

```bash
cd /var/www/alliance-courtage/backend

# Copier le script dans le container
docker cp scripts/testMailtrap.js alliance-courtage-backend:/app/scripts/testMailtrap.js

# Exécuter le test
docker exec -it alliance-courtage-backend node scripts/testMailtrap.js
```

## Solution 2 : Rebuilder le backend (Complet)

```bash
cd /var/www/alliance-courtage/backend

# Rebuilder pour inclure le nouveau script
docker compose build backend

# Redémarrer
docker compose up -d backend

# Exécuter le test
docker exec -it alliance-courtage-backend node scripts/testMailtrap.js
```

## Solution 3 : Créer le script directement dans le container

```bash
docker exec -it alliance-courtage-backend sh -c "cat > /app/scripts/testMailtrap.js << 'EOF'
const nodemailer = require('nodemailer');
require('dotenv').config({ path: './config.env' });

async function testMailtrap() {
  console.log('🧪 Test de configuration Mailtrap');
  console.log('='.repeat(70));

  console.log('\\n📋 Configuration SMTP:');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || '⚠️ Non configuré');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || '⚠️ Non configuré');
  console.log('   SMTP_SECURE:', process.env.SMTP_SECURE || '⚠️ Non configuré');
  console.log('   SMTP_USER:', process.env.SMTP_USER ? '✅ Configuré' : '❌ Non configuré');
  console.log('   SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Configuré' : '❌ Non configuré');

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    console.error('\\n❌ ERREUR: SMTP non configuré!');
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

  console.log('\\n🔌 Test de connexion...');
  try {
    await transporter.verify();
    console.log('✅ Connexion SMTP réussie!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }

  console.log('\\n📤 Envoi email de test...');
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: 'test@example.com',
      subject: '🧪 Test Mailtrap',
      html: '<h1>Test Mailtrap</h1><p>Configuration OK!</p>'
    });
    console.log('✅ Email envoyé! Message ID:', info.messageId);
    console.log('\\n📬 Vérifiez https://mailtrap.io');
  } catch (error) {
    console.error('❌ Erreur envoi:', error.message);
    process.exit(1);
  }
}

testMailtrap().catch(console.error);
EOF
"

# Exécuter
docker exec -it alliance-courtage-backend node scripts/testMailtrap.js
```

## Recommandation

Utilisez **Solution 1** (la plus rapide) :

```bash
cd /var/www/alliance-courtage/backend
docker cp scripts/testMailtrap.js alliance-courtage-backend:/app/scripts/testMailtrap.js
docker exec -it alliance-courtage-backend node scripts/testMailtrap.js
```

