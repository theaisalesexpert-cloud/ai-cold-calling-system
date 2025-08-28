#!/bin/bash

# Test script for the new conversation flow following the exact script

BASE_URL="https://ai-cold-calling-system.onrender.com"
API_KEY="abc123def456ghi789jkl012mno345pqr678"

echo "🎯 Testing New AI Conversation Flow"
echo "==================================="
echo "Following the exact car dealership script"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Simulate complete conversation flow
echo "1️⃣ Testing complete conversation flow simulation..."

# Step 1: Greeting
echo "📞 Step 1: Initial Call (Greeting)"
curl -s -X POST "$BASE_URL/webhook/twilio/voice" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_001&From=+1234567890&To=+441218161111&customerId=123&customerName=John%20Smith&carModel=Honda%20Civic" \
  > /tmp/step1_response.xml

echo "TwiML Response:"
head -3 /tmp/step1_response.xml
echo ""

# Step 2: Customer says "Yes" to good time
echo "📞 Step 2: Customer Response - 'Yes, good time'"
curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_001&SpeechResult=Yes%2C%20this%20is%20a%20good%20time&Confidence=0.95" \
  > /tmp/step2_response.xml

echo "TwiML Response:"
head -3 /tmp/step2_response.xml
echo ""

# Step 3: Customer says "Yes" to still interested
echo "📞 Step 3: Customer Response - 'Yes, still interested'"
curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_001&SpeechResult=Yes%2C%20I%20am%20still%20interested&Confidence=0.92" \
  > /tmp/step3_response.xml

echo "TwiML Response:"
head -3 /tmp/step3_response.xml
echo ""

# Step 4: Customer wants appointment
echo "📞 Step 4: Customer Response - 'Yes, I'd like an appointment'"
curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_001&SpeechResult=Yes%2C%20I%20would%20like%20to%20schedule%20an%20appointment&Confidence=0.88" \
  > /tmp/step4_response.xml

echo "TwiML Response:"
head -3 /tmp/step4_response.xml
echo ""

# Step 5: Customer provides date/time
echo "📞 Step 5: Customer Response - 'Tomorrow at 2 PM'"
curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_001&SpeechResult=Tomorrow%20at%202%20PM%20would%20work%20great&Confidence=0.90" \
  > /tmp/step5_response.xml

echo "TwiML Response:"
head -3 /tmp/step5_response.xml
echo ""

echo "✅ Complete conversation flow test completed!"
echo ""

# Test 2: Alternative flow - Not interested in original car
echo "2️⃣ Testing alternative flow - Not interested in original car..."

# Start new conversation
curl -s -X POST "$BASE_URL/webhook/twilio/voice" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_002&From=+1234567891&To=+441218161111&customerId=124&customerName=Jane%20Doe&carModel=Toyota%20Camry" \
  > /tmp/alt_step1_response.xml

# Customer says good time
curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_002&SpeechResult=Yes%2C%20good%20time&Confidence=0.95" \
  > /tmp/alt_step2_response.xml

# Customer says NOT interested in original car
echo "📞 Alternative Step 3: Customer Response - 'No, not interested anymore'"
curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_002&SpeechResult=No%2C%20I%27m%20not%20interested%20in%20that%20car%20anymore&Confidence=0.93" \
  > /tmp/alt_step3_response.xml

echo "TwiML Response (should offer similar cars):"
head -3 /tmp/alt_step3_response.xml
echo ""

# Customer says YES to similar cars
echo "📞 Alternative Step 4: Customer Response - 'Yes, I'd like to see similar cars'"
curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_002&SpeechResult=Yes%2C%20I%20would%20like%20to%20see%20similar%20cars&Confidence=0.91" \
  > /tmp/alt_step4_response.xml

echo "TwiML Response (should ask for email):"
head -3 /tmp/alt_step4_response.xml
echo ""

# Customer provides email
echo "📞 Alternative Step 5: Customer Response - Provides email"
curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_002&SpeechResult=My%20email%20is%20jane.doe%40email.com&Confidence=0.89" \
  > /tmp/alt_step5_response.xml

echo "TwiML Response (should end call and send email):"
head -3 /tmp/alt_step5_response.xml
echo ""

echo "✅ Alternative conversation flow test completed!"
echo ""

# Test 3: Busy customer flow
echo "3️⃣ Testing busy customer flow..."

curl -s -X POST "$BASE_URL/webhook/twilio/voice" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_003&From=+1234567892&To=+441218161111&customerId=125&customerName=Bob%20Johnson&carModel=Ford%20F150" \
  > /tmp/busy_step1_response.xml

# Customer says busy
echo "📞 Busy Step 2: Customer Response - 'Not a good time, I'm busy'"
curl -s -X POST "$BASE_URL/webhook/twilio/gather" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=TEST_FLOW_003&SpeechResult=Not%20a%20good%20time%2C%20I%27m%20really%20busy%20right%20now&Confidence=0.94" \
  > /tmp/busy_step2_response.xml

echo "TwiML Response (should politely end call):"
head -3 /tmp/busy_step2_response.xml
echo ""

echo "✅ Busy customer flow test completed!"
echo ""

# Test 4: Test conversation service directly
echo "4️⃣ Testing conversation service health..."
curl -s "$BASE_URL/health/detailed" | jq '.services.conversation // "Conversation service status not available"'
echo ""

# Test 5: Test Google Sheets integration
echo "5️⃣ Testing Google Sheets integration..."
curl -s "$BASE_URL/api/sheets/test" | jq '.success, .message'
echo ""

# Test 6: Test email service
echo "6️⃣ Testing email service..."
curl -s "$BASE_URL/health/detailed" | jq '.services.email // "Email service status not available"'
echo ""

echo "🎯 Conversation Flow Test Summary"
echo "================================"
echo ""
echo "✅ Tests completed! Check the responses above for:"
echo ""
echo "🔍 What to look for:"
echo "- Step 1: Should contain greeting with customer name and car model"
echo "- Step 2: Should ask about interest in original car"
echo "- Step 3a: If interested → ask about appointment"
echo "- Step 3b: If not interested → offer similar cars"
echo "- Step 4a: If appointment → ask for date/time"
echo "- Step 4b: If similar cars → ask for email"
echo "- Step 5: Should end call appropriately"
echo ""
echo "📊 Expected Google Sheets Updates:"
echo "- Column D: 'Yes' or 'No' (interested in original)"
echo "- Column E: Appointment date/time (if scheduled)"
echo "- Column F: 'Yes' or 'No' (interested in similar)"
echo "- Column G: Email address (if provided)"
echo ""
echo "📧 Expected Email:"
echo "- Similar cars email should be sent automatically"
echo "- Should contain customer name and original car model"
echo "- Should include dealership contact information"
echo ""
echo "🎙️ Expected Voice Quality:"
echo "- All responses should use ElevenLabs natural voice"
echo "- TwiML should contain <Play> tags, not <Say> tags"
echo "- No robotic Alice voice"
echo ""
echo "🚀 Next Steps:"
echo "1. Make a real test call to verify voice quality"
echo "2. Check Google Sheets for data updates"
echo "3. Verify email delivery"
echo "4. Monitor logs for any errors"

# Cleanup temp files
rm -f /tmp/step*.xml /tmp/alt_step*.xml /tmp/busy_step*.xml
