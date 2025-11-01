/**
 * Script de test automatique de l'API de réinitialisation
 * 
 * Ce script teste directement l'API sans passer par l'interface
 * Usage: node backend/scripts/testAPIReset.js [email]
 */

const http = require('http');

const email = process.argv[2] || 'admin@alliance-courtage.fr';
const apiUrl = 'http://localhost:3001/api/admin-password-reset/request';

console.log('\n' + '='.repeat(70));
console.log('🧪 TEST API - RÉINITIALISATION MOT DE PASSE ADMIN');
console.log('='.repeat(70));
console.log(`📧 Email à tester: ${email}`);
console.log(`🌐 API URL: ${apiUrl}\n`);

const postData = JSON.stringify({ email });

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/admin-password-reset/request',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔄 Envoi de la requête...\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log(`📊 Statut HTTP: ${res.statusCode} ${res.statusMessage}`);
    console.log('\n📥 Réponse du serveur:');
    console.log('─'.repeat(70));
    
    try {
      const response = JSON.parse(data);
      
      if (res.statusCode === 200) {
        console.log('✅ SUCCÈS !\n');
        console.log('Message:', response.message);
        console.log('\n📋 Instructions:');
        console.log('   1. Regardez la console backend pour voir l\'email généré');
        console.log('   2. Copiez le nouveau mot de passe depuis la console');
        console.log('   3. Connectez-vous avec ce mot de passe');
      } else {
        console.log('⚠️  RÉPONSE:');
        console.log(JSON.stringify(response, null, 2));
      }
    } catch (e) {
      console.log(data);
    }
    
    console.log('─'.repeat(70));
    
    if (res.statusCode === 200) {
      console.log('\n✅ TEST RÉUSSI !');
      console.log('📧 Vérifiez la console backend pour voir l\'email généré.');
    } else {
      console.log('\n⚠️  Vérifiez les erreurs ci-dessus.');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ ERREUR DE CONNEXION:');
  console.error('   ', error.message);
  console.error('\n💡 Vérifications:');
  console.error('   1. Le serveur backend est-il démarré ?');
  console.error('   2. Le serveur écoute-t-il sur le port 3001 ?');
  console.error('   3. Essayez: cd backend && npm start');
});

req.write(postData);
req.end();

