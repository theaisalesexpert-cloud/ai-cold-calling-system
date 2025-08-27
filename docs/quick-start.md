# Quick Start Guide

Get your AI Cold-Calling System up and running in 30 minutes.

## 🚀 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] A Twilio account with a phone number
- [ ] An OpenAI API key
- [ ] A Google Cloud account
- [ ] A Google Sheet created
- [ ] An n8n Cloud account

## ⚡ Quick Deploy Options

### 🎯 Option 1: One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/ai-cold-calling-system)

### 🛠️ Option 2: Manual Setup

#### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/ai-cold-calling-system.git
cd ai-cold-calling-system

# Install dependencies
cd backend
npm install
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
nano .env
```

**Minimum required variables:**
```env
# Twilio (get from Twilio Console)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI (get from OpenAI Platform)
OPENAI_API_KEY=sk-your_api_key

# Google Sheets (from service account JSON)
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----"

# Gmail (for follow-up emails)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

#### Step 3: Test Locally

```bash
# Start the server
npm run dev

# Test health check (in another terminal)
curl http://localhost:3000/health
```

#### Step 4: Deploy to Render

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial setup"
   git push origin main
   ```

2. **Deploy to Render:**
   - Go to [Render.com](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Configure build settings:
     - Build Command: `cd backend && npm install`
     - Start Command: `cd backend && npm start`
   - Add environment variables
   - Deploy automatically

3. **Get your app URL:**
   ```
   https://your-app-name.onrender.com
   ```

## 📋 Google Sheets Setup

### 1. Create Your Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create new spreadsheet: "AI Cold Calling - Customer Database"
3. Add headers in row 1:

| A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|
| ID | Name | Phone | Email | Car Model | Status | Enquiry Date | Last Call Date | Call Result | Appointment Date | Notes |

### 2. Add Sample Data

```
CUST_001,John Smith,+1234567890,john@example.com,2023 Honda Accord,new,2024-01-15,,,,,
CUST_002,Sarah Johnson,+1234567891,sarah@example.com,2022 Toyota Camry,new,2024-01-14,,,,,
```

### 3. Share with Service Account

1. Click "Share" in Google Sheets
2. Add your service account email
3. Give "Editor" permissions
4. Uncheck "Notify people"

## 🔧 Configure Twilio

### 1. Set Webhook URL

1. Go to [Twilio Console](https://console.twilio.com)
2. Phone Numbers → Manage → Active numbers
3. Click your phone number
4. Set webhook URL: `https://your-app-name.onrender.com/webhook/twilio/voice`
5. Set method: POST
6. Save configuration

### 2. Test Call

```bash
curl -X POST https://your-app-name.onrender.com/api/calls/test \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890"}'
```

## 🔄 Setup n8n Workflow

### 1. Import Workflow

1. Open your [n8n Cloud](https://n8n.cloud) instance
2. Go to Workflows
3. Click "Import from file"
4. Upload `n8n-workflows/ai-calling-workflow.json`

### 2. Configure Credentials

Add these credentials in n8n:

- **HTTP Header Auth**: For API authentication
- **Google Service Account**: For Sheets access
- **Gmail SMTP**: For email sending

### 3. Update URLs

Update all webhook URLs in the workflow to point to your deployed app:
```
https://your-app.railway.app
```

### 4. Activate Workflow

Click "Active" to enable the workflow.

## ✅ Verification Checklist

Test each component:

- [ ] **Health Check**: `curl https://your-app.railway.app/health`
- [ ] **Google Sheets**: `curl https://your-app.railway.app/api/sheets/test`
- [ ] **Test Call**: Use the test endpoint
- [ ] **n8n Workflow**: Trigger manually in n8n
- [ ] **Email Service**: Check detailed health endpoint

## 🎯 Make Your First Call

### Manual Call via API

```bash
curl -X POST https://your-app.railway.app/api/calls/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{
    "customerId": "CUST_001"
  }'
```

### Bulk Calls via n8n

1. Go to your n8n workflow
2. Click "Execute Workflow"
3. Monitor the execution
4. Check Google Sheets for updates

## 📊 Monitor Your System

### Real-time Monitoring

```bash
# Check system health
curl https://your-app.railway.app/health/detailed

# View call statistics
curl https://your-app.railway.app/api/calls/statistics

# Check active calls
curl https://your-app.railway.app/api/calls/active
```

### View Logs

**Railway:**
```bash
railway logs --tail
```

**Local:**
```bash
tail -f logs/combined.log
```

## 🔧 Customization

### Modify Conversation Script

Edit `backend/src/services/openaiService.js`:

```javascript
buildSystemPrompt(customerData) {
  return `You are a friendly representative from ${customerData.dealershipName}...`;
}
```

### Add New Call Steps

Update the conversation flow in `conversationService.js`:

```javascript
const stepFlow = {
  'greeting': 'interest_check',
  'interest_check': 'your_new_step',
  'your_new_step': 'closing'
};
```

### Customize Email Templates

Edit templates in `backend/src/services/emailService.js`.

## 🆘 Quick Troubleshooting

### Common Issues

1. **"Permission denied" on Google Sheets**
   - Check if service account is added to sheet
   - Verify service account has Editor permissions

2. **Calls not connecting**
   - Verify Twilio webhook URL is set correctly
   - Check if phone number format includes country code

3. **No AI responses**
   - Check OpenAI API key and credits
   - Verify conversation service is running

4. **n8n workflow not triggering**
   - Ensure workflow is activated
   - Check webhook URLs point to your app

### Get Help

- Check `/health/detailed` endpoint for service status
- Review logs for error messages
- Test individual components separately
- Refer to the full troubleshooting guide

## 🎉 You're Ready!

Your AI Cold-Calling System is now live! Here's what happens next:

1. **Scheduled Calls**: n8n will automatically call customers daily at 9 AM
2. **Real-time Updates**: Google Sheets updates with call results
3. **Follow-up Emails**: Automatic emails sent to interested customers
4. **Monitoring**: Use health endpoints to monitor system status

## 📈 Next Steps

1. **Scale Up**: Add more phone numbers for higher volume
2. **Customize**: Modify conversation scripts for your business
3. **Analytics**: Add more detailed reporting and analytics
4. **Integration**: Connect to your CRM system
5. **Optimization**: Monitor and optimize conversation flows

## 🔗 Useful Links

- **API Documentation**: `/docs/api-documentation.md`
- **Deployment Guide**: `/docs/deployment.md`
- **Troubleshooting**: `/docs/troubleshooting.md`
- **Environment Setup**: `/docs/environment-setup.md`

---

**Need help?** Check the troubleshooting guide or create an issue in the GitHub repository.
