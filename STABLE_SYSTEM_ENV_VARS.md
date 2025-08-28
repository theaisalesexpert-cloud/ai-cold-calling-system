# 🔧 Environment Variables for Stable AI Calling System

## 🚨 **CRITICAL - Set These in Render Dashboard**

### **Core System Settings**
```env
# API Authentication
API_KEY=abc123def456ghi789jkl012mno345pqr678
BASE_URL=https://ai-cold-calling-system.onrender.com

# System Performance
NODE_ENV=production
CONVERSATION_TIMEOUT=300000
MAX_CONVERSATION_TURNS=20
RESPONSE_TIMEOUT=3000
```

### **🎙️ ElevenLabs Configuration (MUST BE CORRECT)**
```env
# Enable ElevenLabs (CRITICAL)
USE_ELEVENLABS=true

# ElevenLabs API Settings
ELEVENLABS_API_KEY=sk_your_actual_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL_ID=eleven_turbo_v2

# Voice Quality Settings
ELEVENLABS_STABILITY=0.5
ELEVENLABS_SIMILARITY_BOOST=0.8
ELEVENLABS_STYLE=0.0
```

### **🎧 Deepgram Configuration**
```env
# Enable Deepgram
USE_DEEPGRAM=true

# Deepgram API Settings
DEEPGRAM_API_KEY=your_actual_deepgram_api_key_here
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US
```

### **📞 Twilio Configuration**
```env
# Twilio Account Settings
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+441218161111
TWILIO_WEBHOOK_URL=https://ai-cold-calling-system.onrender.com

# Call Settings
CALL_TIMEOUT=30
RECORDING_ENABLED=true
MACHINE_DETECTION=Enable
```

### **📊 Google Sheets Configuration**
```env
# Google Sheets Integration
GOOGLE_SHEETS_ID=your_google_sheets_id_here
GOOGLE_PROJECT_ID=your_google_project_id
GOOGLE_PRIVATE_KEY_ID=your_private_key_id
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CLIENT_ID=your_client_id
```

### **📧 Email Configuration**
```env
# Gmail Settings for Email Automation
GMAIL_USER=your_email@gmail.com
GMAIL_PASS=your_gmail_app_password_here
EMAIL_ENABLED=true
```

### **🤖 OpenAI Configuration**
```env
# OpenAI for Conversation Intelligence
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=150
OPENAI_TEMPERATURE=0.7
```

### **🏢 Dealership Information**
```env
# Customize for Your Dealership
DEALERSHIP_NAME=Premier Auto
DEALERSHIP_PHONE=+1-555-0123
DEALERSHIP_EMAIL=sales@premierauto.com
BOT_NAME=Sarah
```

### **⚡ Performance & Reliability Settings**
```env
# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Settings
CORS_ORIGIN=*

# Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

## 🔍 **How to Verify Settings**

### **1. Check ElevenLabs API Key**
```bash
curl -H "xi-api-key: YOUR_API_KEY" https://api.elevenlabs.io/v1/voices
```
Should return list of voices.

### **2. Check Deepgram API Key**
```bash
curl -H "Authorization: Token YOUR_API_KEY" https://api.deepgram.com/v1/projects
```
Should return project information.

### **3. Test System Health**
```bash
curl https://ai-cold-calling-system.onrender.com/health/detailed
```
Should show all services as "healthy".

## 🚨 **Common Issues & Solutions**

### **Issue: Robotic Voice (Twilio TTS)**
**Cause:** ElevenLabs not working
**Solution:**
1. Verify `USE_ELEVENLABS=true`
2. Check `ELEVENLABS_API_KEY` is correct
3. Test ElevenLabs endpoint directly

### **Issue: Slow Responses**
**Cause:** API timeouts or network issues
**Solution:**
1. Check `RESPONSE_TIMEOUT=3000`
2. Verify all API keys are valid
3. Monitor Render logs for errors

### **Issue: Calls Not Following Script**
**Cause:** Conversation service errors
**Solution:**
1. Check OpenAI API key
2. Verify Google Sheets connection
3. Test conversation endpoints

### **Issue: Google Sheets Not Updating**
**Cause:** Authentication or permissions
**Solution:**
1. Verify service account has edit permissions
2. Check Google Sheets ID is correct
3. Test sheets endpoint directly

## ✅ **Verification Checklist**

Before going live, verify:

- [ ] `USE_ELEVENLABS=true` is set
- [ ] ElevenLabs API key is valid and working
- [ ] Deepgram API key is valid (if using)
- [ ] Twilio credentials are correct
- [ ] Google Sheets ID and credentials are valid
- [ ] Gmail credentials are working
- [ ] OpenAI API key is valid
- [ ] All health checks return "healthy"
- [ ] Test call uses natural voice
- [ ] Conversation follows exact script
- [ ] Google Sheets updates correctly
- [ ] Email automation works

## 🎯 **Critical Success Factors**

### **For Natural Voice:**
- `USE_ELEVENLABS=true`
- Valid `ELEVENLABS_API_KEY`
- Correct `ELEVENLABS_VOICE_ID`

### **For Script Compliance:**
- Valid `OPENAI_API_KEY`
- Proper conversation service configuration
- Google Sheets integration working

### **For Reliability:**
- All API keys valid and active
- Proper timeout settings
- Error handling enabled
- Real-time response middleware active

**Set these environment variables in your Render dashboard, then deploy and test the system!**
