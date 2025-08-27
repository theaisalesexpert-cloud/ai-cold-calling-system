#!/bin/bash

# AI Cold-Calling System Test Script
# This script tests all components of your system

BASE_URL="https://ai-cold-calling-system.onrender.com"
API_KEY="abc123def456ghi789jkl012mno345pqr678"

echo "🧪 Testing AI Cold-Calling System"
echo "=================================="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Basic Health Check
echo "1️⃣ Testing basic health check..."
curl -s "$BASE_URL/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: Detailed Health Check
echo "2️⃣ Testing detailed health check..."
curl -s "$BASE_URL/health/detailed" | jq '.' || echo "❌ Detailed health check failed"
echo ""

# Test 3: Twilio Webhook Test
echo "3️⃣ Testing Twilio webhook endpoint..."
curl -s "$BASE_URL/webhook/twilio/test" | jq '.' || echo "❌ Twilio webhook test failed"
echo ""

# Test 4: TwiML Generation Test
echo "4️⃣ Testing TwiML generation..."
curl -s "$BASE_URL/webhook/twilio/test-twiml" | head -5 || echo "❌ TwiML generation failed"
echo ""

# Test 5: Voice Webhook Test
echo "5️⃣ Testing voice webhook with sample data..."
curl -s -X POST "$BASE_URL/webhook/twilio/voice" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST123&From=+1234567890&To=+441218161111" | head -5 || echo "❌ Voice webhook failed"
echo ""

# Test 6: Google Sheets Test (if configured)
echo "6️⃣ Testing Google Sheets connection..."
curl -s -H "Authorization: Bearer $API_KEY" "$BASE_URL/api/sheets/test" | jq '.' || echo "❌ Google Sheets test failed"
echo ""

# Test 7: Call Statistics
echo "7️⃣ Testing call statistics..."
curl -s -H "Authorization: Bearer $API_KEY" "$BASE_URL/api/calls/statistics" | jq '.' || echo "❌ Call statistics failed"
echo ""

# Test 8: Customer Data (if available)
echo "8️⃣ Testing customer data retrieval..."
curl -s -H "Authorization: Bearer $API_KEY" "$BASE_URL/api/sheets/customers" | jq '.success' || echo "❌ Customer data retrieval failed"
echo ""

echo "✅ System test completed!"
echo ""
echo "🔧 Next steps:"
echo "1. If all tests pass, your system is ready!"
echo "2. Configure Twilio webhook URL: $BASE_URL/webhook/twilio/voice"
echo "3. Test with a real phone call"
echo "4. Set up n8n workflow with your URLs"
