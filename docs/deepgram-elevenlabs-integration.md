# 🎙️ Deepgram & ElevenLabs Integration Guide

Complete guide to integrate advanced speech services with your AI Cold-Calling System.

## 🎯 **Current vs Enhanced Setup**

### **Current Setup (Default):**
✅ **Twilio Built-in Speech Recognition** - Basic speech-to-text  
✅ **Twilio Built-in Text-to-Speech** - "Alice" voice  
✅ **OpenAI GPT-4** - Conversation intelligence  

### **Enhanced Setup (Optional):**
🚀 **Deepgram** - Advanced speech-to-text with sentiment analysis  
🚀 **ElevenLabs** - Ultra-realistic AI voices  
🚀 **OpenAI GPT-4** - Same conversation intelligence  

## 🔧 **How They Work Together**

### **Call Flow with Enhanced Services:**

```
1. Customer answers call
2. Twilio initiates webhook
3. ElevenLabs generates realistic AI greeting → Customer hears natural voice
4. Customer responds
5. Twilio captures speech → Deepgram transcribes with high accuracy
6. OpenAI processes response → Generates intelligent reply
7. ElevenLabs converts reply to speech → Customer hears natural response
8. Deepgram analyzes sentiment → System adapts conversation tone
9. Process repeats until call ends
10. Deepgram provides call analysis → Topics, sentiment, insights
```

## 🚀 **Setup Instructions**

### **Step 1: Get API Keys**

#### **Deepgram Setup:**
1. **Sign up**: [deepgram.com](https://deepgram.com)
2. **Get API key**: Dashboard → API Keys → Create Key
3. **Free tier**: 45,000 minutes of transcription

#### **ElevenLabs Setup:**
1. **Sign up**: [elevenlabs.io](https://elevenlabs.io)
2. **Get API key**: Profile → API Key
3. **Choose voice**: VoiceLab → Test voices → Copy Voice ID
4. **Free tier**: 10,000 characters/month

### **Step 2: Add Environment Variables**

Add these to your Render environment variables:

```env
# Enable enhanced services
USE_DEEPGRAM=true
USE_ELEVENLABS=true

# Deepgram Configuration
DEEPGRAM_API_KEY=your_deepgram_api_key_here
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL_ID=eleven_turbo_v2
```

### **Step 3: Install Dependencies**

The required packages are already added to package.json:
- `@deepgram/sdk` - Deepgram integration
- `axios` - HTTP requests for ElevenLabs

### **Step 4: Deploy Updated Code**

```bash
git add .
git commit -m "Add Deepgram and ElevenLabs integration"
git push origin main
```

Render will automatically deploy with the new services.

## 🎛️ **Configuration Options**

### **Deepgram Models:**
- `nova-2` - Latest, most accurate (recommended)
- `nova` - Previous generation
- `enhanced` - Optimized for phone calls
- `base` - Fastest, basic accuracy

### **ElevenLabs Voices:**
- `EXAVITQu4vr4xnSDxMaL` - Bella (default, professional female)
- `21m00Tcm4TlvDq8ikWAM` - Rachel (warm female)
- `AZnzlk1XvdvUeBnXmlld` - Domi (confident female)
- `ErXwobaYiN019PkySvjV` - Antoni (well-rounded male)
- `VR6AewLTigWG4xSOukaG` - Arnold (crisp male)

### **Voice Settings:**
```javascript
{
  stability: 0.5,        // 0-1, higher = more stable
  similarity_boost: 0.75, // 0-1, higher = more similar to original
  style: 0.0,            // 0-1, style exaggeration
  use_speaker_boost: true // Enhance clarity
}
```

## 🧪 **Testing the Integration**

### **Test Deepgram:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-app.onrender.com/health/detailed
```

Look for:
```json
{
  "deepgram": {
    "status": "healthy",
    "message": "Deepgram service operational"
  }
}
```

### **Test ElevenLabs:**
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-app.onrender.com/health/detailed
```

Look for:
```json
{
  "elevenlabs": {
    "status": "healthy",
    "message": "ElevenLabs service operational",
    "usage": {
      "charactersUsed": 1250,
      "charactersLimit": 10000,
      "charactersRemaining": 8750
    }
  }
}
```

### **Test Enhanced Call:**
1. **Make test call** with enhanced services enabled
2. **Listen for natural voice** (ElevenLabs working)
3. **Check call analysis** in logs (Deepgram working)

## 📊 **Benefits of Enhanced Services**

### **Deepgram Advantages:**
✅ **Higher accuracy** - 95%+ vs 85% with basic STT  
✅ **Sentiment analysis** - Understand customer mood  
✅ **Topic detection** - Identify conversation themes  
✅ **Speaker diarization** - Separate customer/agent speech  
✅ **Real-time insights** - Adapt conversation in real-time  

### **ElevenLabs Advantages:**
✅ **Natural voices** - Indistinguishable from human  
✅ **Emotional range** - Convey enthusiasm, empathy  
✅ **Custom voices** - Brand-specific voice identity  
✅ **Multiple languages** - Global market support  
✅ **Voice cloning** - Use your actual sales rep's voice  

## 💰 **Cost Considerations**

### **Deepgram Pricing:**
- **Free tier**: 45,000 minutes
- **Pay-as-you-go**: $0.0059/minute
- **Example**: 1000 calls × 3 minutes = $17.70/month

### **ElevenLabs Pricing:**
- **Free tier**: 10,000 characters/month
- **Starter**: $5/month for 30,000 characters
- **Creator**: $22/month for 100,000 characters
- **Example**: 1000 calls × 200 characters = $11/month

### **Total Enhanced Cost:**
- **1000 calls/month**: ~$30/month additional
- **ROI**: Higher conversion rates justify cost

## 🔄 **Fallback Strategy**

The system is designed with graceful fallbacks:

1. **ElevenLabs fails** → Falls back to Twilio TTS
2. **Deepgram fails** → Uses Twilio speech recognition
3. **Both fail** → System continues with built-in services
4. **No degradation** in core functionality

## 🎯 **Advanced Features**

### **Real-time Sentiment Adaptation:**
```javascript
// System adapts based on customer sentiment
if (sentiment === 'NEGATIVE') {
  // Use more empathetic voice settings
  voiceSettings.stability = 0.8;
  voiceSettings.style = 0.2;
}
```

### **Call Analysis Dashboard:**
- **Sentiment trends** over time
- **Topic analysis** - What customers discuss most
- **Conversion correlation** - Which topics lead to sales
- **Voice performance** - A/B test different voices

### **Custom Voice Training:**
1. **Record your best sales rep** (15 minutes of audio)
2. **Train custom voice** with ElevenLabs
3. **Deploy at scale** - Every call sounds like your best rep

## 🚨 **Troubleshooting**

### **ElevenLabs Issues:**
```bash
# Check API key
curl -H "xi-api-key: YOUR_KEY" https://api.elevenlabs.io/v1/voices

# Check usage
curl -H "xi-api-key: YOUR_KEY" https://api.elevenlabs.io/v1/user
```

### **Deepgram Issues:**
```bash
# Check API key
curl -H "Authorization: Token YOUR_KEY" \
     https://api.deepgram.com/v1/projects
```

### **Common Fixes:**
1. **Verify API keys** are correct and active
2. **Check usage limits** - Free tiers have monthly limits
3. **Monitor logs** for specific error messages
4. **Test with simple examples** before full integration

## ✅ **Success Indicators**

Your enhanced integration is working when:

✅ **Health check** shows both services healthy  
✅ **Calls use natural voices** instead of robotic TTS  
✅ **Speech recognition** is more accurate  
✅ **Call analysis** provides sentiment and topics  
✅ **Fallbacks work** when services are unavailable  
✅ **Usage tracking** shows API consumption  

## 🎉 **Next Steps**

1. **Start with free tiers** to test functionality
2. **Monitor usage** and conversion improvements
3. **Scale up plans** based on call volume
4. **Experiment with voices** to find best performing
5. **Analyze call data** to optimize scripts
6. **Consider custom voices** for brand consistency

---

**The enhanced speech services will significantly improve your call quality and conversion rates, making your AI calls virtually indistinguishable from human representatives!** 🚀
