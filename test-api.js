#!/usr/bin/env node

/**
 * POS ENTERPRISE - API Testing Script
 * Automated testing dengan Node.js
 */

const http = require('http');
const https = require('https');
const url = require('url');

const API_BASE = 'http://localhost:3000/api';

// Color codes untuk terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Global test state
let testsPassed = 0;
let testsFailed = 0;
let token = '';
let productId = null;
let transactionId = null;

// Logging helpers
const log = {
  header: (text) => console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}\n${colors.blue}${text}${colors.reset}\n${colors.blue}${'='.repeat(50)}${colors.reset}\n`),
  success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
  error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
  info: (text) => console.log(`${colors.cyan}ℹ️  ${text}${colors.reset}`),
  data: (text) => console.log(`${colors.yellow}${text}${colors.reset}`),
  result: (text) => console.log(`${text}`)
};

/**
 * HTTP Request Helper
 */
function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const fullUrl = `${API_BASE}${path}`;
    const urlObj = new URL(fullUrl);
    
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(urlObj, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            body: parsed,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: null,
            raw: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

/**
 * Test Runner
 */
async function runTest(name, fn) {
  try {
    await fn();
    testsPassed++;
    log.success(name);
  } catch (error) {
    testsFailed++;
    log.error(`${name} - ${error.message}`);
  }
}

/**
 * Assert Helper
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * MAIN TEST SUITE
 */
async function runTests() {
  console.clear();
  log.header('POS ENTERPRISE - API Testing Suite');

  // ========== 1. SERVER CONNECTION ==========
  log.header('1. SERVER CONNECTION');

  await runTest('Server is running', async () => {
    const res = await makeRequest('GET', '/test');
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
    log.info(`Server message: ${res.body.message}`);
  });

  // ========== 2. AUTHENTICATION ==========
  log.header('2. AUTHENTICATION');

  await runTest('Register new user', async () => {
    const res = await makeRequest('POST', '/auth/register', {
      username: 'testuser_' + Date.now(),
      password: 'testpass123',
      email: `test_${Date.now()}@pos.local`,
      fullName: 'Test User',
      role: 'cashier'
    });
    assert([201, 400].includes(res.status), `Expected 201 or 400, got ${res.status}`);
    assert(res.body?.success !== undefined, 'Success field missing');
    log.data(`Response: ${JSON.stringify(res.body)}`);
  });

  await runTest('Login with credentials', async () => {
    const res = await makeRequest('POST', '/auth/login', {
      username: 'testuser',
      password: 'testpass123'
    });
    assert([200, 401].includes(res.status), `Expected 200 or 401, got ${res.status}`);
    if (res.status === 200) {
      token = res.body.token;
      assert(token, 'Token not provided');
      log.info(`Token acquired: ${token.substring(0, 20)}...`);
    } else {
      log.info('Using existing token if available');
    }
  });

  if (!token) {
    log.error('Cannot continue without token. Please register/login manually.');
    return;
  }

  await runTest('Get user profile', async () => {
    const res = await makeRequest('GET', '/auth/profile', null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
    log.data(`User: ${res.body.data?.username}`);
  });

  await runTest('Update user profile', async () => {
    const res = await makeRequest('PUT', '/auth/profile', {
      fullName: 'Updated Test User'
    }, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
  });

  // ========== 3. PRODUCTS ==========
  log.header('3. PRODUCTS MANAGEMENT');

  await runTest('Create product', async () => {
    const res = await makeRequest('POST', '/products', {
      name: 'Susu Segar 1L',
      barcode: 'SKU_' + Date.now(),
      category: 'Dairy',
      price: 25000,
      cost: 18000,
      stock: 50,
      unit: 'pcs'
    }, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
    productId = res.body.data?.id;
    assert(productId, 'Product ID not returned');
    log.info(`Created product ID: ${productId}`);
  });

  await runTest('Get all products', async () => {
    const res = await makeRequest('GET', '/products?page=1&limit=10', null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
    assert(Array.isArray(res.body.data), 'Data is not an array');
    log.info(`Found ${res.body.data?.length || 0} products`);
  });

  if (productId) {
    await runTest('Get product detail', async () => {
      const res = await makeRequest('GET', `/products/${productId}`, null, {
        'Authorization': `Bearer ${token}`
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body?.success === true, 'Success field missing');
      log.info(`Product: ${res.body.data?.name} - Stock: ${res.body.data?.stock}`);
    });

    await runTest('Update product', async () => {
      const res = await makeRequest('PUT', `/products/${productId}`, {
        price: 27000,
        stock: 45
      }, {
        'Authorization': `Bearer ${token}`
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body?.success === true, 'Success field missing');
      log.info(`Updated price to 27000, stock to 45`);
    });

    await runTest('Update stock (add)', async () => {
      const res = await makeRequest('PATCH', `/products/${productId}/stock`, {
        quantity: 5,
        type: 'add'
      }, {
        'Authorization': `Bearer ${token}`
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body?.success === true, 'Success field missing');
      log.info(`Stock added: ${res.body.data?.stock}`);
    });

    await runTest('Update stock (subtract)', async () => {
      const res = await makeRequest('PATCH', `/products/${productId}/stock`, {
        quantity: 2,
        type: 'subtract'
      }, {
        'Authorization': `Bearer ${token}`
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body?.data?.stock > 0, 'Stock is invalid');
      log.info(`Stock updated: ${res.body.data?.stock}`);
    });
  }

  // ========== 4. TRANSACTIONS ==========
  log.header('4. TRANSACTIONS');

  if (productId) {
    await runTest('Create transaction', async () => {
      const res = await makeRequest('POST', '/transactions', {
        items: [
          { product_id: productId, quantity: 2, price: 27000 },
          { product_id: productId, quantity: 1, price: 27000 }
        ],
        paymentMethod: 'cash',
        discountAmount: 0,
        taxAmount: 0,
        notes: 'Test transaction'
      }, {
        'Authorization': `Bearer ${token}`
      });
      assert(res.status === 201, `Expected 201, got ${res.status}`);
      assert(res.body?.success === true, 'Success field missing');
      transactionId = res.body.data?.id;
      assert(transactionId, 'Transaction ID not returned');
      log.info(`Created transaction ID: ${transactionId}, Total: ${res.body.data?.total_amount}`);
    });
  }

  await runTest('Get all transactions', async () => {
    const res = await makeRequest('GET', '/transactions?page=1&limit=10', null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
    assert(Array.isArray(res.body.data), 'Data is not an array');
    log.info(`Found ${res.body.data?.length || 0} transactions`);
  });

  if (transactionId) {
    await runTest('Get transaction detail', async () => {
      const res = await makeRequest('GET', `/transactions/${transactionId}`, null, {
        'Authorization': `Bearer ${token}`
      });
      assert(res.status === 200, `Expected 200, got ${res.status}`);
      assert(res.body?.success === true, 'Success field missing');
      assert(Array.isArray(res.body.data?.items), 'Items not returned');
      log.info(`Transaction items: ${res.body.data.items.length}`);
    });
  }

  await runTest('Get transactions by date', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await makeRequest('GET', `/transactions/report/by-date?startDate=${today}&endDate=${today}`, null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
  });

  await runTest('Get top products', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await makeRequest('GET', `/transactions/report/top-products?limit=5&startDate=${today}&endDate=${today}`, null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
  });

  // ========== 5. REPORTS ==========
  log.header('5. REPORTS & ANALYTICS');

  await runTest('Get today daily summary', async () => {
    const res = await makeRequest('GET', '/reports/daily/today', null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
    const summary = res.body.data?.summary;
    log.info(`Today: ${summary?.total_transactions} transactions, Revenue: ${summary?.total_sales}`);
  });

  await runTest('Get date range summary', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await makeRequest('GET', `/reports/daily/range?startDate=${today}&endDate=${today}`, null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
  });

  await runTest('Save daily report', async () => {
    const today = new Date().toISOString().split('T')[0];
    const res = await makeRequest('POST', '/reports/daily/save', {
      reportDate: today,
      totalSales: 100000,
      totalTransactions: 5,
      notes: 'Test daily report'
    }, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
  });

  await runTest('Get dashboard overview', async () => {
    const res = await makeRequest('GET', '/reports/stats/overview', null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
    const stats = res.body.data;
    log.data(`Users: ${stats.total_users}, Products: ${stats.total_products}, Transactions: ${stats.total_transactions}`);
  });

  await runTest('Log sync event', async () => {
    const res = await makeRequest('POST', '/reports/sync-logs', {
      deviceId: 'POS-01',
      syncStatus: 'success',
      syncType: 'test',
      itemsSynced: 10
    }, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 201, `Expected 201, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
  });

  await runTest('Get sync logs', async () => {
    const res = await makeRequest('GET', '/reports/sync-logs?limit=10', null, {
      'Authorization': `Bearer ${token}`
    });
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    assert(res.body?.success === true, 'Success field missing');
    assert(Array.isArray(res.body.data), 'Data is not an array');
  });

  // ========== TEST SUMMARY ==========
  log.header('TEST SUMMARY');
  
  const totalTests = testsPassed + testsFailed;
  const passPercentage = totalTests > 0 ? ((testsPassed / totalTests) * 100).toFixed(2) : 0;

  console.log(`
${colors.green}Total Tests: ${totalTests}${colors.reset}
${colors.green}Passed: ${testsPassed}${colors.reset}
${colors.red}Failed: ${testsFailed}${colors.reset}
${colors.cyan}Success Rate: ${passPercentage}%${colors.reset}
  `);

  if (testsFailed === 0) {
    log.success('ALL TESTS PASSED! 🎉');
  } else {
    log.error(`${testsFailed} test(s) failed`);
  }

  console.log(`\nToken for manual testing:\n${colors.yellow}${token}${colors.reset}\n`);
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Handle errors
process.on('uncaughtException', (err) => {
  log.error(`Uncaught exception: ${err.message}`);
  process.exit(1);
});

// Run tests
runTests().catch(err => {
  log.error(`Test suite error: ${err.message}`);
  process.exit(1);
});