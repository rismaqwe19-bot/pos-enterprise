const express = require('express');
const router = express.Router();
const db = require('../config/database');
const auth = require('../middleware/auth');

// Get all products dengan pagination dan search
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Query dengan search
    let query = 'SELECT * FROM products';
    let countQuery = 'SELECT COUNT(*) FROM products';
    const params = [];

    if (search) {
      query += ' WHERE name ILIKE $1 OR barcode ILIKE $1';
      countQuery += ' WHERE name ILIKE $1 OR barcode ILIKE $1';
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get products dengan pagination
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
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
    console.error('Get products error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Get product by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Create product (admin/manager only)
router.post('/', auth, async (req, res) => {
  try {
    const { name, barcode, category, price, cost, stock, unit } = req.body;

    // Validasi input
    if (!name || !price || price < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nama dan harga harus diisi dengan benar' 
      });
    }

    // Check barcode unique
    if (barcode) {
      const checkBarcode = await db.query(
        'SELECT id FROM products WHERE barcode = $1',
        [barcode]
      );
      if (checkBarcode.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Barcode sudah terdaftar' 
        });
      }
    }

    const result = await db.query(
      `INSERT INTO products (name, barcode, category, price, cost, stock, unit, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [
        name,
        barcode || null,
        category || 'General',
        price,
        cost || 0,
        stock || 0,
        unit || 'pcs',
        req.userId
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Product berhasil ditambahkan',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Update product
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, barcode, category, price, cost, stock, unit } = req.body;

    // Check product exists
    const checkProduct = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (checkProduct.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product tidak ditemukan' 
      });
    }

    // Check barcode unique (jika berubah)
    if (barcode && barcode !== checkProduct.rows[0].barcode) {
      const checkBarcode = await db.query(
        'SELECT id FROM products WHERE barcode = $1',
        [barcode]
      );
      if (checkBarcode.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Barcode sudah terdaftar' 
        });
      }
    }

    const result = await db.query(
      `UPDATE products SET 
        name = COALESCE($1, name),
        barcode = COALESCE($2, barcode),
        category = COALESCE($3, category),
        price = COALESCE($4, price),
        cost = COALESCE($5, cost),
        stock = COALESCE($6, stock),
        unit = COALESCE($7, unit),
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        name || null,
        barcode || null,
        category || null,
        price || null,
        cost || null,
        stock || null,
        unit || null,
        id
      ]
    );

    res.json({
      success: true,
      message: 'Product updated',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Delete product
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING id, name',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      message: 'Product berhasil dihapus',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Update stock (untuk adjustment)
router.patch('/:id/stock', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type } = req.body; // type: 'add' atau 'subtract'

    if (!quantity || !type || !['add', 'subtract'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Quantity dan type (add/subtract) harus valid' 
      });
    }

    const operation = type === 'add' ? '+' : '-';

    const result = await db.query(
      `UPDATE products SET 
        stock = stock ${operation} $1,
        updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      message: `Stock updated (${type})`,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

module.exports = router;