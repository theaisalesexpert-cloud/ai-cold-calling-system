# AI Cold Calling System - Configuration Guide

## Overview
This guide covers all configuration aspects of the AI cold calling system, including API keys, webhook URLs, and system parameters.

## 1. Twilio Configuration

### Account Setup
- **Account SID**: Found in Twilio Console dashboard
- **Auth Token**: Found in Twilio Console dashboard  
- **Phone Number**: Must be purchased and verified in Twilio
- **Webhook URL**: `https://theaisalesexpert.co.uk/webhook/twilio/voice`

### Voice Configuration
```json
{
  "voice": "alice",
  "language": "en-US",
  "statusCallback": "https://theaisalesexpert.co.uk/webhook/twilio/status",
  "statusCallbackEvent": ["initiated", "ringing", "answered", "completed"],
  "record": true,
  "recordingStatusCallback": "https://theaisalesexpert.co.uk/webhook/twilio/recording"
}
```

### Phone Number Settings
1. Go to Twilio Console → Phone Numbers → Manage → Active Numbers
2. Click your phone number
3. Configure:
   - **Voice URL**: `https://theaisalesexpert.co.uk/webhook/twilio/voice`
   - **Voice HTTP Method**: POST
   - **Status Callback URL**: `https://theaisalesexpert.co.uk/webhook/twilio/status`

## 2. OpenAI Configuration

### API Settings
- **Model**: `gpt-4` (recommended) or `gpt-3.5-turbo`
- **Max Tokens**: 150 (for concise responses)
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Top P**: 1.0
- **Frequency Penalty**: 0.0
- **Presence Penalty**: 0.0

### System Prompt Template
```
You are Sarah, a friendly car dealership representative making a follow-up call.

Customer Info:
- Name: {customerName}
- Car: {carModel}
- Enquiry Date: {enquiryDate}

Call Script Flow:
1. Confirm interest in original car
2. If yes, offer appointment
3. If no, offer similar cars
4. If interested in similar cars, get email

Keep responses natural, brief (1-2 sentences), and conversational.
Determine the customer's intent and respond accordingly.
End the call politely when appropriate.
```

## 3. ElevenLabs Configuration

### Voice Settings
- **Voice ID**: Choose from available voices (recommended: Rachel, Bella, or Sarah)
- **Model**: `eleven_monolingual_v1` or `eleven_multilingual_v1`
- **Stability**: 0.5 (balanced)
- **Similarity Boost**: 0.5 (natural variation)
- **Style**: 0.0 (neutral)
- **Use Speaker Boost**: true

### Recommended Voices
| Voice Name | Voice ID | Description |
|------------|----------|-------------|
| Rachel | `21m00Tcm4TlvDq8ikWAM` | Professional, clear |
| Bella | `EXAVITQu4vr4xnSDxMaL` | Warm, friendly |
| Sarah | `EXAVITQu4vr4xnSDxMaL` | Business-appropriate |

## 4. Deepgram Configuration

### Speech-to-Text Settings
- **Model**: `nova-2` (latest, most accurate)
- **Language**: `en-US`
- **Punctuate**: true
- **Diarize**: false (single speaker expected)
- **Smart Format**: true
- **Profanity Filter**: false
- **Redact**: false

### Real-time Configuration
```json
{
  "model": "nova-2",
  "language": "en-US",
  "punctuate": true,
  "smart_format": true,
  "interim_results": true,
  "endpointing": 300,
  "vad_events": true
}
```

## 5. Google Sheets Configuration

### Service Account Setup
1. Create Google Cloud Project
2. Enable Google Sheets API
3. Create Service Account
4. Download JSON key file
5. Share spreadsheet with service account email

### Sheet Structure
Required columns (exact order):
1. Customer Name (A)
2. Phone Number (B) - E.164 format
3. Car Model (C)
4. Enquiry Date (D) - YYYY-MM-DD
5. Call Status (E) - Pending/Calling/Completed/Failed
6. Call Date (F) - Auto-populated
7. Call Outcome (G) - Auto-populated
8. Still Interested (H) - Yes/No/Unknown
9. Wants Appointment (I) - Yes/No/Unknown
10. Wants Similar Cars (J) - Yes/No/Unknown
11. Email Address (K) - Auto-populated
12. Notes (L) - Auto-populated
13. Email Sent (M) - Yes/No
14. Email Date (N) - Auto-populated

### Data Validation Rules
- Phone Number: Must match pattern `^\+[1-9]\d{1,14}$`
- Call Status: Dropdown with values: Pending, Calling, Completed, Failed, Do Not Call
- Dates: YYYY-MM-DD format
- Yes/No fields: Dropdown with values: Yes, No, Unknown

## 6. Email Configuration

### Gmail Setup
1. Enable 2-Factor Authentication
2. Generate App Password
3. Use App Password (not regular password)

### SMTP Settings
- **Host**: smtp.gmail.com
- **Port**: 587
- **Security**: STARTTLS
- **Authentication**: Required

### Email Template Variables
Available variables for email templates:
- `{{ customerName }}` - Customer's name
- `{{ carModel }}` - Original car enquired about
- `{{ enquiryDate }}` - Date of original enquiry
- `{{ dealershipName }}` - Your dealership name
- `{{ contactPhone }}` - Your contact phone
- `{{ contactEmail }}` - Your contact email

## 7. n8n Configuration

### Environment Variables
Set these in n8n Settings → Environment Variables:
```
TWILIO_PHONE_NUMBER=+1234567890
GOOGLE_SPREADSHEET_ID=your_sheet_id
EMAIL_USER=your_email@gmail.com
DEALERSHIP_NAME=Premium Auto Sales
CONTACT_PHONE=+1234567890
CONTACT_EMAIL=sales@yourdealership.com
```

### Webhook URLs
- Main webhook: `https://your-n8n-instance.app.n8n.cloud/webhook/call-completed`
- Status updates: `https://your-n8n-instance.app.n8n.cloud/webhook/call-status-update`

### Execution Settings
- **Timeout**: 300 seconds
- **Max Execution Time**: 600 seconds
- **Save Execution Progress**: true
- **Save Data on Error**: true
- **Save Data on Success**: false (to save storage)

## 8. Render.com Configuration

### Environment Variables
Set all these in Render.com dashboard:
```bash
NODE_ENV=production
PORT=3000
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=your_number
OPENAI_API_KEY=your_key
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=your_voice_id
DEEPGRAM_API_KEY=your_key
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_email
GOOGLE_PRIVATE_KEY=your_private_key
GOOGLE_SPREADSHEET_ID=your_sheet_id
EMAIL_USER=your_email
EMAIL_PASSWORD=your_app_password
N8N_WEBHOOK_URL=your_n8n_webhook_url
WEBHOOK_BASE_URL=https://theaisalesexpert.co.uk
LOG_LEVEL=info
```

### Service Settings
- **Instance Type**: Starter (can upgrade)
- **Auto-Deploy**: Enabled
- **Health Check Path**: `/health`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

## 9. Domain Configuration

### DNS Settings (Squarespace)
Add these DNS records:
- **A Record**: `@` → Render.com IP address
- **CNAME Record**: `www` → `your-service.onrender.com`
- **TXT Record**: For domain verification if required

### SSL Certificate
- Render.com provides automatic SSL certificates
- Verify HTTPS is working: `https://theaisalesexpert.co.uk/health`

## 10. Security Configuration

### API Key Security
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate keys regularly
- Monitor API usage for anomalies

### Webhook Security
- Verify Twilio webhook signatures
- Use HTTPS for all webhook endpoints
- Implement rate limiting
- Log all webhook requests

### Data Privacy
- Comply with GDPR/CCPA requirements
- Implement data retention policies
- Secure customer data transmission
- Regular security audits

## 11. Monitoring & Logging

### Log Levels
- **error**: System errors, failed API calls
- **warn**: Recoverable issues, rate limits
- **info**: Normal operations, call completions
- **debug**: Detailed debugging information

### Metrics to Monitor
- Call success rate
- API response times
- Error rates by service
- Customer satisfaction scores
- Email delivery rates

### Alerting
Set up alerts for:
- High error rates (>5%)
- API failures
- Webhook timeouts
- Low call success rates (<80%)

## 12. Performance Tuning

### Optimization Settings
- **Connection Pooling**: Enable for database connections
- **Caching**: Cache frequently accessed data
- **Compression**: Enable gzip compression
- **CDN**: Use CDN for audio files

### Scaling Considerations
- Monitor CPU and memory usage
- Scale Render.com instance as needed
- Implement queue system for high volume
- Consider multiple webhook servers for redundancy

This configuration guide ensures optimal performance and reliability of your AI cold calling system.
