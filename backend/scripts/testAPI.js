const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

// Fonction pour tester l'API
async function testAPI() {
  console.log('🧪 Test de l\'API Alliance Courtage');
  console.log('=====================================');

  try {
    // Test 1: Health check
    console.log('\n1️⃣ Test du health check...');
    const healthResponse = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test 2: Login
    console.log('\n2️⃣ Test de l\'authentification...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@alliance-courtage.fr',
      password: 'password'
    });
    console.log('✅ Login réussi');
    const token = loginResponse.data.token;

    // Headers pour les requêtes authentifiées
    const authHeaders = {
      'x-auth-token': token
    };

    // Test 3: Profil utilisateur
    console.log('\n3️⃣ Test du profil utilisateur...');
    const profileResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders
    });
    console.log('✅ Profil utilisateur:', profileResponse.data.user);

    // Test 4: Produits financiers
    console.log('\n4️⃣ Test des produits financiers...');
    const productsResponse = await axios.get(`${API_BASE_URL}/products`);
    console.log(`✅ ${productsResponse.data.length} produits financiers trouvés`);

    // Test 5: Actualités
    console.log('\n5️⃣ Test des actualités...');
    const newsResponse = await axios.get(`${API_BASE_URL}/news`);
    console.log(`✅ ${newsResponse.data.length} actualités trouvées`);

    // Test 6: Partenaires
    console.log('\n6️⃣ Test des partenaires...');
    const partnersResponse = await axios.get(`${API_BASE_URL}/partners`);
    console.log(`✅ ${partnersResponse.data.length} partenaires trouvés`);

    // Test 7: Archives
    console.log('\n7️⃣ Test des archives...');
    const archivesResponse = await axios.get(`${API_BASE_URL}/archives`);
    console.log(`✅ ${archivesResponse.data.length} archives trouvées`);

    // Test 8: Utilisateurs (Admin)
    console.log('\n8️⃣ Test des utilisateurs...');
    const usersResponse = await axios.get(`${API_BASE_URL}/users`, {
      headers: authHeaders
    });
    console.log(`✅ ${usersResponse.data.length} utilisateurs trouvés`);

    // Test 9: Logout
    console.log('\n9️⃣ Test de la déconnexion...');
    await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
      headers: authHeaders
    });
    console.log('✅ Déconnexion réussie');

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('\n📊 Résumé des tests :');
    console.log(`- Health check: ✅`);
    console.log(`- Authentification: ✅`);
    console.log(`- Produits financiers: ${productsResponse.data.length} éléments`);
    console.log(`- Actualités: ${newsResponse.data.length} éléments`);
    console.log(`- Partenaires: ${partnersResponse.data.length} éléments`);
    console.log(`- Archives: ${archivesResponse.data.length} éléments`);
    console.log(`- Utilisateurs: ${usersResponse.data.length} éléments`);

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Solution: Assurez-vous que le serveur backend est démarré :');
      console.log('   npm run dev');
    }
    
    process.exit(1);
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testAPI();
}

module.exports = { testAPI };



