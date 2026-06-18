/**
 * API Client untuk POS Enterprise
 * Handle semua HTTP requests ke backend dengan token management
 */

class PosAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('token');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
  }

  /**
   * Set token dan user setelah login
   */
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Clear auth saat logout
   */
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Check apakah user sudah login
   */
  isAuthenticated() {
    return !!this.token;
  }

  /**
   * Generic HTTP request method
   */
  async request(method, endpoint, data = null) {
    const url = `${this.baseURL}${endpoint}`;
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // Add token jika ada
    if (this.token) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    // Add body jika ada data
    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const json = await response.json();

      // Check if response is success
      if (!json.success && response.status === 401) {
        // Token expired atau invalid
        this.clearAuth();
        window.location.href = '/login.html';
        throw new Error('Session expired. Please login again.');
      }

      return json;
    } catch (error) {
      console.error(`API Error [${method} ${endpoint}]:`, error);
      throw error;
    }
  }

  // ============== AUTHENTICATION ==============

  /**
   * POST /auth/register
   */
  async register(username, password, email, fullName) {
    return this.request('POST', '/auth/register', {
      username,
      password,
      email,
      fullName
    });
  }

  /**
   * POST /auth/login
   */
  async login(username, password) {
    const result = await this.request('POST', '/auth/login', {
      username,
      password
    });

    if (result.success) {
      this.setAuth(result.token, result.user);
    }

    return result;
  }

  /**
   * GET /auth/profile
   */
  async getProfile() {
    return this.request('GET', '/auth/profile');
  }

  /**
   * PUT /auth/profile
   */
  async updateProfile(email, fullName) {
    return this.request('PUT', '/auth/profile', {
      email,
      fullName
    });
  }

  // ============== PRODUCTS ==============

  /**
   * GET /products - List dengan pagination
   */
  async getProducts(page = 1, limit = 10, search = '') {
    let endpoint = `/products?page=${page}&limit=${limit}`;
    if (search) {
      endpoint += `&search=${encodeURIComponent(search)}`;
    }
    return this.request('GET', endpoint);
  }

  /**
   * GET /products/:id
   */
  async getProductById(id) {
    return this.request('GET', `/products/${id}`);
  }

  /**
   * POST /products - Create product
   */
  async createProduct(name, barcode, category, price, cost, stock, unit = 'pcs') {
    return this.request('POST', '/products', {
      name,
      barcode,
      category,
      price,
      cost,
      stock,
      unit
    });
  }

  /**
   * PUT /products/:id - Update product
   */
  async updateProduct(id, data) {
    return this.request('PUT', `/products/${id}`, data);
  }

  /**
   * DELETE /products/:id
   */
  async deleteProduct(id) {
    return this.request('DELETE', `/products/${id}`);
  }

  /**
   * PATCH /products/:id/stock - Update stock
   */
  async updateStock(id, quantity, type = 'add') {
    return this.request('PATCH', `/products/${id}/stock`, {
      quantity,
      type // 'add' or 'subtract'
    });
  }

  // ============== TRANSACTIONS ==============

  /**
   * GET /transactions - List transactions
   */
  async getTransactions(page = 1, limit = 10, startDate = null, endDate = null) {
    let endpoint = `/transactions?page=${page}&limit=${limit}`;
    if (startDate && endDate) {
      endpoint += `&startDate=${startDate}&endDate=${endDate}`;
    }
    return this.request('GET', endpoint);
  }

  /**
   * GET /transactions/:id - Get transaction detail
   */
  async getTransactionById(id) {
    return this.request('GET', `/transactions/${id}`);
  }

  /**
   * POST /transactions - Create transaction (sale)
   */
  async createTransaction(items, paymentMethod = 'cash', discountAmount = 0, taxAmount = 0, notes = '') {
    return this.request('POST', '/transactions', {
      items,
      paymentMethod,
      discountAmount,
      taxAmount,
      notes
    });
  }

  /**
   * GET /transactions/report/by-date
   */
  async getTransactionReport(startDate, endDate) {
    return this.request('GET', `/transactions/report/by-date?startDate=${startDate}&endDate=${endDate}`);
  }

  /**
   * GET /transactions/report/top-products
   */
  async getTopProducts(limit = 10, startDate = null, endDate = null) {
    let endpoint = `/transactions/report/top-products?limit=${limit}`;
    if (startDate && endDate) {
      endpoint += `&startDate=${startDate}&endDate=${endDate}`;
    }
    return this.request('GET', endpoint);
  }

  // ============== REPORTS ==============

  /**
   * GET /reports/daily/today
   */
  async getTodaySummary() {
    return this.request('GET', '/reports/daily/today');
  }

  /**
   * GET /reports/daily/range
   */
  async getDailyRange(startDate, endDate) {
    return this.request('GET', `/reports/daily/range?startDate=${startDate}&endDate=${endDate}`);
  }

  /**
   * POST /reports/daily/save
   */
  async saveDailyReport(reportDate, totalSales, totalTransactions, notes) {
    return this.request('POST', '/reports/daily/save', {
      reportDate,
      totalSales,
      totalTransactions,
      notes
    });
  }

  /**
   * GET /reports/daily/saved
   */
  async getSavedReports(startDate = null, endDate = null, limit = 30) {
    let endpoint = `/reports/daily/saved?limit=${limit}`;
    if (startDate && endDate) {
      endpoint += `&startDate=${startDate}&endDate=${endDate}`;
    }
    return this.request('GET', endpoint);
  }

  /**
   * GET /reports/stats/overview
   */
  async getDashboardStats() {
    return this.request('GET', '/reports/stats/overview');
  }

  /**
   * POST /reports/sync-logs
   */
  async logSyncEvent(deviceId, syncStatus, syncType = 'manual', itemsSynced = 0) {
    return this.request('POST', '/reports/sync-logs', {
      deviceId,
      syncStatus,
      syncType,
      itemsSynced
    });
  }

  /**
   * GET /reports/sync-logs
   */
  async getSyncLogs(limit = 50, offset = 0) {
    return this.request('GET', `/reports/sync-logs?limit=${limit}&offset=${offset}`);
  }
}

// Export untuk digunakan di semua pages
const api = new PosAPI();