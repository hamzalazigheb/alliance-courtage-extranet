const fs = require('fs');
const path = require('path');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alliance.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken = '';
let userToken = '';
let testResults = [];

// Fonction pour afficher les résultats
function logTest(category, name, success, details = '') {
  const icon = success ? '✅' : '❌';
  const result = { category, name, success, details, timestamp: new Date().toISOString() };
  testResults.push(result);
  console.log(`${icon} [${category}] ${name}${details ? ': ' + details : ''}`);
}

// Fonction pour faire une requête
async function apiRequest(method, endpoint, data = null, token = null, isFormData = false) {
  try {
    const url = `${API_URL}${endpoint}`;
    const headers = {
      'Accept': 'application/json'
    };

    if (token) {
      headers['x-auth-token'] = token;
    }

    const options = {
      method,
      headers
    };

    if (data) {
      if (isFormData) {
        options.body = data;
      } else {
        headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(data);
      }
    }

    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    
    let responseData;
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    return {
      ok: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error.message
    };
  }
}

// Tests
async function runTests() {
  console.log('\n🚀 DÉBUT DES TESTS API\n');
  console.log('='.repeat(60));

  // 1. Test de base - Health check
  console.log('\n📊 TESTS DE BASE');
  console.log('-'.repeat(60));
  
  const health = await apiRequest('GET', '/api/health');
  logTest('Base', 'Health Check', health.ok && health.data.status === 'OK');

  const metrics = await apiRequest('GET', '/metrics');
  logTest('Base', 'Metrics Endpoint', metrics.ok);

  // 2. Tests d'authentification
  console.log('\n🔐 TESTS AUTHENTIFICATION');
  console.log('-'.repeat(60));

  // Login Admin
  const adminLogin = await apiRequest('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  logTest('Auth', 'Admin Login', adminLogin.ok && adminLogin.data.token);
  
  if (adminLogin.ok && adminLogin.data.token) {
    adminToken = adminLogin.data.token;
    logTest('Auth', 'Token généré', true, adminToken.substring(0, 20) + '...');
  }

  // Vérifier le profil admin
  if (adminToken) {
    const profile = await apiRequest('GET', '/api/auth/me', null, adminToken);
    logTest('Auth', 'Get Profile', profile.ok && profile.data.email === ADMIN_EMAIL);
  }

  // 3. Tests Utilisateurs
  console.log('\n👥 TESTS UTILISATEURS');
  console.log('-'.repeat(60));

  if (adminToken) {
    const users = await apiRequest('GET', '/api/users', null, adminToken);
    logTest('Users', 'Liste des utilisateurs', users.ok && Array.isArray(users.data));
    
    if (users.ok && users.data.length > 0) {
      logTest('Users', 'Nombre d\'utilisateurs', true, `${users.data.length} utilisateur(s)`);
    }
  }

  // 4. Tests Produits
  console.log('\n📦 TESTS PRODUITS');
  console.log('-'.repeat(60));

  const products = await apiRequest('GET', '/api/products');
  logTest('Products', 'Liste des produits', products.ok && Array.isArray(products.data));

  if (products.ok && products.data.length > 0) {
    logTest('Products', 'Nombre de produits', true, `${products.data.length} produit(s)`);
    
    // Test d'un produit spécifique
    const productId = products.data[0].id;
    const product = await apiRequest('GET', `/api/products/${productId}`);
    logTest('Products', 'Détail d\'un produit', product.ok);
  }

  // 5. Tests Actualités
  console.log('\n📰 TESTS ACTUALITÉS');
  console.log('-'.repeat(60));

  const news = await apiRequest('GET', '/api/news');
  logTest('News', 'Liste des actualités', news.ok && Array.isArray(news.data));

  if (news.ok && news.data.length > 0) {
    logTest('News', 'Nombre d\'actualités', true, `${news.data.length} actualité(s)`);
  }

  // 6. Tests Archives
  console.log('\n📁 TESTS ARCHIVES');
  console.log('-'.repeat(60));

  const archives = await apiRequest('GET', '/api/archives');
  logTest('Archives', 'Liste des archives', archives.ok && Array.isArray(archives.data));

  if (archives.ok && archives.data.length > 0) {
    logTest('Archives', 'Nombre d\'archives', true, `${archives.data.length} archive(s)`);
  }

  // Test des catégories d'archives
  const categories = await apiRequest('GET', '/api/archives/categories');
  logTest('Archives', 'Catégories d\'archives', categories.ok && Array.isArray(categories.data));

  // 7. Tests Partenaires
  console.log('\n🤝 TESTS PARTENAIRES');
  console.log('-'.repeat(60));

  const partners = await apiRequest('GET', '/api/partners');
  logTest('Partners', 'Liste des partenaires', partners.ok && Array.isArray(partners.data));

  if (partners.ok && partners.data.length > 0) {
    logTest('Partners', 'Nombre de partenaires', true, `${partners.data.length} partenaire(s)`);
  }

  // 8. Tests Produits Structurés
  console.log('\n💼 TESTS PRODUITS STRUCTURÉS');
  console.log('-'.repeat(60));

  const structuredProducts = await apiRequest('GET', '/api/structured-products');
  logTest('Structured', 'Liste des produits structurés', structuredProducts.ok && Array.isArray(structuredProducts.data));

  if (structuredProducts.ok && structuredProducts.data.length > 0) {
    logTest('Structured', 'Nombre de produits structurés', true, `${structuredProducts.data.length} produit(s)`);
    
    // Test des fichiers d'un produit
    const productId = structuredProducts.data[0].id;
    const files = await apiRequest('GET', `/api/structured-products/${productId}/files`);
    logTest('Structured', 'Fichiers d\'un produit', files.ok);
  }

  // Test des assurances
  const assurancesStruct = await apiRequest('GET', '/api/structured-products/assurances');
  logTest('Structured', 'Liste des assurances (structured)', assurancesStruct.ok);

  // 9. Tests Documents Financiers
  console.log('\n💰 TESTS DOCUMENTS FINANCIERS');
  console.log('-'.repeat(60));

  const financialDocs = await apiRequest('GET', '/api/financial-documents');
  logTest('Financial', 'Liste des documents financiers', financialDocs.ok && Array.isArray(financialDocs.data));

  if (financialDocs.ok && financialDocs.data.length > 0) {
    logTest('Financial', 'Nombre de documents', true, `${financialDocs.data.length} document(s)`);
  }

  // 10. Tests Formations
  console.log('\n🎓 TESTS FORMATIONS');
  console.log('-'.repeat(60));

  const formations = await apiRequest('GET', '/api/formations');
  logTest('Formations', 'Liste des formations', formations.ok && Array.isArray(formations.data));

  if (formations.ok && formations.data.length > 0) {
    logTest('Formations', 'Nombre de formations', true, `${formations.data.length} formation(s)`);
  }

  // 11. Tests Assurances
  console.log('\n🛡️ TESTS ASSURANCES');
  console.log('-'.repeat(60));

  const assurances = await apiRequest('GET', '/api/assurances');
  logTest('Assurances', 'Liste des assurances', assurances.ok && Array.isArray(assurances.data));

  if (assurances.ok && assurances.data.length > 0) {
    logTest('Assurances', 'Nombre d\'assurances', true, `${assurances.data.length} assurance(s)`);
  }

  // Test montants développés
  const montants = await apiRequest('GET', '/api/structured-products/assurances/montants');
  logTest('Assurances', 'Montants développés', montants.ok);

  // 12. Tests Bordereaux
  console.log('\n📋 TESTS BORDEREAUX');
  console.log('-'.repeat(60));

  if (adminToken) {
    const bordereaux = await apiRequest('GET', '/api/bordereaux', null, adminToken);
    logTest('Bordereaux', 'Liste des bordereaux', bordereaux.ok && Array.isArray(bordereaux.data));

    if (bordereaux.ok && bordereaux.data.length > 0) {
      logTest('Bordereaux', 'Nombre de bordereaux', true, `${bordereaux.data.length} bordereau(x)`);
    }
  }

  // 13. Tests Réglementaire
  console.log('\n⚖️ TESTS RÉGLEMENTAIRE');
  console.log('-'.repeat(60));

  const reglementaire = await apiRequest('GET', '/api/reglementaire');
  logTest('Réglementaire', 'Liste des documents', reglementaire.ok && Array.isArray(reglementaire.data));

  if (reglementaire.ok && reglementaire.data.length > 0) {
    logTest('Réglementaire', 'Nombre de documents', true, `${reglementaire.data.length} document(s)`);
  }

  // 14. Tests Simulateurs
  console.log('\n🧮 TESTS SIMULATEURS');
  console.log('-'.repeat(60));

  const simulators = await apiRequest('GET', '/api/simulators');
  logTest('Simulators', 'Liste des simulateurs', simulators.ok && Array.isArray(simulators.data));

  if (simulators.ok && simulators.data.length > 0) {
    logTest('Simulators', 'Nombre de simulateurs', true, `${simulators.data.length} simulateur(s)`);
  }

  // 15. Tests Notifications
  console.log('\n🔔 TESTS NOTIFICATIONS');
  console.log('-'.repeat(60));

  if (adminToken) {
    const notifications = await apiRequest('GET', '/api/notifications', null, adminToken);
    logTest('Notifications', 'Liste des notifications', notifications.ok && Array.isArray(notifications.data));
  }

  // 16. Tests Dashboard
  console.log('\n📊 TESTS DASHBOARD');
  console.log('-'.repeat(60));

  if (adminToken) {
    const stats = await apiRequest('GET', '/api/dashboard/stats', null, adminToken);
    logTest('Dashboard', 'Statistiques générales', stats.ok);

    const statsYear = await apiRequest('GET', '/api/dashboard/stats/2024', null, adminToken);
    logTest('Dashboard', 'Statistiques par année', statsYear.ok);
  }

  // 17. Tests CMS
  console.log('\n✏️ TESTS CMS');
  console.log('-'.repeat(60));

  if (adminToken) {
    const homepage = await apiRequest('GET', '/api/cms/homepage');
    logTest('CMS', 'Contenu homepage', homepage.ok);

    const presentation = await apiRequest('GET', '/api/cms/presentation');
    logTest('CMS', 'Contenu présentation', presentation.ok);
  }

  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📈 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));

  const total = testResults.length;
  const passed = testResults.filter(r => r.success).length;
  const failed = testResults.filter(r => !r.success).length;
  const successRate = ((passed / total) * 100).toFixed(2);

  console.log(`\n✅ Tests réussis: ${passed}/${total}`);
  console.log(`❌ Tests échoués: ${failed}/${total}`);
  console.log(`📊 Taux de réussite: ${successRate}%\n`);

  // Tests échoués détaillés
  if (failed > 0) {
    console.log('❌ TESTS ÉCHOUÉS:');
    console.log('-'.repeat(60));
    testResults.filter(r => !r.success).forEach(r => {
      console.log(`   • [${r.category}] ${r.name}`);
      if (r.details) {
        console.log(`     Détails: ${r.details}`);
      }
    });
  }

  // Sauvegarder le rapport
  const report = {
    date: new Date().toISOString(),
    summary: {
      total,
      passed,
      failed,
      successRate: parseFloat(successRate)
    },
    tests: testResults
  };

  const reportPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Rapport sauvegardé: ${reportPath}\n`);

  // Retourner le code de sortie approprié
  process.exit(failed > 0 ? 1 : 0);
}

// Exécuter les tests
console.log('⏳ Préparation des tests...');
console.log(`🌐 API URL: ${API_URL}`);
console.log(`👤 Admin: ${ADMIN_EMAIL}\n`);

runTests().catch(error => {
  console.error('\n💥 ERREUR FATALE:', error);
  process.exit(1);
});

