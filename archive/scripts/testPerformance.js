const axios = require('axios');
require('dotenv').config({ path: './config.env' });

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function measureTime(fn) {
  const start = Date.now();
  try {
    await fn();
    const end = Date.now();
    return { success: true, duration: end - start };
  } catch (error) {
    const end = Date.now();
    return { success: false, duration: end - start, error: error.message };
  }
}

async function testAPI(method, endpoint, data = null, headers = {}) {
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

    const start = Date.now();
    const response = await axios(config);
    const duration = Date.now() - start;

    return {
      success: response.status < 400,
      status: response.status,
      duration,
      dataSize: JSON.stringify(response.data).length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: 0
    };
  }
}

async function testEndpointPerformance(endpoint, method = 'GET', data = null, headers = {}, iterations = 10) {
  log(`\n📊 Testing: ${method} ${endpoint}`, 'cyan');
  
  const durations = [];
  const successes = [];
  let totalDataSize = 0;

  for (let i = 0; i < iterations; i++) {
    const result = await testAPI(method, endpoint, data, headers);
    durations.push(result.duration);
    successes.push(result.success);
    if (result.dataSize) {
      totalDataSize += result.dataSize;
    }
  }

  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const successRate = (successes.filter(s => s).length / successes.length) * 100;
  const avgDataSize = totalDataSize / iterations;

  log(`   Average: ${avgDuration.toFixed(2)}ms`, avgDuration < 500 ? 'green' : avgDuration < 1000 ? 'yellow' : 'red');
  log(`   Min: ${minDuration}ms | Max: ${maxDuration}ms`, 'blue');
  log(`   Success Rate: ${successRate.toFixed(1)}%`, successRate === 100 ? 'green' : 'yellow');
  log(`   Avg Data Size: ${(avgDataSize / 1024).toFixed(2)} KB`, 'blue');

  return {
    endpoint,
    avgDuration,
    minDuration,
    maxDuration,
    successRate,
    avgDataSize
  };
}

async function testConcurrentRequests(endpoint, method = 'GET', concurrent = 10) {
  log(`\n🔄 Testing Concurrent Requests: ${method} ${endpoint}`, 'cyan');
  
  const promises = [];
  const start = Date.now();

  for (let i = 0; i < concurrent; i++) {
    promises.push(testAPI(method, endpoint));
  }

  const results = await Promise.all(promises);
  const totalDuration = Date.now() - start;

  const successes = results.filter(r => r.success).length;
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  log(`   Total Time: ${totalDuration}ms`, 'blue');
  log(`   Average Request Time: ${avgDuration.toFixed(2)}ms`, 'blue');
  log(`   Success Rate: ${(successes / concurrent * 100).toFixed(1)}%`, successes === concurrent ? 'green' : 'yellow');
  log(`   Requests/Second: ${((concurrent / totalDuration) * 1000).toFixed(2)}`, 'blue');

  return {
    totalDuration,
    avgDuration,
    successRate: (successes / concurrent) * 100,
    requestsPerSecond: (concurrent / totalDuration) * 1000
  };
}

async function runPerformanceTests() {
  log('\n⚡ Starting Performance Tests\n', 'cyan');
  log('='.repeat(60), 'cyan');

  const results = [];

  // Test public endpoints
  log('\n📈 Testing Public Endpoints\n', 'blue');
  results.push(await testEndpointPerformance('/api/archives', 'GET', null, {}, 10));
  results.push(await testEndpointPerformance('/api/financial-documents', 'GET', null, {}, 10));
  results.push(await testEndpointPerformance('/api/structured-products', 'GET', null, {}, 10));
  results.push(await testEndpointPerformance('/api/assurances', 'GET', null, {}, 10));
  results.push(await testEndpointPerformance('/api/partners', 'GET', null, {}, 10));

  // Test concurrent requests
  log('\n📈 Testing Concurrent Load\n', 'blue');
  await testConcurrentRequests('/api/archives', 'GET', 20);
  await testConcurrentRequests('/api/structured-products', 'GET', 20);

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('\n📊 Performance Summary\n', 'cyan');
  
  const avgResponseTime = results.reduce((sum, r) => sum + r.avgDuration, 0) / results.length;
  const slowestEndpoint = results.reduce((prev, curr) => 
    curr.avgDuration > prev.avgDuration ? curr : prev
  );

  log(`   Average Response Time: ${avgResponseTime.toFixed(2)}ms`, avgResponseTime < 500 ? 'green' : 'yellow');
  log(`   Slowest Endpoint: ${slowestEndpoint.endpoint} (${slowestEndpoint.avgDuration.toFixed(2)}ms)`, 'blue');

  if (avgResponseTime < 500) {
    log('\n✅ Performance is excellent!\n', 'green');
  } else if (avgResponseTime < 1000) {
    log('\n⚠️  Performance is acceptable but could be improved\n', 'yellow');
  } else {
    log('\n❌ Performance needs optimization\n', 'red');
  }
}

runPerformanceTests().catch(console.error);

