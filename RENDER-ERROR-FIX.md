# 🚨 Render.com Deployment Error Fix

## Error: "username is required"

**What happened:** The Twilio client is trying to initialize but can't find the Account SID and Auth Token environment variables.

## 🔧 Quick Fix Steps

### 1. Check Environment Variables in Render.com

1. **Go to your Render.com service dashboard**
2. **Click the "Environment" tab**
3. **Verify these variables are set:**

```
TWILIO_ACCOUNT_SID=AC...your_account_sid
TWILIO_AUTH_TOKEN=...your_auth_token
TWILIO_PHONE_NUMBER=+1...your_phone_number
OPENAI_API_KEY=sk-...your_openai_key
ELEVENLABS_API_KEY=...your_elevenlabs_key
ELEVENLABS_VOICE_ID=...your_voice_id
DEEPGRAM_API_KEY=...your_deepgram_key
GOOGLE_SERVICE_ACCOUNT_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
GOOGLE_SPREADSHEET_ID=1...your_sheet_id
GOOGLE_SHEET_NAME=Leads
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=...your_gmail_app_password
N8N_WEBHOOK_URL=https://your_n8n_instance.app.n8n.cloud/webhook
WEBHOOK_BASE_URL=https://theaisalesexpert.co.uk
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### 2. Add Missing Variables

**If any variables are missing:**

1. **Click "Add Environment Variable"**
2. **Enter the variable name** (e.g., `TWILIO_ACCOUNT_SID`)
3. **Enter the variable value** (your actual Twilio Account SID)
4. **Click "Save"**
5. **Repeat for all missing variables**

### 3. Redeploy

1. **Click "Manual Deploy"** or
2. **Push a new commit to trigger auto-deploy**

## 🔍 How to Find Your Credentials

### Twilio Credentials:
1. Go to https://console.twilio.com
2. **Account SID**: On the dashboard (starts with `AC`)
3. **Auth Token**: Click "Show" next to Auth Token
4. **Phone Number**: Go to Phone Numbers → Manage → Active Numbers

### OpenAI API Key:
1. Go to https://platform.openai.com/api-keys
2. Copy your API key (starts with `sk-`)

### ElevenLabs:
1. Go to https://elevenlabs.io/app/speech-synthesis
2. **API Key**: Profile → API Keys
3. **Voice ID**: Click on a voice → Copy Voice ID

### Google Sheets:
1. **Service Account Email**: From your JSON key file
2. **Private Key**: From your JSON key file (include BEGIN/END lines)
3. **Spreadsheet ID**: From your Google Sheets URL

## ⚠️ Common Mistakes

### 1. Wrong Variable Names
Make sure variable names match exactly:
- ✅ `TWILIO_ACCOUNT_SID`
- ❌ `TWILIO_SID` or `ACCOUNT_SID`

### 2. Missing Values
- Don't leave any variables empty
- Include the full private key with BEGIN/END lines

### 3. Special Characters
- For private keys, copy the entire key including newlines
- For passwords, don't include quotes unless they're part of the password

## 🧪 Test Your Fix

After adding all environment variables:

1. **Check the deployment logs** in Render.com
2. **Look for this message**: `AI Cold Calling Webhook Server running on port 3000`
3. **Test the health endpoint**: Visit your service URL + `/health`

## 📋 Environment Variable Checklist

Copy this list and check off each one as you add it to Render.com:

- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_PHONE_NUMBER`
- [ ] `OPENAI_API_KEY`
- [ ] `ELEVENLABS_API_KEY`
- [ ] `ELEVENLABS_VOICE_ID`
- [ ] `DEEPGRAM_API_KEY`
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- [ ] `GOOGLE_PRIVATE_KEY`
- [ ] `GOOGLE_SPREADSHEET_ID`
- [ ] `GOOGLE_SHEET_NAME`
- [ ] `EMAIL_SERVICE`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASSWORD`
- [ ] `N8N_WEBHOOK_URL`
- [ ] `WEBHOOK_BASE_URL`
- [ ] `NODE_ENV`
- [ ] `PORT`
- [ ] `LOG_LEVEL`

## 🎯 Success Indicators

**Your deployment is successful when you see:**
```
AI Cold Calling Webhook Server running on port 3000
```

**And your health endpoint returns:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T15:30:00.000Z",
  "activeCalls": 0
}
```

## 🆘 Still Having Issues?

1. **Double-check all environment variables** are set correctly
2. **Verify your API keys** are valid and active
3. **Check Render.com logs** for other error messages
4. **Try the environment checker**: Run `node webhook-server/check-env.js` locally

The error you're seeing is very common and easily fixed by adding the missing environment variables!
