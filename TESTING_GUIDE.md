# 🧪 Testing Backend API - Complete Guide

## 📋 Testing Methods

Ada 3 cara untuk test API:

1. **Automated Test Script (Node.js)** ⭐ Recommended
2. **Bash Script (curl)** 
3. **Manual Testing (Postman/Thunder Client)**

---

## ⭐ Method 1: Automated Testing (Node.js)

### ✅ Keuntungan
- ✅ Comprehensive testing semua endpoints
- ✅ Automatic error detection
- ✅ Colorful output untuk mudah dibaca
- ✅ Cross-platform (Windows, Mac, Linux)
- ✅ Detailed report dengan success rate

### 🚀 Cara Menjalankan

```bash
# 1. Pastikan server running
npm run dev
# (di terminal lain)

# 2. Run test script
node test-api.js
```

### 📊 Expected Output

```
==================================================
POS ENTERPRISE - API Testing Suite
==================================================

==================================================
1. SERVER CONNECTION
==================================================

✅ Server is running
ℹ️  Server message: API server is running

==================================================
2. AUTHENTICATION
==================================================

✅ Register new user
✅ Login with credentials
ℹ️  Token acquired: eyJhbGc...
✅ Get user profile
ℹ️  User: testuser

... (more tests) ...

==================================================
TEST SUMMARY
==================================================

Total Tests: 22
Passed: 22
Failed: 0
Success Rate: 100%

✅ ALL TESTS PASSED! 🎉
```

### 🔍 Test Coverage

Script ini test:
- ✅ Server connection
- ✅ User registration
- ✅ User login
- ✅ Profile management
- ✅ Product CRUD
- ✅ Stock management
- ✅ Transaction creation
- ✅ Transaction queries
- ✅ Daily reports
- ✅ Dashboard stats
- ✅ Sync logging

---

## Method 2: Bash Script (curl)

### ✅ Keuntungan
- ✅ Simple dan straightforward
- ✅ Lihat response lengkap
- ✅ Good untuk debugging

### 🚀 Cara Menjalankan

```bash
# Linux/Mac
chmod +x test-api.sh
./test-api.sh

# Windows (gunakan Git Bash atau WSL)
bash test-api.sh
```

### 📊 Output Sample

```
========== 1. Test Server Connection ==========

✅ Server is running
Response: {"success":true,"message":"API server is running","timestamp":"2024-01-15T10:30:00.000Z"}

========== 2. Register User ==========

✅ Register endpoint working
Response: {"success":true,"message":"User berhasil didaftarkan","data":{...}}

... (more) ...
```

### 📝 Kelebihan Bash Script
- Menampilkan raw HTTP responses
- Lebih mudah debugging jika ada error
- Bisa di-customize dengan mudah

---

## Method 3: Manual Testing (Postman/Thunder Client)

### Setup Postman

#### 1. Create Collection
- Buka Postman
- Klik "+ New Collection"
- Nama: "POS Enterprise"

#### 2. Setup Environment Variable
- Klik "Environments" di sidebar
- Klik "+"
- Nama: "Local POS"
- Variable:
  - `base_url` = `http://localhost:3000/api`
  - `token` = (akan diisi dari login response)

#### 3. Create Requests

**A. Login Request**
```
POST {{base_url}}/auth/login
Body (JSON):
{
  "username": "testuser",
  "password": "testpass123"
}

THEN: 
Copy token dari response
Klik "Tests" tab, paste:
pm.environment.set("token", pm.response.json().token);
```

**B. Get Products**
```
GET {{base_url}}/products?page=1&limit=10
Headers:
- Authorization: Bearer {{token}}
```

**C. Create Product**
```
POST {{base_url}}/products
Headers:
- Authorization: Bearer {{token}}
Body (JSON):
{
  "name": "Susu Segar",
  "price": 25000,
  "stock": 50
}
```

**D. Create Transaction**
```
POST {{base_url}}/transactions
Headers:
- Authorization: Bearer {{token}}
Body (JSON):
{
  "items": [
    {"product_id": 1, "quantity": 2, "price": 25000}
  ],
  "paymentMethod": "cash"
}
```

---

## 🔧 Troubleshooting

### Error: Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
```bash
# Pastikan server running
npm run dev

# Check port 3000
lsof -i :3000  # (Mac/Linux)
netstat -ano | findstr :3000  # (Windows)
```

---

### Error: Invalid Token

```
{
  "success": false,
  "message": "Token tidak valid atau expired"
}
```

**Solution:**
1. Login lagi untuk dapat token baru
2. Pastikan header format benar: `Authorization: Bearer <token>`
3. Token expired setelah 24 jam

---

### Error: Product Stock Not Enough

```
{
  "success": false,
  "message": "Stock Susu Segar tidak cukup (available: 2)"
}
```

**Solution:**
1. Update stock terlebih dahulu
2. Atau reduce quantity di transaction

---

### Error: Database Connection Failed

```
Error: database connection failed
```

**Solution:**
```bash
# Check PostgreSQL running
sudo systemctl status postgresql  # Linux

# Check credentials di .env
cat .env

# Check database exists
psql -U pos_user -d pos_db -c "SELECT NOW();"
```

---

## 📊 Performance Testing

### Load Test dengan Apache Bench

```bash
# Install Apache Bench
# Mac: brew install httpd
# Linux: apt-get install apache2-utils
# Windows: Download from Apache

# Test endpoint performance
ab -n 100 -c 10 -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/products
```

Expect:
- Requests per second: 50-200+ (tergantung hardware)
- Time per request: 5-20ms

---

## 🎯 Test Checklist

```
Authentication:
[ ] POST /auth/register - Create new user
[ ] POST /auth/login - Get JWT token
[ ] GET /auth/profile - Get user info
[ ] PUT /auth/profile - Update profile

Products:
[ ] GET /products - List with pagination
[ ] GET /products/:id - Get detail
[ ] POST /products - Create
[ ] PUT /products/:id - Update
[ ] DELETE /products/:id - Delete
[ ] PATCH /products/:id/stock - Update stock

Transactions:
[ ] GET /transactions - List
[ ] GET /transactions/:id - Get detail with items
[ ] POST /transactions - Create sale
[ ] GET /transactions/report/by-date - Daily report
[ ] GET /transactions/report/top-products - Top sellers

Reports:
[ ] GET /reports/daily/today - Today summary
[ ] GET /reports/daily/range - Date range summary
[ ] POST /reports/daily/save - Save daily report
[ ] GET /reports/stats/overview - Dashboard stats
[ ] POST /reports/sync-logs - Log sync event
[ ] GET /reports/sync-logs - Get sync history
```

---

## 📈 Expected Results

### Success Metrics

| Endpoint | Method | Expected Status | Notes |
|----------|--------|-----------------|-------|
| /auth/register | POST | 201 or 400 | 400 jika user sudah exist |
| /auth/login | POST | 200 or 401 | Berhasil: return token |
| /products | GET | 200 | Return array dengan pagination |
| /products | POST | 201 | Return created product |
| /transactions | POST | 201 | Return transaction ID |
| /reports/daily/today | GET | 200 | Return summary object |

### Response Time Expected

```
GET /products                  → 50-100ms
POST /products                 → 100-150ms
POST /transactions             → 150-300ms (ada stock update)
GET /reports/daily/today       → 100-200ms (ada aggregation)
```

---

## 🔐 Security Testing

### 1. Test Without Token

```bash
curl http://localhost:3000/api/products
# Expected: 401 Unauthorized
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Token tidak valid atau expired"
}
```

### 2. Test With Invalid Token

```bash
curl -H "Authorization: Bearer invalid_token" \
  http://localhost:3000/api/products
# Expected: 401 Unauthorized
```

### 3. Test SQL Injection Prevention

```bash
# Try SQL injection di search
curl "http://localhost:3000/api/products?search='; DROP TABLE products; --" \
  -H "Authorization: Bearer <token>"

# Expected: Safe - parameterized queries prevent injection
# Return: Normal search results atau empty array
```

---

## 📝 Logging Response

Setiap request bisa di-log untuk debugging:

### Enable Logging di Server

Add to `server/server.js`:
```javascript
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});
```

### Check Logs

```bash
# Linux/Mac
tail -f /var/log/pos-enterprise.log

# Or dari stdout server
npm run dev 2>&1 | tee server.log
```

---

## ✅ Final Verification Checklist

Sebelum lanjut ke frontend:

- [ ] Server bisa diakses di http://localhost:3000
- [ ] `/api/test` endpoint working
- [ ] User bisa register dan login
- [ ] Token bisa digunakan di protected endpoints
- [ ] Products CRUD all working
- [ ] Transactions bisa dibuat
- [ ] Stock auto-update saat transaksi
- [ ] Reports endpoints accessible
- [ ] Database schema verified
- [ ] Error handling consistent

---

## 🚀 Next Steps Setelah Testing

Jika semua test PASS:

1. ✅ Backend routes ready
2. ⏳ Frontend pages creation
3. ⏳ API client integration
4. ⏳ Styling & UI/UX
5. ⏳ Offline sync implementation

---

## 💡 Tips

1. **Save Token**: Simpan token dari login untuk testing manual
2. **Use Same User**: Gunakan user yang sama untuk konsistensi
3. **Test Date Range**: Gunakan tanggal hari ini untuk report testing
4. **Check Logs**: Buka server logs jika ada error
5. **Reset Database**: Jika perlu fresh start:
   ```bash
   psql -U pos_user -d pos_db -f schema.sql
   ```

---

## 📞 Support

Jika ada error:
1. Check server logs: `npm run dev`
2. Verify database connection: `psql -U pos_user -d pos_db`
3. Review API_DOCUMENTATION.md untuk endpoint details
4. Use Postman untuk manual debugging
