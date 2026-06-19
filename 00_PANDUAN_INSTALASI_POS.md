# Panduan Lengkap Instalasi Aplikasi Kasir POS Berbasis Laravel

## 📋 Persyaratan Sistem
- **OS**: Ubuntu 20.04 / 22.04 / 24.04
- **PHP**: 8.2 atau lebih tinggi
- **Laravel**: 10 atau 11
- **Database**: MySQL 8.0+
- **Node.js**: 18+ (untuk asset compilation)
- **Composer**: 2.0+

---

## 🔧 STEP 1: Persiapan Environment di Ubuntu

### 1.1 Update sistem dan install dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git unzip nano vim
```

### 1.2 Install PHP 8.2 dan ekstensions yang diperlukan
```bash
sudo apt install -y php8.2 php8.2-cli php8.2-fpm
sudo apt install -y php8.2-mysql php8.2-mbstring php8.2-xml php8.2-bcmath 
sudo apt install -y php8.2-curl php8.2-zip php8.2-gd php8.2-json php8.2-common
```

### 1.3 Install Composer
```bash
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
composer --version
```

### 1.4 Install MySQL Server
```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
# Ikuti prosesnya dan set password root
```

### 1.5 Install Node.js dan npm
```bash
sudo apt install -y nodejs npm
node --version && npm --version
```

### 1.6 Install Apache Web Server (atau Nginx)
```bash
# Untuk Apache:
sudo apt install -y apache2 libapache2-mod-php8.2
sudo a2enmod rewrite
sudo systemctl restart apache2

# ATAU untuk Nginx (opsional):
sudo apt install -y nginx
```

---

## 🚀 STEP 2: Setup Database MySQL

### 2.1 Login ke MySQL
```bash
sudo mysql -u root -p
# Masukkan password yang sudah dibuat
```

### 2.2 Buat Database dan User
```sql
CREATE DATABASE kasir_pos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'kasir_user'@'localhost' IDENTIFIED BY '@Erigusri123';
GRANT ALL PRIVILEGES ON kasir_pos_db.* TO 'kasir_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 📦 STEP 3: Setup Project Laravel

### 3.1 Buat project Laravel baru
```bash
cd /var/www
composer create-project laravel/laravel kasir-pos
cd kasir-pos
```

### 3.2 Setup file .env
```bash
cp .env.example .env
php artisan key:generate
```

### 3.3 Edit file .env dengan credentials database
```bash
nano .env
```

Ubah bagian database menjadi:
```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kasir_pos_db
DB_USERNAME=kasir_user
DB_PASSWORD=password_yang_aman
```

### 3.4 Install dependencies Laravel
```bash
composer install
npm install
```

### 3.5 Compile assets
```bash
npm run build
```

---

## 🗂️ STEP 4: Setup Struktur Project

### 4.1 Buat direktori untuk menyimpan gambar produk
```bash
mkdir -p storage/app/public/products
mkdir -p storage/app/public/uploads
mkdir -p public/storage
chmod -R 775 storage/app/public
```

### 4.2 Buat symbolic link untuk storage
```bash
php artisan storage:link
```

### 4.3 Buat folder untuk reports
```bash
mkdir -p storage/reports
chmod -R 775 storage/reports
```

---

## ⚙️ STEP 5: Membuat Models, Migrations, dan Controllers

Ikuti file-file berikutnya untuk setup lengkap. Setiap file sudah dibuat dengan detail lengkap.

---

## 🔐 STEP 6: Konfigurasi Web Server

### Untuk Apache:
```bash
sudo nano /etc/apache2/sites-available/kasir-pos.conf
```

Tambahkan:
```apache
<VirtualHost *:80>
    ServerName kasir-pos.local
    ServerAdmin admin@kasir-pos.local
    
    DocumentRoot /var/www/kasir-pos/public
    
    <Directory /var/www/kasir-pos/public>
        AllowOverride All
        Order by,deny
        Allow from all
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/kasir-pos-error.log
    CustomLog ${APACHE_LOG_DIR}/kasir-pos-access.log combined
</VirtualHost>
```

Aktifkan:
```bash
sudo a2ensite kasir-pos.conf
sudo systemctl reload apache2
```

Edit /etc/hosts:
```bash
sudo nano /etc/hosts
# Tambahkan: 127.0.0.1 kasir-pos.local
```

---

## 🎯 STEP 7: Jalankan Migrations dan Seeders

```bash
php artisan migrate
php artisan db:seed
```

---

## 📱 STEP 8: Setup & Testing

### Jalankan development server
```bash
php artisan serve --host=0.0.0.0 --port=8000
```

### Akses aplikasi
- **URL**: http://127.0.0.1:8000 atau http://kasir-pos.local
- **Admin**: admin@example.com / password
- **Kasir**: kasir@example.com / password
- **Kepala**: kepala@example.com / password

---

## 🔧 Troubleshooting

### Jika storage tidak bisa diakses:
```bash
php artisan storage:link
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```

### Clear cache
```bash
php artisan cache:clear
php artisan config:clear
php artisan view:clear
```

### Reset database
```bash
php artisan migrate:reset
php artisan migrate
php artisan db:seed
```

---

## ✅ Checklist Instalasi

- [ ] PHP 8.2+ terinstall
- [ ] Composer terinstall
- [ ] MySQL server running
- [ ] Database dan user dibuat
- [ ] Laravel project created
- [ ] .env dikonfigurasi
- [ ] Dependencies installed
- [ ] Storage link dibuat
- [ ] Migrations berhasil dijalankan
- [ ] Seeders berhasil dijalankan
- [ ] Web server dikonfigurasi
- [ ] Aplikasi bisa diakses

---

**Lanjut ke Step selanjutnya sesuai file yang sudah disiapkan!**
