# 🔄 Complete n8n Workflow Configuration Guide

## 📥 **Step 1: Import the Workflow**

1. **Log into your n8n Cloud account**
2. **Go to Workflows**
3. **Click "Import from file"**
4. **Upload:** `n8n-workflows/ai-cold-calling-workflow.json`
5. **Click "Import"**

## 🔑 **Step 2: Set Up Credentials**

### **Credential 1: Google Sheets API**
1. **Go to Credentials → Add Credential**
2. **Select:** "Google Sheets API"
3. **Name:** `Google Sheets API`
4. **Authentication:** Service Account
5. **Service Account Email:** `[Your service account email from Google Cloud]`
6. **Private Key:** `[Your full private key from Google Cloud JSON]`
7. **Click "Save"**

### **Credential 2: Twilio API**
1. **Add Credential → Twilio API**
2. **Name:** `Twilio API`
3. **Account SID:** `[Your Twilio Account SID]`
4. **Auth Token:** `[Your Twilio Auth Token]`
5. **Click "Save"**

### **Credential 3: SMTP Gmail**
1. **Add Credential → SMTP**
2. **Name:** `SMTP Gmail`
3. **Host:** `smtp.gmail.com`
4. **Port:** `587`
5. **Secure:** `false` (uses StartTLS)
6. **Username:** `[Your Gmail address]`
7. **Password:** `[Your Gmail App Password]`
8. **Click "Save"**

## 🌐 **Step 3: Environment Variables**

**Go to Settings → Environment Variables and add:**

```
GOOGLE_SHEETS_ID = [Your Google Sheets ID from URL]
TWILIO_ACCOUNT_SID = [Your Twilio Account SID]
TWILIO_PHONE_NUMBER = [Your Twilio phone number like +1234567890]
WEBHOOK_BASE_URL = https://ai-cold-calling-system.onrender.com
DEALERSHIP_NAME = [Your actual dealership name]
BOT_NAME = Sarah
DEFAULT_REP_NAME = Sarah from [Your Dealership Name]
SMTP_USER = [Your Gmail address]
```

## 🔧 **Step 4: Configure Each Node**

### **Node 1: Schedule Calls (Cron)**
```
✓ Trigger Rules: Cron Expression
✓ Expression: 0 9-17 * * 1-5
✓ Timezone: Your local timezone
```

### **Node 2: Read Leads from Google Sheets**
```
✓ Credential: Google Sheets API
✓ Resource: Sheet
✓ Operation: Read
✓ Document ID: {{ $env.GOOGLE_SHEETS_ID }}
✓ Sheet Name: Sheet1
✓ Range: A:P
✓ Header Row: true
```

### **Node 3: Filter Pending Leads**
```
✓ Condition 1: {{ $json.call_status }} equals "pending"
✓ Condition 2: {{ parseInt($json.call_attempts) }} less than 3
✓ Combinator: AND
```

### **Node 4: Process One Lead at a Time**
```
✓ Batch Size: 1
✓ Reset: false
```

### **Node 5: Update Call Status to In Progress**
```
✓ Credential: Google Sheets API
✓ Operation: Update
✓ Document ID: {{ $env.GOOGLE_SHEETS_ID }}
✓ Column to Match: phone_number
✓ Value to Match: {{ $json.phone_number }}
✓ Fields to Update:
  - call_status = "in_progress"
  - call_attempts = {{ parseInt($json.call_attempts) + 1 }}
  - last_call_date = {{ new Date().toISOString().split('T')[0] }}
```

### **Node 6: Initiate Twilio Call**
```
✓ Method: POST
✓ URL: https://api.twilio.com/2010-04-01/Accounts/{{ $env.TWILIO_ACCOUNT_SID }}/Calls.json
✓ Authentication: Twilio API credential
✓ Body Parameters (Form):
  - To: {{ $json.phone_number }}
  - From: {{ $env.TWILIO_PHONE_NUMBER }}
  - Url: {{ $env.WEBHOOK_BASE_URL }}/webhook/call/initiate
  - Method: POST
  - StatusCallback: {{ $env.WEBHOOK_BASE_URL }}/webhook/call/status
  - StatusCallbackEvent: initiated,ringing,answered,completed
  - StatusCallbackMethod: POST
```

### **Node 7: Webhook - Call Completed**
```
✓ HTTP Method: POST
✓ Path: call-completed
✓ Authentication: None
✓ Response Mode: Response Body
```
**Important:** This creates the webhook URL you'll use in your Render app

### **Node 8: Update Call Results**
```
✓ Credential: Google Sheets API
✓ Operation: Update
✓ Document ID: {{ $env.GOOGLE_SHEETS_ID }}
✓ Column to Match: phone_number
✓ Value to Match: {{ $json.phone_number }}
✓ Fields to Update:
  - call_status = {{ $json.call_status }}
  - call_duration = {{ $json.call_duration }}
  - call_notes = {{ $json.call_notes }}
  - still_interested = {{ $json.extracted_data.still_interested || 'unknown' }}
  - wants_appointment = {{ $json.extracted_data.wants_appointment || 'unknown' }}
  - interested_similar = {{ $json.extracted_data.interested_similar || 'unknown' }}
  - email_address = {{ $json.extracted_data.email_address || '' }}
  - next_action = {{ $json.extracted_data.email_address ? 'send_similar_cars' : ($json.extracted_data.wants_appointment === 'yes' ? 'schedule_appointment' : 'no_action') }}
```

### **Node 9: Check if Should Send Email**
```
✓ Condition 1: {{ $json.extracted_data.email_address }} not equals ""
✓ Condition 2: {{ $json.extracted_data.interested_similar }} equals "yes"
✓ Combinator: AND
```

### **Node 10: Send Similar Cars Email**
```
✓ Credential: SMTP Gmail
✓ From Email: {{ $env.SMTP_USER }}
✓ To Email: {{ $json.extracted_data.email_address }}
✓ Subject: Similar Car Options - {{ $env.DEALERSHIP_NAME }}
✓ Email Type: HTML
✓ Message: [HTML template with car options]
```

### **Node 11: Mark Email as Sent**
```
✓ Credential: Google Sheets API
✓ Operation: Update
✓ Column to Match: phone_number
✓ Fields to Update:
  - email_sent = "yes"
```

## 🔗 **Step 5: Node Connections**

Verify these connections exist:
```
Schedule Calls → Read Leads from Google Sheets
Read Leads → Filter Pending Leads  
Filter Leads → Process One Lead at a Time
Process Leads → Update Call Status to In Progress
Update Status → Initiate Twilio Call
Webhook Call Completed → Update Call Results
Update Results → Check if Should Send Email
Check Email → Send Similar Cars Email (TRUE branch)
Send Email → Mark Email as Sent
```

## 🧪 **Step 6: Test the Workflow**

1. **Test Individual Nodes:**
   - Click on "Read Leads from Google Sheets"
   - Click "Test step"
   - Should return your sheet data

2. **Test Complete Workflow:**
   - Click "Execute Workflow"
   - Watch each node turn green
   - Check for any error messages

3. **Check Webhook URL:**
   - Go to "Webhook - Call Completed" node
   - Copy the webhook URL
   - Should be: `https://theaisalesexpert.app.n8n.cloud/webhook/call-completed`

## ⚙️ **Step 7: Update Your Render App**

Add this environment variable to Render.com:
```
N8N_WEBHOOK_URL=https://theaisalesexpert.app.n8n.cloud
```

This tells your Render app where to send call results back to n8n.

## ✅ **Verification Checklist**

- [ ] Workflow imported successfully
- [ ] All 3 credentials created and working
- [ ] All environment variables set
- [ ] All nodes have green connections
- [ ] Test execution completes without errors
- [ ] Webhook URL copied for Render app configuration

Your updated n8n workflow file is now ready! Would you like me to help you with any specific node configuration or credential setup?
