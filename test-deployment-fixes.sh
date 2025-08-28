#!/bin/bash

# Test script to verify deployment fixes

BASE_URL="https://ai-cold-calling-system.onrender.com"

echo "🔧 Testing Deployment Fixes"
echo "============================"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Basic Health Check (should not have rate limiting errors)
echo "1️⃣ Testing basic health check..."
response=$(curl -s -w "%{http_code}" "$BASE_URL/health" -o /tmp/health_response.json)
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo "✅ Health check passed (HTTP $http_code)"
    cat /tmp/health_response.json | jq '.'
else
    echo "❌ Health check failed (HTTP $http_code)"
    cat /tmp/health_response.json
fi
echo ""

# Test 2: Test Service Status (should not have headers error)
echo "2️⃣ Testing service status..."
response=$(curl -s -w "%{http_code}" "$BASE_URL/api/test/status" -o /tmp/status_response.json)
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo "✅ Service status passed (HTTP $http_code)"
    cat /tmp/status_response.json | jq '.elevenlabs.enabled, .deepgram.enabled'
else
    echo "❌ Service status failed (HTTP $http_code)"
    cat /tmp/status_response.json
fi
echo ""

# Test 3: Test TwiML Generation (should not have headers error)
echo "3️⃣ Testing TwiML generation..."
response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/test/twiml" \
  -H "Content-Type: application/json" \
  -d '{"text": "Testing TwiML generation after fixes."}' \
  -o /tmp/twiml_response.json)
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo "✅ TwiML generation passed (HTTP $http_code)"
    cat /tmp/twiml_response.json | jq '.success, .data.usedElevenLabs'
else
    echo "❌ TwiML generation failed (HTTP $http_code)"
    cat /tmp/twiml_response.json
fi
echo ""

# Test 4: Test Voice Webhook (should not have headers error)
echo "4️⃣ Testing voice webhook..."
response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/webhook/twilio/voice" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST123&From=+1234567890&To=+441218161111" \
  -o /tmp/voice_response.xml)
http_code="${response: -3}"
if [ "$http_code" = "200" ]; then
    echo "✅ Voice webhook passed (HTTP $http_code)"
    echo "TwiML Response:"
    head -5 /tmp/voice_response.xml
else
    echo "❌ Voice webhook failed (HTTP $http_code)"
    cat /tmp/voice_response.xml
fi
echo ""

# Test 5: Multiple rapid requests (test rate limiting)
echo "5️⃣ Testing rate limiting (should not crash)..."
for i in {1..5}; do
    response=$(curl -s -w "%{http_code}" "$BASE_URL/health" -o /dev/null)
    http_code="${response: -3}"
    echo "Request $i: HTTP $http_code"
done
echo ""

echo "✅ Deployment fixes test completed!"
echo ""
echo "🔍 What to look for:"
echo "- All HTTP responses should be 200"
echo "- No 'ValidationError' or 'Headers already sent' errors"
echo "- TwiML should contain <Play> tags if ElevenLabs is enabled"
echo "- Rate limiting should work without errors"
echo ""
echo "🎯 If all tests pass:"
echo "1. The trust proxy issue is fixed"
echo "2. The headers error is resolved"
echo "3. ElevenLabs integration is working"
echo "4. Ready for real call testing"

# Cleanup temp files
rm -f /tmp/health_response.json /tmp/status_response.json /tmp/twiml_response.json /tmp/voice_response.xml
