const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const auth = require('../middleware/auth');

// Register user baru
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, fullName, role } = req.body;

    // Validasi input
    if (!username || !password || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, password, dan email harus diisi' 
      });
    }

    // Check user sudah ada
    const checkUser = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (checkUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username atau email sudah terdaftar' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user baru
    const newUser = await db.query(
      `INSERT INTO users (username, password, email, fullname, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, username, email, fullname, role`,
      [username, hashedPassword, email, fullName || username, role || 'cashier']
    );

    res.status(201).json({
      success: true,
      message: 'User berhasil didaftarkan',
      data: newUser.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error register: ' + error.message 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username dan password harus diisi' 
      });
    }

    // Cari user
    const userResult = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }

    const user = userResult.rows[0];

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Username atau password salah' 
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'secret-key-pos',
      { expiresIn: '24h' }
    );

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      token: token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullname: user.fullname,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error login: ' + error.message 
    });
  }
});

// Get profile (protected)
router.get('/profile', auth, async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT id, username, email, fullname, role, last_login, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      data: userResult.rows[0]
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

// Update profile (protected)
router.put('/profile', auth, async (req, res) => {
  try {
    const { email, fullName } = req.body;

    const updateResult = await db.query(
      `UPDATE users SET email = COALESCE($1, email), 
                        fullname = COALESCE($2, fullname),
                        updated_at = NOW()
       WHERE id = $3
       RETURNING id, username, email, fullname, role`,
      [email || null, fullName || null, req.userId]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User tidak ditemukan' 
      });
    }

    res.json({
      success: true,
      message: 'Profile updated',
      data: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error: ' + error.message 
    });
  }
});

module.exports = router;