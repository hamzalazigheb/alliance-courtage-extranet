const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:3001';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alliance.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

let adminToken = '';
let testResults = [];

function logTest(category, name, success, details = '') {
  const icon = success ? '✅' : '❌';
  const result = { category, name, success, details };
  testResults.push(result);
  console.log(`${icon} [${category}] ${name}${details ? ': ' + details : ''}`);
}

async function apiRequest(method, endpoint, data = null, token = null) {
  try {
    const url = `${API_URL}${endpoint}`;
    const headers = {};

    if (token) {
      headers['x-auth-token'] = token;
    }

    const options = {
      method,
      headers
    };

    if (data) {
      if (data instanceof FormData) {
        // FormData gère ses propres headers
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

// Créer un fichier de test
function createTestFile(filename, content = 'Test file content') {
  const filePath = path.join(__dirname, 'temp', filename);
  
  // Créer le dossier temp s'il n'existe pas
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  fs.writeFileSync(filePath, content);
  return filePath;
}

async function testFileUploads() {
  console.log('\n🚀 TESTS DES UPLOADS DE FICHIERS\n');
  console.log('='.repeat(60));

  // 1. Login Admin
  console.log('\n🔐 AUTHENTIFICATION');
  console.log('-'.repeat(60));

  const adminLogin = await apiRequest('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  
  logTest('Auth', 'Admin Login', adminLogin.ok && adminLogin.data.token);
  
  if (!adminLogin.ok || !adminLogin.data.token) {
    console.error('\n❌ Impossible de continuer sans authentification');
    process.exit(1);
  }
  
  adminToken = adminLogin.data.token;

  // 2. Test Upload Actualité (News)
  console.log('\n📰 TEST UPLOAD ACTUALITÉ');
  console.log('-'.repeat(60));

  try {
    const testImagePath = createTestFile('test-news.png', 'PNG image data');
    const formData = new FormData();
    formData.append('title', 'Test Actualité Upload');
    formData.append('content', 'Contenu de test pour l\'actualité');
    formData.append('date', new Date().toISOString().split('T')[0]);
    formData.append('image', fs.createReadStream(testImagePath));

    const newsUpload = await apiRequest('POST', '/api/news', formData, adminToken);
    logTest('News', 'Upload nouvelle actualité', newsUpload.ok, newsUpload.ok ? `ID: ${newsUpload.data.id}` : newsUpload.data.error);
    
    if (newsUpload.ok && newsUpload.data.id) {
      // Supprimer l'actualité de test
      await apiRequest('DELETE', `/api/news/${newsUpload.data.id}`, null, adminToken);
    }
  } catch (error) {
    logTest('News', 'Upload nouvelle actualité', false, error.message);
  }

  // 3. Test Upload Archive
  console.log('\n📁 TEST UPLOAD ARCHIVE');
  console.log('-'.repeat(60));

  try {
    const testPdfPath = createTestFile('test-archive.pdf', 'PDF document data');
    const formData = new FormData();
    formData.append('title', 'Test Archive Upload');
    formData.append('category_id', '1');
    formData.append('file', fs.createReadStream(testPdfPath));

    const archiveUpload = await apiRequest('POST', '/api/archives', formData, adminToken);
    logTest('Archives', 'Upload nouvelle archive', archiveUpload.ok, archiveUpload.ok ? `ID: ${archiveUpload.data.id}` : archiveUpload.data.error);
    
    if (archiveUpload.ok && archiveUpload.data.id) {
      // Supprimer l'archive de test
      await apiRequest('DELETE', `/api/archives/${archiveUpload.data.id}`, null, adminToken);
    }
  } catch (error) {
    logTest('Archives', 'Upload nouvelle archive', false, error.message);
  }

  // 4. Test Upload Produit Structuré
  console.log('\n💼 TEST UPLOAD PRODUIT STRUCTURÉ');
  console.log('-'.repeat(60));

  try {
    const testFile1 = createTestFile('test-structured-1.pdf', 'PDF 1 data');
    const testFile2 = createTestFile('test-structured-2.pdf', 'PDF 2 data');
    
    const formData = new FormData();
    formData.append('assurances', JSON.stringify([
      { name: 'Test Assurance', montant: '100' }
    ]));
    formData.append('montant_enveloppe_total', '100');
    formData.append('statut', 'Retraite');
    formData.append('prevoyance', 'Prévoyance');
    formData.append('files', fs.createReadStream(testFile1));
    formData.append('files', fs.createReadStream(testFile2));

    const structuredUpload = await apiRequest('POST', '/api/structured-products', formData, adminToken);
    logTest('Structured', 'Upload produit structuré', structuredUpload.ok, structuredUpload.ok ? `ID: ${structuredUpload.data.id}` : structuredUpload.data.error);
    
    if (structuredUpload.ok && structuredUpload.data.id) {
      // Tester le download des fichiers
      const files = await apiRequest('GET', `/api/structured-products/${structuredUpload.data.id}/files`);
      logTest('Structured', 'Récupération fichiers', files.ok && Array.isArray(files.data), files.ok ? `${files.data.length} fichier(s)` : '');
      
      // Supprimer le produit de test
      await apiRequest('DELETE', `/api/structured-products/${structuredUpload.data.id}`, null, adminToken);
    }
  } catch (error) {
    logTest('Structured', 'Upload produit structuré', false, error.message);
  }

  // 5. Test Upload Document Financier
  console.log('\n💰 TEST UPLOAD DOCUMENT FINANCIER');
  console.log('-'.repeat(60));

  try {
    const testPdfPath = createTestFile('test-financial.pdf', 'Financial PDF data');
    const formData = new FormData();
    formData.append('title', 'Test Document Financier');
    formData.append('month', new Date().toISOString().slice(0, 7));
    formData.append('file', fs.createReadStream(testPdfPath));

    const financialUpload = await apiRequest('POST', '/api/financial-documents', formData, adminToken);
    logTest('Financial', 'Upload document financier', financialUpload.ok, financialUpload.ok ? `ID: ${financialUpload.data.id}` : financialUpload.data.error);
    
    if (financialUpload.ok && financialUpload.data.id) {
      // Supprimer le document de test
      await apiRequest('DELETE', `/api/financial-documents/${financialUpload.data.id}`, null, adminToken);
    }
  } catch (error) {
    logTest('Financial', 'Upload document financier', false, error.message);
  }

  // 6. Test Upload Formation
  console.log('\n🎓 TEST UPLOAD FORMATION');
  console.log('-'.repeat(60));

  try {
    const testImagePath = createTestFile('test-formation.jpg', 'JPEG image data');
    const formData = new FormData();
    formData.append('title', 'Test Formation');
    formData.append('description', 'Description de test');
    formData.append('date', new Date().toISOString().split('T')[0]);
    formData.append('lieu', 'Lieu test');
    formData.append('image', fs.createReadStream(testImagePath));

    const formationUpload = await apiRequest('POST', '/api/formations', formData, adminToken);
    logTest('Formations', 'Upload formation', formationUpload.ok, formationUpload.ok ? `ID: ${formationUpload.data.id}` : formationUpload.data.error);
    
    if (formationUpload.ok && formationUpload.data.id) {
      // Supprimer la formation de test
      await apiRequest('DELETE', `/api/formations/${formationUpload.data.id}`, null, adminToken);
    }
  } catch (error) {
    logTest('Formations', 'Upload formation', false, error.message);
  }

  // 7. Test Upload Document Réglementaire
  console.log('\n⚖️ TEST UPLOAD DOCUMENT RÉGLEMENTAIRE');
  console.log('-'.repeat(60));

  try {
    const testPdfPath = createTestFile('test-reglementaire.pdf', 'Regulatory PDF data');
    const formData = new FormData();
    formData.append('title', 'Test Réglementaire');
    formData.append('category', 'Test Category');
    formData.append('file', fs.createReadStream(testPdfPath));

    const reglementaireUpload = await apiRequest('POST', '/api/reglementaire', formData, adminToken);
    logTest('Réglementaire', 'Upload document', reglementaireUpload.ok, reglementaireUpload.ok ? `ID: ${reglementaireUpload.data.id}` : reglementaireUpload.data.error);
    
    if (reglementaireUpload.ok && reglementaireUpload.data.id) {
      // Supprimer le document de test
      await apiRequest('DELETE', `/api/reglementaire/${reglementaireUpload.data.id}`, null, adminToken);
    }
  } catch (error) {
    logTest('Réglementaire', 'Upload document', false, error.message);
  }

  // Nettoyer les fichiers temporaires
  console.log('\n🧹 NETTOYAGE');
  console.log('-'.repeat(60));
  
  const tempDir = path.join(__dirname, 'temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    logTest('Cleanup', 'Suppression fichiers temporaires', true);
  }

  // Résumé
  console.log('\n' + '='.repeat(60));
  console.log('📈 RÉSUMÉ DES TESTS D\'UPLOAD');
  console.log('='.repeat(60));

  const total = testResults.length;
  const passed = testResults.filter(r => r.success).length;
  const failed = testResults.filter(r => !r.success).length;
  const successRate = ((passed / total) * 100).toFixed(2);

  console.log(`\n✅ Tests réussis: ${passed}/${total}`);
  console.log(`❌ Tests échoués: ${failed}/${total}`);
  console.log(`📊 Taux de réussite: ${successRate}%\n`);

  if (failed > 0) {
    console.log('❌ TESTS ÉCHOUÉS:');
    console.log('-'.repeat(60));
    testResults.filter(r => !r.success).forEach(r => {
      console.log(`   • [${r.category}] ${r.name}`);
      if (r.details) {
        console.log(`     Détails: ${r.details}`);
      }
    });
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Exécuter les tests
console.log('⏳ Préparation des tests d\'upload...');
console.log(`🌐 API URL: ${API_URL}`);
console.log(`👤 Admin: ${ADMIN_EMAIL}\n`);

testFileUploads().catch(error => {
  console.error('\n💥 ERREUR FATALE:', error);
  process.exit(1);
});

