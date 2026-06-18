# 📚 POS ENTERPRISE - API Documentation

## 🔐 Authentication Routes `/api/auth`

### 1. Register User
**POST** `/api/auth/register`

**Request:**
```json
{
  "username": "kasir1",
  "password": "password123",
  "email": "kasir1@pos.local",
  "fullName": "Kasir Satu",
  "role": "cashier"  // cashier, manager, admin
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User berhasil didaftarkan",
  "data": {
    "id": 1,
    "username": "kasir1",
    "email": "kasir1@pos.local",
    "fullname": "Kasir Satu",
    "role": "cashier"
  }
}
```

---

### 2. Login
**POST** `/api/auth/login`

**Request:**
```json
{
  "username": "kasir1",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login berhasil",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "username": "kasir1",
    "email": "kasir1@pos.local",
    "fullname": "Kasir Satu",
    "role": "cashier"
  }
}
```

---

### 3. Get Profile (Protected)
**GET** `/api/auth/profile`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "kasir1",
    "email": "kasir1@pos.local",
    "fullname": "Kasir Satu",
    "role": "cashier",
    "last_login": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4. Update Profile (Protected)
**PUT** `/api/auth/profile`
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "email": "newemail@pos.local",
  "fullName": "Kasir Updated"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "id": 1,
    "username": "kasir1",
    "email": "newemail@pos.local",
    "fullname": "Kasir Updated",
    "role": "cashier"
  }
}
```

---

## 📦 Products Routes `/api/products`

### 1. Get All Products (Protected)
**GET** `/api/products?page=1&limit=10&search=susu`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Susu Segar 1L",
      "barcode": "8991234567890",
      "category": "Dairy",
      "price": 25000,
      "cost": 18000,
      "stock": 50,
      "unit": "pcs",
      "created_by": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

### 2. Get Product Detail (Protected)
**GET** `/api/products/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Susu Segar 1L",
    "barcode": "8991234567890",
    "category": "Dairy",
    "price": 25000,
    "cost": 18000,
    "stock": 50,
    "unit": "pcs",
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 3. Create Product (Protected)
**POST** `/api/products`
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "name": "Susu Segar 1L",
  "barcode": "8991234567890",
  "category": "Dairy",
  "price": 25000,
  "cost": 18000,
  "stock": 50,
  "unit": "pcs"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product berhasil ditambahkan",
  "data": {
    "id": 1,
    "name": "Susu Segar 1L",
    "barcode": "8991234567890",
    "category": "Dairy",
    "price": 25000,
    "cost": 18000,
    "stock": 50,
    "unit": "pcs",
    "created_by": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 4. Update Product (Protected)
**PUT** `/api/products/:id`
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "price": 27000,
  "stock": 45
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated",
  "data": { /* updated product */ }
}
```

---

### 5. Delete Product (Protected)
**DELETE** `/api/products/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Product berhasil dihapus",
  "data": {
    "id": 1,
    "name": "Susu Segar 1L"
  }
}
```

---

### 6. Update Stock (Protected)
**PATCH** `/api/products/:id/stock`
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "quantity": 10,
  "type": "add"  // atau "subtract"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Stock updated (add)",
  "data": {
    "id": 1,
    "name": "Susu Segar 1L",
    "stock": 60
  }
}
```

---

## 💳 Transactions Routes `/api/transactions`

### 1. Get All Transactions (Protected)
**GET** `/api/transactions?page=1&limit=10&startDate=2024-01-01&endDate=2024-01-31`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "transaction_date": "2024-01-15T10:30:00Z",
      "cashier_id": 1,
      "total_amount": 75000,
      "item_count": 3,
      "payment_method": "cash",
      "discount_amount": 0,
      "tax_amount": 0,
      "notes": null,
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "pages": 1
  }
}
```

---

### 2. Get Transaction Detail (Protected)
**GET** `/api/transactions/:id`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "transaction_date": "2024-01-15T10:30:00Z",
    "cashier_id": 1,
    "cashier_name": "kasir1",
    "total_amount": 75000,
    "item_count": 3,
    "payment_method": "cash",
    "discount_amount": 0,
    "tax_amount": 0,
    "notes": null,
    "items": [
      {
        "id": 1,
        "transaction_id": 1,
        "product_id": 1,
        "product_name": "Susu Segar 1L",
        "barcode": "8991234567890",
        "quantity": 3,
        "price": 25000,
        "subtotal": 75000,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3. Create Transaction (Protected)
**POST** `/api/transactions`
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "items": [
    {
      "product_id": 1,
      "quantity": 3,
      "price": 25000
    },
    {
      "product_id": 2,
      "quantity": 1,
      "price": 50000
    }
  ],
  "paymentMethod": "cash",
  "discountAmount": 0,
  "taxAmount": 0,
  "notes": "Pembeli cash"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Transaction created",
  "data": {
    "id": 1,
    "transaction_date": "2024-01-15T10:30:00Z",
    "total_amount": 125000,
    "item_count": 4,
    "payment_method": "cash"
  }
}
```

---

### 4. Get Transaction Report by Date (Protected)
**GET** `/api/transactions/report/by-date?startDate=2024-01-01&endDate=2024-01-31`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "total_transactions": 10,
      "total_sales": 750000,
      "total_items": 30,
      "avg_transaction": 75000
    }
  ]
}
```

---

### 5. Get Top Selling Products (Protected)
**GET** `/api/transactions/report/top-products?limit=10&startDate=2024-01-01&endDate=2024-01-31`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Susu Segar 1L",
      "barcode": "8991234567890",
      "sold_count": 15,
      "total_quantity": 45,
      "total_revenue": 1125000
    }
  ]
}
```

---

## 📊 Reports Routes `/api/reports`

### 1. Get Today's Summary (Protected)
**GET** `/api/reports/daily/today`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_transactions": 10,
      "total_sales": 750000,
      "total_items_sold": 30,
      "total_cashiers": 2
    },
    "top_products": [
      {
        "id": 1,
        "name": "Susu Segar 1L",
        "qty": 20,
        "revenue": 500000
      }
    ],
    "payment_breakdown": [
      {
        "payment_method": "cash",
        "count": 8,
        "amount": 600000
      },
      {
        "payment_method": "card",
        "count": 2,
        "amount": 150000
      }
    ]
  }
}
```

---

### 2. Get Date Range Summary (Protected)
**GET** `/api/reports/daily/range?startDate=2024-01-01&endDate=2024-01-31`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "total_transactions": 10,
      "total_sales": 750000,
      "items_sold": 30,
      "avg_transaction": 75000,
      "cashiers": 2
    }
  ],
  "totals": {
    "total_sales": 15000000,
    "total_transactions": 200,
    "total_items": 600,
    "avg_daily_sales": 484615
  }
}
```

---

### 3. Save Daily Report (Protected)
**POST** `/api/reports/daily/save`
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "reportDate": "2024-01-15",
  "totalSales": 750000,
  "totalTransactions": 10,
  "notes": "Hari normal, penjualan lancar"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Daily report saved",
  "data": {
    "id": 1,
    "report_date": "2024-01-15",
    "total_sales": 750000,
    "total_transactions": 10,
    "notes": "Hari normal, penjualan lancar",
    "created_by": 1,
    "created_at": "2024-01-15T23:59:00Z",
    "updated_at": "2024-01-15T23:59:00Z"
  }
}
```

---

### 4. Get Saved Daily Reports (Protected)
**GET** `/api/reports/daily/saved?startDate=2024-01-01&endDate=2024-01-31&limit=30`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "report_date": "2024-01-15",
      "total_sales": 750000,
      "total_transactions": 10,
      "notes": "Hari normal",
      "created_by": 1,
      "created_at": "2024-01-15T23:59:00Z",
      "updated_at": "2024-01-15T23:59:00Z"
    }
  ]
}
```

---

### 5. Get Sync Logs (Protected)
**GET** `/api/reports/sync-logs?limit=50&offset=0`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "device_id": "POS-01",
      "sync_status": "success",
      "sync_type": "automatic",
      "items_synced": 25,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 150
}
```

---

### 6. Log Sync Event (Protected)
**POST** `/api/reports/sync-logs`
**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "deviceId": "POS-01",
  "syncStatus": "success",
  "syncType": "automatic",
  "itemsSynced": 25
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Sync log recorded",
  "data": {
    "id": 1,
    "device_id": "POS-01",
    "sync_status": "success",
    "sync_type": "automatic",
    "items_synced": 25,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

---

### 7. Get Dashboard Overview Stats (Protected)
**GET** `/api/reports/stats/overview`
**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "total_users": 5,
    "total_products": 50,
    "total_transactions": 200,
    "total_revenue": 15000000,
    "low_stock_items": 5
  }
}
```

---

## 🔑 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Username dan password harus diisi"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token tidak valid atau expired"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Product tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Error: database connection failed"
}
```

---

## 🧪 Testing dengan curl

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"kasir1","password":"pass123","email":"kasir1@pos.local"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"kasir1","password":"pass123"}'

# Get products (dengan token)
curl -X GET http://localhost:3000/api/products \
  -H "Authorization: Bearer <TOKEN_DARI_LOGIN>"

# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Susu","price":25000,"stock":50}'

# Create transaction
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"items":[{"product_id":1,"quantity":2,"price":25000}],"paymentMethod":"cash"}'
```

---

## 📌 Catatan Penting

1. **Authentication:** Semua route kecuali `/api/test` membutuhkan JWT token di header `Authorization: Bearer <token>`
2. **Token Expiry:** Token berlaku 24 jam setelah login
3. **Database:** Semua data disimpan di PostgreSQL
4. **Error Handling:** Gunakan status code HTTP untuk error handling
5. **Pagination:** Default `page=1`, `limit=10`
6. **Search:** Case-insensitive ILIKE search untuk products dan transactions
