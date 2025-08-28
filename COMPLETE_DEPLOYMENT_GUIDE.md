# 🚀 Complete AI Cold Calling System - Script-Based Implementation

## 📋 **Google Sheet Structure (Exact Format)**

Create a Google Sheet named "Leads" with these exact columns:

| Column | Header | Purpose | Example |
|--------|--------|---------|---------|
| A | Customer Phone Number | Primary identifier | +1234567890 |
| B | Customer Name | Personalization | John Smith |
| C | Car Model Enquired About | Conversation context | Honda Civic |
| D | Interested? (Yes/No) | Updated by AI | Yes/No |
| E | Appointment Date & Time | Updated by AI | Tomorrow at 2 PM |
| F | Interested in Similar Cars? (Yes/No) | Updated by AI | Yes/No |
| G | Customer Email | Updated by AI | john@email.com |

## 🎯 **Conversation Script Implementation**

### **Step 1: Greeting & Personalization**
```
AI: "Hi [Customer Name], this is [Bot Name] from [Dealership Name]. 
     You recently enquired about the [Car Model]. Is now a good time to talk?"

Customer Responses:
- "Yes" → Continue to Step 2
- "Not now/busy" → Politely reschedule and end call
```

### **Step 2: Confirm Interest in Original Car**
```
AI: "I just wanted to check — are you still interested in the [Car Model]?"

Customer Responses:
- "Yes, I am" → Update Column D = "Yes" → Go to Step 3
- "No, not anymore" → Update Column D = "No" → Go to Step 4
```

### **Step 3: Arrange Appointment for Original Car**
```
AI: "Great! Would you like to arrange an appointment to see or test drive the [Car Model]?"

Customer Responses:
- "Yes" → Ask: "What date and time works best for you?"
  - Save answer to Column E → End call
- "No" → Go to Step 4
```

### **Step 4: Offer Similar Cars**
```
AI: "No problem — sometimes the exact model isn't the right fit. 
     Would you be interested in hearing about similar cars we currently have available?"

Customer Responses:
- "Yes, I'd like to see similar cars" → Update Column F = "Yes" → Go to Step 5
- "No, not interested at all" → Update Column F = "No" → Thank and end call
```

### **Step 5: Collect Email for Similar Car Options**
```
AI: "Perfect! What's the best email address to send those similar car options to?"

Customer Responses:
- Gives email → Save to Column G → Send email → End call
- Email exists → Confirm: "I'll send it to your email on file: [Email]" → End call
```

## 🔧 **Environment Variables (Render Dashboard)**

```env
# Core API
API_KEY=abc123def456ghi789jkl012mno345pqr678
BASE_URL=https://ai-cold-calling-system.onrender.com

# Enhanced Services
USE_ELEVENLABS=true
USE_DEEPGRAM=true

# ElevenLabs Configuration
ELEVENLABS_API_KEY=sk_your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL_ID=eleven_turbo_v2

# Deepgram Configuration  
DEEPGRAM_API_KEY=your_deepgram_api_key_here
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+441218161111
TWILIO_WEBHOOK_URL=https://ai-cold-calling-system.onrender.com

# Google Sheets Configuration
GOOGLE_SHEETS_ID=your_google_sheets_id_here
GOOGLE_PROJECT_ID=your_google_project_id
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your_client_id

# Email Configuration (Gmail)
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_app_password_here

# OpenAI Configuration
OPENAI_API_KEY=sk-your_openai_api_key_here

# Dealership Information
DEALERSHIP_NAME=Premier Auto
DEALERSHIP_PHONE=+1-555-0123
DEALERSHIP_EMAIL=sales@premierauto.com
```

## 🚀 **Deployment Steps**

### **1. Deploy to Render**
```bash
git add .
git commit -m "Complete script-based AI calling system with ElevenLabs and Deepgram"
git push origin main
```

### **2. Configure Environment Variables**
- Go to Render Dashboard → Your Service → Environment
- Add all environment variables from above
- Click "Save Changes"

### **3. Wait for Deployment**
- Monitor deployment logs
- Should see: "Your service is live 🎉"

## 🧪 **Testing Steps**

### **1. Test Service Health**
```bash
curl https://ai-cold-calling-system.onrender.com/health/detailed
```

**Expected Response:**
```json
{
  "status": "healthy",
  "services": {
    "elevenlabs": {"status": "healthy"},
    "deepgram": {"status": "healthy"},
    "googleSheets": {"status": "healthy"},
    "email": {"status": "healthy"}
  }
}
```

### **2. Test Conversation Flow**
```bash
bash test-conversation-flow.sh
```

### **3. Test Real Call**
```bash
curl -X POST https://ai-cold-calling-system.onrender.com/api/calls/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer abc123def456ghi789jkl012mno345pqr678" \
  -d '{"phoneNumber": "+YOUR_PHONE_NUMBER"}'
```

## 📊 **n8n Workflow Setup**

### **1. Import Workflow**
- Open n8n
- Click "Import from File"
- Upload `n8n-workflow-updated.json`

### **2. Configure Credentials**
- Create HTTP Header Auth credential
- Name: "AI Calling System API"
- Header Name: "Authorization"
- Header Value: "Bearer abc123def456ghi789jkl012mno345pqr678"

### **3. Set Schedule**
- Add Cron Trigger node
- Schedule: `0 9 * * 1-5` (9 AM, Monday-Friday)
- Connect to "Set Configuration" node

## ✅ **Success Indicators**

### **🎙️ Voice Quality**
- **Natural, human-like voice** (ElevenLabs working)
- **No robotic Alice voice**
- **Clear, professional speech**

### **📞 Call Flow**
- **Follows exact script** step by step
- **Responds appropriately** to customer input
- **Handles interruptions** gracefully
- **Ends calls** at appropriate times

### **📊 Data Updates**
- **Column D**: "Yes" or "No" for original car interest
- **Column E**: Appointment date/time if scheduled
- **Column F**: "Yes" or "No" for similar cars interest  
- **Column G**: Email address if provided

### **📧 Email Automation**
- **Automatically sent** when customer wants similar cars
- **Contains customer name** and original car model
- **Professional template** with dealership branding
- **Call-to-action buttons** for contact

## 🔍 **Monitoring & Logs**

### **Render Logs to Watch For:**
```
✅ ElevenLabs service initialized
✅ Deepgram service initialized  
✅ Google Sheets connected
✅ Email service configured
✅ Using ElevenLabs for greeting
✅ Customer data updated in sheets
✅ Similar cars email sent
```

### **Error Indicators:**
```
❌ ElevenLabs API key not configured
❌ Deepgram service not available
❌ Failed to update Google Sheet
❌ Email service disabled
❌ Headers already sent error
```

## 🎯 **Performance Optimization**

### **Response Time:**
- **ElevenLabs**: ~2-3 seconds for speech generation
- **Deepgram**: ~1-2 seconds for transcription
- **OpenAI**: ~1-2 seconds for conversation processing
- **Total**: ~5-7 seconds per interaction

### **Reliability Features:**
- **Automatic fallback** to Twilio TTS if ElevenLabs fails
- **Error handling** for all API calls
- **Conversation timeout** protection
- **Duplicate call prevention**

## 🚨 **Troubleshooting**

### **Robotic Voice Issue:**
1. Check `USE_ELEVENLABS=true`
2. Verify ElevenLabs API key
3. Test `/api/test/elevenlabs` endpoint
4. Check TwiML contains `<Play>` not `<Say>`

### **Google Sheets Not Updating:**
1. Verify Google Sheets ID
2. Check service account permissions
3. Test `/api/sheets/test` endpoint
4. Ensure sheet has correct column headers

### **Email Not Sending:**
1. Check Gmail app password
2. Verify email service status
3. Test email endpoint directly
4. Check spam folder

## 🎉 **Final Verification**

### **Complete Test Checklist:**
- [ ] Health check returns all services healthy
- [ ] Test call uses natural voice (ElevenLabs)
- [ ] Conversation follows exact script
- [ ] Google Sheets updates correctly
- [ ] Email sends automatically
- [ ] n8n workflow runs successfully
- [ ] No errors in Render logs

**Your AI Cold Calling System is now fully operational with natural voice, script-based conversations, and automated data management!** 🚀
