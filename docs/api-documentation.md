# API Documentation

<<<<<<< HEAD
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
=======
Complete API reference for the AI Cold-Calling System.

## Base URL

```
Production: https://your-app.railway.app
Development: http://localhost:3000
```

## Authentication

Most endpoints require API key authentication via header:

```
Authorization: Bearer your_api_key_here
```

## Health Check Endpoints

### GET /health

Basic health check endpoint.
>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139

**Response:**
```json
{
<<<<<<< HEAD
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
=======
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

### GET /health/detailed

Detailed health check with service status.
>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139

**Response:**
```json
{
<<<<<<< HEAD
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
=======
  "status": "healthy",
  "server": {
    "status": "healthy",
    "uptime": 3600,
    "memory": {...},
    "timestamp": "2024-01-20T10:00:00.000Z"
  },
  "services": {
    "googleSheets": {
      "status": "healthy",
      "message": "Connection successful"
    },
    "email": {
      "status": "healthy",
      "message": "Configuration valid"
    },
    "twilio": {
      "status": "healthy",
      "message": "Configuration present"
    },
    "openai": {
      "status": "healthy",
      "message": "API key configured"
    }
  }
}
```

## Call Management Endpoints

### POST /api/calls/initiate

Initiate a new AI call to a customer.

**Request Body:**
```json
{
  "customerId": "CUST_001",
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Call initiated successfully",
  "data": {
    "callSid": "CA1234567890abcdef",
    "status": "queued",
    "customerName": "John Smith",
    "phoneNumber": "+1234567890"
  }
}
```

### GET /api/calls/status/:callSid

Get status of a specific call.

**Response:**
```json
{
  "success": true,
  "data": {
    "call": {
      "sid": "CA1234567890abcdef",
      "status": "completed",
      "duration": 180,
      "startTime": "2024-01-20T10:00:00.000Z",
      "endTime": "2024-01-20T10:03:00.000Z"
    },
    "conversation": {
      "id": "conv_123",
      "currentStep": "completed",
      "turnCount": 8,
      "startTime": "2024-01-20T10:00:00.000Z",
      "context": {
        "customerResponded": true,
        "appointmentScheduled": true,
        "emailCollected": false
      }
    }
>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139
  }
}
```

<<<<<<< HEAD
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
=======
### POST /api/calls/end/:callSid

End an active call.

**Response:**
```json
{
  "success": true,
  "message": "Call ended successfully"
}
```

### POST /api/calls/bulk-initiate

Initiate calls for multiple customers.

**Request Body:**
```json
{
  "customerIds": ["CUST_001", "CUST_002", "CUST_003"],
  "delay": 5000
>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139
}
```

**Response:**
```json
{
  "success": true,
<<<<<<< HEAD
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
=======
  "message": "Bulk call initiation completed. 2 successful, 1 failed.",
  "data": {
    "results": [
      {
        "customerId": "CUST_001",
        "success": true,
        "callSid": "CA1234567890abcdef"
      },
      {
        "customerId": "CUST_002",
        "success": false,
        "error": "Customer not found"
      }
    ],
    "summary": {
      "total": 3,
      "successful": 2,
      "failed": 1
>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139
    }
  }
}
```

<<<<<<< HEAD
#### Service Status
```http
GET /api/voice/status
Authorization: Bearer jwt-token
```
=======
### GET /api/calls/customers/ready

Get customers ready for calling.
>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139

**Response:**
```json
{
  "success": true,
  "data": {
<<<<<<< HEAD
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
=======
    "customers": [
      {
        "id": "CUST_001",
        "name": "John Smith",
        "phone": "+1234567890",
        "carModel": "2023 Honda Accord",
        "status": "new"
      }
    ],
    "count": 1
  }
}
```

### GET /api/calls/statistics

Get call statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "sheets": {
      "total": 100,
      "calledToday": 15,
      "interested": 25,
      "appointments": 8,
      "notInterested": 30,
      "pending": 22
    },
    "conversations": {
      "active": 2,
      "averageTurns": 6.5,
      "byStep": {
        "greeting": 1,
        "interest_check": 1
      }
>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139
    }
  }
}
```

<<<<<<< HEAD
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
=======
## Google Sheets Endpoints

### GET /api/sheets/customers

Get all customer data from Google Sheets.

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [
      {
        "id": "CUST_001",
        "name": "John Smith",
        "phone": "+1234567890",
        "email": "john@example.com",
        "carModel": "2023 Honda Accord",
        "status": "new",
        "enquiryDate": "2024-01-15",
        "rowIndex": 2
      }
    ],
    "count": 1
  }
}
```

### GET /api/sheets/customers/:customerId

Get specific customer by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "customer": {
      "id": "CUST_001",
      "name": "John Smith",
      "phone": "+1234567890",
      "email": "john@example.com",
      "carModel": "2023 Honda Accord",
      "status": "new"
    }
  }
}
```

### POST /api/sheets/customers

Add new customer to Google Sheets.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "phone": "+1234567891",
  "email": "jane@example.com",
  "carModel": "2023 Toyota Camry",
  "status": "new"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer added successfully",
  "data": {
    "success": true,
    "customerId": "CUST_002"
  }
}
```

### PUT /api/sheets/customers/:customerId

Update customer record.

**Request Body:**
```json
{
  "status": "interested",
  "lastCallDate": "2024-01-20",
  "callResult": "interested",
  "notes": "Very interested in test drive"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Customer record updated successfully",
  "data": {
    "success": true,
    "updatedFields": ["status", "lastCallDate", "callResult", "notes"]
  }
}
```

### GET /api/sheets/customers/search/:query

Search customers by query.

**Query Parameters:**
- `field` (optional): Specific field to search in (default: "all")

**Response:**
```json
{
  "success": true,
  "data": {
    "customers": [...],
    "count": 5,
    "query": "honda",
    "field": "all"
  }
}
```

## Twilio Webhook Endpoints

### POST /webhook/twilio/voice

Handle incoming voice calls (Twilio webhook).

**Request Body:** (Twilio format)
```
CallSid=CA1234567890abcdef
From=+1234567890
To=+1987654321
```

**Response:** TwiML XML

### POST /webhook/twilio/gather

Handle speech input from customer.

**Request Body:** (Twilio format)
```
CallSid=CA1234567890abcdef
SpeechResult=Yes, I'm still interested
Confidence=0.95
```

**Response:** TwiML XML

### POST /webhook/twilio/status

Handle call status updates.

**Request Body:** (Twilio format)
```
CallSid=CA1234567890abcdef
CallStatus=completed
CallDuration=180
```

**Response:** "OK"

## Error Responses

All endpoints return errors in this format:

```json
{
  "status": "error",
  "message": "Error description",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

### Common Error Codes

- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid API key)
- `404` - Not Found (resource doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limiting

API endpoints are rate limited:
- **Window**: 15 minutes
- **Max requests**: 100 per IP
- **Headers included in response**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset time

## Webhook Security

Twilio webhooks include signature validation. The system automatically validates incoming webhooks using your Twilio Auth Token.

## Testing Endpoints

### POST /api/calls/test

Make a test call to verify system functionality.

**Request Body:**
```json
{
  "phoneNumber": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test call initiated successfully",
  "data": {
    "callSid": "CA1234567890abcdef",
    "status": "queued",
    "phoneNumber": "+1234567890"
>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139
  }
}
```

<<<<<<< HEAD
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
=======
### GET /api/sheets/test

Test Google Sheets connection.

**Response:**
```json
{
  "success": true,
  "message": "Google Sheets connection successful",
  "data": {
    "sheetValidation": {
      "valid": true
    },
    "customerCount": 25,
    "timestamp": "2024-01-20T10:00:00.000Z"
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const apiClient = axios.create({
  baseURL: 'https://your-app.railway.app',
  headers: {
    'Authorization': 'Bearer your_api_key_here',
    'Content-Type': 'application/json'
  }
});

// Initiate a call
async function initiateCall(customerId) {
  try {
    const response = await apiClient.post('/api/calls/initiate', {
      customerId: customerId
    });
    console.log('Call initiated:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

// Get customer data
async function getCustomers() {
  try {
    const response = await apiClient.get('/api/sheets/customers');
    return response.data.data.customers;
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}
```

### Python

```python
import requests

class AICallingAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
    
    def initiate_call(self, customer_id):
        response = requests.post(
            f'{self.base_url}/api/calls/initiate',
            json={'customerId': customer_id},
            headers=self.headers
        )
        return response.json()
    
    def get_customers(self):
        response = requests.get(
            f'{self.base_url}/api/sheets/customers',
            headers=self.headers
        )
        return response.json()

# Usage
api = AICallingAPI('https://your-app.railway.app', 'your_api_key_here')
result = api.initiate_call('CUST_001')
print(result)
```

### cURL Examples

```bash
# Health check
curl https://your-app.railway.app/health

# Initiate call
curl -X POST https://your-app.railway.app/api/calls/initiate \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"customerId": "CUST_001"}'

# Get customers
curl -H "Authorization: Bearer your_api_key_here" \
  https://your-app.railway.app/api/sheets/customers

# Update customer
curl -X PUT https://your-app.railway.app/api/sheets/customers/CUST_001 \
  -H "Authorization: Bearer your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"status": "interested", "notes": "Follow up needed"}'
>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139
```
