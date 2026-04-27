#!/bin/bash

# Analytics Testing Script
# This script tests all analytics endpoints

BASE_URL="http://localhost:5002/api"
ADMIN_TOKEN=""

echo "=========================================="
echo "Analytics Testing Script"
echo "=========================================="
echo ""

# Function to make authenticated requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            "$BASE_URL$endpoint"
    else
        curl -s -X $method \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ADMIN_TOKEN" \
            -d "$data" \
            "$BASE_URL$endpoint"
    fi
}

# Step 1: Login as admin
echo "Step 1: Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}' \
    "$BASE_URL/auth/login")

ADMIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo "❌ Failed to login. Please make sure:"
    echo "   1. Backend is running on port 5002"
    echo "   2. Admin user is seeded (POST /api/dev/seed-admin)"
    exit 1
fi

echo "✅ Logged in successfully"
echo ""

# Step 2: Seed analytics data
echo "Step 2: Seeding analytics data..."
SEED_RESPONSE=$(make_request POST "/dev/seed-analytics")
echo $SEED_RESPONSE | grep -q "success.*true"
if [ $? -eq 0 ]; then
    echo "✅ Analytics data seeded successfully"
else
    echo "⚠️  Seeding may have failed or data already exists"
fi
echo ""

# Step 3: Test system stats
echo "Step 3: Testing system stats endpoint..."
STATS_RESPONSE=$(make_request GET "/admin/stats")
echo $STATS_RESPONSE | grep -q "totalUsers"
if [ $? -eq 0 ]; then
    echo "✅ System stats endpoint working"
    echo "   Response: $STATS_RESPONSE"
else
    echo "❌ System stats endpoint failed"
fi
echo ""

# Step 4: Test analytics endpoints
echo "Step 4: Testing analytics endpoints..."

# Test users analytics
for period in week month year; do
    echo "   Testing users-$period..."
    RESPONSE=$(make_request GET "/admin/analytics/users/$period")
    echo $RESPONSE | grep -q "success.*true"
    if [ $? -eq 0 ]; then
        echo "   ✅ users-$period working"
    else
        echo "   ❌ users-$period failed"
    fi
done

# Test reservations analytics
for period in week month year; do
    echo "   Testing reservations-$period..."
    RESPONSE=$(make_request GET "/admin/analytics/reservations/$period")
    echo $RESPONSE | grep -q "success.*true"
    if [ $? -eq 0 ]; then
        echo "   ✅ reservations-$period working"
    else
        echo "   ❌ reservations-$period failed"
    fi
done

# Test revenue analytics
for period in week month year; do
    echo "   Testing revenue-$period..."
    RESPONSE=$(make_request GET "/admin/analytics/revenue/$period")
    echo $RESPONSE | grep -q "success.*true"
    if [ $? -eq 0 ]; then
        echo "   ✅ revenue-$period working"
    else
        echo "   ❌ revenue-$period failed"
    fi
done

echo ""
echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Open http://localhost:5173/login"
echo "2. Login with admin/admin123"
echo "3. Navigate to Reports page"
echo "4. View analytics charts"
