const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all transactions dengan pagination
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM transactions';
    let countQuery = 'SELECT COUNT(*) FROM transactions';
    const params = [];

    // Filter by date range jika ada
    if (startDate && endDate) {
      query += ' WHERE transaction_date::date >= $1 AND transaction_date::date <= $2';
      countQuery += ' WHERE transaction_date::date >= $1 AND transaction_date::date <= $2';
      params.push(startDate, endDate);
    }

    // Get total count
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get transactions dengan pagination
    query += ' ORDER BY transaction_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Get transaction detail dengan items
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Get transaction
    const txnResult = await db.query(
      `SELECT t.*, u.username as cashier_name
       FROM transactions t
       LEFT JOIN users u ON t.cashier_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (txnResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Transaction tidak ditemukan' 
      });
    }

    // Get transaction items
    const itemsResult = await db.query(
      `SELECT ti.*, p.name as product_name, p.barcode
       FROM transaction_items ti
       LEFT JOIN products p ON ti.product_id = p.id
       WHERE ti.transaction_id = $1
       ORDER BY ti.id`,
      [id]
    );

    const transaction = txnResult.rows[0];
    transaction.items = itemsResult.rows;

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Create transaction (kompleks - dengan items)
router.post('/', auth, async (req, res) => {
  const client = await db.connect();
  try {
    const { items, paymentMethod, notes, discountAmount = 0, taxAmount = 0 } = req.body;

    // Validasi input
    if (!items || items.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Minimal 1 item harus ada' 
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Calculate total
    let totalAmount = 0;
    let totalQuantity = 0;

    // Validate stock dan calculate total
    for (const item of items) {
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ 
          success: false, 
          message: `Product ID ${item.product_id} tidak ditemukan` 
        });
      }

      const product = productResult.rows[0];

      // Check stock
      if (product.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          success: false, 
          message: `Stock ${product.name} tidak cukup (available: ${product.stock})` 
        });
      }

      totalAmount += item.quantity * item.price;
      totalQuantity += item.quantity;
    }

    // Calculate final total dengan tax dan discount
    const finalTotal = totalAmount + (taxAmount || 0) - (discountAmount || 0);

    // Insert transaction
    const txnResult = await client.query(
      `INSERT INTO transactions (transaction_date, cashier_id, total_amount, item_count, payment_method, discount_amount, tax_amount, notes, created_at, updated_at)
       VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, transaction_date, total_amount, item_count`,
      [req.userId, finalTotal, totalQuantity, paymentMethod || 'cash', discountAmount, taxAmount, notes || null]
    );

    const transactionId = txnResult.rows[0].id;

    // Insert transaction items dan update stock
    for (const item of items) {
      // Insert item
      await client.query(
        `INSERT INTO transaction_items (transaction_id, product_id, quantity, price, subtotal, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [transactionId, item.product_id, item.quantity, item.price, item.quantity * item.price]
      );

      // Update stock
      await client.query(
        'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
        [item.quantity, item.product_id]
      );
    }

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Transaction created',
      data: {
        id: transactionId,
        transaction_date: txnResult.rows[0].transaction_date,
        total_amount: finalTotal,
        item_count: totalQuantity,
        payment_method: paymentMethod || 'cash'
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create transaction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  } finally {
    client.release();
  }
});

// Get transactions by date range
router.get('/report/by-date', auth, async (req, res) => {
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
        SUM(item_count) as total_items,
        AVG(total_amount) as avg_transaction
       FROM transactions
       WHERE transaction_date::date >= $1 AND transaction_date::date <= $2
       GROUP BY DATE(transaction_date)
       ORDER BY date DESC`,
      [startDate, endDate]
    );

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Get top selling products
router.get('/report/top-products', auth, async (req, res) => {
  try {
    const { limit = 10, startDate, endDate } = req.query;

    let query = `SELECT 
      p.id, p.name, p.barcode,
      COUNT(ti.id) as sold_count,
      SUM(ti.quantity) as total_quantity,
      SUM(ti.subtotal) as total_revenue
    FROM transaction_items ti
    JOIN products p ON ti.product_id = p.id
    JOIN transactions t ON ti.transaction_id = t.id`;

    const params = [];

    if (startDate && endDate) {
      query += ` WHERE t.transaction_date::date >= $1 AND t.transaction_date::date <= $2`;
      params.push(startDate, endDate);
    }

    query += ` GROUP BY p.id, p.name, p.barcode
      ORDER BY total_revenue DESC
      LIMIT $${params.length + 1}`;

    params.push(limit);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

module.exports = router;