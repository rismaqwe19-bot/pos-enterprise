const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get today's summary
router.get('/daily/today', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(item_count), 0) as total_items_sold,
        COALASE(COUNT(DISTINCT user_id), 0) as total_cashiers
       FROM transactions
       WHERE DATE(transaction_date) = CURRENT_DATE`
    );

    const summary = result.rows[0];

    // Get top products today
    const topProducts = await db.query(
      `SELECT p.id, p.name, SUM(ti.quantity) as qty, SUM(ti.subtotal) as revenue
       FROM transaction_items ti
       JOIN products p ON ti.product_id = p.id
       JOIN transactions t ON ti.transaction_id = t.id
       WHERE DATE(t.transaction_date) = CURRENT_DATE
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT 5`
    );

    // Get payment methods breakdown
    const paymentBreakdown = await db.query(
      `SELECT payment_method, COUNT(*) as count, SUM(total_amount) as amount
       FROM transactions
       WHERE DATE(transaction_date) = CURRENT_DATE
       GROUP BY payment_method`
    );

    res.json({
      success: true,
      data: {
        summary: summary,
        top_products: topProducts.rows,
        payment_breakdown: paymentBreakdown.rows
      }
    });
  } catch (error) {
    console.error('Get daily summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Get date range summary
router.get('/daily/range', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'startDate dan endDate harus diisi' 
      });
    }

    const result = await db.query(
      `SELECT 
        DATE(transaction_date) as date,
        COUNT(*) as total_transactions,
        SUM(total_amount) as total_sales,
        SUM(item_count) as items_sold,
        AVG(total_amount) as avg_transaction,
        COUNT(DISTINCT cashier_id) as cashiers
       FROM transactions
       WHERE transaction_date::date >= $1 AND transaction_date::date <= $2
       GROUP BY DATE(transaction_date)
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    // Calculate totals
    let totalSales = 0, totalTransactions = 0, totalItems = 0;
    result.rows.forEach(row => {
      totalSales += parseFloat(row.total_sales || 0);
      totalTransactions += parseInt(row.total_transactions);
      totalItems += parseInt(row.items_sold);
    });

    res.json({
      success: true,
      data: result.rows,
      totals: {
        total_sales: totalSales,
        total_transactions: totalTransactions,
        total_items: totalItems,
        avg_daily_sales: result.rows.length > 0 ? (totalSales / result.rows.length) : 0
      }
    });
  } catch (error) {
    console.error('Get range summary error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Save daily report to database
router.post('/daily/save', auth, async (req, res) => {
  try {
    const { reportDate, totalSales, totalTransactions, notes } = req.body;

    if (!reportDate || !totalSales) {
      return res.status(400).json({ 
        success: false, 
        message: 'reportDate dan totalSales harus diisi' 
      });
    }

    // Check if report already exists
    const check = await db.query(
      'SELECT id FROM daily_reports WHERE report_date = $1',
      [reportDate]
    );

    let result;
    if (check.rows.length > 0) {
      // Update
      result = await db.query(
        `UPDATE daily_reports SET 
          total_sales = $1, 
          total_transactions = $2, 
          notes = $3,
          created_by = $4,
          updated_at = NOW()
         WHERE report_date = $5
         RETURNING *`,
        [totalSales, totalTransactions || 0, notes || null, req.userId, reportDate]
      );
    } else {
      // Insert
      result = await db.query(
        `INSERT INTO daily_reports (report_date, total_sales, total_transactions, created_by, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [reportDate, totalSales, totalTransactions || 0, req.userId, notes || null]
      );
    }

    res.json({
      success: true,
      message: 'Daily report saved',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Save daily report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Get daily reports
router.get('/daily/saved', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;

    let query = 'SELECT * FROM daily_reports';
    const params = [];

    if (startDate && endDate) {
      query += ' WHERE report_date >= $1 AND report_date <= $2';
      params.push(startDate, endDate);
    }

    query += ' ORDER BY report_date DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get daily reports error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Get sync logs
router.get('/sync-logs', auth, async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT id, device_id, sync_status, sync_type, items_synced, created_at
       FROM sync_logs
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await db.query('SELECT COUNT(*) as total FROM sync_logs');

    res.json({
      success: true,
      data: result.rows,
      total: parseInt(countResult.rows[0].total)
    });
  } catch (error) {
    console.error('Get sync logs error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Log sync event
router.post('/sync-logs', auth, async (req, res) => {
  try {
    const { deviceId, syncStatus, syncType, itemsSynced } = req.body;

    if (!deviceId || !syncStatus) {
      return res.status(400).json({ 
        success: false, 
        message: 'deviceId dan syncStatus harus diisi' 
      });
    }

    const result = await db.query(
      `INSERT INTO sync_logs (device_id, sync_status, sync_type, items_synced, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [deviceId, syncStatus, syncType || 'manual', itemsSynced || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Sync log recorded',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create sync log error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Get dashboard stats (overall)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    // Total users
    const usersResult = await db.query('SELECT COUNT(*) as count FROM users');
    
    // Total products
    const productsResult = await db.query('SELECT COUNT(*) as count FROM products');
    
    // Total transactions
    const txnResult = await db.query('SELECT COUNT(*) as count FROM transactions');
    
    // Total revenue
    const revenueResult = await db.query(
      'SELECT COALESCE(SUM(total_amount), 0) as total FROM transactions'
    );

    // Low stock products
    const lowStockResult = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE stock < 10'
    );

    res.json({
      success: true,
      data: {
        total_users: parseInt(usersResult.rows[0].count),
        total_products: parseInt(productsResult.rows[0].count),
        total_transactions: parseInt(txnResult.rows[0].count),
        total_revenue: parseFloat(revenueResult.rows[0].total),
        low_stock_items: parseInt(lowStockResult.rows[0].count)
      }
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

module.exports = router;