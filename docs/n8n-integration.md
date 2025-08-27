# 🔄 n8n Integration Guide

## Overview

This guide shows how to integrate the AI Cold Calling System with n8n workflows for complete automation of lead management, call scheduling, and follow-up processes.

## Integration Architecture

```
Google Sheets → n8n → AI Calling System → n8n → Actions
     ↓              ↓                      ↓         ↓
  New Leads    Trigger Calls         Call Results  Follow-ups
                                                   Emails
                                                   CRM Updates
                                                   Scheduling
```

## Setup Requirements

### 1. n8n Installation

**Option A: n8n Cloud (Recommended)**
1. Go to [n8n.cloud](https://n8n.cloud)
2. Create an account
3. Create a new workflow

**Option B: Self-hosted n8n**
```bash
# Using Docker
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n

# Using npm
npm install n8n -g
n8n start

# Access at: http://localhost:5678
```

### 2. Configure Webhooks

In your AI calling system `.env` file:
```bash
# n8n Configuration
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook
N8N_API_KEY=your-n8n-api-key
N8N_WORKFLOW_ID=your-workflow-id
N8N_BASE_URL=https://your-n8n-instance.app.n8n.cloud

# Or for local n8n
N8N_WEBHOOK_URL=http://localhost:5678/webhook
N8N_BASE_URL=http://localhost:5678
```

## Quick Setup Guide

### Step 1: Import Workflows

1. **Download workflow files** from the `n8n-workflows/` directory
2. **Open n8n** (cloud or local instance)
3. **Import workflows**:
   - Go to Workflows → Import from File
   - Import `lead-processing-workflow.json`
   - Import `call-results-workflow.json`

### Step 2: Configure Credentials

1. **Google Sheets API**:
   - Create service account in Google Cloud Console
   - Download credentials JSON
   - Add to n8n credentials

2. **HTTP Request Authentication**:
   - Create "Header Auth" credential
   - Header Name: `X-API-Key`
   - Header Value: `your-ai-calling-system-api-key`

3. **Email Service** (optional):
   - Configure SMTP credentials
   - Or use service like SendGrid/Mailgun

### Step 3: Update Workflow URLs

Replace `http://your-ai-calling-system.com` with your actual URL:
- Local: `http://localhost:3000`
- Production: `https://your-domain.com`

### Step 4: Configure Google Sheets

Your Google Sheet should have these columns:
```
customer_name | phone_number | email | car_model | dealership_name | priority | status | call_status | call_outcome | call_duration | sentiment | next_action | appointment_scheduled | call_notes | last_updated
```

### Step 5: Test Integration

```bash
# Test n8n connection
curl -X GET http://localhost:3000/api/n8n/test \
  -H "X-API-Key: your-api-key"

# Manually trigger call completion
curl -X POST http://localhost:3000/api/n8n/notify/call-completed \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "sessionId": "test_123",
    "customerName": "John Doe",
    "phoneNumber": "+1234567890",
    "carModel": "Toyota Camry 2023",
    "outcome": "appointment_scheduled"
  }'
```

## Core Workflows

### 1. Lead Processing Workflow

**Trigger**: New row in Google Sheets
**Actions**: 
- Validate lead data
- Schedule call
- Update lead status

```json
{
  "name": "AI Calling - Lead Processing",
  "nodes": [
    {
      "parameters": {
        "pollTimes": {
          "item": [
            {
              "mode": "everyMinute"
            }
          ]
        },
        "sheetId": "YOUR_GOOGLE_SHEETS_ID",
        "range": "A:Z"
      },
      "name": "Google Sheets Trigger",
      "type": "n8n-nodes-base.googleSheetsTrigger",
      "typeVersion": 2,
      "position": [240, 300]
    },
    {
      "parameters": {
        "url": "http://your-ai-calling-system.com/api/leads",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "httpMethod": "POST",
        "jsonParameters": true,
        "options": {},
        "bodyParametersJson": "{\n  \"customerName\": \"{{ $json.customer_name }}\",\n  \"phoneNumber\": \"{{ $json.phone_number }}\",\n  \"email\": \"{{ $json.email }}\",\n  \"carModel\": \"{{ $json.car_model }}\",\n  \"leadSource\": \"{{ $json.lead_source }}\",\n  \"priority\": \"{{ $json.priority || 'medium' }}\",\n  \"dealership\": \"{{ $json.dealership_name }}\"\n}"
      },
      "name": "Create Lead",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [460, 300]
    },
    {
      "parameters": {
        "url": "http://your-ai-calling-system.com/webhook/call/initiate",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "httpMethod": "POST",
        "jsonParameters": true,
        "options": {},
        "bodyParametersJson": "{\n  \"customer_name\": \"{{ $json.customerName }}\",\n  \"phone_number\": \"{{ $json.phoneNumber }}\",\n  \"car_model\": \"{{ $json.carModel }}\",\n  \"dealership_name\": \"{{ $json.dealership }}\",\n  \"bot_name\": \"Sarah\",\n  \"priority\": \"{{ $json.priority }}\",\n  \"lead_source\": \"{{ $json.leadSource }}\"\n}"
      },
      "name": "Initiate Call",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [680, 300]
    }
  ],
  "connections": {
    "Google Sheets Trigger": {
      "main": [
        [
          {
            "node": "Create Lead",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Create Lead": {
      "main": [
        [
          {
            "node": "Initiate Call",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### 2. Call Results Processing Workflow

**Trigger**: Webhook from AI calling system
**Actions**:
- Update Google Sheets
- Send follow-up emails
- Schedule appointments
- Update CRM

```json
{
  "name": "AI Calling - Results Processing",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "ai-calling-results",
        "options": {}
      },
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300],
      "webhookId": "ai-calling-results"
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.body.outcome }}",
              "operation": "equal",
              "value2": "appointment_scheduled"
            }
          ]
        }
      },
      "name": "Check Outcome",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [460, 300]
    },
    {
      "parameters": {
        "authentication": "serviceAccount",
        "resource": "sheet",
        "operation": "update",
        "sheetId": "YOUR_GOOGLE_SHEETS_ID",
        "range": "A:Z",
        "keyRow": 1,
        "dataMode": "defineBelow",
        "valueInputMode": "raw",
        "columnsUi": {
          "columnValues": [
            {
              "column": "call_status",
              "value": "={{ $json.body.call_status }}"
            },
            {
              "column": "call_outcome",
              "value": "={{ $json.body.outcome }}"
            },
            {
              "column": "call_duration",
              "value": "={{ $json.body.call_duration }}"
            },
            {
              "column": "next_action",
              "value": "={{ $json.body.next_action }}"
            },
            {
              "column": "last_updated",
              "value": "={{ $now }}"
            }
          ]
        },
        "options": {}
      },
      "name": "Update Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "typeVersion": 3,
      "position": [680, 200]
    },
    {
      "parameters": {
        "fromEmail": "sarah@yourdealership.com",
        "toEmail": "={{ $json.body.extracted_data.email_address }}",
        "subject": "Appointment Confirmation - {{ $json.body.car_model }}",
        "emailType": "html",
        "message": "<h2>Appointment Confirmed!</h2>\n<p>Hi {{ $json.body.customer_name }},</p>\n<p>Thank you for your interest in the {{ $json.body.car_model }}. Your appointment has been scheduled.</p>\n<p>We'll send you the details shortly.</p>\n<p>Best regards,<br>{{ $json.body.dealership_name }}</p>"
      },
      "name": "Send Appointment Email",
      "type": "n8n-nodes-base.emailSend",
      "typeVersion": 2,
      "position": [680, 400]
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [
          {
            "node": "Check Outcome",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Check Outcome": {
      "main": [
        [
          {
            "node": "Update Google Sheets",
            "type": "main",
            "index": 0
          },
          {
            "node": "Send Appointment Email",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

## Webhook Endpoints

### 1. Call Completion Webhook

**URL**: `https://your-n8n-instance.app.n8n.cloud/webhook/call-completed`
**Method**: POST
**Payload**:
```json
{
  "phone_number": "+1234567890",
  "customer_name": "John Doe",
  "car_model": "Toyota Camry 2023",
  "dealership_name": "ABC Motors",
  "call_duration": 180,
  "call_status": "completed",
  "outcome": "appointment_scheduled",
  "transcript": [
    {
      "speaker": "ai",
      "text": "Hi, is this John Doe?",
      "timestamp": "2024-01-15T10:00:00Z"
    }
  ],
  "extracted_data": {
    "still_interested": "yes",
    "wants_appointment": "yes",
    "email_address": "john@example.com",
    "preferred_time": ["morning"],
    "appointment_date": "2024-01-20T10:00:00Z"
  },
  "sentiment_summary": "positive",
  "next_action": "send_appointment_confirmation",
  "call_notes": "Customer very interested, scheduled test drive"
}
```

### 2. Lead Status Update Webhook

**URL**: `https://your-n8n-instance.app.n8n.cloud/webhook/lead-updated`
**Method**: POST
**Payload**:
```json
{
  "lead_id": "lead_123",
  "phone_number": "+1234567890",
  "status": "qualified",
  "lead_score": 85,
  "last_contact": "2024-01-15T10:00:00Z",
  "next_action": "schedule_appointment",
  "notes": "Customer interested in test drive"
}
```

## Advanced Workflows

### 3. Intelligent Follow-up Workflow

This workflow handles different outcomes and schedules appropriate follow-ups:

```json
{
  "name": "AI Calling - Intelligent Follow-up",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "intelligent-followup",
        "options": {}
      },
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.body.outcome }}",
              "operation": "equal",
              "value2": "not_interested"
            }
          ]
        }
      },
      "name": "Not Interested?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [460, 200]
    },
    {
      "parameters": {
        "conditions": {
          "string": [
            {
              "value1": "={{ $json.body.outcome }}",
              "operation": "equal",
              "value2": "interested_similar"
            }
          ]
        }
      },
      "name": "Interested in Similar?",
      "type": "n8n-nodes-base.if",
      "typeVersion": 1,
      "position": [460, 400]
    },
    {
      "parameters": {
        "unit": "days",
        "amount": 30
      },
      "name": "Wait 30 Days",
      "type": "n8n-nodes-base.wait",
      "typeVersion": 1,
      "position": [680, 100]
    },
    {
      "parameters": {
        "url": "http://your-ai-calling-system.com/api/emails/send",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "httpMethod": "POST",
        "jsonParameters": true,
        "bodyParametersJson": "{\n  \"to\": \"{{ $json.body.extracted_data.email_address }}\",\n  \"template\": \"similar_cars_email\",\n  \"data\": {\n    \"customer_name\": \"{{ $json.body.customer_name }}\",\n    \"original_car\": \"{{ $json.body.car_model }}\",\n    \"dealership_name\": \"{{ $json.body.dealership_name }}\"\n  }\n}"
      },
      "name": "Send Similar Cars Email",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 3,
      "position": [680, 400]
    }
  ]
}
```

### 4. CRM Integration Workflow

Integrates with popular CRMs like HubSpot, Salesforce, or Pipedrive:

```json
{
  "name": "AI Calling - CRM Integration",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "crm-update",
        "options": {}
      },
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1,
      "position": [240, 300]
    },
    {
      "parameters": {
        "resource": "contact",
        "operation": "upsert",
        "email": "={{ $json.body.extracted_data.email_address }}",
        "additionalFields": {
          "phone": "={{ $json.body.phone_number }}",
          "firstname": "={{ $json.body.customer_name.split(' ')[0] }}",
          "lastname": "={{ $json.body.customer_name.split(' ')[1] }}",
          "car_interest": "={{ $json.body.car_model }}",
          "lead_status": "={{ $json.body.outcome }}",
          "call_duration": "={{ $json.body.call_duration }}",
          "last_call_date": "={{ $now }}"
        }
      },
      "name": "Update HubSpot Contact",
      "type": "n8n-nodes-base.hubspot",
      "typeVersion": 2,
      "position": [460, 300]
    },
    {
      "parameters": {
        "resource": "deal",
        "operation": "create",
        "dealname": "{{ $json.body.car_model }} - {{ $json.body.customer_name }}",
        "dealstage": "appointmentscheduled",
        "additionalFields": {
          "amount": "25000",
          "dealtype": "newbusiness",
          "pipeline": "default"
        }
      },
      "name": "Create Deal",
      "type": "n8n-nodes-base.hubspot",
      "typeVersion": 2,
      "position": [680, 300]
    }
  ]
}
```

## Configuration Steps

### 1. Set Up Webhooks in AI Calling System

Add this to your `webhooks/services/n8nIntegration.js`:
