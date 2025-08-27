# API Documentation

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

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

### GET /health/detailed

Detailed health check with service status.

**Response:**
```json
{
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
  }
}
```

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
}
```

**Response:**
```json
{
  "success": true,
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
    }
  }
}
```

### GET /api/calls/customers/ready

Get customers ready for calling.

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
    }
  }
}
```

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
  }
}
```

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
```
