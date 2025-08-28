#!/bin/bash

# Comprehensive test for stable, reliable AI calling system

BASE_URL="https://ai-cold-calling-system.onrender.com"
API_KEY="abc123def456ghi789jkl012mno345pqr678"

echo "🎯 Testing Stable AI Cold Calling System"
echo "========================================"
echo "Following EXACT car dealership script"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: System Health and Service Status
echo "1️⃣ Testing system health and service status..."
echo "================================================"

health_response=$(curl -s "$BASE_URL/health/detailed")
echo "Health Response:"
echo "$health_response" | jq '.'

# Check ElevenLabs status
elevenlabs_status=$(echo "$health_response" | jq -r '.services.elevenlabs.status // "unknown"')
echo "ElevenLabs Status: $elevenlabs_status"

# Check Deepgram status  
deepgram_status=$(echo "$health_response" | jq -r '.services.deepgram.status // "unknown"')
echo "Deepgram Status: $deepgram_status"

echo ""

# Test 2: ElevenLabs Voice Generation (Must Work)
echo "2️⃣ Testing ElevenLabs voice generation..."
echo "========================================="

elevenlabs_test=$(curl -s -X POST "$BASE_URL/api/test/elevenlabs" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hi John Smith, this is Sarah from Premier Auto. You recently enquired about the Honda Civic. Is now a good time to talk?"}')

echo "ElevenLabs Test Response:"
echo "$elevenlabs_test" | jq '.'

elevenlabs_success=$(echo "$elevenlabs_test" | jq -r '.success // false')
echo "ElevenLabs Working: $elevenlabs_success"

if [ "$elevenlabs_success" != "true" ]; then
    echo "❌ CRITICAL: ElevenLabs not working - system will use robotic voice!"
    echo "Fix ElevenLabs before proceeding."
    exit 1
fi

echo ""

# Test 3: TwiML Generation (Must Use ElevenLabs)
echo "3️⃣ Testing TwiML generation with ElevenLabs..."
echo "=============================================="

twiml_test=$(curl -s -X POST "$BASE_URL/api/test/twiml" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hi John Smith, this is Sarah from Premier Auto. You recently enquired about the Honda Civic. Is now a good time to talk?"}')

echo "TwiML Test Response:"
echo "$twiml_test" | jq '.'

used_elevenlabs=$(echo "$twiml_test" | jq -r '.data.usedElevenLabs // false')
echo "Used ElevenLabs: $used_elevenlabs"

if [ "$used_elevenlabs" != "true" ]; then
    echo "❌ CRITICAL: TwiML not using ElevenLabs - calls will be robotic!"
    echo "Check ElevenLabs integration in Twilio controller."
    exit 1
fi

echo ""

# Test 4: Complete Conversation Flow Simulation
echo "4️⃣ Testing complete conversation flow..."
echo "======================================="

# Simulate Step 1: Initial greeting
echo "📞 Step 1: Initial Call"
step1_response=$(curl -s -X POST "$BASE_URL/webhook/twilio/voice" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_STABLE_001&From=+1234567890&To=+441218161111&customerId=123&customerName=John%20Smith&carModel=Honda%20Civic")

echo "Step 1 TwiML (should contain <Play> tag):"
echo "$step1_response" | head -5

# Check if response contains Play tag (ElevenLabs) not Say tag (Twilio TTS)
if echo "$step1_response" | grep -q "<Play>"; then
    echo "✅ Step 1: Using ElevenLabs (natural voice)"
elif echo "$step1_response" | grep -q "<Say>"; then
    echo "❌ Step 1: Using Twilio TTS (robotic voice)"
else
    echo "⚠️ Step 1: Unexpected TwiML format"
fi

echo ""

# Simulate Step 2: Customer says "Yes, good time"
echo "📞 Step 2: Customer Response - 'Yes, good time'"
step2_response=$(curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_STABLE_001&SpeechResult=Yes%2C%20this%20is%20a%20good%20time&Confidence=0.95")

echo "Step 2 TwiML (should ask about interest in car):"
echo "$step2_response" | head -5

# Check if asking about interest in original car
if echo "$step2_response" | grep -qi "still interested"; then
    echo "✅ Step 2: Correctly asking about interest in original car"
else
    echo "❌ Step 2: Not following script correctly"
fi

echo ""

# Simulate Step 3: Customer says "Yes, still interested"
echo "📞 Step 3: Customer Response - 'Yes, still interested'"
step3_response=$(curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_STABLE_001&SpeechResult=Yes%2C%20I%20am%20still%20interested&Confidence=0.92")

echo "Step 3 TwiML (should ask about appointment):"
echo "$step3_response" | head -5

# Check if asking about appointment
if echo "$step3_response" | grep -qi "appointment"; then
    echo "✅ Step 3: Correctly asking about appointment"
else
    echo "❌ Step 3: Not following script correctly"
fi

echo ""

# Test 5: Alternative Flow - Not Interested
echo "5️⃣ Testing alternative flow - Not interested in original car..."
echo "=============================================================="

# Start new conversation
curl -s -X POST "$BASE_URL/webhook/twilio/voice" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_STABLE_002&From=+1234567891&To=+441218161111&customerId=124&customerName=Jane%20Doe&carModel=Toyota%20Camry" \
  > /dev/null

# Customer says good time
curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_STABLE_002&SpeechResult=Yes%2C%20good%20time&Confidence=0.95" \
  > /dev/null

# Customer says NOT interested
echo "📞 Alternative Step: Customer says 'No, not interested anymore'"
alt_response=$(curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_STABLE_002&SpeechResult=No%2C%20I%27m%20not%20interested%20in%20that%20car%20anymore&Confidence=0.93")

echo "Alternative TwiML (should offer similar cars):"
echo "$alt_response" | head -5

# Check if offering similar cars
if echo "$alt_response" | grep -qi "similar cars"; then
    echo "✅ Alternative Flow: Correctly offering similar cars"
else
    echo "❌ Alternative Flow: Not following script correctly"
fi

echo ""

# Test 6: Response Time Test
echo "6️⃣ Testing response times (must be under 3 seconds)..."
echo "====================================================="

for i in {1..5}; do
    start_time=$(date +%s%3N)
    
    curl -s -X POST "$BASE_URL/webhook/twilio/voice" \
      -H "Content-Type: application/x-www-form-urlencoded" \
      -d "CallSid=TEST_SPEED_$i&From=+123456789$i&To=+441218161111&customerId=12$i&customerName=Test%20User&carModel=Test%20Car" \
      > /dev/null
    
    end_time=$(date +%s%3N)
    response_time=$((end_time - start_time))
    
    echo "Response $i: ${response_time}ms"
    
    if [ $response_time -gt 3000 ]; then
        echo "⚠️ Response $i took longer than 3 seconds!"
    fi
done

echo ""

# Test 7: Google Sheets Integration
echo "7️⃣ Testing Google Sheets integration..."
echo "======================================"

sheets_test=$(curl -s "$BASE_URL/api/sheets/test")
echo "Sheets Test Response:"
echo "$sheets_test" | jq '.'

sheets_success=$(echo "$sheets_test" | jq -r '.success // false')
echo "Google Sheets Working: $sheets_success"

echo ""

# Test 8: Email Service
echo "8️⃣ Testing email service..."
echo "=========================="

email_health=$(echo "$health_response" | jq -r '.services.email.status // "unknown"')
echo "Email Service Status: $email_health"

echo ""

# Final Summary
echo "🎯 SYSTEM STABILITY TEST SUMMARY"
echo "================================="
echo ""

if [ "$elevenlabs_success" = "true" ] && [ "$used_elevenlabs" = "true" ]; then
    echo "✅ VOICE QUALITY: Natural voice (ElevenLabs) working correctly"
else
    echo "❌ VOICE QUALITY: System will use robotic voice - FIX REQUIRED"
fi

if echo "$step2_response" | grep -qi "still interested" && echo "$step3_response" | grep -qi "appointment"; then
    echo "✅ CONVERSATION FLOW: Following exact script correctly"
else
    echo "❌ CONVERSATION FLOW: Not following script - FIX REQUIRED"
fi

if [ "$sheets_success" = "true" ]; then
    echo "✅ DATA MANAGEMENT: Google Sheets integration working"
else
    echo "⚠️ DATA MANAGEMENT: Google Sheets may have issues"
fi

if [ "$email_health" = "healthy" ]; then
    echo "✅ EMAIL AUTOMATION: Email service working"
else
    echo "⚠️ EMAIL AUTOMATION: Email service may have issues"
fi

echo ""
echo "🚀 NEXT STEPS:"
echo "1. If all tests pass ✅ - Make a real test call"
echo "2. If any tests fail ❌ - Fix issues before going live"
echo "3. Monitor Render logs for any errors"
echo "4. Test with multiple phone numbers"
echo ""

echo "📞 To make a test call:"
echo "curl -X POST $BASE_URL/api/calls/test \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer $API_KEY\" \\"
echo "  -d '{\"phoneNumber\": \"+YOUR_PHONE_NUMBER\"}'"

echo ""
echo "✅ Stable system test completed!"
