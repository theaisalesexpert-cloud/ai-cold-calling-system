# Deploy to Render.com Guide

## 🚀 Deployment Steps

### 1. Prepare Your Repository

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AI Cold Calling System"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-cold-calling.git
   git push -u origin main
   ```

### 2. Create Render.com Service

1. **Log into Render.com**
2. **Click "New +" → "Web Service"**
3. **Connect GitHub repository**
4. **Configure service:**
   - **Name:** `ai-cold-calling-webhooks`
   - **Environment:** `Node`
   - **Region:** Choose closest to your users
   - **Branch:** `main`
   - **Root Directory:** `webhooks`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### 3. Environment Variables

Add all variables from your `.env` file:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_VOICE_ID=voice_id
DEEPGRAM_API_KEY=your_deepgram_key
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
N8N_WEBHOOK_URL=your_n8n_webhook_url
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
DOMAIN=theaisalesexpert.co.uk
WEBHOOK_BASE_URL=https://theaisalesexpert.co.uk
DEALERSHIP_NAME=Your Dealership Name
BOT_NAME=Sarah
DEFAULT_REP_NAME=Sarah from Your Dealership
```

### 4. Custom Domain Setup

1. **In Render.com:**
   - Go to your service settings
   - Click "Custom Domains"
   - Add `theaisalesexpert.co.uk`

2. **In Squarespace:**
   - Go to Settings → Domains
   - Click "Use a Domain You Already Own"
   - Add CNAME record:
     - **Host:** `@` (or `www`)
     - **Value:** `your-service-name.onrender.com`

### 5. SSL Certificate

Render.com automatically provides SSL certificates for custom domains.

### 6. Health Check

After deployment, test your service:
```bash
curl https://theaisalesexpert.co.uk/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00.000Z"
}
```

## 🔧 Deployment Configuration Files

### package.json (webhooks/package.json)
```json
{
  "name": "ai-calling-webhooks",
  "version": "1.0.0",
  "scripts": {
    "start": "node twilio-voice-handler.js",
    "dev": "nodemon twilio-voice-handler.js"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

### render.yaml (optional)
```yaml
services:
  - type: web
    name: ai-cold-calling-webhooks
    env: node
    buildCommand: cd webhooks && npm install
    startCommand: cd webhooks && npm start
    envVars:
      - key: NODE_ENV
        value: production
```

## 🔍 Monitoring & Logs

### View Logs
1. Go to your Render.com dashboard
2. Click on your service
3. Go to "Logs" tab
4. Monitor real-time logs

### Health Monitoring
- Render.com automatically monitors your service
- Set up alerts for downtime
- Monitor resource usage

## 🚨 Troubleshooting

### Common Issues

1. **Build Fails:**
   - Check Node.js version compatibility
   - Verify package.json is in webhooks directory
   - Check for missing dependencies

2. **Service Won't Start:**
   - Verify start command
   - Check environment variables
   - Review logs for errors

3. **Domain Not Working:**
   - Verify CNAME record in Squarespace
   - Wait for DNS propagation (up to 24 hours)
   - Check SSL certificate status

4. **Webhook Errors:**
   - Verify Twilio webhook URLs
   - Check HTTPS configuration
   - Test endpoints manually

### Debug Commands
```bash
# Test local development
cd webhooks
npm install
npm run dev

# Test production endpoint
curl -X POST https://theaisalesexpert.co.uk/webhook/call/initiate \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"Test","phone_number":"+1234567890","car_model":"Test Car"}'
```

## 📈 Scaling Considerations

### Performance Optimization
- Enable HTTP/2
- Use connection pooling
- Implement request queuing
- Monitor response times

### Cost Management
- Monitor usage in Render.com dashboard
- Set up billing alerts
- Optimize resource allocation
- Use appropriate instance sizes

## 🔒 Security Best Practices

1. **Environment Variables:**
   - Never expose sensitive data in logs
   - Use Render's encrypted environment variables
   - Rotate API keys regularly

2. **HTTPS Only:**
   - Force HTTPS redirects
   - Use secure headers
   - Validate webhook signatures

3. **Rate Limiting:**
   - Implement request rate limiting
   - Monitor for abuse
   - Set up DDoS protection

Your webhook server is now deployed and ready to handle AI calling requests!
