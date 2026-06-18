# ⚡ Quick Start - Testing API

## 📦 Files You Have

```
✅ Backend Routes (4 files)
   - server/routes/auth.js
   - server/routes/products.js
   - server/routes/transactions.js
   - server/routes/reports.js

✅ Server Configuration
   - server/app.js
   - server/server.js

✅ Testing Files
   - test-api.js (Recommended - Node.js automated test)
   - test-api.sh (Bash script with curl)
   - TESTING_GUIDE.md (Complete testing guide)

✅ Documentation
   - API_DOCUMENTATION.md (All endpoints detailed)
   - ROUTES_SUMMARY.md (Quick reference)
```

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Prepare Your Project Folder

```bash
# Navigate to your pos-enterprise folder
cd /path/to/pos-enterprise

# Copy route files
mkdir -p server/routes
cp -r server/routes/*.js server/routes/

# Copy server files (jika belum ada)
cp server/app.js server/
cp server/server.js server/

# Copy test files
cp test-api.js .
cp test-api.sh .
```

### Step 2: Start Backend Server

```bash
# Terminal 1 - Start the server
npm run dev

# You should see:
# ✅ Database connected at: 2024-01-15 10:30:00
# 🚀 Server running
# 📍 URL: http://localhost:3000
```

### Step 3: Run Tests

```bash
# Terminal 2 - Run automated tests
node test-api.js
```

### Expected Output

```
==================================================
POS ENTERPRISE - API Testing Suite
==================================================

✅ Server is running
✅ Register new user
✅ Login with credentials
✅ Get user profile
... (more tests) ...

==================================================
TEST SUMMARY
==================================================

Total Tests: 22
Passed: 22
Failed: 0
Success Rate: 100.00%

✅ ALL TESTS PASSED! 🎉
```

---

## 🎯 What Gets Tested

| Category | Items | Status |
|----------|-------|--------|
| **Authentication** | Register, Login, Profile | ✅ Tested |
| **Products** | CRUD, Stock Update | ✅ Tested |
| **Transactions** | Create Sale, Get Details, Reports | ✅ Tested |
| **Reports** | Daily Summary, Dashboard Stats | ✅ Tested |

---

## 🔧 If Tests Fail

### Issue: Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Fix:** Make sure server is running with `npm run dev`

---

### Issue: Database Error
```
Error: database connection failed
```
**Fix:** Check .env file has correct DB credentials:
```
DB_USER=pos_user
DB_PASSWORD=29082002
DB_NAME=pos_db
```

---

### Issue: Token Invalid
```
Error: Token tidak valid atau expired
```
**Fix:** This is expected - test will auto-login and get new token

---

## 📊 Manual Testing Examples

### Login & Get Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'

# Response: { "token": "eyJhbGc..." }
# Copy the token for next requests
```

### Use Token to Get Products

```bash
TOKEN="<paste_token_here>"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/products
```

### Create Transaction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 2, "price": 25000}
    ],
    "paymentMethod": "cash"
  }'
```

---

## 📈 Performance Check

After tests pass, check response times:

```bash
# Time a request
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/products | head -c 100
```

Expected:
- **GET endpoints**: < 100ms
- **POST endpoints**: 100-300ms
- **Aggregate queries**: 100-500ms

---

## ✅ Verification Checklist

After tests pass:

```
[ ] Server running on port 3000
[ ] Database connected and tables exist
[ ] 22+ test cases passed
[ ] Can register new user
[ ] Can login and get token
[ ] Can create products
[ ] Can create transactions with stock deduction
[ ] Can fetch reports and analytics
[ ] Error handling working (401, 404, etc)
[ ] Response times acceptable (< 500ms)
```

---

## 🎓 Understanding Test Results

### Green (✅) Means:
- Endpoint is working correctly
- Database operations successful
- Response format is correct
- Status codes are appropriate

### Red (❌) Means:
- Endpoint failed
- Database error occurred
- Response is missing expected fields
- Status code not as expected

---

## 📝 Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| Tests timeout | Increase timeout in test-api.js (default 5s) |
| Database full error | Reset DB: `psql -U pos_user -d pos_db -f schema.sql` |
| Port already in use | Change PORT in .env or kill process on 3000 |
| Module not found | Run `npm install` again |
| Invalid token on subsequent runs | Scripts auto-login, should be fine |

---

## 🔐 Security Validated

Test suite validates:
- ✅ Password hashing (bcrypt)
- ✅ JWT token generation
- ✅ Token validation on protected routes
- ✅ SQL injection prevention
- ✅ Proper error messages (don't expose details)

---

## 📚 Documentation Files

### For Reference During Development

1. **API_DOCUMENTATION.md** 📖
   - Complete endpoint documentation
   - All request/response examples
   - Error codes and meanings

2. **ROUTES_SUMMARY.md** 📋
   - Quick endpoint reference
   - HTTP methods and paths
   - Test commands

3. **TESTING_GUIDE.md** 🧪
   - Detailed testing instructions
   - Troubleshooting guide
   - Performance testing tips

---

## 🎉 Success Criteria

✅ All tests pass when running `node test-api.js`

Once you have this, you're ready to build the frontend!

---

## ⏭️ What's Next

After successful testing:

1. **Frontend Foundation**
   - `public/js/api.js` - HTTP client
   - `public/pages/login.html` - Login page
   - `public/js/pos.js` - Main POS dashboard

2. **User Interface**
   - `public/css/style.css` - Styling
   - Dashboard layout
   - Product & transaction UI

3. **Functionality**
   - `public/js/sync.js` - Offline sync
   - Local storage
   - Real-time updates

4. **Deployment Ready**
   - Environment configuration
   - Error handling UI
   - Loading states

---

## 💬 Quick Commands Reference

```bash
# Start server
npm run dev

# Run tests (in another terminal)
node test-api.js

# View server logs
npm run dev 2>&1 | tee server.log

# Test single endpoint
curl http://localhost:3000/api/test

# Reset database
psql -U pos_user -d pos_db -f schema.sql

# Check if server is running
curl -s http://localhost:3000/api/test | jq
```

---

## 🚀 You're Ready!

Backend is tested and ready. Next step is to build the frontend interface that communicates with these APIs.

Good luck! 💪
