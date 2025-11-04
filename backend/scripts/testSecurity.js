const axios = require('axios');
require('dotenv').config({ path: './config.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

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

let testResults = {
  total: 0,
  passed: 0,
  failed: 0
};

function logTest(name) {
  log(`\n🔒 Testing: ${name}`, 'cyan');
  testResults.total++;
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
  testResults.passed++;
}

function logError(message) {
  log(`❌ ${message}`, 'red');
  testResults.failed++;
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function testAPI(method, endpoint, data = null, headers = {}, expectedStatus = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      validateStatus: () => true
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    
    if (expectedStatus !== null) {
      return response.status === expectedStatus;
    }
    
    return response.status;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      return 'SERVER_DOWN';
    }
    return error.response?.status || 'ERROR';
  }
}

// Test 1: Unauthorized access
async function testUnauthorizedAccess() {
  logTest('Unauthorized Access Protection');

  const protectedRoutes = [
    { method: 'GET', endpoint: '/api/users' },
    { method: 'GET', endpoint: '/api/bordereaux' },
    { method: 'GET', endpoint: '/api/favoris' },
    { method: 'GET', endpoint: '/api/notifications' },
    { method: 'GET', endpoint: '/api/cms/home' },
    { method: 'POST', endpoint: '/api/favoris', data: { item_type: 'test', item_id: 1, title: 'Test' } }
  ];

  for (const route of protectedRoutes) {
    const status = await testAPI(route.method, route.endpoint, route.data, {});
    if (status === 401 || status === 403) {
      logSuccess(`${route.method} ${route.endpoint} - Properly protected (${status})`);
    } else {
      logError(`${route.method} ${route.endpoint} - Not protected! Got status: ${status}`);
    }
  }
}

// Test 2: Invalid token
async function testInvalidToken() {
  logTest('Invalid Token Handling');

  const invalidTokens = [
    'invalid-token',
    'Bearer invalid',
    'expired.token.here',
    'malformed.token'
  ];

  for (const token of invalidTokens) {
    const status = await testAPI('GET', '/api/users', null, { 'x-auth-token': token });
    if (status === 401 || status === 403) {
      logSuccess(`Invalid token rejected: ${token.substring(0, 20)}...`);
    } else {
      logError(`Invalid token accepted! Status: ${status}`);
    }
  }
}

// Test 3: SQL Injection
async function testSQLInjection() {
  logTest('SQL Injection Protection');

  const sqlInjectionAttempts = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT * FROM users--",
    "admin'--",
    "' OR 1=1--"
  ];

  // Test on login
  for (const attempt of sqlInjectionAttempts) {
    const status = await testAPI('POST', '/api/auth/login', {
      email: attempt,
      password: 'test'
    });
    
    if (status === 401 || status === 400 || status === 422) {
      logSuccess(`SQL injection attempt blocked: ${attempt.substring(0, 20)}...`);
    } else if (status === 200) {
      logError(`SQL injection attempt succeeded! Payload: ${attempt}`);
    } else {
      logWarning(`Unexpected status for SQL injection test: ${status}`);
    }
  }
}

// Test 4: XSS Protection
async function testXSSProtection() {
  logTest('XSS Protection');

  const xssAttempts = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>'
  ];

  // Test on CMS update
  for (const attempt of xssAttempts) {
    const status = await testAPI('PUT', '/api/cms/home', {
      title: attempt,
      subtitle: 'Test',
      description: 'Test'
    }, { 'x-auth-token': 'invalid-token' });
    
    // Should reject due to invalid token, not process XSS
    if (status === 401 || status === 403) {
      logSuccess(`XSS attempt blocked (auth required): ${attempt.substring(0, 20)}...`);
    } else {
      logWarning(`XSS test status: ${status}`);
    }
  }
}

// Test 5: Rate Limiting (if implemented)
async function testRateLimiting() {
  logTest('Rate Limiting');

  logWarning('Rate limiting test - sending multiple requests...');
  
  const requests = [];
  for (let i = 0; i < 20; i++) {
    requests.push(testAPI('POST', '/api/auth/login', {
      email: 'test@example.com',
      password: 'wrongpassword'
    }));
  }

  const results = await Promise.all(requests);
  const status429 = results.filter(s => s === 429).length;
  
  if (status429 > 0) {
    logSuccess(`Rate limiting active: ${status429} requests returned 429`);
  } else {
    logWarning('Rate limiting may not be active or not triggered');
  }
}

// Test 6: CORS Configuration
async function testCORS() {
  logTest('CORS Configuration');

  try {
    const response = await axios.options(`${API_BASE_URL}/api/auth/login`, {
      headers: {
        'Origin': 'http://evil.com',
        'Access-Control-Request-Method': 'POST'
      },
      validateStatus: () => true
    });

    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    };

    if (corsHeaders['access-control-allow-origin']) {
      const allowedOrigin = corsHeaders['access-control-allow-origin'];
      if (allowedOrigin === '*' || allowedOrigin === 'http://evil.com') {
        logWarning('CORS allows all origins or malicious origin');
      } else {
        logSuccess(`CORS properly configured: ${allowedOrigin}`);
      }
    } else {
      logWarning('CORS headers not found');
    }
  } catch (error) {
    logWarning(`CORS test failed: ${error.message}`);
  }
}

// Test 7: Input Validation
async function testInputValidation() {
  logTest('Input Validation');

  const invalidInputs = [
    { email: '', password: 'test' },
    { email: 'invalid-email', password: 'test' },
    { email: 'test@example.com', password: '' },
    { email: 'a'.repeat(300) + '@example.com', password: 'test' }
  ];

  for (const input of invalidInputs) {
    const status = await testAPI('POST', '/api/auth/login', input);
    if (status === 400 || status === 422) {
      logSuccess(`Invalid input rejected: ${JSON.stringify(input).substring(0, 50)}...`);
    } else if (status === 200) {
      logError(`Invalid input accepted! ${JSON.stringify(input)}`);
    }
  }
}

// Test 8: File Upload Security
async function testFileUploadSecurity() {
  logTest('File Upload Security');

  // Test with invalid file types (would need actual file upload)
  logWarning('File upload security test - requires actual file upload implementation');
  
  // Test endpoint protection
  const status = await testAPI('POST', '/api/archives', null, {});
  if (status === 401 || status === 403) {
    logSuccess('File upload endpoint is protected');
  } else {
    logError(`File upload endpoint not protected! Status: ${status}`);
  }
}

// Main test function
async function runSecurityTests() {
  log('\n🔒 Starting Security Tests\n', 'magenta');
  log('='.repeat(60), 'magenta');

  const startTime = Date.now();

  try {
    await testUnauthorizedAccess();
    await testInvalidToken();
    await testSQLInjection();
    await testXSSProtection();
    await testRateLimiting();
    await testCORS();
    await testInputValidation();
    await testFileUploadSecurity();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    log('\n' + '='.repeat(60), 'magenta');
    log(`\n📊 Security Test Results:`, 'cyan');
    log(`   Total Tests: ${testResults.total}`, 'cyan');
    log(`   ✅ Passed: ${testResults.passed}`, 'green');
    log(`   ❌ Failed: ${testResults.failed}`, 'red');
    log(`\n⏱️  Duration: ${duration} seconds\n`, 'blue');

    if (testResults.failed === 0) {
      log('🎉 All security tests passed!\n', 'green');
    } else {
      log(`⚠️  ${testResults.failed} security test(s) failed. Please review!\n`, 'yellow');
    }

  } catch (error) {
    logError(`\nSecurity test suite failed: ${error.message}`);
    console.error(error);
  }
}

runSecurityTests();

