# Environment Setup Guide

This guide will walk you through setting up all the required accounts and API keys for the AI Cold-Calling System.

## 🔑 Required Accounts & API Keys

### 1. Twilio Account Setup

**Purpose**: Voice calling and telephony services

1. **Sign up**: Go to [Twilio Console](https://console.twilio.com)
2. **Verify your phone number** during registration
3. **Get your credentials**:
   - Account SID: Found on the main dashboard
   - Auth Token: Found on the main dashboard (click "Show" to reveal)
4. **Buy a phone number**:
   - Go to Phone Numbers > Manage > Buy a number
   - Choose a number with Voice capabilities
   - Note down the number (format: +1234567890)
5. **Configure webhooks** (after deploying your backend):
   - Go to Phone Numbers > Manage > Active numbers
   - Click on your purchased number
   - Set webhook URL: `https://your-app-name.onrender.com/webhook/twilio/voice`
   - Set HTTP method: POST

**Environment Variables**:
```env
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 2. OpenAI API Setup

**Purpose**: AI conversation logic and natural language processing

1. **Sign up**: Go to [OpenAI Platform](https://platform.openai.com)
2. **Add payment method**: Go to Billing > Payment methods
3. **Create API key**:
   - Go to API keys section
   - Click "Create new secret key"
   - Name it "AI Cold Calling System"
   - Copy and save the key securely
4. **Set usage limits** (recommended):
   - Go to Billing > Usage limits
   - Set monthly limit (e.g., $50)

**Environment Variables**:
```env
OPENAI_API_KEY=sk-your_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
```

### 3. ElevenLabs Setup

**Purpose**: High-quality text-to-speech for natural voice

1. **Sign up**: Go to [ElevenLabs](https://elevenlabs.io)
2. **Choose a plan**: Free tier includes 10,000 characters/month
3. **Get API key**:
   - Go to Profile > API Key
   - Copy the API key
4. **Choose a voice**:
   - Go to VoiceLab
   - Test different voices
   - Copy the Voice ID of your preferred voice

**Environment Variables**:
```env
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_VOICE_ID=your_preferred_voice_id
ELEVENLABS_MODEL_ID=eleven_turbo_v2
```

### 4. Deepgram Setup

**Purpose**: Advanced speech-to-text recognition

1. **Sign up**: Go to [Deepgram](https://deepgram.com)
2. **Get API key**:
   - Go to API Keys in dashboard
   - Create new API key
   - Name it "AI Cold Calling"
   - Copy the key

**Environment Variables**:
```env
DEEPGRAM_API_KEY=your_deepgram_api_key_here
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US
```

### 5. Google Cloud Setup

**Purpose**: Google Sheets API and Gmail integration

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create new project: "AI Cold Calling System"
   - Note the Project ID

2. **Enable APIs**:
   - Go to APIs & Services > Library
   - Enable "Google Sheets API"
   - Enable "Gmail API"

3. **Create Service Account**:
   - Go to APIs & Services > Credentials
   - Click "Create Credentials" > "Service Account"
   - Name: `ai-calling-service`
   - Role: Editor (or custom role with Sheets access)
   - Create and download JSON key file

4. **Setup Gmail App Password**:
   - Go to Google Account settings
   - Security > 2-Step Verification (enable if not already)
   - App passwords > Generate password for "Mail"
   - Save the 16-character password

**Environment Variables**:
```env
GOOGLE_SHEETS_ID=your_google_sheets_id
GOOGLE_PROJECT_ID=your_project_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
```

### 6. n8n Cloud Setup

**Purpose**: Workflow orchestration and automation

1. **Sign up**: Go to [n8n Cloud](https://n8n.cloud)
2. **Choose plan**: Starter plan is sufficient for testing
3. **Get webhook URLs**: After creating workflows, you'll get webhook URLs
4. **Create credentials**:
   - HTTP Header Auth for API authentication
   - Gmail SMTP for email sending
   - Google Service Account for Sheets access

**Environment Variables**:
```env
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/
N8N_API_KEY=your_n8n_api_key
```

## 🚀 Deployment Platform Setup

### Render.com (Recommended)

**Why Render.com**: Easy deployment, automatic HTTPS, environment variables management, competitive pricing

1. **Sign up**: Go to [Render.com](https://render.com)
2. **Connect GitHub**: Link your GitHub account
3. **Create Web Service**: Import your repository
4. **Set environment variables**: Add all the variables from above
5. **Deploy**: Render will automatically deploy your app

**Environment Variables**:
```env
PORT=10000
NODE_ENV=production
BASE_URL=https://your-app-name.onrender.com
```

### Alternative: Railway

1. **Sign up**: Go to [Railway](https://railway.app)
2. **Connect GitHub**: Link your repository
3. **Create project**: Import your repository
4. **Set environment variables**: Add via dashboard
5. **Deploy**: Automatic deployment

### Alternative: Heroku

1. **Sign up**: Go to [Heroku](https://heroku.com)
2. **Install Heroku CLI**
3. **Create app**: `heroku create your-app-name`
4. **Set environment variables**: Use Heroku dashboard or CLI
5. **Deploy**: `git push heroku main`

## 🔒 Security Setup

### API Key Authentication

Add this to your environment variables:
```env
API_KEY=your_secure_api_key_here
JWT_SECRET=your_jwt_secret_key_here
```

Generate secure keys:
```bash
# Generate API key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Rate Limiting

Configure rate limiting:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📊 Monitoring Setup (Optional)

### Sentry (Error Tracking)

1. **Sign up**: Go to [Sentry](https://sentry.io)
2. **Create project**: Choose Node.js
3. **Get DSN**: Copy the DSN from project settings

```env
SENTRY_DSN=your_sentry_dsn_here
```

### New Relic (Performance Monitoring)

1. **Sign up**: Go to [New Relic](https://newrelic.com)
2. **Get license key**: From account settings

```env
NEW_RELIC_LICENSE_KEY=your_license_key_here
```

## ✅ Environment Variables Checklist

Create a `.env` file with all these variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=production
BASE_URL=https://your-app-name.onrender.com

# Twilio Configuration
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
TWILIO_WEBHOOK_URL=https://your-app.railway.app

# OpenAI Configuration
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=150
OPENAI_TEMPERATURE=0.7

# ElevenLabs Configuration
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
ELEVENLABS_MODEL_ID=eleven_turbo_v2

# Deepgram Configuration
DEEPGRAM_API_KEY=
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US

# Google Services Configuration
GOOGLE_SHEETS_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_PROJECT_ID=

# Gmail Configuration
GMAIL_USER=
GMAIL_APP_PASSWORD=

# n8n Configuration
N8N_WEBHOOK_URL=
N8N_API_KEY=

# Security
JWT_SECRET=
API_KEY=

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Call Settings
MAX_CALL_DURATION=300
CALL_TIMEOUT=30
CONVERSATION_TIMEOUT=30000
MAX_CONVERSATION_TURNS=20
```

## 🧪 Testing Your Setup

After setting up all environment variables:

1. **Test backend health**:
   ```bash
   curl https://your-app.railway.app/health/detailed
   ```

2. **Test Google Sheets connection**:
   ```bash
   curl https://your-app.railway.app/api/sheets/test
   ```

3. **Test Twilio webhook**:
   ```bash
   curl https://your-app.railway.app/webhook/twilio/test
   ```

4. **Make a test call**:
   ```bash
   curl -X POST https://your-app.railway.app/api/calls/test \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_api_key" \
     -d '{"phoneNumber": "+1234567890"}'
   ```

## 🆘 Troubleshooting

### Common Issues

1. **"Invalid credentials" errors**:
   - Double-check all API keys are correct
   - Ensure no extra spaces in environment variables
   - Verify service accounts have proper permissions

2. **Webhook not receiving calls**:
   - Check Twilio webhook URL configuration
   - Ensure your app is deployed and accessible
   - Verify webhook URL format

3. **Google Sheets permission denied**:
   - Ensure service account email is added to the sheet
   - Check if service account has Editor permissions
   - Verify the sheet ID is correct

4. **OpenAI API errors**:
   - Check if you have sufficient credits
   - Verify API key is active
   - Check usage limits

### Getting Help

- Check the logs: `railway logs` or your platform's log viewer
- Use health check endpoints to diagnose issues
- Review API documentation for each service
- Check the troubleshooting section in each service's documentation
