# API Documentation

## Overview

The Enhanced AI Cold-Calling System provides a comprehensive REST API for managing calls, leads, analytics, and system configuration. All endpoints support JSON request/response format and include comprehensive error handling.

## Authentication

### API Key Authentication
Include your API key in the request header:
```
X-API-Key: your-api-key-here
```

### JWT Authentication (for admin endpoints)
Include JWT token in the Authorization header:
```
Authorization: Bearer your-jwt-token-here
```

## Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3000/api
```

## Core Endpoints

### Call Management

#### Initiate Call
```http
POST /webhook/call/initiate
Content-Type: application/json
X-API-Key: your-api-key

{
  "customer_name": "John Doe",
  "phone_number": "+1234567890",
  "car_model": "Toyota Camry 2023",
  "dealership_name": "ABC Motors",
  "bot_name": "Sarah",
  "priority": "medium",
  "scheduled_time": "2024-01-15T10:00:00Z",
  "lead_source": "website"
}
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hi, is this John Doe? Hi John Doe, this is Sarah calling from ABC Motors...</Say>
  <Gather input="speech" timeout="10" speechTimeout="3" action="/webhook/call/response/session_123">
  </Gather>
</Response>
```

#### Process Customer Response
```http
POST /webhook/call/response/:sessionId
Content-Type: application/x-www-form-urlencoded

SpeechResult=Yes I am still interested
CallSid=CA1234567890abcdef
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Great! Would you like to schedule an appointment?</Say>
  <Gather input="speech" timeout="10" speechTimeout="3" action="/webhook/call/response/session_123">
  </Gather>
</Response>
```

#### Get Call Details
```http
GET /api/calls/:callId
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "call_1234567890",
    "customerName": "John Doe",
    "phoneNumber": "+1234567890",
    "carModel": "Toyota Camry 2023",
    "status": "completed",
    "outcome": "appointment_scheduled",
    "duration": 180,
    "transcript": [
      {
        "speaker": "ai",
        "text": "Hi, is this John Doe?",
        "timestamp": "2024-01-15T10:00:00Z",
        "sentiment": { "score": 0.1, "label": "neutral" }
      }
    ],
    "analytics": {
      "sentimentTrend": "improving",
      "averageSentiment": 0.3,
      "communicationStyle": "conversational"
    }
  }
}
```

### Lead Management

#### Create Lead
```http
POST /api/leads
Content-Type: application/json
Authorization: Bearer jwt-token

{
  "customerName": "Jane Smith",
  "phoneNumber": "+1987654321",
  "email": "jane@example.com",
  "carModel": "Honda Accord 2023",
  "leadSource": "website",
  "priority": "high",
  "preferences": {
    "contactMethod": "phone",
    "bestTimeToCall": "morning",
    "timezone": "America/New_York"
  }
}
```

#### Get Leads for Calling
```http
GET /api/leads/for-calling?limit=10&priority=high
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "lead_123",
      "customerName": "Jane Smith",
      "phoneNumber": "+1987654321",
      "carModel": "Honda Accord 2023",
      "leadScore": 85,
      "priority": "high",
      "nextCallDate": "2024-01-15T09:00:00Z",
      "callAttempts": 0
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10
  }
}
```

#### Update Lead Status
```http
PUT /api/leads/:leadId/status
Content-Type: application/json
Authorization: Bearer jwt-token

{
  "status": "qualified",
  "notes": "Customer interested in test drive",
  "nextAction": "schedule_appointment"
}
```

### Analytics

#### Dashboard Analytics
```http
GET /api/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCalls": 1250,
      "totalLeads": 890,
      "conversionRate": 12.5,
      "averageCallDuration": 145,
      "successRate": 78.2
    },
    "calls": {
      "completedCalls": 978,
      "appointmentsScheduled": 156,
      "interestedInSimilar": 234,
      "averageSentiment": 0.15,
      "outcomeDistribution": {
        "appointment_scheduled": 156,
        "interested_similar": 234,
        "not_interested": 445,
        "callback_requested": 89
      }
    },
    "performance": {
      "averageAiResponseTime": 1250,
      "averageTtsLatency": 800,
      "averageSttLatency": 650,
      "overallPerformanceScore": 92
    },
    "insights": [
      {
        "type": "success",
        "category": "performance",
        "title": "Excellent Response Times",
        "description": "AI response times are 15% faster than last month"
      }
    ]
  }
}
```

#### Real-Time Metrics
```http
GET /api/analytics/realtime
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "activeCalls": 5,
    "recentCalls": 23,
    "systemHealth": {
      "status": "healthy",
      "uptime": 86400,
      "memory": {
        "used": 512,
        "total": 1024,
        "percentage": 50
      }
    },
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Voice Services

#### Text-to-Speech
```http
POST /api/voice/tts
Content-Type: application/json
Authorization: Bearer jwt-token

{
  "text": "Hello, this is a test message",
  "voice_id": "EXAVITQu4vr4xnSDxMaL",
  "stability": 0.75,
  "similarity_boost": 0.75,
  "emotion": "friendly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "audioUrl": "https://your-domain.com/audio/tts_123.mp3",
    "duration": 3.2,
    "size": 51200,
    "format": "mp3"
  }
}
```

#### Speech-to-Text
```http
POST /api/voice/stt
Content-Type: multipart/form-data
Authorization: Bearer jwt-token

audio: [audio file]
model: nova-2
language: en-US
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transcript": "Hello, this is a test message",
    "confidence": 0.95,
    "sentiment": {
      "score": 0.2,
      "label": "positive"
    },
    "words": [
      {
        "word": "Hello",
        "start": 0.0,
        "end": 0.5,
        "confidence": 0.98
      }
    ],
    "metadata": {
      "duration": 3.2,
      "channels": 1
    }
  }
}
```

#### Service Status
```http
GET /api/voice/status
Authorization: Bearer jwt-token
```

**Response:**
```json
{
  "success": true,
  "data": {
    "elevenlabs": true,
    "deepgram": true,
    "elevenLabsResponseTime": 245,
    "deepgramResponseTime": 180,
    "performance": {
      "ttsRequests": 1250,
      "sttRequests": 890,
      "averageTtsTime": 800,
      "averageSttTime": 650,
      "errors": 12
    },
    "cache": {
      "size": 45,
      "maxSize": 100
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "type": "validation",
    "field": "phone_number",
    "code": "INVALID_PHONE_FORMAT"
  }
}
```

### Error Types
- `validation` - Input validation errors
- `authentication` - Authentication/authorization errors
- `rate_limit` - Rate limiting errors
- `api` - External API errors (OpenAI, ElevenLabs, etc.)
- `server` - Internal server errors
- `consent_required` - GDPR consent errors

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `502` - Bad Gateway (external API errors)

## Rate Limits

- **General API**: 100 requests per 15 minutes per IP
- **Call Initiation**: 10 requests per minute per IP
- **Authentication**: 5 attempts per 15 minutes per IP

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
```

## Webhooks

### Call Completion Webhook
Configure your n8n workflow to receive call completion notifications:

```http
POST /your-n8n-webhook-url
Content-Type: application/json

{
  "phone_number": "+1234567890",
  "call_duration": 180,
  "call_status": "completed",
  "outcome": "appointment_scheduled",
  "transcript": [...],
  "extracted_data": {
    "still_interested": "yes",
    "wants_appointment": "yes",
    "email_address": "john@example.com"
  },
  "call_notes": "Customer scheduled appointment for test drive",
  "sentiment_summary": "positive",
  "next_action": "send_appointment_confirmation"
}
```

## SDKs and Libraries

### JavaScript/Node.js
```bash
npm install @ai-calling-system/sdk
```

```javascript
const { AICallingClient } = require('@ai-calling-system/sdk');

const client = new AICallingClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-domain.com/api'
});

// Initiate a call
const call = await client.calls.initiate({
  customerName: 'John Doe',
  phoneNumber: '+1234567890',
  carModel: 'Toyota Camry 2023'
});
```

### Python
```bash
pip install ai-calling-system-sdk
```

```python
from ai_calling_system import AICallingClient

client = AICallingClient(
    api_key='your-api-key',
    base_url='https://your-domain.com/api'
)

# Get analytics
analytics = client.analytics.get_dashboard(
    start_date='2024-01-01',
    end_date='2024-01-31'
)
```
