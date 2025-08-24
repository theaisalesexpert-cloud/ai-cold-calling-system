# AI Cold Calling System - Complete Setup Guide

## Prerequisites
- ✅ n8n Cloud account
- ✅ Render.com account
- ✅ OpenAI API key
- ✅ ElevenLabs account
- ✅ Twilio account with verified phone number
- ✅ Deepgram account
- ✅ Google Sheets access
- ✅ Domain: theaisalesexpert.co.uk

## Step 1: Deploy Webhook Server to Render.com

### 1.1 Prepare the Code
1. Upload the `webhook-server/` folder to a GitHub repository
2. Create a `.env` file in the webhook-server directory with your credentials:

```bash
# Copy from webhook-server/.env.example and fill in your values
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_preferred_voice_id
DEEPGRAM_API_KEY=your_deepgram_api_key
GOOGLE_SPREADSHEET_ID=your_google_sheets_id
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
N8N_WEBHOOK_URL=https://your_n8n_instance.app.n8n.cloud/webhook
WEBHOOK_BASE_URL=https://theaisalesexpert.co.uk
```

### 1.2 Deploy to Render.com
1. Log into Render.com
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: ai-cold-calling-webhook
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Starter (can upgrade later)

5. Add environment variables in Render dashboard (copy from your .env file)
6. Deploy the service

### 1.3 Configure Custom Domain
1. In Render dashboard, go to your service settings
2. Add custom domain: `theaisalesexpert.co.uk`
3. Configure DNS in Squarespace:
   - Add CNAME record: `www` → `your-service.onrender.com`
   - Add A record: `@` → Render's IP address

## Step 2: Set Up Google Sheets

### 2.1 Create the Spreadsheet
1. Create a new Google Sheet named "AI Cold Calling Leads"
2. Set up columns exactly as specified in `config/google-sheets-structure.md`:

| A | B | C | D | E | F | G | H | I | J | K | L | M | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Customer Name | Phone Number | Car Model | Enquiry Date | Call Status | Call Date | Call Outcome | Still Interested | Wants Appointment | Wants Similar Cars | Email Address | Notes | Email Sent | Email Date |

### 2.2 Create Google Service Account
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create Service Account:
   - Go to IAM & Admin → Service Accounts
   - Create new service account
   - Download JSON key file
5. Share your Google Sheet with the service account email
6. Copy the service account email and private key for n8n configuration

### 2.3 Add Sample Data
Add a few test leads:
```
John Smith | +1234567890 | BMW X5 2023 | 2024-01-15 | Pending | | | | | | | | |
Jane Doe | +1987654321 | Audi Q7 2023 | 2024-01-16 | Pending | | | | | | | | |
```

## Step 3: Configure n8n Cloud

### 3.1 Set Up Credentials
1. Log into your n8n Cloud instance
2. Go to Settings → Credentials
3. Add the following credentials:

**Google Sheets OAuth2 API**
- Name: `google-sheets-credentials`
- Use the service account JSON key

**Twilio API**
- Name: `twilio-credentials`
- Account SID: Your Twilio Account SID
- Auth Token: Your Twilio Auth Token

**SMTP Email**
- Name: `email-credentials`
- Host: smtp.gmail.com
- Port: 587
- User: Your Gmail address
- Password: Your Gmail App Password

### 3.2 Set Up Environment Variables
1. Go to Settings → Environment Variables
2. Add these variables:
```
TWILIO_PHONE_NUMBER=your_twilio_phone_number
GOOGLE_SPREADSHEET_ID=your_google_sheets_id
EMAIL_USER=your_email@gmail.com
```

### 3.3 Import Workflow
1. Go to Workflows
2. Click "Import from File"
3. Upload `n8n-workflows/ai-cold-calling-main-workflow.json`
4. Update all credential references to match your credential names
5. Test the workflow with sample data

## Step 4: Configure Twilio Webhooks

### 4.1 Set Up Phone Number Webhooks
1. Log into Twilio Console
2. Go to Phone Numbers → Manage → Active Numbers
3. Click on your phone number
4. Configure webhooks:
   - **Voice URL**: `https://theaisalesexpert.co.uk/webhook/twilio/voice`
   - **Voice Method**: POST
   - **Status Callback URL**: `https://theaisalesexpert.co.uk/webhook/twilio/status`

### 4.2 Test Webhook Connectivity
1. Use a tool like ngrok for local testing first
2. Test the webhook endpoints:
   - GET `https://theaisalesexpert.co.uk/health` should return status
   - POST to voice webhook should handle TwiML properly

## Step 5: Configure ElevenLabs Voice

### 5.1 Choose Voice
1. Log into ElevenLabs
2. Go to VoiceLab
3. Choose a professional female voice (recommended: "Rachel" or "Bella")
4. Copy the Voice ID for your configuration

### 5.2 Test Voice Synthesis
1. Test the voice with sample text
2. Adjust voice settings if needed:
   - Stability: 0.5
   - Similarity Boost: 0.5

## Step 6: Testing & Validation

### 6.1 End-to-End Test
1. Add a test lead to Google Sheets with status "Pending"
2. Verify the n8n workflow triggers
3. Check that Twilio call is initiated
4. Test the AI conversation flow
5. Verify Google Sheets updates
6. Test email sending for interested prospects

### 6.2 Monitor Logs
1. Check Render.com logs for webhook server
2. Monitor n8n execution logs
3. Review Twilio call logs
4. Check Google Sheets for updates

## Step 7: Go Live

### 7.1 Production Checklist
- [ ] All credentials configured and tested
- [ ] Webhook server deployed and accessible
- [ ] Domain properly configured
- [ ] Google Sheets structure correct
- [ ] n8n workflow active
- [ ] Twilio webhooks configured
- [ ] Voice synthesis working
- [ ] Email sending functional

### 7.2 Load Real Data
1. Import your actual lead data into Google Sheets
2. Ensure phone numbers are in E.164 format (+country code)
3. Set Call Status to "Pending" for leads to be called
4. Monitor the first few calls closely

## Troubleshooting

### Common Issues
1. **Webhook not receiving calls**: Check domain DNS and SSL certificate
2. **Voice synthesis failing**: Verify ElevenLabs API key and voice ID
3. **Google Sheets not updating**: Check service account permissions
4. **Calls not connecting**: Verify Twilio phone number and webhooks

### Support Resources
- Check logs in Render.com dashboard
- Use n8n's execution history for debugging
- Monitor Twilio call logs for voice issues
- Test individual components separately

## Next Steps
Once the system is working:
1. Monitor call quality and success rates
2. Adjust AI prompts based on performance
3. Scale up Render.com instance if needed
4. Add more sophisticated email templates
5. Implement call recording and analysis
