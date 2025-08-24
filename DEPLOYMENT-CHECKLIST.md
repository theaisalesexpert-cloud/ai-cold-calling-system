# 🚀 Render.com Deployment Checklist

## Before You Start
- [ ] GitHub account ready
- [ ] Render.com account created
- [ ] All API credentials collected (see list below)

## Required API Credentials

### Twilio
- [ ] Account SID: `AC...`
- [ ] Auth Token: `...`
- [ ] Phone Number: `+1...`

### OpenAI
- [ ] API Key: `sk-...`

### ElevenLabs
- [ ] API Key: `...`
- [ ] Voice ID: `...` (choose from your ElevenLabs dashboard)

### Deepgram
- [ ] API Key: `...`

### Google Sheets
- [ ] Service Account Email: `...@....iam.gserviceaccount.com`
- [ ] Private Key: `-----BEGIN PRIVATE KEY-----...`
- [ ] Spreadsheet ID: `1...` (from Google Sheets URL)

### Email (Gmail)
- [ ] Gmail Address: `your-email@gmail.com`
- [ ] App Password: `...` (not your regular password!)

### n8n
- [ ] Webhook URL: `https://your-instance.app.n8n.cloud/webhook`

## Deployment Steps

### 1. GitHub Setup
- [ ] Create new repository: `ai-cold-calling-system`
- [ ] Push all project files to GitHub
- [ ] Verify repository is public or accessible to Render.com

### 2. Render.com Service Creation
- [ ] Log into Render.com
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Configure service settings:
  - [ ] Name: `ai-cold-calling-webhook`
  - [ ] Environment: Node
  - [ ] Build Command: `cd webhook-server && npm install`
  - [ ] Start Command: `cd webhook-server && npm start`

### 3. Environment Variables
Copy and paste these into Render.com Environment Variables section:

```
NODE_ENV=production
PORT=3000
WEBHOOK_BASE_URL=https://theaisalesexpert.co.uk
LOG_LEVEL=info
TWILIO_ACCOUNT_SID=your_actual_value_here
TWILIO_AUTH_TOKEN=your_actual_value_here
TWILIO_PHONE_NUMBER=your_actual_value_here
OPENAI_API_KEY=your_actual_value_here
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=150
OPENAI_TEMPERATURE=0.7
ELEVENLABS_API_KEY=your_actual_value_here
ELEVENLABS_VOICE_ID=your_actual_value_here
ELEVENLABS_MODEL=eleven_monolingual_v1
DEEPGRAM_API_KEY=your_actual_value_here
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_actual_value_here
GOOGLE_PRIVATE_KEY=your_actual_value_here
GOOGLE_SPREADSHEET_ID=your_actual_value_here
GOOGLE_SHEET_NAME=Leads
EMAIL_SERVICE=gmail
EMAIL_USER=your_actual_value_here
EMAIL_PASSWORD=your_actual_value_here
N8N_WEBHOOK_URL=your_actual_value_here
```

**⚠️ Replace ALL `your_actual_value_here` with your real credentials!**

### 4. Deploy Service
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (2-5 minutes)
- [ ] Check build logs for any errors
- [ ] Note your service URL: `https://your-service.onrender.com`

### 5. Test Basic Deployment
- [ ] Visit: `https://your-service.onrender.com/health`
- [ ] Should return JSON with `"status": "healthy"`

### 6. Configure Custom Domain
- [ ] In Render.com: Add custom domain `theaisalesexpert.co.uk`
- [ ] In Squarespace DNS:
  - [ ] Add CNAME: `www` → `your-service.onrender.com`
  - [ ] Add A record: `@` → `216.24.57.1`
- [ ] Wait for SSL certificate (up to 24 hours)

### 7. Configure Twilio
- [ ] Log into Twilio Console
- [ ] Go to Phone Numbers → Active Numbers
- [ ] Click your phone number
- [ ] Set Voice URL: `https://theaisalesexpert.co.uk/webhook/twilio/voice`
- [ ] Set Status Callback: `https://theaisalesexpert.co.uk/webhook/twilio/status`
- [ ] Save configuration

### 8. Final Testing
- [ ] Test health endpoint: `https://theaisalesexpert.co.uk/health`
- [ ] Run system test: `node scripts/test-system.js`
- [ ] Verify all API integrations working

## Common Issues & Solutions

### Build Fails
- Check that `webhook-server/package.json` exists
- Verify build command is correct
- Check build logs for specific errors

### Environment Variables Not Working
- Ensure no extra spaces in variable names or values
- For private keys, include the full key with BEGIN/END lines
- Double-check all variable names match exactly

### Domain Not Working
- DNS changes can take up to 24 hours
- Check DNS propagation: https://dnschecker.org
- Verify SSL certificate is active in Render.com

### Health Check Fails
- Check runtime logs in Render.com
- Verify all environment variables are set
- Test individual API connections

## Success Indicators

✅ **Deployment Successful When:**
- Health endpoint returns `{"status": "healthy"}`
- No errors in Render.com logs
- Domain resolves to your service
- SSL certificate is active
- Twilio webhooks can reach your endpoints

## Next Steps After Deployment

1. **Configure n8n workflows** with your webhook URLs
2. **Set up Google Sheets** with the required structure
3. **Import n8n workflow files** from `n8n-workflows/` folder
4. **Test with sample leads** before going live
5. **Monitor system performance** and logs

## Emergency Rollback

If something goes wrong:
1. Check Render.com service logs
2. Verify environment variables
3. Test individual API endpoints
4. Rollback to previous Git commit if needed
5. Contact support if issues persist

---

**🎯 Goal:** Get `https://theaisalesexpert.co.uk/health` returning a healthy status!

**📞 Need Help?** Check `docs/troubleshooting.md` for detailed solutions.
