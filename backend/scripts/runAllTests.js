#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

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

const scripts = [
  { name: 'Database Tests', file: 'testDatabase.js', description: 'Tests database structure and integrity' },
  { name: 'API Tests', file: 'testAllAPI.js', description: 'Tests all API endpoints' },
  { name: 'Security Tests', file: 'testSecurity.js', description: 'Tests security measures' },
  { name: 'Performance Tests', file: 'testPerformance.js', description: 'Tests API performance' }
];

async function runScript(script) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`\n🚀 Running: ${script.name}`, 'magenta');
  log(`📝 ${script.description}`, 'blue');
  log(`${'='.repeat(60)}\n`, 'cyan');

  try {
    const scriptPath = path.join(__dirname, script.file);
    execSync(`node "${scriptPath}"`, { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    log(`\n✅ ${script.name} completed\n`, 'green');
    return true;
  } catch (error) {
    log(`\n❌ ${script.name} failed\n`, 'red');
    return false;
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(60), 'blue');
  log('🧪 ALLIANCE COURTAGE - COMPREHENSIVE TEST SUITE', 'blue');
  log('='.repeat(60) + '\n', 'blue');

  const startTime = Date.now();
  const results = [];

  for (const script of scripts) {
    const success = await runScript(script);
    results.push({ name: script.name, success });
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Final Summary
  log('\n' + '='.repeat(60), 'blue');
  log('\n📊 FINAL TEST SUMMARY', 'magenta');
  log('='.repeat(60) + '\n', 'blue');

  results.forEach(result => {
    if (result.success) {
      log(`✅ ${result.name}`, 'green');
    } else {
      log(`❌ ${result.name}`, 'red');
    }
  });

  const passed = results.filter(r => r.success).length;
  const total = results.length;

  log(`\n📈 Results: ${passed}/${total} test suites passed`, 'cyan');
  log(`⏱️  Total Duration: ${duration} seconds\n`, 'blue');

  if (passed === total) {
    log('🎉 All test suites completed successfully!\n', 'green');
  } else {
    log(`⚠️  ${total - passed} test suite(s) had issues. Please review the output above.\n`, 'yellow');
  }
}

// Run all tests
runAllTests().catch(error => {
  log(`\n❌ Test runner failed: ${error.message}\n`, 'red');
  process.exit(1);
});

