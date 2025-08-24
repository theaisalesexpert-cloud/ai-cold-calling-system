# 🔧 Fixed n8n Workflows Setup Guide

## Problem Solved
The original workflows used newer node types that aren't available in all n8n Cloud instances. These fixed versions use standard nodes that work in any n8n environment.

## 📁 Fixed Workflow Files
1. **`ai-cold-calling-main-workflow-fixed.json`** - Main workflow using standard nodes
2. **`ai-conversation-workflow-fixed.json`** - Conversation handler using standard nodes

## 🚀 Import Instructions

### Step 1: Delete Old Workflow (if imported)
1. Go to your n8n Cloud dashboard
2. If you imported the original workflow, delete it
3. Click "Workflows" → Find the old workflow → Delete

### Step 2: Import Fixed Main Workflow
1. Go to **Workflows** in n8n
2. Click **"Import from File"**
3. Upload **`ai-cold-calling-main-workflow-fixed.json`**
4. Click **"Import"**

### Step 3: Import Fixed Conversation Workflow
1. Still in **Workflows**
2. Click **"Import from File"** again
3. Upload **`ai-conversation-workflow-fixed.json`**
4. Click **"Import"**

## ⚙️ Required Credentials Setup

### 1. Google Sheets Service Account
**Credential Type**: `Google Service Account`
**Name**: `google-sheets-service-account`

**Setup**:
1. Go to n8n → Settings → Credentials
2. Add new credential → Google Service Account
3. Upload your service account JSON file
4. Name it: `google-sheets-service-account`

### 2. Twilio Basic Auth
**Credential Type**: `HTTP Basic Auth`
**Name**: `twilio-basic-auth`

**Setup**:
1. Add new credential → HTTP Basic Auth
2. **Username**: Your Twilio Account SID
3. **Password**: Your Twilio Auth Token
4. Name it: `twilio-basic-auth`

### 3. OpenAI API Key
**Credential Type**: `HTTP Header Auth`
**Name**: `openai-api-key`

**Setup**:
1. Add new credential → HTTP Header Auth
2. **Name**: `Authorization`
3. **Value**: `Bearer YOUR_OPENAI_API_KEY`
4. Name it: `openai-api-key`

### 4. ElevenLabs API Key
**Credential Type**: `HTTP Header Auth`
**Name**: `elevenlabs-api-key`

**Setup**:
1. Add new credential → HTTP Header Auth
2. **Name**: `xi-api-key`
3. **Value**: `YOUR_ELEVENLABS_API_KEY`
4. Name it: `elevenlabs-api-key`

### 5. Gmail SMTP
**Credential Type**: `SMTP`
**Name**: `gmail-smtp`

**Setup**:
1. Add new credential → SMTP
2. **Host**: `smtp.gmail.com`
3. **Port**: `587`
4. **Security**: `STARTTLS`
5. **Username**: Your Gmail address
6. **Password**: Your Gmail App Password
7. Name it: `gmail-smtp`

## 🔧 Environment Variables Setup

Go to n8n → Settings → Environment Variables and add:

```
GOOGLE_SPREADSHEET_ID=your_google_sheets_id_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
EMAIL_USER=your_email@gmail.com
ELEVENLABS_VOICE_ID=your_elevenlabs_voice_id_here
```

## 🔗 Key Differences from Original

### Main Workflow Changes:
- ✅ **Google Sheets Trigger** → **Schedule Trigger** (checks every 5 minutes)
- ✅ **Twilio Node** → **HTTP Request** (direct API call)
- ✅ **Updated node versions** to work with all n8n instances
- ✅ **Simplified authentication** using standard credential types

### Conversation Workflow Changes:
- ✅ **OpenAI Node** → **HTTP Request** (direct API call)
- ✅ **ElevenLabs integration** via HTTP Request
- ✅ **Standard webhook** and response nodes
- ✅ **Compatible with all n8n versions**

## ✅ Testing Your Setup

### Test Main Workflow:
1. Add a test lead to your Google Sheets with status "Pending"
2. Manually execute the workflow
3. Check if it reads the sheet and updates the status

### Test Conversation Workflow:
1. Use the webhook test feature in n8n
2. Send sample conversation data
3. Verify AI response generation

## 🚨 Troubleshooting

### "Node not found" errors:
- Make sure you're using the **FIXED** workflow files
- All nodes in the fixed versions are standard n8n nodes

### Credential errors:
- Double-check credential names match exactly
- Verify all API keys are correct
- Test credentials individually

### Google Sheets not updating:
- Verify service account has edit permissions
- Check spreadsheet ID is correct
- Ensure sheet name is "Leads"

### Twilio calls not working:
- Verify Account SID and Auth Token
- Check phone number format (+1234567890)
- Ensure webhook URLs are accessible

## 🎯 Success Indicators

**Main Workflow Working:**
- ✅ Reads Google Sheets successfully
- ✅ Filters pending calls
- ✅ Makes Twilio API calls
- ✅ Updates call status

**Conversation Workflow Working:**
- ✅ Receives webhook data
- ✅ Generates AI responses
- ✅ Synthesizes speech
- ✅ Returns proper JSON response

## 📞 Next Steps

1. **Deploy Render.com webhook server** (follow deployment guide)
2. **Configure Twilio webhooks** to point to your domain
3. **Test end-to-end** with real phone calls
4. **Monitor and optimize** based on performance

These fixed workflows will work reliably in any n8n Cloud environment!
