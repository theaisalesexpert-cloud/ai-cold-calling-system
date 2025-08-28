# 🔧 ElevenLabs & Deepgram Troubleshooting Guide

Complete troubleshooting guide to fix ElevenLabs and Deepgram integration issues.

## 🚨 **Step 1: Deploy the Fixes**

First, deploy the updated code with bug fixes:

```bash
git add .
git commit -m "Fix ElevenLabs and Deepgram service initialization and add test endpoints"
git push origin main
```

Wait for Render to deploy (2-3 minutes).

## 🧪 **Step 2: Test Service Status**

### **Check Overall Status:**
```bash
curl https://ai-cold-calling-system.onrender.com/api/test/status
```

**Expected Response:**
```json
{
  "elevenlabs": {
    "enabled": true,
    "configured": true,
    "health": {"status": "healthy"},
    "config": {
      "voiceId": "EXAVITQu4vr4xnSDxMaL",
      "modelId": "eleven_turbo_v2"
    }
  },
  "deepgram": {
    "enabled": true,
    "configured": true,
    "health": {"status": "healthy"},
    "config": {
      "model": "nova-2",
      "language": "en-US"
    }
  }
}
```

## 🔧 **Step 3: Fix Environment Variables**

Based on the status response, add missing environment variables in Render:

### **Go to Render Dashboard:**
1. **Navigate to**: Your service → Environment
2. **Add these variables** (if missing):

```env
# Enable services
USE_ELEVENLABS=true
USE_DEEPGRAM=true

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_actual_api_key_here
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL_ID=eleven_turbo_v2

# Deepgram Configuration
DEEPGRAM_API_KEY=your_actual_api_key_here
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US
```

### **Get Your API Keys:**

#### **ElevenLabs API Key:**
1. Go to [elevenlabs.io](https://elevenlabs.io)
2. Sign up/login
3. Go to Profile → API Key
4. Copy the key (starts with `sk_...`)

#### **Deepgram API Key:**
1. Go to [deepgram.com](https://deepgram.com)
2. Sign up/login
3. Go to Dashboard → API Keys
4. Create new key or copy existing
5. Copy the key

## 🧪 **Step 4: Test Individual Services**

### **Test ElevenLabs:**
```bash
curl -X POST https://ai-cold-calling-system.onrender.com/api/test/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test of ElevenLabs."}'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "ElevenLabs test successful",
  "data": {
    "filename": "speech_1234567890_abc123.mp3",
    "audioSize": 15420,
    "audioUrl": "/audio/speech_1234567890_abc123.mp3"
  }
}
```

### **Test Deepgram:**
```bash
curl -X POST https://ai-cold-calling-system.onrender.com/api/test/deepgram \
  -H "Content-Type: application/json"
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Deepgram test successful",
  "data": {
    "transcript": "Life moves pretty fast...",
    "confidence": 0.95,
    "sentiment": "NEUTRAL"
  }
}
```

## 🔍 **Step 5: Common Issues & Solutions**

### **Issue 1: "Service not available"**

**Cause:** API keys not set or incorrect

**Solution:**
1. Check environment variables in Render
2. Verify API keys are correct and active
3. Ensure `USE_ELEVENLABS=true` and `USE_DEEPGRAM=true`

### **Issue 2: "Invalid API key"**

**ElevenLabs:**
```bash
# Test API key directly
curl -H "xi-api-key: YOUR_API_KEY" https://api.elevenlabs.io/v1/voices
```

**Deepgram:**
```bash
# Test API key directly
curl -H "Authorization: Token YOUR_API_KEY" https://api.deepgram.com/v1/projects
```

### **Issue 3: "Quota exceeded"**

**Solution:**
- Check usage on service dashboards
- Upgrade plan if needed
- Wait for quota reset (monthly)

### **Issue 4: "Audio directory creation failed"**

**Solution:** This is fixed in the updated code, but if it persists:
- Check file system permissions
- Verify `/tmp` directory is writable

## 🎯 **Step 6: Test Complete Integration**

### **Test Both Services Together:**
```bash
curl -X POST https://ai-cold-calling-system.onrender.com/api/test/both \
  -H "Content-Type: application/json" \
  -d '{"text": "Testing both services together."}'
```

### **Test with Real Call:**
```bash
curl -X POST https://ai-cold-calling-system.onrender.com/api/calls/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{"phoneNumber": "+YOUR_PHONE_NUMBER"}'
```

**Listen for:**
- **Natural voice** (ElevenLabs working)
- **High accuracy transcription** (Deepgram working)

## 📊 **Step 7: Monitor Logs**

In Render Dashboard → Logs, look for:

### **Success Messages:**
```
✅ ElevenLabs service initialized
✅ Deepgram service initialized
✅ Speech generated successfully
✅ Transcription completed
```

### **Error Messages:**
```
❌ ElevenLabs API key not configured
❌ Failed to initialize Deepgram client
❌ Speech generation failed
❌ Transcription failed
```

## 🔧 **Step 8: Advanced Debugging**

### **Check Available Voices:**
```bash
curl https://ai-cold-calling-system.onrender.com/api/test/elevenlabs/voices
```

### **Test Audio Playback:**
1. Generate audio with ElevenLabs test
2. Visit: `https://ai-cold-calling-system.onrender.com/audio/FILENAME.mp3`
3. Should play natural voice

### **Check Service Health:**
```bash
curl https://ai-cold-calling-system.onrender.com/health/detailed
```

## 🎯 **Expected Working State**

When everything is working correctly:

### **Status Check Shows:**
```json
{
  "elevenlabs": {
    "enabled": true,
    "configured": true,
    "health": {"status": "healthy"}
  },
  "deepgram": {
    "enabled": true,
    "configured": true,
    "health": {"status": "healthy"}
  }
}
```

### **Test Calls:**
- **Voice sounds natural** (not robotic)
- **Speech recognition is accurate**
- **Sentiment analysis available**
- **Audio files generated** in `/audio/` endpoint

## 🚨 **If Still Not Working**

### **1. Check Render Environment Variables:**
- All required variables are set
- No typos in variable names
- API keys are valid and active

### **2. Verify API Keys:**
- Test them directly with service APIs
- Check quotas and usage limits
- Ensure accounts are active

### **3. Check Service Status:**
- ElevenLabs service status
- Deepgram service status
- Any ongoing outages

### **4. Review Logs:**
- Look for specific error messages
- Check initialization logs
- Monitor API call logs

## 📞 **Quick Test Commands**

```bash
# 1. Check status
curl https://ai-cold-calling-system.onrender.com/api/test/status

# 2. Test ElevenLabs
curl -X POST https://ai-cold-calling-system.onrender.com/api/test/elevenlabs \
  -H "Content-Type: application/json" \
  -d '{"text": "Test"}'

# 3. Test Deepgram
curl -X POST https://ai-cold-calling-system.onrender.com/api/test/deepgram

# 4. Test both
curl -X POST https://ai-cold-calling-system.onrender.com/api/test/both

# 5. Make test call
curl -X POST https://ai-cold-calling-system.onrender.com/api/calls/test \
  -H "Authorization: Bearer your_api_key" \
  -d '{"phoneNumber": "+YOUR_NUMBER"}'
```

---

**Follow these steps in order, and your ElevenLabs and Deepgram integration will be working correctly!** 🎉
