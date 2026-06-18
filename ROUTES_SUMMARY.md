# 🚀 Backend Routes - Quick Reference

## Files Created ✅

```
server/
├── routes/
│   ├── auth.js ✅ (Register, Login, Profile)
│   ├── products.js ✅ (CRUD Products + Stock Management)
│   ├── transactions.js ✅ (Create Sale, Transaction Details, Reports)
│   └── reports.js ✅ (Daily Reports, Dashboard Stats, Sync Logs)
├── app.js ✅ (Express app dengan routing)
└── server.js ✅ (Server entry point)
```

---

## 📡 Available Endpoints Summary

### 🔐 Auth Routes
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | `/api/auth/register` | ❌ | Register user baru |
| POST | `/api/auth/login` | ❌ | Login & get token |
| GET | `/api/auth/profile` | ✅ | Get user profile |
| PUT | `/api/auth/profile` | ✅ | Update user profile |

### 📦 Product Routes
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/products` | ✅ | Get all products (paginated, searchable) |
| GET | `/api/products/:id` | ✅ | Get product detail |
| POST | `/api/products` | ✅ | Create product |
| PUT | `/api/products/:id` | ✅ | Update product |
| DELETE | `/api/products/:id` | ✅ | Delete product |
| PATCH | `/api/products/:id/stock` | ✅ | Update stock (add/subtract) |

### 💳 Transaction Routes
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/transactions` | ✅ | List transactions (paginated) |
| GET | `/api/transactions/:id` | ✅ | Get transaction detail + items |
| POST | `/api/transactions` | ✅ | Create new transaction (penjualan) |
| GET | `/api/transactions/report/by-date` | ✅ | Daily sales report |
| GET | `/api/transactions/report/top-products` | ✅ | Top selling products |

### 📊 Report Routes
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | `/api/reports/daily/today` | ✅ | Today's summary |
| GET | `/api/reports/daily/range` | ✅ | Date range summary |
| POST | `/api/reports/daily/save` | ✅ | Save daily report |
| GET | `/api/reports/daily/saved` | ✅ | Get saved reports |
| GET | `/api/reports/sync-logs` | ✅ | Sync logs |
| POST | `/api/reports/sync-logs` | ✅ | Log sync event |
| GET | `/api/reports/stats/overview` | ✅ | Dashboard overview |

---

## 🔑 Authentication Token Usage

Semua endpoint yang butuh auth harus include header:
```
Authorization: Bearer <token_dari_login>
```

Contoh:
```bash
curl -H "Authorization: Bearer eyJhbGc..." http://localhost:3000/api/products
```

---

## 📝 Common Query Parameters

### Pagination
- `page=1` (default)
- `limit=10` (default)

### Search
- `search=nama_produk` (untuk products)

### Date Range
- `startDate=2024-01-01`
- `endDate=2024-01-31`

---

## 🧪 Quick Test Commands

```bash
# 1. Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kasir1",
    "password": "123456",
    "email": "kasir1@pos.local",
    "fullName": "Kasir Satu"
  }'

# 2. Login (copy token dari response)
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "kasir1",
    "password": "123456"
  }' | jq -r '.token')

# 3. Get all products
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer $TOKEN"

# 4. Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Susu Segar",
    "barcode": "123456",
    "price": 25000,
    "cost": 18000,
    "stock": 50
  }'

# 5. Create transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 2, "price": 25000}
    ],
    "paymentMethod": "cash"
  }'

# 6. Get today sales
curl -X GET http://localhost:3000/api/reports/daily/today \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔄 Database Transactions

Endpoint yang menggunakan DB transaction:
- **POST /api/transactions** - Atomic transaction dengan update stock

Error handling:
- Jika ada error, semua perubahan di-rollback
- Stock tidak akan berkurang jika transaction gagal

---

## ✨ Features Implemented

### Auth Module
- ✅ Register user dengan bcrypt password hashing
- ✅ Login dengan JWT token (24h expiry)
- ✅ Profile management (get & update)
- ✅ Last login tracking

### Products Module
- ✅ Full CRUD operations
- ✅ Barcode validation (unique)
- ✅ Stock management (add/subtract)
- ✅ Pagination & search
- ✅ Product categories

### Transactions Module
- ✅ Create penjualan dengan multiple items
- ✅ Atomic transaction (stock update + transaction logging)
- ✅ Inventory check before transaction
- ✅ Detailed transaction history
- ✅ Sales reports (by date, top products)

### Reports Module
- ✅ Daily sales summary
- ✅ Date range analytics
- ✅ Payment method breakdown
- ✅ Top selling products ranking
- ✅ Dashboard overview stats
- ✅ Sync logs tracking

---

## 🚀 Next Steps

1. ✅ Backend routes created
2. ⏳ Frontend pages (login, dashboard, transactions)
3. ⏳ API client (api.js)
4. ⏳ POS interface (pos.js)
5. ⏳ Offline sync (sync.js)
6. ⏳ Styling (style.css)

---

## 📌 Important Notes

1. **Database**: Semua data langsung ke PostgreSQL
2. **Error Handling**: Konsisten menggunakan status codes & message field
3. **Security**: 
   - Password hashing with bcrypt
   - JWT authentication
   - SQL injection prevention (parameterized queries)
4. **Performance**:
   - Pagination untuk list endpoints
   - Database indexing recommended untuk barcode & username
5. **Offline Support**: Routes siap untuk sync logs
