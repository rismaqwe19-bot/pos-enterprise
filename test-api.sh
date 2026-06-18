#!/bin/bash

# ============================================
# POS ENTERPRISE - API Testing Script
# ============================================

API_URL="http://localhost:3000/api"
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Store token globally
TOKEN=""
PRODUCT_ID=""
TRANSACTION_ID=""

print_header() {
    echo -e "\n${COLOR_BLUE}========== $1 ==========${NC}\n"
}

print_success() {
    echo -e "${COLOR_GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${COLOR_RED}❌ $1${NC}"
}

print_info() {
    echo -e "${COLOR_YELLOW}ℹ️  $1${NC}"
}

# ========== 1. TEST SERVER CONNECTION ==========
print_header "1. Test Server Connection"

response=$(curl -s -w "\n%{http_code}" $API_URL/test)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    print_success "Server is running"
    echo "Response: $body"
else
    print_error "Server not responding (HTTP $http_code)"
    exit 1
fi

# ========== 2. REGISTER USER ==========
print_header "2. Register User"

response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123",
    "email": "testuser@pos.local",
    "fullName": "Test User",
    "role": "cashier"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ] || [ "$http_code" = "400" ]; then
    print_success "Register endpoint working"
    if [ "$http_code" = "400" ]; then
        print_info "User already exists (expected on retry)"
    fi
    echo "Response: $body"
else
    print_error "Register failed (HTTP $http_code)"
    echo "Response: $body"
fi

# ========== 3. LOGIN ==========
print_header "3. Login User"

response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    print_success "Login successful"
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    echo "Token: ${TOKEN:0:20}..."
    echo "Full Response: $body"
else
    print_error "Login failed (HTTP $http_code)"
    echo "Response: $body"
    exit 1
fi

# ========== 4. GET PROFILE ==========
print_header "4. Get User Profile"

response=$(curl -s -w "\n%{http_code}" -X GET $API_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    print_success "Get profile working"
    echo "Response: $body"
else
    print_error "Get profile failed (HTTP $http_code)"
    echo "Response: $body"
fi

# ========== 5. CREATE PRODUCT ==========
print_header "5. Create Product"

response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Susu Segar 1L",
    "barcode": "8991234567890",
    "category": "Dairy",
    "price": 25000,
    "cost": 18000,
    "stock": 50,
    "unit": "pcs"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ]; then
    print_success "Product created"
    PRODUCT_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "Product ID: $PRODUCT_ID"
    echo "Response: $body"
else
    print_error "Create product failed (HTTP $http_code)"
    echo "Response: $body"
fi

# ========== 6. GET PRODUCTS ==========
print_header "6. Get All Products"

response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/products?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    print_success "Get products working"
    echo "Response: $body"
else
    print_error "Get products failed (HTTP $http_code)"
    echo "Response: $body"
fi

# ========== 7. GET PRODUCT DETAIL ==========
print_header "7. Get Product Detail"

if [ ! -z "$PRODUCT_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET $API_URL/products/$PRODUCT_ID \
      -H "Authorization: Bearer $TOKEN")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        print_success "Get product detail working"
        echo "Response: $body"
    else
        print_error "Get product detail failed (HTTP $http_code)"
        echo "Response: $body"
    fi
else
    print_error "Product ID not available (skip this test)"
fi

# ========== 8. UPDATE PRODUCT ==========
print_header "8. Update Product"

if [ ! -z "$PRODUCT_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PUT $API_URL/products/$PRODUCT_ID \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "price": 27000,
        "stock": 45
      }')

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        print_success "Update product working"
        echo "Response: $body"
    else
        print_error "Update product failed (HTTP $http_code)"
        echo "Response: $body"
    fi
else
    print_error "Product ID not available (skip this test)"
fi

# ========== 9. UPDATE STOCK ==========
print_header "9. Update Stock"

if [ ! -z "$PRODUCT_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X PATCH $API_URL/products/$PRODUCT_ID/stock \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d '{
        "quantity": 5,
        "type": "add"
      }')

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        print_success "Update stock working"
        echo "Response: $body"
    else
        print_error "Update stock failed (HTTP $http_code)"
        echo "Response: $body"
    fi
else
    print_error "Product ID not available (skip this test)"
fi

# ========== 10. CREATE PRODUCT 2 ==========
print_header "10. Create Second Product (for transaction)"

response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Roti Tawar",
    "barcode": "8991234567891",
    "category": "Bakery",
    "price": 15000,
    "cost": 10000,
    "stock": 30,
    "unit": "pcs"
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "201" ]; then
    print_success "Second product created"
    PRODUCT_ID_2=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
    echo "Product ID 2: $PRODUCT_ID_2"
else
    print_info "Product creation skipped"
fi

# ========== 11. CREATE TRANSACTION ==========
print_header "11. Create Transaction (Sale)"

if [ ! -z "$PRODUCT_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X POST $API_URL/transactions \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"items\": [
          {\"product_id\": $PRODUCT_ID, \"quantity\": 2, \"price\": 27000},
          {\"product_id\": $PRODUCT_ID, \"quantity\": 1, \"price\": 27000}
        ],
        \"paymentMethod\": \"cash\",
        \"discountAmount\": 0,
        \"taxAmount\": 0,
        \"notes\": \"Test transaction\"
      }")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "201" ]; then
        print_success "Transaction created"
        TRANSACTION_ID=$(echo "$body" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        echo "Transaction ID: $TRANSACTION_ID"
        echo "Response: $body"
    else
        print_error "Create transaction failed (HTTP $http_code)"
        echo "Response: $body"
    fi
else
    print_error "Product ID not available (skip transaction)"
fi

# ========== 12. GET TRANSACTIONS ==========
print_header "12. Get All Transactions"

response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL/transactions?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    print_success "Get transactions working"
    echo "Response: $body"
else
    print_error "Get transactions failed (HTTP $http_code)"
    echo "Response: $body"
fi

# ========== 13. GET TRANSACTION DETAIL ==========
print_header "13. Get Transaction Detail"

if [ ! -z "$TRANSACTION_ID" ]; then
    response=$(curl -s -w "\n%{http_code}" -X GET $API_URL/transactions/$TRANSACTION_ID \
      -H "Authorization: Bearer $TOKEN")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$http_code" = "200" ]; then
        print_success "Get transaction detail working"
        echo "Response: $body"
    else
        print_error "Get transaction detail failed (HTTP $http_code)"
        echo "Response: $body"
    fi
else
    print_error "Transaction ID not available (skip this test)"
fi

# ========== 14. GET TODAY REPORT ==========
print_header "14. Get Today's Sales Report"

response=$(curl -s -w "\n%{http_code}" -X GET $API_URL/reports/daily/today \
  -H "Authorization: Bearer $TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    print_success "Get today report working"
    echo "Response: $body"
else
    print_error "Get today report failed (HTTP $http_code)"
    echo "Response: $body"
fi

# ========== 15. GET DASHBOARD STATS ==========
print_header "15. Get Dashboard Overview Stats"

response=$(curl -s -w "\n%{http_code}" -X GET $API_URL/reports/stats/overview \
  -H "Authorization: Bearer $TOKEN")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

if [ "$http_code" = "200" ]; then
    print_success "Get dashboard stats working"
    echo "Response: $body"
else
    print_error "Get dashboard stats failed (HTTP $http_code)"
    echo "Response: $body"
fi

# ========== SUMMARY ==========
print_header "Test Summary"
echo -e "${COLOR_GREEN}✅ Testing Complete!${NC}\n"
echo "Token untuk testing manual:"
echo "Authorization: Bearer $TOKEN"
echo ""
echo "Sample cURL commands:"
echo "curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/products"
echo "curl -H \"Authorization: Bearer $TOKEN\" http://localhost:3000/api/reports/daily/today"