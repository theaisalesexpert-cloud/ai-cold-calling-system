# 📋 n8n Workflow Node Configuration Guide

Complete configuration settings for each node in your AI Cold-Calling workflow.

## 🎯 **Workflow Overview**

The workflow consists of these main nodes:
1. **Daily Call Trigger** (Cron)
2. **Set Configuration** (Set)
3. **Get Customer Data** (Google Sheets)
4. **Filter Ready Customers** (Filter)
5. **Process One by One** (Split in Batches)
6. **Initiate AI Call** (HTTP Request)
7. **Wait Between Calls** (Wait)
8. **Check Call Success** (IF)
9. **Update Call Status** (Google Sheets)
10. **Get Statistics** (HTTP Request)
11. **Send Daily Report** (Email Send)

---

## 🔧 **Node-by-Node Configuration**

### **1. Daily Call Trigger (Cron Node)**

**Node Type:** `n8n-nodes-base.cron`

**Configuration:**
```javascript
{
  "rule": {
    "interval": [
      {
        "field": "cronExpression",
        "expression": "0 9 * * 1-5"  // 9 AM, Monday-Friday
      }
    ]
  }
}
```

**Settings Explained:**
- **Cron Expression**: `0 9 * * 1-5`
  - `0` = 0 minutes
  - `9` = 9 AM
  - `*` = Every day of month
  - `*` = Every month
  - `1-5` = Monday to Friday

**Customization Options:**
- `0 10 * * 1-5` = 10 AM weekdays
- `0 14 * * *` = 2 PM every day
- `0 9,14 * * 1-5` = 9 AM and 2 PM weekdays

---

### **2. Set Configuration (Set Node)**

**Node Type:** `n8n-nodes-base.set`

**Configuration:**
```javascript
{
  "values": {
    "string": [
      {
        "name": "BASE_URL",
        "value": "https://ai-cold-calling-system.onrender.com"
      },
      {
        "name": "GOOGLE_SHEETS_ID",
        "value": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
      },
      {
        "name": "GOOGLE_SERVICE_ACCOUNT_EMAIL",
        "value": "your-service@project.iam.gserviceaccount.com"
      },
      {
        "name": "GOOGLE_PRIVATE_KEY",
        "value": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
      },
      {
        "name": "GMAIL_USER",
        "value": "your-email@gmail.com"
      },
      {
        "name": "API_KEY",
        "value": "abc123def456ghi789jkl012mno345pqr678"
      }
    ]
  },
  "options": {}
}
```

**Required Values:**
- **BASE_URL**: Your Render.com app URL
- **GOOGLE_SHEETS_ID**: From your Google Sheet URL
- **GOOGLE_SERVICE_ACCOUNT_EMAIL**: From service account JSON
- **GOOGLE_PRIVATE_KEY**: From service account JSON (keep \n characters)
- **GMAIL_USER**: Your Gmail address
- **API_KEY**: Your custom API key

---

### **3. Get Customer Data (Google Sheets Node)**

**Node Type:** `n8n-nodes-base.googleSheets`

**Configuration:**
```javascript
{
  "authentication": "serviceAccount",
  "serviceAccountEmail": "={{$('Set Configuration').item.json.GOOGLE_SERVICE_ACCOUNT_EMAIL}}",
  "privateKey": "={{$('Set Configuration').item.json.GOOGLE_PRIVATE_KEY}}",
  "operation": "read",
  "documentId": "={{$('Set Configuration').item.json.GOOGLE_SHEETS_ID}}",
  "sheetName": "Customers",
  "range": "A:O",
  "keyRow": 1,
  "dataStartRow": 2
}
```

**Settings Explained:**
- **Authentication**: Service Account (more secure than OAuth)
- **Service Account Email**: References Set Configuration node
- **Private Key**: References Set Configuration node
- **Operation**: Read (to get customer data)
- **Document ID**: Your Google Sheets ID
- **Sheet Name**: "Customers" (must match your sheet tab name)
- **Range**: A:O (columns A through O)
- **Key Row**: 1 (header row)
- **Data Start Row**: 2 (first data row)

---

### **4. Filter Ready Customers (Filter Node)**

**Node Type:** `n8n-nodes-base.filter`

**Configuration:**
```javascript
{
  "conditions": {
    "options": {
      "caseSensitive": true,
      "leftValue": "",
      "typeValidation": "strict"
    },
    "conditions": [
      {
        "id": "filter-ready-customers",
        "leftValue": "={{$json.Status}}",
        "rightValue": "new",
        "operator": {
          "type": "string",
          "operation": "equals"
        }
      },
      {
        "id": "has-phone",
        "leftValue": "={{$json.Phone}}",
        "rightValue": "",
        "operator": {
          "type": "string",
          "operation": "notEquals"
        }
      },
      {
        "id": "not-called-today",
        "leftValue": "={{$json['Last Call Date']}}",
        "rightValue": "={{DateTime.now().toFormat('yyyy-MM-dd')}}",
        "operator": {
          "type": "string",
          "operation": "notEquals"
        }
      }
    ],
    "combinator": "and"
  }
}
```

**Filter Conditions:**
1. **Status equals "new"**: Only call new customers
2. **Phone not empty**: Must have phone number
3. **Not called today**: Avoid duplicate calls
4. **Combinator "and"**: All conditions must be true

---

### **5. Process One by One (Split in Batches Node)**

**Node Type:** `n8n-nodes-base.splitInBatches`

**Configuration:**
```javascript
{
  "batchSize": 1,
  "options": {}
}
```

**Settings:**
- **Batch Size**: 1 (process customers one at a time)
- **Options**: Empty (use defaults)

---

### **6. Initiate AI Call (HTTP Request Node)**

**Node Type:** `n8n-nodes-base.httpRequest`

**Configuration:**
```javascript
{
  "method": "POST",
  "url": "={{$('Set Configuration').item.json.BASE_URL}}/api/calls/initiate",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "=Bearer {{$('Set Configuration').item.json.API_KEY}}"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "specifyBody": "json",
  "jsonBody": "={\n  \"customerId\": \"{{$json.ID}}\",\n  \"phoneNumber\": \"{{$json.Phone}}\"\n}",
  "options": {}
}
```

**Settings Explained:**
- **Method**: POST
- **URL**: References BASE_URL from Set Configuration
- **Headers**: Authorization with API key + Content-Type
- **Body**: JSON with customer ID and phone number
- **JSON Body**: Dynamic values from customer data

---

### **7. Wait Between Calls (Wait Node)**

**Node Type:** `n8n-nodes-base.wait`

**Configuration:**
```javascript
{
  "amount": 30,
  "unit": "seconds"
}
```

**Settings:**
- **Amount**: 30 (wait time)
- **Unit**: seconds
- **Purpose**: Prevent overwhelming the system

**Customization:**
- Increase to 60 seconds for slower processing
- Decrease to 15 seconds for faster campaigns

---

### **8. Check Call Success (IF Node)**

**Node Type:** `n8n-nodes-base.if`

**Configuration:**
```javascript
{
  "conditions": {
    "options": {
      "caseSensitive": true,
      "leftValue": "",
      "typeValidation": "strict"
    },
    "conditions": [
      {
        "id": "call-success",
        "leftValue": "={{$json.success}}",
        "rightValue": true,
        "operator": {
          "type": "boolean",
          "operation": "true"
        }
      }
    ],
    "combinator": "and"
  }
}
```

**Logic:**
- **If TRUE**: Call was successful → Update as "call_initiated"
- **If FALSE**: Call failed → Update as "call_failed"

---

### **9. Update Call Status (Google Sheets Node)**

**Node Type:** `n8n-nodes-base.googleSheets`

**Configuration for SUCCESS path:**
```javascript
{
  "authentication": "serviceAccount",
  "serviceAccountEmail": "={{$('Set Configuration').item.json.GOOGLE_SERVICE_ACCOUNT_EMAIL}}",
  "privateKey": "={{$('Set Configuration').item.json.GOOGLE_PRIVATE_KEY}}",
  "operation": "update",
  "documentId": "={{$('Set Configuration').item.json.GOOGLE_SHEETS_ID}}",
  "sheetName": "Customers",
  "range": "H{{$('Process One by One').item.json.row}}:I{{$('Process One by One').item.json.row}}",
  "keyRow": 1,
  "dataMode": "define",
  "data": {
    "values": [
      [
        "={{DateTime.now().toFormat('yyyy-MM-dd')}}",
        "call_initiated"
      ]
    ]
  }
}
```

**Configuration for FAILED path:**
```javascript
{
  // Same as above but with:
  "data": {
    "values": [
      [
        "={{DateTime.now().toFormat('yyyy-MM-dd')}}",
        "call_failed"
      ]
    ]
  }
}
```

---

### **10. Get Statistics (HTTP Request Node)**

**Node Type:** `n8n-nodes-base.httpRequest`

**Configuration:**
```javascript
{
  "method": "GET",
  "url": "={{$('Set Configuration').item.json.BASE_URL}}/api/calls/statistics",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "Authorization",
        "value": "=Bearer {{$('Set Configuration').item.json.API_KEY}}"
      }
    ]
  },
  "options": {}
}
```

---

### **11. Send Daily Report (Email Send Node)**

**Node Type:** `n8n-nodes-base.emailSend`

**Configuration:**
```javascript
{
  "fromEmail": "={{$('Set Configuration').item.json.GMAIL_USER}}",
  "toEmail": "admin@yourcompany.com",
  "subject": "Daily AI Calling Report - {{DateTime.now().toFormat('yyyy-MM-dd')}}",
  "emailType": "html",
  "message": "=<h2>Daily AI Calling Report</h2>\n<p><strong>Date:</strong> {{DateTime.now().toFormat('yyyy-MM-dd')}}</p>\n\n<h3>Statistics:</h3>\n<ul>\n<li><strong>Total Customers:</strong> {{$json.data.sheets.total}}</li>\n<li><strong>Called Today:</strong> {{$json.data.sheets.calledToday}}</li>\n<li><strong>Interested:</strong> {{$json.data.sheets.interested}}</li>\n<li><strong>Appointments:</strong> {{$json.data.sheets.appointments}}</li>\n</ul>",
  "options": {}
}
```

**Credentials Required:**
- **SMTP Credential**: Gmail SMTP settings
  - Host: `smtp.gmail.com`
  - Port: `587`
  - Secure: `true`
  - Username: Your Gmail address
  - Password: Gmail app password

---

## 🔗 **Node Connections**

```
Daily Call Trigger → Set Configuration → Get Customer Data → Filter Ready Customers → Process One by One → Initiate AI Call → Wait Between Calls → Check Call Success
                                                                                                                                                    ↓
                                                                                                                                              [TRUE] Update Call Status (Success)
                                                                                                                                                    ↓
                                                                                                                                              [FALSE] Update Call Status (Failed)
                                                                                                                                                    ↓
                                                                                                                                              Get Statistics → Send Daily Report
```

---

## 🎯 **Testing Individual Nodes**

### **Test Set Configuration:**
1. Click on "Set Configuration" node
2. Click "Execute Node"
3. Verify all values are set correctly

### **Test Google Sheets:**
1. Click on "Get Customer Data" node
2. Click "Execute Node"
3. Should return customer data from your sheet

### **Test HTTP Request:**
1. Click on "Initiate AI Call" node
2. Click "Execute Node"
3. Should make API call to your backend

---

## 🔧 **Common Configuration Issues**

### **Issue 1: Google Sheets Authentication**
- **Problem**: Permission denied errors
- **Fix**: Ensure service account email is added to sheet with Editor permissions

### **Issue 2: HTTP Request Failures**
- **Problem**: 401 Unauthorized errors
- **Fix**: Verify API_KEY matches your backend configuration

### **Issue 3: Email Sending Failures**
- **Problem**: SMTP authentication errors
- **Fix**: Use Gmail app password, not regular password

---

## 📊 **Workflow Visual Diagram**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Daily Call     │───▶│ Set             │───▶│ Get Customer    │
│  Trigger        │    │ Configuration   │    │ Data            │
│  (Cron)         │    │ (Set)           │    │ (Google Sheets) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Process One     │◀───│ Filter Ready    │◀───│                 │
│ by One          │    │ Customers       │    │                 │
│ (Split Batches) │    │ (Filter)        │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Initiate AI     │───▶│ Wait Between    │───▶│ Check Call      │
│ Call            │    │ Calls           │    │ Success         │
│ (HTTP Request)  │    │ (Wait)          │    │ (IF)            │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                               ┌────────┴────────┐
                                               ▼                 ▼
                                    ┌─────────────────┐ ┌─────────────────┐
                                    │ Update Success  │ │ Update Failed   │
                                    │ (Google Sheets) │ │ (Google Sheets) │
                                    └─────────────────┘ └─────────────────┘
                                               │                 │
                                               └────────┬────────┘
                                                        ▼
                                               ┌─────────────────┐
                                               │ Get Statistics  │
                                               │ (HTTP Request)  │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │ Send Daily      │
                                               │ Report          │
                                               │ (Email Send)    │
                                               └─────────────────┘
```

## 🔐 **Credentials Setup in n8n**

### **Gmail SMTP Credential**
1. **Go to n8n** → Credentials → Create New
2. **Select**: SMTP
3. **Configure**:
   ```
   Name: Gmail SMTP
   Host: smtp.gmail.com
   Port: 587
   Secure: true
   Username: your-email@gmail.com
   Password: your_gmail_app_password
   ```

### **Google Service Account (Optional)**
If you prefer using n8n credentials instead of Set node:
1. **Go to n8n** → Credentials → Create New
2. **Select**: Google Service Account
3. **Upload**: Your service account JSON file

## 🎛️ **Advanced Node Settings**

### **HTTP Request Node Advanced Options**
```javascript
{
  "timeout": 30000,           // 30 second timeout
  "followRedirect": true,     // Follow redirects
  "ignoreHttpStatusErrors": false,  // Fail on HTTP errors
  "proxy": "",               // No proxy
  "internalIpsAllowed": false // Security setting
}
```

### **Google Sheets Node Advanced Options**
```javascript
{
  "useAppend": false,        // Don't append, update specific cells
  "cellFormat": "USER_ENTERED", // Format as user entered
  "dateTimeRenderOption": "FORMATTED_STRING" // Format dates
}
```

### **Email Node Advanced Options**
```javascript
{
  "allowUnauthorizedCerts": false, // Security setting
  "connectionTimeout": 30000,      // Connection timeout
  "attachments": []                // No attachments by default
}
```

## 🔄 **Webhook Nodes (Manual Triggers)**

### **Manual Call Webhook**
**Node Type:** `n8n-nodes-base.webhook`
```javascript
{
  "httpMethod": "POST",
  "path": "manual-call",
  "responseMode": "responseNode",
  "options": {}
}
```

### **Bulk Call Webhook**
**Node Type:** `n8n-nodes-base.webhook`
```javascript
{
  "httpMethod": "POST",
  "path": "bulk-call",
  "responseMode": "responseNode",
  "options": {}
}
```

## 🧪 **Testing Configuration**

### **Test Each Node Individually**
1. **Right-click node** → "Execute Node"
2. **Check output** in the right panel
3. **Verify data** is passed correctly to next node

### **Test Complete Workflow**
1. **Click "Execute Workflow"** button
2. **Monitor execution** in real-time
3. **Check each node** for successful execution

### **Debug Failed Nodes**
1. **Click on failed node**
2. **Check error message** in right panel
3. **Verify configuration** against this guide
4. **Test with sample data**

## 📝 **Configuration Checklist**

### **Before Activating Workflow:**
- [ ] Set Configuration node has all required values
- [ ] Google Sheets ID is correct
- [ ] Service account has access to sheet
- [ ] API_KEY matches backend configuration
- [ ] BASE_URL points to your Render app
- [ ] Gmail SMTP credential is configured
- [ ] All nodes execute successfully in test mode

### **After Activation:**
- [ ] Cron trigger is set for correct timezone
- [ ] Workflow shows as "Active"
- [ ] Manual test execution works
- [ ] Google Sheets updates correctly
- [ ] Email reports are received

This comprehensive guide covers every aspect of configuring your n8n workflow nodes. Each node is designed to work together seamlessly, with the Set Configuration node providing centralized credential management.
