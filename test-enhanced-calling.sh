#!/bin/bash

# Enhanced AI Cold-Calling System Test Script
# Tests ElevenLabs and Deepgram integration

BASE_URL="https://ai-cold-calling-system.onrender.com"
API_KEY="abc123def456ghi789jkl012mno345pqr678"

echo "🎙️ Testing Enhanced AI Cold-Calling System"
echo "=========================================="
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Check Service Status
echo "1️⃣ Checking service status..."
curl -s "$BASE_URL/api/test/status" | jq '.'
echo ""

# Test 2: Test ElevenLabs Service
echo "2️⃣ Testing ElevenLabs service..."
curl -s -X POST "$BASE_URL/api/test/elevenlabs" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test of ElevenLabs voice generation for our AI calling system."}' | jq '.'
echo ""

# Test 3: Test Deepgram Service
echo "3️⃣ Testing Deepgram service..."
curl -s -X POST "$BASE_URL/api/test/deepgram" \
  -H "Content-Type: application/json" | jq '.'
echo ""

# Test 4: Test Both Services Together
echo "4️⃣ Testing both services together..."
curl -s -X POST "$BASE_URL/api/test/both" \
  -H "Content-Type: application/json" \
  -d '{"text": "Testing ElevenLabs and Deepgram integration together."}' | jq '.'
echo ""

# Test 5: Test TwiML Generation with ElevenLabs
echo "5️⃣ Testing TwiML generation with ElevenLabs..."
curl -s -X POST "$BASE_URL/api/test/twiml" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is Sarah from Premier Auto. This is a test of our enhanced calling system."}' | jq '.'
echo ""

# Test 6: Check Audio Files
echo "6️⃣ Checking generated audio files..."
curl -s "$BASE_URL/audio/" | jq '.'
echo ""

# Test 7: Test Voice Webhook (simulated)
echo "7️⃣ Testing voice webhook..."
curl -s -X POST "$BASE_URL/webhook/twilio/voice" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST123&From=+1234567890&To=+441218161111" | head -10
echo ""

# Test 8: Health Check
echo "8️⃣ Testing health check..."
curl -s "$BASE_URL/health/detailed" | jq '.services.elevenlabs, .services.deepgram'
echo ""

echo "✅ Enhanced system test completed!"
echo ""
echo "🔍 What to look for:"
echo "- ElevenLabs status: 'healthy' with usage stats"
echo "- Deepgram status: 'healthy' with model info"
echo "- TwiML test: 'usedElevenLabs: true'"
echo "- Audio files: Generated .mp3 files"
echo "- Voice webhook: TwiML with <Play> tags (not <Say>)"
echo ""
echo "🎯 Next steps:"
echo "1. If all tests pass, make a real test call"
echo "2. Listen for natural voice (not robotic)"
echo "3. Check call logs for ElevenLabs usage"
echo "4. Verify audio quality and conversation flow"
