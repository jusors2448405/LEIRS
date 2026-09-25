#!/bin/bash
# Test script for admin-otp Edge Function

FUNCTION_URL="http://localhost:54321/functions/v1/admin-otp"
EMAIL="leirs.admin@gmail.com"

echo "================================"
echo "LEIRS Admin OTP Function Tests"
echo "================================"
echo ""

# Test 1: Generate OTP
echo "Test 1: Generate OTP"
echo "-------------------"
GENERATE_RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"generate\", \"email\": \"$EMAIL\"}")

echo "$GENERATE_RESPONSE" | jq .
OTP=$(echo "$GENERATE_RESPONSE" | jq -r '.dev_otp')
echo ""
echo "Generated OTP: $OTP"
echo ""

# Wait a moment
sleep 2

# Test 2: Verify with wrong OTP
echo "Test 2: Verify with WRONG OTP"
echo "-----------------------------"
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"verify\", \"email\": \"$EMAIL\", \"otp\": \"999999\"}" | jq .
echo ""

# Test 3: Verify with correct OTP
echo "Test 3: Verify with CORRECT OTP"
echo "-------------------------------"
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"verify\", \"email\": \"$EMAIL\", \"otp\": \"$OTP\"}" | jq .
echo ""

# Test 4: Try to verify again (should fail - one-time use)
echo "Test 4: Try to verify again (should fail)"
echo "-----------------------------------------"
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"verify\", \"email\": \"$EMAIL\", \"otp\": \"$OTP\"}" | jq .
echo ""

# Test 5: Generate new OTP for resend test
echo "Test 5: Generate OTP for resend test"
echo "------------------------------------"
curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"generate\", \"email\": \"$EMAIL\"}" | jq .
echo ""

# Test 6: Resend OTP
echo "Test 6: Resend OTP"
echo "-----------------"
RESEND_RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "{\"action\": \"resend\", \"email\": \"$EMAIL\"}")

echo "$RESEND_RESPONSE" | jq .
echo ""

# Test 7: Rate limit test (generate multiple times)
echo "Test 7: Rate Limit Test"
echo "----------------------"
echo "Attempting 4 generations in a row..."
for i in {1..4}; do
  echo "Request $i:"
  curl -s -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -d "{\"action\": \"generate\", \"email\": \"test$i@example.com\"}" | jq '.success, .remaining, .error'
  sleep 1
done

echo ""
echo "================================"
echo "Tests Complete"
echo "================================"
