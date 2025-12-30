// Test setup file
const { query, closePool } = require('../config/database');

// Increase timeout for database operations
jest.setTimeout(30000);

// Clean up after all tests
afterAll(async () => {
  try {
    await closePool();
  } catch (error) {
    console.log('Pool already closed or not initialized');
  }
});

// Global test utilities
global.testUtils = {
  // Generate random email for testing
  randomEmail: () => `test_${Date.now()}_${Math.random().toString(36).substring(7)}@test.com`,
  
  // Generate random string
  randomString: (length = 10) => Math.random().toString(36).substring(2, length + 2),
  
  // Wait helper
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};




