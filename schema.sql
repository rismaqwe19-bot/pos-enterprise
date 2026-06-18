-- 1. Bersihkan tabel lama jika ada (Urutan diatur agar tidak melanggar foreign key)
DROP TABLE IF EXISTS sync_logs CASCADE;
DROP TABLE IF EXISTS daily_reports CASCADE;
DROP TABLE IF EXISTS transaction_items CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Buat ulang tabel dengan struktur baru
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL, -- Kolom baru ditambahkan di sini
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'cashier',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  barcode VARCHAR(50) UNIQUE,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock INT DEFAULT 0,
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  total_amount DECIMAL(12, 2),
  payment_method VARCHAR(50),
  status VARCHAR(20) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Transaction items table
CREATE TABLE transaction_items (
  id SERIAL PRIMARY KEY,
  transaction_id INT REFERENCES transactions(id) ON DELETE CASCADE,
  product_id INT REFERENCES products(id),
  quantity INT,
  unit_price DECIMAL(10, 2),
  subtotal DECIMAL(12, 2)
);

-- Daily reports table
CREATE TABLE daily_reports (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE, -- Ditambahkan UNIQUE agar laporan per tanggal tidak ganda
  total_sales DECIMAL(12, 2),
  total_transactions INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sync logs table
CREATE TABLE sync_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE SET NULL, -- Dibuat relasi formal ke users
  action VARCHAR(50),
  table_name VARCHAR(50),
  record_id INT,
  timestamp TIMESTAMP DEFAULT NOW()
);