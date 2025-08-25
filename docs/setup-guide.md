# AI Cold Calling System - Complete Setup Guide

## 🚀 Quick Start Overview

This system automates cold calling for car dealership follow-ups using:
- **n8n** for workflow automation
- **Twilio Voice** for phone calls
- **OpenAI GPT** for conversation AI
- **ElevenLabs** for natural voice synthesis
- **Deepgram** for speech recognition
- **Google Sheets** for lead management
- **Email automation** for follow-ups

## 📋 Prerequisites

### Required Accounts & Services
- [x] n8n Cloud account
- [x] Render.com account
- [x] OpenAI API key
- [x] ElevenLabs account
- [x] Twilio account with verified phone number
- [x] Deepgram account
- [x] Google Cloud Platform account
- [x] Squarespace domain (theaisalesexpert.co.uk)

## 🔧 Step-by-Step Setup

### 1. Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in all environment variables:
   ```env
   # Twilio
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   
   # OpenAI
   OPENAI_API_KEY=sk-...
   
   # ElevenLabs
   ELEVENLABS_API_KEY=your_api_key
   ELEVENLABS_VOICE_ID=voice_id_for_sarah
   
   # Deepgram
   DEEPGRAM_API_KEY=your_deepgram_key
   
   # Google Sheets
   GOOGLE_SHEETS_ID=your_sheet_id
   GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
   
   # Domain & Webhooks
   DOMAIN=theaisalesexpert.co.uk
   WEBHOOK_BASE_URL=https://theaisalesexpert.co.uk
   
   # Dealership Info
   DEALERSHIP_NAME=Your Dealership Name
   BOT_NAME=Sarah
   ```

### 2. Google Sheets Setup

1. **Create Google Sheet:**
   - Use the template in `config/google-sheets-template.csv`
   - Import to Google Sheets
   - Note the Sheet ID from URL

2. **Google Cloud Setup:**
   - Go to Google Cloud Console
   - Create new project or select existing
   - Enable Google Sheets API
   - Create Service Account
   - Download JSON credentials
   - Extract email and private key for `.env`

3. **Share Sheet:**
   - Share your Google Sheet with service account email
   - Give "Editor" permissions

### 3. Twilio Configuration

1. **Phone Number Setup:**
   - Log into Twilio Console
   - Go to Phone Numbers → Manage → Active numbers
   - Click on your phone number
   - Set webhook URL: `https://theaisalesexpert.co.uk/webhook/call/initiate`
   - Set HTTP method: POST

2. **Voice Configuration:**
   - Enable voice capabilities
   - Set status callback URL: `https://theaisalesexpert.co.uk/webhook/call/status`

### 4. Deploy Webhook Server

1. **Prepare for Deployment:**
   ```bash
   cd webhooks
   npm install
   ```

2. **Deploy to Render.com:**
   - Connect your GitHub repository
   - Create new Web Service
   - Set build command: `cd webhooks && npm install`
   - Set start command: `cd webhooks && npm start`
   - Add all environment variables
   - Deploy

3. **Configure Domain:**
   - In Render.com, add custom domain: `theaisalesexpert.co.uk`
   - In Squarespace, add CNAME record pointing to Render

### 5. n8n Workflow Setup

1. **Import Workflow:**
   - Log into n8n Cloud
   - Go to Workflows
   - Click "Import from file"
   - Upload `n8n-workflows/ai-cold-calling-workflow.json`

2. **Configure Credentials:**
   - **Google Sheets API:** Add service account credentials
   - **Twilio API:** Add Account SID and Auth Token
   - **SMTP:** Add email credentials for follow-ups

3. **Set Environment Variables in n8n:**
   - Go to Settings → Environment Variables
   - Add all variables from your `.env` file

4. **Test Workflow:**
   - Click "Test workflow"
   - Check each node executes successfully

### 6. Voice Services Setup

1. **ElevenLabs Voice Selection:**
   ```bash
   node scripts/list-voices.js
   ```
   - Choose appropriate voice ID
   - Update `ELEVENLABS_VOICE_ID` in environment

2. **Test Voice Services:**
   ```bash
   cd webhooks
   npm test
   ```

## 🧪 Testing Your Setup

### Run Complete Test Suite
```bash
npm test
```

### Manual Testing Steps

1. **Test Webhook Server:**
   ```bash
   curl https://theaisalesexpert.co.uk/health
   ```

2. **Test Google Sheets:**
   - Add test lead to your sheet
   - Verify n8n can read the data

3. **Test Voice Services:**
   - Run voice service tests
   - Verify TTS and STT work

4. **Test Complete Flow:**
   - Add test lead with your phone number
   - Trigger n8n workflow manually
   - Answer the call and test conversation

## 📞 How to Use

### Adding Leads
1. Open your Google Sheet
2. Add leads with required columns:
   - customer_name
   - phone_number (E.164 format: +1234567890)
   - car_model
   - enquiry_date
   - call_status (set to "pending")

### Monitoring Calls
- Check Google Sheet for real-time updates
- Monitor n8n execution logs
- Check webhook server logs in Render.com

### Customizing the Script
Edit `config/conversation-prompts.json` to modify:
- Greeting messages
- Conversation flow
- Response handling
- Call endings

## 🔧 Troubleshooting

### Common Issues

1. **Calls Not Initiating:**
   - Check Twilio webhook URL
   - Verify phone number format
   - Check n8n workflow execution

2. **Voice Quality Issues:**
   - Adjust ElevenLabs voice settings
   - Check audio format compatibility
   - Test different voice models

3. **Google Sheets Not Updating:**
   - Verify service account permissions
   - Check sheet ID in environment
   - Test API credentials

4. **Email Not Sending:**
   - Check SMTP credentials
   - Verify email template formatting
   - Test email service connection

### Debug Commands
```bash
# Check webhook server logs
curl https://theaisalesexpert.co.uk/health

# Test voice services
node tests/test-voice-services.js

# Validate environment
node scripts/validate-config.js
```

## 📈 Scaling & Optimization

### Performance Tips
- Limit concurrent calls (Twilio limits)
- Batch process leads efficiently
- Monitor API rate limits
- Use webhook queuing for high volume

### Cost Optimization
- Monitor Twilio usage
- Optimize call duration
- Use appropriate voice models
- Implement call scheduling

## 🔒 Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files
   - Use secure credential storage
   - Rotate API keys regularly

2. **Webhook Security:**
   - Validate Twilio signatures
   - Use HTTPS only
   - Implement rate limiting

3. **Data Protection:**
   - Encrypt sensitive data
   - Follow GDPR compliance
   - Secure Google Sheets access

## 📞 Support & Maintenance

### Regular Maintenance
- Monitor API usage and costs
- Update conversation prompts
- Review call success rates
- Update lead data regularly

### Getting Help
- Check logs in Render.com dashboard
- Review n8n execution history
- Test individual components
- Contact service providers for API issues

## 🎯 Next Steps

Once your system is running:
1. Monitor initial calls and adjust prompts
2. Analyze conversion rates
3. Optimize conversation flow
4. Scale to more leads
5. Add advanced features (appointment booking, CRM integration)

Your AI cold calling system is now ready to automatically follow up with car dealership leads!
