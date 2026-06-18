/**
 * POS Dashboard Logic
 * Handle navigation, sales, products, dan reports
 */

let currentCart = [];
let currentProductId = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!api.isAuthenticated()) {
    window.location.href = '/pages/login.html';
    return;
  }

  // Setup
  setupNavigation();
  setupEventListeners();
  
  // Load initial data
  await loadDashboardData();
  document.getElementById('userName').textContent = api.user.username;

  // Auto-refresh dashboard every 30 seconds
  setInterval(loadDashboardData, 30000);
});

// ============== NAVIGATION ==============

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const pages = document.querySelectorAll('.page');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageName = link.dataset.page;
      
      // Update active nav
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // Show page
      pages.forEach(p => p.classList.add('hidden'));
      document.getElementById(pageName + 'Page').classList.remove('hidden');

      // Load page data
      if (pageName === 'sales') {
        loadProductsForSales();
      } else if (pageName === 'products') {
        loadProductsTable();
      } else if (pageName === 'history') {
        loadTransactionHistory();
      } else if (pageName === 'reports') {
        loadReportsData();
      }
    });
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Yakin ingin logout?')) {
      api.clearAuth();
      window.location.href = '/pages/login.html';
    }
  });
}

// ============== DASHBOARD PAGE ==============

async function loadDashboardData() {
  try {
    // Get today summary
    const summaryResult = await api.getTodaySummary();
    if (summaryResult.success) {
      const summary = summaryResult.data.summary;
      document.getElementById('statTransactions').textContent = summary.total_transactions || 0;
      document.getElementById('statSales').textContent = formatCurrency(summary.total_sales || 0);
      document.getElementById('statItems').textContent = summary.total_items_sold || 0;

      // Top products
      const topProducts = summaryResult.data.top_products || [];
      const tbody = document.getElementById('topProductsBody');
      tbody.innerHTML = '';
      
      if (topProducts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center">Belum ada penjualan</td></tr>';
      } else {
        topProducts.forEach(product => {
          tbody.innerHTML += `
            <tr>
              <td>${product.name}</td>
              <td>${product.qty}</td>
              <td>${formatCurrency(product.revenue)}</td>
            </tr>
          `;
        });
      }

      // Payment breakdown
      const breakdown = summaryResult.data.payment_breakdown || [];
      const paymentDiv = document.getElementById('paymentBreakdown');
      paymentDiv.innerHTML = '';
      breakdown.forEach(payment => {
        paymentDiv.innerHTML += `
          <div class="payment-item">
            <span class="payment-method">${payment.payment_method}</span>
            <span class="payment-count">${payment.count} transaksi</span>
            <span class="payment-amount">${formatCurrency(payment.amount)}</span>
          </div>
        `;
      });
    }

    // Get overall stats
    const statsResult = await api.getDashboardStats();
    if (statsResult.success) {
      document.getElementById('statProducts').textContent = statsResult.data.total_products || 0;
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showMessage('Error loading dashboard data', 'error');
  }
}

// ============== SALES PAGE ==============

async function loadProductsForSales() {
  try {
    const result = await api.getProducts(1, 100);
    if (result.success) {
      const productList = document.getElementById('productList');
      productList.innerHTML = '';

      result.data.forEach(product => {
        const stockClass = product.stock < 10 ? 'low-stock' : '';
        productList.innerHTML += `
          <div class="product-card ${stockClass}" data-product-id="${product.id}">
            <div class="product-name">${product.name}</div>
            <div class="product-price">${formatCurrency(product.price)}</div>
            <div class="product-stock">Stock: ${product.stock}</div>
            <button class="btn btn-small btn-primary add-to-cart" data-id="${product.id}" data-name="${product.name}" data-price="${product.price}">
              + Tambah
            </button>
          </div>
        `;
      });

      // Add to cart handler
      document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          addToCart(btn.dataset.id, btn.dataset.name, parseInt(btn.dataset.price));
        });
      });
    }
  } catch (error) {
    showMessage('Error loading products', 'error');
  }
}

function addToCart(productId, productName, price) {
  const existingItem = currentCart.find(item => item.product_id === parseInt(productId));

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    currentCart.push({
      product_id: parseInt(productId),
      name: productName,
      price: price,
      quantity: 1
    });
  }

  updateCartDisplay();
}

function removeFromCart(index) {
  currentCart.splice(index, 1);
  updateCartDisplay();
}

function updateQuantity(index, newQty) {
  if (newQty <= 0) {
    removeFromCart(index);
  } else {
    currentCart[index].quantity = newQty;
    updateCartDisplay();
  }
}

function updateCartDisplay() {
  const cartTable = document.getElementById('cartItems');
  const subtotalEl = document.getElementById('subtotal');
  const totalEl = document.getElementById('totalAmount');

  if (currentCart.length === 0) {
    cartTable.innerHTML = '<tr><td colspan="5" class="text-center">Keranjang kosong</td></tr>';
    subtotalEl.textContent = 'Rp 0';
    totalEl.textContent = 'Rp 0';
    return;
  }

  let subtotal = 0;
  cartTable.innerHTML = '';

  currentCart.forEach((item, index) => {
    const itemSubtotal = item.price * item.quantity;
    subtotal += itemSubtotal;

    cartTable.innerHTML += `
      <tr>
        <td>${item.name}</td>
        <td>
          <input type="number" value="${item.quantity}" class="input-small" 
            onchange="updateQuantity(${index}, parseInt(this.value))">
        </td>
        <td>${formatCurrency(item.price)}</td>
        <td>${formatCurrency(itemSubtotal)}</td>
        <td>
          <button class="btn btn-small btn-danger" onclick="removeFromCart(${index})">X</button>
        </td>
      </tr>
    `;
  });

  subtotalEl.textContent = formatCurrency(subtotal);
  
  const discount = parseInt(document.getElementById('discountAmount').value) || 0;
  const tax = parseInt(document.getElementById('taxAmount').value) || 0;
  const total = subtotal - discount + tax;
  
  totalEl.textContent = formatCurrency(total);
}

// ============== PRODUCTS PAGE ==============

async function loadProductsTable() {
  try {
    const result = await api.getProducts(1, 50);
    if (result.success) {
      const tbody = document.getElementById('productsTableBody');
      tbody.innerHTML = '';

      result.data.forEach(product => {
        tbody.innerHTML += `
          <tr>
            <td>${product.name}</td>
            <td>${product.barcode || '-'}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.stock}</td>
            <td>${product.category || '-'}</td>
            <td>
              <button class="btn btn-small btn-primary edit-product" data-id="${product.id}">Edit</button>
              <button class="btn btn-small btn-danger delete-product" data-id="${product.id}">Hapus</button>
            </td>
          </tr>
        `;
      });

      // Event listeners
      document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', () => editProduct(btn.dataset.id));
      });

      document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
      });
    }
  } catch (error) {
    showMessage('Error loading products', 'error');
  }
}

async function deleteProduct(id) {
  if (confirm('Yakin ingin menghapus produk ini?')) {
    try {
      const result = await api.deleteProduct(id);
      if (result.success) {
        showMessage('Produk berhasil dihapus', 'success');
        loadProductsTable();
      } else {
        showMessage(result.message || 'Error menghapus produk', 'error');
      }
    } catch (error) {
      showMessage('Error: ' + error.message, 'error');
    }
  }
}

async function editProduct(id) {
  try {
    const result = await api.getProductById(id);
    if (result.success) {
      const product = result.data;
      currentProductId = id;

      document.getElementById('productModalTitle').textContent = 'Edit Produk';
      document.getElementById('productName').value = product.name;
      document.getElementById('productBarcode').value = product.barcode || '';
      document.getElementById('productCategory').value = product.category || '';
      document.getElementById('productPrice').value = product.price;
      document.getElementById('productCost').value = product.cost || '';
      document.getElementById('productStock').value = product.stock;
      document.getElementById('productUnit').value = product.unit || 'pcs';

      openModal('productModal');
    }
  } catch (error) {
    showMessage('Error loading product', 'error');
  }
}

// ============== TRANSACTION HISTORY ==============

async function loadTransactionHistory() {
  try {
    const result = await api.getTransactions(1, 20);
    if (result.success) {
      const tbody = document.getElementById('historyTableBody');
      tbody.innerHTML = '';

      result.data.forEach(tx => {
        const date = new Date(tx.transaction_date).toLocaleDateString('id-ID');
        tbody.innerHTML += `
          <tr>
            <td>#${tx.id}</td>
            <td>${date}</td>
            <td>${formatCurrency(tx.total_amount)}</td>
            <td>${tx.item_count}</td>
            <td>${tx.payment_method}</td>
            <td>
              <button class="btn btn-small btn-primary view-tx" data-id="${tx.id}">Lihat</button>
            </td>
          </tr>
        `;
      });

      document.querySelectorAll('.view-tx').forEach(btn => {
        btn.addEventListener('click', () => viewTransaction(btn.dataset.id));
      });
    }
  } catch (error) {
    showMessage('Error loading transactions', 'error');
  }
}

async function viewTransaction(id) {
  try {
    const result = await api.getTransactionById(id);
    if (result.success) {
      const tx = result.data;
      let itemsHtml = tx.items.map(item => `
        <tr>
          <td>${item.product_name}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(item.price)}</td>
          <td>${formatCurrency(item.subtotal)}</td>
        </tr>
      `).join('');

      alert(`Transaksi #${tx.id}\nTotal: ${formatCurrency(tx.total_amount)}\nMetode: ${tx.payment_method}`);
    }
  } catch (error) {
    showMessage('Error loading transaction', 'error');
  }
}

// ============== REPORTS PAGE ==============

async function loadReportsData() {
  try {
    const stats = await api.getDashboardStats();
    if (stats.success) {
      document.getElementById('reportTodayTx').textContent = stats.data.total_transactions;
      document.getElementById('reportTotalUsers').textContent = stats.data.total_users;
      document.getElementById('reportTotalProducts').textContent = stats.data.total_products;
    }

    const summary = await api.getTodaySummary();
    if (summary.success) {
      document.getElementById('reportTodaySales').textContent = formatCurrency(summary.data.summary.total_sales);
    }
  } catch (error) {
    console.error('Error loading reports:', error);
  }
}

// ============== EVENT LISTENERS ==============

function setupEventListeners() {
  // Refresh dashboard
  document.getElementById('refreshDashboard')?.addEventListener('click', loadDashboardData);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Yakin ingin logout?')) {
      api.clearAuth();
      window.location.href = '/pages/login.html';
    }
  });

  // Product search
  document.getElementById('productSearch')?.addEventListener('keyup', (e) => {
    const search = e.target.value.toLowerCase();
    document.querySelectorAll('.product-card').forEach(card => {
      const visible = card.textContent.toLowerCase().includes(search);
      card.style.display = visible ? 'block' : 'none';
    });
  });

  // Cart updates
  document.getElementById('discountAmount')?.addEventListener('change', updateCartDisplay);
  document.getElementById('taxAmount')?.addEventListener('change', updateCartDisplay);

  // Checkout
  document.getElementById('checkoutBtn')?.addEventListener('click', checkout);
  document.getElementById('clearCartBtn')?.addEventListener('click', () => {
    currentCart = [];
    updateCartDisplay();
  });

  // New product
  document.getElementById('newProductBtn')?.addEventListener('click', () => {
    currentProductId = null;
    document.getElementById('productModalTitle').textContent = 'Produk Baru';
    document.getElementById('productForm').reset();
    openModal('productModal');
  });

  // Product form
  document.getElementById('productForm')?.addEventListener('submit', saveProduct);

  // Modal close
  document.querySelectorAll('.close-btn, .close-modal').forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Filter history
  document.getElementById('filterHistoryBtn')?.addEventListener('click', loadTransactionHistory);

  // Generate report
  document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
}

async function checkout() {
  if (currentCart.length === 0) {
    showMessage('Keranjang kosong', 'error');
    return;
  }

  try {
    const discount = parseInt(document.getElementById('discountAmount').value) || 0;
    const tax = parseInt(document.getElementById('taxAmount').value) || 0;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('notes').value;

    const result = await api.createTransaction(
      currentCart,
      paymentMethod,
      discount,
      tax,
      notes
    );

    if (result.success) {
      showMessage('Transaksi berhasil disimpan!', 'success');
      currentCart = [];
      updateCartDisplay();
      document.getElementById('productForm').reset();
      
      // Reload dashboard
      setTimeout(loadDashboardData, 1000);
    } else {
      showMessage(result.message || 'Error menyimpan transaksi', 'error');
    }
  } catch (error) {
    showMessage('Error: ' + error.message, 'error');
  }
}

async function saveProduct() {
  const name = document.getElementById('productName').value;
  const barcode = document.getElementById('productBarcode').value;
  const category = document.getElementById('productCategory').value;
  const price = parseInt(document.getElementById('productPrice').value);
  const cost = parseInt(document.getElementById('productCost').value) || 0;
  const stock = parseInt(document.getElementById('productStock').value);
  const unit = document.getElementById('productUnit').value;

  try {
    let result;
    if (currentProductId) {
      result = await api.updateProduct(currentProductId, {
        name, barcode, category, price, cost, stock, unit
      });
    } else {
      result = await api.createProduct(name, barcode, category, price, cost, stock, unit);
    }

    if (result.success) {
      showMessage('Produk berhasil disimpan', 'success');
      closeModal();
      loadProductsTable();
    } else {
      showMessage(result.message || 'Error menyimpan produk', 'error');
    }
  } catch (error) {
    showMessage('Error: ' + error.message, 'error');
  }
}

async function generateReport() {
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;

  if (!startDate || !endDate) {
    showMessage('Pilih tanggal terlebih dahulu', 'error');
    return;
  }

  try {
    const result = await api.getDailyRange(startDate, endDate);
    if (result.success) {
      const tbody = document.getElementById('reportTableBody');
      tbody.innerHTML = '';

      result.data.forEach(row => {
        tbody.innerHTML += `
          <tr>
            <td>${row.date}</td>
            <td>${row.total_transactions}</td>
            <td>${formatCurrency(row.total_sales)}</td>
            <td>${row.items_sold}</td>
            <td>${formatCurrency(row.avg_transaction)}</td>
          </tr>
        `;
      });

      document.getElementById('reportTable').style.display = 'table';
    }
  } catch (error) {
    showMessage('Error generating report', 'error');
  }
}

// ============== HELPER FUNCTIONS ==============

function openModal(modalId) {
  document.getElementById(modalId).classList.remove('hidden');
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
}

function showMessage(message, type = 'info') {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `message ${type}`;
  div.textContent = message;
  container.appendChild(div);

  setTimeout(() => div.remove(), 4000);
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}