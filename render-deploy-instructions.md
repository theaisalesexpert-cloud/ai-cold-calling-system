# 🚀 Deploy AI Cold-Calling System to Render.com

## Prerequisites Checklist
- [ ] GitHub account
- [ ] Render.com account
- [ ] All API keys ready (Twilio, OpenAI, ElevenLabs, etc.)
- [ ] Domain `theaisalesexpert.co.uk` access

## Step-by-Step Deployment

### 1. 📁 Push Code to GitHub

```bash
# Initialize git repository (if not already done)
git init

# Add all files
git add .

# Commit the code
git commit -m "Initial commit: AI Cold-Calling System"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/ai-cold-calling-system.git

# Push to GitHub
git push -u origin main
```

### 2. 🌐 Create Render.com Web Service

1. **Log into Render.com Dashboard**
   - Go to https://render.com
   - Sign in to your account

2. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"
   - Choose "Build and deploy from a Git repository"

3. **Connect GitHub Repository**
   - Click "Connect GitHub" (if not already connected)
   - Select your repository: `ai-cold-calling-system`
   - Click "Connect"

### 3. ⚙️ Configure Service Settings

**Basic Settings:**
- **Name**: `ai-cold-calling-webhook`
- **Environment**: `Node`
- **Region**: Choose closest to your location
- **Branch**: `main`
- **Root Directory**: Leave empty (uses root)
- **Build Command**: `cd webhook-server && npm install`
- **Start Command**: `cd webhook-server && npm start`

**Advanced Settings:**
- **Instance Type**: `Starter` (can upgrade later)
- **Auto-Deploy**: `Yes` (deploys on git push)

### 4. 🔐 Add Environment Variables

In Render.com dashboard, go to your service → Environment tab and add these variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
WEBHOOK_BASE_URL=https://theaisalesexpert.co.uk
LOG_LEVEL=info

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=150
OPENAI_TEMPERATURE=0.7

# ElevenLabs Configuration
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
ELEVENLABS_VOICE_ID=your_preferred_voice_id_here
ELEVENLABS_MODEL=eleven_monolingual_v1

# Deepgram Configuration
DEEPGRAM_API_KEY=your_deepgram_api_key_here
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email_here
GOOGLE_PRIVATE_KEY=your_private_key_here
GOOGLE_SPREADSHEET_ID=your_google_sheets_id_here
GOOGLE_SHEET_NAME=Leads

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password_here

# n8n Configuration
N8N_WEBHOOK_URL=https://your_n8n_instance.app.n8n.cloud/webhook
```

**⚠️ Important Notes:**
- Replace ALL placeholder values with your actual credentials
- For `GOOGLE_PRIVATE_KEY`: Copy the entire private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- For `N8N_WEBHOOK_URL`: Use your actual n8n cloud instance URL

### 5. 🚀 Deploy the Service

1. **Click "Create Web Service"**
   - Render.com will start building your application
   - This process takes 2-5 minutes

2. **Monitor Build Process**
   - Watch the build logs in real-time
   - Look for any errors during npm install or start

3. **Verify Deployment**
   - Once deployed, you'll get a URL like: `https://ai-cold-calling-webhook.onrender.com`
   - Test the health endpoint: `https://your-service.onrender.com/health`

### 6. 🌍 Configure Custom Domain

1. **In Render.com Dashboard:**
   - Go to your service → Settings
   - Scroll to "Custom Domains"
   - Click "Add Custom Domain"
   - Enter: `theaisalesexpert.co.uk`

2. **Configure DNS in Squarespace:**
   - Log into your Squarespace account
   - Go to Settings → Domains → DNS
   - Add these records:
     ```
     Type: CNAME
     Host: www
     Value: your-service.onrender.com
     
     Type: A
     Host: @
     Value: 216.24.57.1 (Render's IP - check current IP in Render docs)
     ```

3. **Wait for SSL Certificate:**
   - Render.com automatically provisions SSL certificates
   - This can take up to 24 hours
   - You'll see "SSL Certificate: Active" when ready

### 7. ✅ Test Your Deployment

1. **Health Check:**
   ```bash
   curl https://theaisalesexpert.co.uk/health
   ```
   Should return:
   ```json
   {
     "status": "healthy",
     "timestamp": "2024-01-20T15:30:00.000Z",
     "activeCalls": 0
   }
   ```

2. **Run System Test:**
   ```bash
   # In your local project directory
   cd scripts
   node test-system.js
   ```

### 8. 🔗 Configure Twilio Webhooks

1. **Log into Twilio Console**
2. **Go to Phone Numbers → Manage → Active Numbers**
3. **Click your phone number**
4. **Configure Voice settings:**
   - **Webhook URL**: `https://theaisalesexpert.co.uk/webhook/twilio/voice`
   - **HTTP Method**: POST
   - **Status Callback URL**: `https://theaisalesexpert.co.uk/webhook/twilio/status`
5. **Save Configuration**

### 9. 🎯 Final Verification

**Check these endpoints are working:**
- ✅ `https://theaisalesexpert.co.uk/health`
- ✅ Twilio webhook can reach your voice endpoint
- ✅ All environment variables are set correctly
- ✅ SSL certificate is active

## 🚨 Troubleshooting

### Build Fails
- Check build logs in Render.com dashboard
- Verify `package.json` is in `webhook-server/` directory
- Ensure all dependencies are listed

### Environment Variables Not Working
- Double-check all variable names match exactly
- Verify no extra spaces in values
- For multi-line values (like private keys), ensure proper formatting

### Domain Not Working
- Verify DNS propagation: https://dnschecker.org
- Check SSL certificate status in Render.com
- Wait up to 24 hours for full propagation

### Webhook Errors
- Test endpoints manually with curl
- Check Render.com logs for errors
- Verify Twilio webhook configuration

## 📞 Support

If you encounter issues:
1. Check Render.com build and runtime logs
2. Review the troubleshooting guide: `docs/troubleshooting.md`
3. Test individual components using `scripts/test-system.js`
4. Contact Render.com support if needed

## 🎉 Success!

Once deployed successfully, your AI Cold-Calling system will be:
- ✅ Running on `https://theaisalesexpert.co.uk`
- ✅ Ready to receive Twilio webhooks
- ✅ Connected to all AI services
- ✅ Ready for n8n integration

**Next Step:** Configure your n8n workflows to use the deployed webhook URLs!
