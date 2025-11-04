const axios = require('axios');
require('dotenv').config({ path: './config.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'test123456';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@alliance-courtage.fr';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Hamza1234.';

let adminToken = '';
let userToken = '';
let testUserId = null;
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
  testResults.passed++;
  testResults.total++;
}

function logError(message) {
  log(`❌ ${message}`, 'red');
  testResults.failed++;
  testResults.total++;
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
  testResults.warnings++;
  testResults.total++;
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function testAPI(method, endpoint, data = null, token = null, expectedStatus = 200) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'x-auth-token': token })
      },
      validateStatus: () => true // Don't throw on any status
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    if (response.status === expectedStatus) {
      return { success: true, data: response.data, status: response.status };
    } else {
      const errorMsg = typeof response.data === 'object' 
        ? JSON.stringify(response.data) 
        : response.data?.error || response.data || `Status ${response.status}`;
      return { success: false, error: errorMsg, status: response.status };
    }
  } catch (error) {
    if (error.response) {
      const errorMsg = typeof error.response.data === 'object' 
        ? JSON.stringify(error.response.data) 
        : error.response.data?.error || error.response.data || error.message;
      return { 
        success: error.response.status === expectedStatus, 
        error: errorMsg, 
        status: error.response.status 
      };
    }
    if (error.code === 'ECONNREFUSED') {
      return { success: false, error: 'Server not running - please start the backend server' };
    }
    return { success: false, error: error.message };
  }
}

// Tests d'authentification
async function testAuth() {
  logTest('Authentication');

  // Test login admin
  const adminLogin = await testAPI('POST', '/api/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });
  
  if (adminLogin.success && adminLogin.data.token) {
    adminToken = adminLogin.data.token;
    logSuccess('Admin login successful');
  } else {
    logError(`Admin login failed: ${adminLogin.error}`);
    return false;
  }

  // Test login user
  const userLogin = await testAPI('POST', '/api/auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD
  });
  
  if (userLogin.success && userLogin.data.token) {
    userToken = userLogin.data.token;
    testUserId = userLogin.data.user?.id;
    logSuccess('User login successful');
  } else {
    logWarning(`User login failed (user may not exist): ${userLogin.error}`);
  }

  // Test get current user
  if (adminToken) {
    const currentUser = await testAPI('GET', '/api/auth/me', null, adminToken);
    if (currentUser.success) {
      logSuccess('Get current user successful');
    } else {
      logError(`Get current user failed: ${currentUser.error}`);
    }
  }

  return true;
}

// Tests CMS
async function testCMS() {
  logTest('CMS Routes');

  const cmsPages = [
    { name: 'home', endpoint: '/api/cms/home' },
    { name: 'gamme-produits', endpoint: '/api/cms/gamme-produits' },
    { name: 'produits-structures', endpoint: '/api/cms/produits-structures' },
    { name: 'rencontres', endpoint: '/api/cms/rencontres' },
    { name: 'gamme-financiere', endpoint: '/api/cms/gamme-financiere' },
    { name: 'partenaires', endpoint: '/api/cms/partenaires' }
  ];

  for (const page of cmsPages) {
    // GET
    const getResult = await testAPI('GET', page.endpoint, null, adminToken);
    if (getResult.success) {
      logSuccess(`GET ${page.endpoint}`);
    } else {
      logError(`GET ${page.endpoint} failed: ${getResult.error}`);
    }

    // PUT (update)
    if (getResult.success) {
      const updateData = {
        title: `Test Title ${new Date().toISOString()}`,
        subtitle: 'Test Subtitle',
        description: 'Test Description',
        ...(page.name !== 'rencontres' && { headerImage: 'https://example.com/image.jpg' })
      };

      const putResult = await testAPI('PUT', page.endpoint, updateData, adminToken);
      if (putResult.success) {
        logSuccess(`PUT ${page.endpoint}`);
      } else {
        logWarning(`PUT ${page.endpoint} failed: ${putResult.error}`);
      }
    }
  }
}

// Tests Fichiers
async function testFiles() {
  logTest('File Management Routes');

  const fileTypes = [
    { name: 'bordereaux', endpoint: '/api/bordereaux' },
    { name: 'formations', endpoint: '/api/formations' },
    { name: 'archives', endpoint: '/api/archives' },
    { name: 'financial-documents', endpoint: '/api/financial-documents' }
  ];

  for (const fileType of fileTypes) {
    // GET all
    const getAllResult = await testAPI('GET', fileType.endpoint, null, adminToken);
    if (getAllResult.success) {
      logSuccess(`GET ${fileType.endpoint}`);
      
      // Test download if files exist
      if (getAllResult.data && getAllResult.data.length > 0) {
        const firstFile = getAllResult.data[0];
        const downloadResult = await testAPI(
          'GET', 
          `${fileType.endpoint}/${firstFile.id}/download`, 
          null, 
          adminToken,
          200
        );
        if (downloadResult.success) {
          logSuccess(`GET ${fileType.endpoint}/${firstFile.id}/download`);
        } else {
          logWarning(`Download test failed: ${downloadResult.error}`);
        }
      }
    } else {
      logError(`GET ${fileType.endpoint} failed: ${getAllResult.error}`);
    }
  }
}

// Tests Réglementaire
async function testReglementaire() {
  logTest('Réglementaire Routes');

  if (!adminToken) {
    logWarning('Skipping réglementaire tests - no admin token');
    return;
  }

  // GET folders
  const foldersResult = await testAPI('GET', '/api/reglementaire/folders', null, adminToken);
  if (foldersResult.success) {
    logSuccess('GET /api/reglementaire/folders');
  } else {
    logError(`GET folders failed: ${foldersResult.error}`);
  }

  // GET documents
  const documentsResult = await testAPI('GET', '/api/reglementaire/documents', null, adminToken);
  if (documentsResult.success) {
    logSuccess('GET /api/reglementaire/documents');
  } else {
    logError(`GET documents failed: ${documentsResult.error}`);
  }
}

// Tests Favoris
async function testFavoris() {
  logTest('Favoris Routes');

  if (!userToken && !adminToken) {
    logWarning('Skipping favoris tests - no token available');
    return;
  }

  const token = userToken || adminToken;

  // GET all favoris
  const getAllResult = await testAPI('GET', '/api/favoris', null, token);
  if (getAllResult.success) {
    logSuccess('GET /api/favoris');
  } else {
    logError(`GET /api/favoris failed: ${getAllResult.error}`);
  }

  // POST add favori
  const addResult = await testAPI('POST', '/api/favoris', {
    item_type: 'test',
    item_id: 1,
    title: 'Test Favorite',
    description: 'Test Description',
    url: '#test'
  }, token, 201);

  if (addResult.success) {
    logSuccess('POST /api/favoris');
    const favoriteId = addResult.data.id;

    // DELETE favori
    const deleteResult = await testAPI('DELETE', `/api/favoris/${favoriteId}`, null, token);
    if (deleteResult.success) {
      logSuccess(`DELETE /api/favoris/${favoriteId}`);
    } else {
      logError(`DELETE favori failed: ${deleteResult.error}`);
    }
  } else {
    logError(`POST /api/favoris failed: ${addResult.error}`);
  }

  // Check favorite
  const checkResult = await testAPI('GET', '/api/favoris/check?type=test&item_id=999', null, token);
  if (checkResult.success) {
    logSuccess('GET /api/favoris/check');
  } else {
    logError(`GET /api/favoris/check failed: ${checkResult.error}`);
  }
}

// Tests Notifications
async function testNotifications() {
  logTest('Notifications Routes');

  if (!adminToken) {
    logWarning('Skipping notifications tests - no admin token');
    return;
  }

  // GET notifications
  const getAllResult = await testAPI('GET', '/api/notifications', null, adminToken);
  if (getAllResult.success) {
    logSuccess('GET /api/notifications');
  } else {
    logError(`GET /api/notifications failed: ${getAllResult.error}`);
  }

  // GET unread count
  const countResult = await testAPI('GET', '/api/notifications/unread-count', null, adminToken);
  if (countResult.success) {
    logSuccess('GET /api/notifications/unread-count');
  } else {
    logError(`GET unread count failed: ${countResult.error}`);
  }
}

// Tests Gestion
async function testManagement() {
  logTest('Management Routes');

  if (!adminToken) {
    logWarning('Skipping management tests - no admin token');
    return;
  }

  // Users
  const usersResult = await testAPI('GET', '/api/users', null, adminToken);
  if (usersResult.success) {
    logSuccess('GET /api/users');
  } else {
    logError(`GET /api/users failed: ${usersResult.error}`);
  }

  // Structured Products
  const productsResult = await testAPI('GET', '/api/structured-products', null, adminToken);
  if (productsResult.success) {
    logSuccess('GET /api/structured-products');
  } else {
    logError(`GET /api/structured-products failed: ${productsResult.error}`);
  }

  // Assurances
  const assurancesResult = await testAPI('GET', '/api/assurances', null, adminToken);
  if (assurancesResult.success) {
    logSuccess('GET /api/assurances');
  } else {
    logError(`GET /api/assurances failed: ${assurancesResult.error}`);
  }

  // Partners
  const partnersResult = await testAPI('GET', '/api/partners', null, adminToken);
  if (partnersResult.success) {
    logSuccess('GET /api/partners');
  } else {
    logError(`GET /api/partners failed: ${partnersResult.error}`);
  }
}

// Tests Permissions
async function testPermissions() {
  logTest('Permissions (Admin vs User)');

  if (!userToken) {
    logWarning('Skipping permission tests - no user token');
    return;
  }

  // User should NOT access admin routes
  const adminOnlyRoutes = [
    '/api/users',
    '/api/admin-password-reset/requests'
  ];

  for (const route of adminOnlyRoutes) {
    const result = await testAPI('GET', route, null, userToken, 403);
    if (result.success || result.status === 403) {
      logSuccess(`User correctly blocked from ${route}`);
    } else {
      logError(`Permission check failed for ${route}: ${result.error}`);
    }
  }
}

// Tests Database Structure
async function testDatabaseStructure() {
  logTest('Database Structure');

  const mysql = require('mysql2/promise');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'alliance_courtage'
    });

    const tables = [
      'users',
      'structured_products',
      'products', // Alternative name
      'product_reservations',
      'assurances',
      'bordereaux',
      'formations',
      'archives',
      'financial_documents',
      'partners',
      'password_reset_requests',
      'cms_content',
      'reglementaire_folders',
      'reglementaire_documents',
      'notifications',
      'favoris'
    ];

    for (const table of tables) {
      try {
        const [rows] = await connection.query(`SHOW TABLES LIKE '${table}'`);
        if (rows.length > 0) {
          logSuccess(`Table ${table} exists`);
        } else {
          // Don't log error for alternative table names
          if (!['products'].includes(table)) {
            logWarning(`Table ${table} does NOT exist`);
          }
        }
      } catch (err) {
        logWarning(`Could not check table ${table}: ${err.message}`);
      }
    }

    await connection.end();
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
  }
}

// Main test function
async function runAllTests() {
  log('\n🚀 Starting Comprehensive API Tests\n', 'blue');
  log('=' .repeat(60), 'blue');

  const startTime = Date.now();

  try {
    // 1. Database Structure
    await testDatabaseStructure();

    // 2. Authentication
    const authSuccess = await testAuth();
    if (!authSuccess) {
      logWarning('Authentication failed, some tests may fail');
    }

    // 3. CMS Routes
    if (adminToken) {
      await testCMS();
    }

    // 4. File Management
    if (adminToken) {
      await testFiles();
    }

    // 5. Réglementaire
    if (adminToken) {
      await testReglementaire();
    }

    // 6. Favoris
    await testFavoris();

    // 7. Notifications
    if (adminToken) {
      await testNotifications();
    }

    // 8. Management Routes
    if (adminToken) {
      await testManagement();
    }

    // 9. Permissions
    await testPermissions();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    log('\n' + '='.repeat(60), 'blue');
    log(`\n📊 Test Results Summary:`, 'magenta');
    log(`   Total Tests: ${testResults.total}`, 'cyan');
    log(`   ✅ Passed: ${testResults.passed}`, 'green');
    log(`   ❌ Failed: ${testResults.failed}`, 'red');
    log(`   ⚠️  Warnings: ${testResults.warnings}`, 'yellow');
    log(`\n⏱️  Duration: ${duration} seconds\n`, 'blue');

    if (testResults.failed === 0) {
      log('🎉 All tests passed!\n', 'green');
    } else {
      log(`⚠️  ${testResults.failed} test(s) failed. Please review the errors above.\n`, 'yellow');
    }

  } catch (error) {
    logError(`\nTest suite failed: ${error.message}`);
    console.error(error);
  }
}

// Run tests
runAllTests().catch(console.error);
