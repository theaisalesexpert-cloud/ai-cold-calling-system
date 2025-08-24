# AI Cold Calling System - API Reference

## Overview
This document describes all API endpoints and webhook interfaces for the AI Cold Calling System.

## Base URL
```
https://theaisalesexpert.co.uk
```

## Authentication
Most endpoints use API key authentication via headers or environment variables. Twilio webhooks are authenticated via signature verification.

## Endpoints

### 1. Health Check

#### GET /health
Returns the current system health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T15:30:00.000Z",
  "activeCalls": 2
}
```

**Status Codes:**
- `200`: System is healthy
- `500`: System error

---

### 2. Twilio Voice Webhook

#### POST /webhook/twilio/voice
Handles incoming Twilio voice webhook events.

**Request Headers:**
```
Content-Type: application/x-www-form-urlencoded
X-Twilio-Signature: sha1=signature_hash
```

**Request Body:**
```
CallSid=CA1234567890abcdef1234567890abcdef
From=+1234567890
To=+1987654321
CallStatus=ringing
Direction=outbound-api
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>https://example.com/audio/greeting.mp3</Play>
    <Gather input="speech" action="/webhook/twilio/gather/CA123" method="POST" speechTimeout="3" timeout="10"/>
</Response>
```

**Call Status Values:**
- `queued`: Call is queued
- `ringing`: Phone is ringing
- `in-progress`: Call is active
- `completed`: Call ended normally
- `busy`: Line was busy
- `no-answer`: No answer
- `failed`: Call failed

---

### 3. Speech Input Handler

#### POST /webhook/twilio/gather/:callSid
Processes speech input from customers during calls.

**URL Parameters:**
- `callSid`: Twilio Call SID

**Request Body:**
```
SpeechResult=Yes I am still interested in the BMW
Confidence=0.95
CallSid=CA1234567890abcdef1234567890abcdef
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Play>https://example.com/audio/response.mp3</Play>
    <Gather input="speech" action="/webhook/twilio/gather/CA123" method="POST"/>
</Response>
```

---

### 4. Call Status Updates

#### POST /webhook/twilio/status
Receives call status updates from Twilio.

**Request Body:**
```
CallSid=CA1234567890abcdef1234567890abcdef
CallStatus=completed
CallDuration=120
From=+1234567890
To=+1987654321
```

**Response:**
```json
{
  "status": "received",
  "timestamp": "2024-01-20T15:30:00.000Z"
}
```

---

### 5. n8n Webhook Endpoints

#### POST /webhook/call-completed
Receives call completion data from the webhook server.

**Request Body:**
```json
{
  "callSid": "CA1234567890abcdef1234567890abcdef",
  "customerName": "John Smith",
  "phoneNumber": "+1234567890",
  "callOutcome": {
    "stillInterested": "Yes",
    "wantsAppointment": "No",
    "wantsSimilarCars": "Yes",
    "emailAddress": "john@example.com"
  },
  "conversationHistory": [
    {
      "role": "assistant",
      "content": "Hi, is this John Smith?",
      "timestamp": "2024-01-20T15:30:00.000Z"
    },
    {
      "role": "user",
      "content": "Yes, this is John.",
      "timestamp": "2024-01-20T15:30:05.000Z"
    }
  ],
  "duration": 3,
  "endTime": "2024-01-20T15:33:00.000Z"
}
```

**Response:**
```json
{
  "status": "processed",
  "sheetsUpdated": true,
  "emailSent": true
}
```

#### POST /webhook/call-status-update
Updates call status in real-time.

**Request Body:**
```json
{
  "callSid": "CA1234567890abcdef1234567890abcdef",
  "status": "Calling",
  "timestamp": "2024-01-20T15:30:00.000Z"
}
```

---

## External API Integrations

### 1. OpenAI Chat Completions

**Endpoint:** `https://api.openai.com/v1/chat/completions`

**Request:**
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are Sarah, a car dealership representative..."
    },
    {
      "role": "user",
      "content": "Yes, I'm still interested in the BMW."
    }
  ],
  "max_tokens": 150,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "Great! Would you like to schedule an appointment to see the BMW?"
      }
    }
  ]
}
```

### 2. ElevenLabs Text-to-Speech

**Endpoint:** `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}`

**Request:**
```json
{
  "text": "Great! Would you like to schedule an appointment?",
  "model_id": "eleven_monolingual_v1",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.5
  }
}
```

**Response:** Binary audio data (MP3)

### 3. Deepgram Speech-to-Text

**Endpoint:** `https://api.deepgram.com/v1/listen`

**Request:** Audio stream or file

**Response:**
```json
{
  "results": {
    "channels": [
      {
        "alternatives": [
          {
            "transcript": "Yes I am still interested in the BMW",
            "confidence": 0.95
          }
        ]
      }
    ]
  }
}
```

### 4. Google Sheets API

**Endpoint:** `https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}`

**Update Request:**
```json
{
  "values": [
    ["Completed", "2024-01-20 15:30", "Interested", "Yes", "No", "Yes", "john@example.com"]
  ]
}
```

---

## Data Models

### Call Session
```json
{
  "callSid": "string",
  "sessionId": "string",
  "customerData": {
    "name": "string",
    "phoneNumber": "string",
    "carModel": "string",
    "enquiryDate": "string"
  },
  "conversationHistory": [
    {
      "role": "assistant|user",
      "content": "string",
      "timestamp": "string"
    }
  ],
  "currentStep": "greeting|confirm_interest|offer_appointment|offer_alternatives|collect_email|end_call",
  "callOutcome": {
    "stillInterested": "Yes|No|Unknown",
    "wantsAppointment": "Yes|No|Unknown",
    "wantsSimilarCars": "Yes|No|Unknown",
    "emailAddress": "string"
  },
  "startTime": "string",
  "isActive": "boolean"
}
```

### Customer Data
```json
{
  "name": "string",
  "phoneNumber": "string (E.164 format)",
  "carModel": "string",
  "enquiryDate": "string (YYYY-MM-DD)",
  "callStatus": "Pending|Calling|Completed|Failed|Do Not Call",
  "callDate": "string",
  "callOutcome": "string",
  "stillInterested": "Yes|No|Unknown",
  "wantsAppointment": "Yes|No|Unknown",
  "wantsSimilarCars": "Yes|No|Unknown",
  "emailAddress": "string",
  "notes": "string",
  "emailSent": "Yes|No",
  "emailDate": "string"
}
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object"
  },
  "timestamp": "string"
}
```

### Common Error Codes
- `INVALID_PHONE_NUMBER`: Phone number format invalid
- `CALL_FAILED`: Twilio call initiation failed
- `AI_SERVICE_ERROR`: OpenAI or ElevenLabs API error
- `SHEETS_UPDATE_FAILED`: Google Sheets update failed
- `WEBHOOK_SIGNATURE_INVALID`: Twilio signature verification failed

---

## Rate Limits

### Internal Endpoints
- Health check: 100 requests/minute
- Webhook endpoints: 1000 requests/minute

### External API Limits
- **OpenAI**: Varies by plan (typically 3,500 requests/minute for GPT-4)
- **ElevenLabs**: 120 requests/minute (free tier)
- **Deepgram**: 40 concurrent connections
- **Google Sheets**: 300 requests/minute per project

---

## Webhook Security

### Twilio Signature Verification
```javascript
const crypto = require('crypto');

function verifyTwilioSignature(signature, url, params, authToken) {
  const data = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(url + data)
    .digest('base64');
  
  return signature === `sha1=${expectedSignature}`;
}
```

### Required Headers
- `X-Twilio-Signature`: Required for all Twilio webhooks
- `Content-Type`: `application/x-www-form-urlencoded` for Twilio
- `User-Agent`: Twilio webhook user agent

---

## Testing

### Test Endpoints
Use these endpoints for testing:

```bash
# Health check
curl https://theaisalesexpert.co.uk/health

# Test webhook (requires valid Twilio signature)
curl -X POST https://theaisalesexpert.co.uk/webhook/twilio/voice \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "CallSid=test&From=+1234567890&To=+1234567890&CallStatus=ringing"
```

### Test Data
Use these test phone numbers (Twilio test credentials):
- `+15005550006`: Valid number
- `+15005550001`: Invalid number
- `+15005550004`: Number not reachable

---

This API reference provides comprehensive documentation for integrating with and extending the AI Cold Calling System.
