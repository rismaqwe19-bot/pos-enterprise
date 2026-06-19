# 📝 PANDUAN IMPLEMENTASI STEP BY STEP - APLIKASI POS

## 🎯 Ringkasan File yang Sudah Disiapkan

| No | File | Fungsi |
|---|---|---|
| 00 | Panduan Instalasi | Setup environment di Ubuntu |
| 01-09 | Migrations | Database schema semua tabel |
| 10-18 | Models | Model & relationships |
| 19 | DatabaseSeeder | Data awal aplikasi |
| 20-25 | Controllers | Business logic lengkap |
| 26 | Web Routes | Routing aplikasi |
| 27 | RoleMiddleware | Middleware role-based access |

---

## ⚙️ STEP 1: SETUP PROJECT LARAVEL (15 menit)

Ikuti panduan di file `00_PANDUAN_INSTALASI_POS.md` untuk:
- Install PHP 8.2+, Composer, Node.js, MySQL
- Setup database dan user
- Create Laravel project baru
- Edit .env file dengan credentials database

Setelah selesai, folder project akan ada di `/var/www/kasir-pos`

---

## 📂 STEP 2: COPY FILES KE PROJECT (10 menit)

### 2.1 Copy Migration Files✅
```bash
cd /var/www/kasir-pos

# Copy ke folder migrations
cp 01_migration_create_users_table.php database/migrations/
cp 02_migration_create_categories_table.php database/migrations/
cp 03_migration_create_products_table.php database/migrations/
cp 04_migration_create_customers_table.php database/migrations/
cp 05_migration_create_transactions_table.php database/migrations/
cp 06_migration_create_transaction_details_table.php database/migrations/
cp 07_migration_create_stock_movements_table.php database/migrations/
cp 08_migration_create_access_controls_table.php database/migrations/
cp 09_migration_create_sales_reports_table.php database/migrations/

# Rename files ke format yang benar dengan timestamp
# Contoh: 0001_01_01_000002_create_jobs_table.php
```

### 2.2 Rename Migration Files dengan Timestamp✅
```bash
cd database/migrations

# Ganti TIMESTAMP dengan tanggal hari ini (format: 2024_01_15)
# Ganti NOMOR dengan 000001, 000002, dst

# Contoh struktur nama file yang benar:
# 2024_01_15_000001_create_users_table.php
# 2024_01_15_000002_create_categories_table.php
# dst...
```

### 2.3 Copy Model Files✅
```bash
cd /var/www/kasir-pos

cp 10_Model_User.php app/Models/User.php
cp 11_Model_Category.php app/Models/Category.php
cp 12_Model_Product.php app/Models/Product.php
cp 13_Model_Customer.php app/Models/Customer.php
cp 14_Model_Transaction.php app/Models/Transaction.php
cp 15_Model_TransactionDetail.php app/Models/TransactionDetail.php
cp 16_Model_StockMovement.php app/Models/StockMovement.php
cp 17_Model_AccessControl.php app/Models/AccessControl.php
cp 18_Model_SalesReport.php app/Models/SalesReport.php
```

### 2.4 Copy Controller Files
```bash
cd /var/www/kasir-pos

cp 20_CategoryController.php app/Http/Controllers/CategoryController.php
cp 21_ProductController.php app/Http/Controllers/ProductController.php
cp 22_CustomerController.php app/Http/Controllers/CustomerController.php
cp 23_TransactionController.php app/Http/Controllers/TransactionController.php
cp 24_ReportController.php app/Http/Controllers/ReportController.php
cp 25_UserController.php app/Http/Controllers/UserController.php
```

### 2.5 Copy Seeder File
```bash
cp 19_DatabaseSeeder.php database/seeders/DatabaseSeeder.php
```

### 2.6 Copy Routes File
```bash
# Edit routes/web.php dan copy semua routes dari 26_web_routes.php
nano routes/web.php
# Paste seluruh kode dari 26_web_routes.php
```

### 2.7 Copy Middleware
```bash
cp 27_RoleMiddleware.php app/Http/Middleware/RoleMiddleware.php
```

---

## 🔧 STEP 3: REGISTER MIDDLEWARE DI KERNEL (5 menit)

### 3.1 Edit app/Http/Kernel.php
```bash
nano app/Http/Kernel.php
```

### 3.2 Cari section `protected $routeMiddleware = [`
Tambahkan di dalamnya:
```php
'role' => \App\Http\Middleware\RoleMiddleware::class,
```

Contoh hasil akhir:
```php
protected $routeMiddleware = [
    // ... middleware lainnya
    'role' => \App\Http\Middleware\RoleMiddleware::class,
];
```

---

## 🗂️ STEP 4: SETUP AUTH & CORE CONFIG (10 menit)

### 4.1 Generate Controller Auth (jika belum ada)
```bash
php artisan make:controller AuthController --no-model
```

### 4.2 Membuat Login/Register Views
Untuk saat ini gunakan form bootstrap sederhana atau tunggu panduan views.

### 4.3 Setup default User model
User model sudah di-override di file 10_Model_User.php

---

## 🗄️ STEP 5: JALANKAN MIGRATIONS & SEEDING (10 menit)

### 5.1 Test connection
```bash
php artisan migrate:status
# Jika ada error, pastikan .env sudah benar
```

### 5.2 Jalankan migrations
```bash
php artisan migrate
```

Jika error karena foreign key, coba:
```bash
php artisan migrate --force
```

### 5.3 Jalankan seeder untuk data awal
```bash
php artisan db:seed
```

Jika ingin clean start:
```bash
php artisan migrate:reset
php artisan migrate
php artisan db:seed
```

---

## ✅ STEP 6: TEST APLIKASI (5 menit)

### 6.1 Jalankan development server
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

### 6.2 Test login dengan credentials:
- **Admin**: admin@example.com / password
- **Kasir 1**: kasir1@example.com / password
- **Kasir 2**: kasir2@example.com / password
- **Kepala**: kepala@example.com / password

### 6.3 Test basic functions:
- ✅ Login dengan different roles
- ✅ Lihat dashboard sesuai role
- ✅ Akses menu sesuai permissions
- ✅ Coba create transaction (Kasir)
- ✅ Lihat reports (Kepala)

---

## 📖 PENJELASAN STRUKTUR DATABASE

### 1. **Users Table** - Pengguna sistem dengan 3 role
- admin: Full access ke semua menu
- kasir: Hanya bisa create transaksi & view transaksi mereka
- kepala: Hanya bisa view reports & analytics

### 2. **Categories** - Kategori produk (CRUD Admin)
- Produk dikelompokkan per kategori
- Setiap kategori punya created_by & updated_by

### 3. **Products** - Daftar produk dengan gambar otomatis
- Setiap produk punya purchase_price & selling_price
- Image disimpan otomatis di `storage/app/public/products`
- Tracking min_stock untuk alert stok rendah

### 4. **Customers** - Data pelanggan
- Support credit limit & current_debt tracking
- Type: retail atau wholesale

### 5. **Transactions** - Transaksi penjualan PER KASIR
- code: Unique transaction number (TRXYYYYMMDDxxxx)
- user_id: Kasir yang membuat transaksi
- status: pending → completed → cancelled
- Tracking subtotal, tax, discount, total

### 6. **TransactionDetails** - Detail items dalam transaksi
- One transaction banyak details
- Tracking quantity, unit_price, discount per item
- Menyimpan nama & code produk saat transaksi (untuk history)

### 7. **StockMovements** - Riwayat stok OTOMATIS
- Setiap transaksi → StockMovement recorded otomatis
- type: in (masuk) atau out (keluar)
- reason: sales, purchase, adjustment, return, damage
- tracking stock_before & stock_after untuk audit trail

### 8. **AccessControls** - Manajemen hak akses per role
- Define permission untuk setiap role
- Admin punya semua permission
- Kasir hanya punya permission untuk transaksi
- Kepala hanya punya permission untuk reports

### 9. **SalesReports** - Laporan penjualan harian
- Generated otomatis setelah transaksi
- Tracking profit & profit_margin
- Per-date dan per-kasir

---

## 🔐 FLOW AUTHORIZATION (Role-Based)

### Admin
```
✅ view_dashboard
✅ manage_users
✅ manage_categories
✅ manage_products
✅ manage_customers
✅ view_transactions
✅ create_transaction
✅ view_reports
✅ manage_access_control
✅ view_stock_movements
```

### Kasir
```
✅ view_dashboard (hanya sales hari ini)
✅ view_transactions (hanya milik sendiri)
✅ create_transaction (important!)
✅ print_invoice
✅ print_receipt
❌ manage_users
❌ manage_products
❌ view_all_reports
```

### Kepala
```
✅ view_dashboard
✅ view_transactions (all)
✅ view_reports
✅ view_sales_reports
✅ view_profit_reports
✅ view_stock_movements
❌ create_transaction
❌ manage_users
❌ manage_products
```

---

## 💡 KEY FEATURES YANG SUDAH IMPLEMENTED

### ✅ Dashboard Mobile Responsive
- Akan dibuat dengan Tailwind CSS
- Show summary per role

### ✅ CRUD Lengkap untuk:
- Categories (Admin)
- Products (Admin)
- Customers (Admin)
- Users (Admin)
- Transactions (Kasir & Admin)
- Access Controls (Admin)

### ✅ Gambar Produk Otomatis
- Upload di ProductController::store() & update()
- Disimpan ke `storage/app/public/products`
- Auto-generated filename dengan timestamp

### ✅ Manajemen Stok Otomatis
- Saat create transaction → stok -quantity otomatis
- StockMovement table recorded setiap perubahan
- Cancel transaction → stok restored otomatis
- Adjust stock dengan reason tracking

### ✅ Data Transaksi Per Kasir
- Kasir hanya lihat transaksi milik mereka
- Transaction.user_id = auth()->id()
- Admin bisa lihat semua + filter by kasir

### ✅ Print Struk & Invoice
- Controller method printInvoice() & printReceipt()
- Will use Blade views + CSS print styling

### ✅ Laporan Penjualan & Keuntungan
- ReportController sudah handle:
  - Sales Report by date range
  - Profit Report by product & by user
  - Daily breakdown
  - Export to CSV

### ✅ Riwayat Transaksi
- Transaction history per kasir
- Transaction history all (admin/kepala)
- Filter by date, status, kasir

---

## 🚀 NEXT STEPS - VIEWS & UI

Setelah database & logic selesai, buat:

1. **Auth Views** (login, register, forgot password)
2. **Dashboard** (different per role)
3. **Categories CRUD** (form create/edit, list)
4. **Products CRUD** (form dengan image upload)
5. **Customers CRUD** (form & list)
6. **Users CRUD** (form & list)
7. **POS Interface** (transaction create - most important)
8. **Reports** (sales, profit, transaction history)

---

## ⚠️ TROUBLESHOOTING COMMON ISSUES

### Error: "Class not found"
```bash
composer dump-autoload
php artisan cache:clear
```

### Error: "Table doesn't exist"
```bash
php artisan migrate:reset
php artisan migrate
php artisan db:seed
```

### Error: "SQLSTATE[HY000]: General error"
Pastikan .env DB credentials benar:
```
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kasir_pos_db
DB_USERNAME=kasir_user
DB_PASSWORD=password_yang_aman
```

### Error: "Storage path not found"
```bash
php artisan storage:link
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

### Error: Foreign Key Constraint
Jika migration ada error tentang foreign key:
```bash
# Edit migrations agar sesuai urutan
# Atau tambahkan di .env:
DB_FOREIGN_KEYS=true

# Kemudian:
php artisan migrate:reset
php artisan migrate
```

---

## 📱 TESTING CHECKLIST

- [ ] Login dengan 3 role berbeda
- [ ] Dashboard menampilkan data sesuai role
- [ ] Kasir bisa create transaksi
- [ ] Stok berkurang otomatis saat transaksi
- [ ] StockMovement tercatat
- [ ] Cancel transaksi, stok restored
- [ ] Admin bisa manage categories
- [ ] Admin bisa manage products dengan gambar
- [ ] Admin bisa manage customers
- [ ] Admin bisa manage users
- [ ] Kepala bisa lihat reports
- [ ] Kasir hanya lihat transaksi mereka
- [ ] Admin bisa lihat semua transaksi
- [ ] Export report ke CSV
- [ ] Print invoice berfungsi
- [ ] Print receipt berfungsi

---

## 📞 SUPPORT & DEBUGGING

Jika ada error saat implementasi:

1. **Check Laravel logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Clear all caches**:
   ```bash
   php artisan cache:clear
   php artisan config:clear
   php artisan view:clear
   php artisan route:clear
   ```

3. **Regenerate autoload**:
   ```bash
   composer dump-autoload
   ```

4. **Check database connection**:
   ```bash
   mysql -u kasir_user -p kasir_pos_db
   ```

---

**✅ Setelah STEP 1-6 selesai, aplikasi POS siap digunakan!**

Untuk UI/Views, ikuti panduan di file berikutnya yang akan mencakup:
- Bootstrap/Tailwind setup
- All blade templates
- AJAX integration
- Real-time updates

