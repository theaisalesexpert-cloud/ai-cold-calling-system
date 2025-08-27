# Render.com Deployment Guide

Complete guide for deploying your AI Cold-Calling System to Render.com.

## 🚀 Why Render.com?

- **Easy deployment** from GitHub
- **Automatic HTTPS** and SSL certificates
- **Environment variable management**
- **Built-in health checks**
- **Competitive pricing** with free tier
- **Excellent performance** and reliability

## 📋 Prerequisites

- GitHub repository with your code
- Render.com account ([Sign up here](https://render.com))
- All API keys and credentials ready

## 🔧 Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Create Render Service

1. **Go to Render Dashboard**: [https://dashboard.render.com](https://dashboard.render.com)
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub**: Authorize Render to access your repositories
4. **Select Repository**: Choose your AI cold-calling repository
5. **Configure Service**:
   - **Name**: `ai-calling-system`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Runtime**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`

### 3. Configure Environment Variables

In the Render dashboard, add these environment variables:

#### Server Configuration
```
NODE_ENV=production
PORT=10000
BASE_URL=https://your-app-name.onrender.com
```

#### Twilio Configuration
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WEBHOOK_URL=https://your-app-name.onrender.com
```

#### OpenAI Configuration
```
OPENAI_API_KEY=sk-your_api_key
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=150
OPENAI_TEMPERATURE=0.7
```

#### Google Services Configuration
```
GOOGLE_SHEETS_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----
GOOGLE_PROJECT_ID=your_project_id
```

#### Gmail Configuration
```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your_16_char_password
```

#### Security Configuration
```
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

#### Application Settings
```
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_CALL_DURATION=300
CALL_TIMEOUT=30
CONVERSATION_TIMEOUT=30000
MAX_CONVERSATION_TURNS=20
DEBUG=false
ENABLE_CORS=true
CORS_ORIGIN=*
ENABLE_CONVERSATION_LOGGING=true
```

### 4. Advanced Settings

#### Health Check Configuration
- **Health Check Path**: `/health`
- **Health Check Grace Period**: 60 seconds

#### Auto-Deploy Settings
- **Auto-Deploy**: Yes (deploys on every push to main branch)

### 5. Deploy

1. **Click "Create Web Service"**
2. **Wait for deployment** (usually 2-5 minutes)
3. **Check deployment logs** for any errors
4. **Test your app** at `https://your-app-name.onrender.com/health`

## 🔧 Post-Deployment Configuration

### 1. Update Twilio Webhooks

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to Phone Numbers → Manage → Active numbers
3. Click on your phone number
4. Update webhook URL: `https://your-app-name.onrender.com/webhook/twilio/voice`
5. Set method: POST
6. Save configuration

### 2. Test Your Deployment

```bash
# Health check
curl https://your-app-name.onrender.com/health/detailed

# Test Google Sheets connection
curl https://your-app-name.onrender.com/api/sheets/test

# Test Twilio webhook
curl https://your-app-name.onrender.com/webhook/twilio/test
```

### 3. Update n8n Workflow

1. Open your n8n Cloud instance
2. Update all webhook URLs to point to your Render app:
   ```
   https://your-app-name.onrender.com
   ```
3. Test the workflow

## 📊 Render.com Pricing

### Free Tier
- **750 hours/month** of usage
- **Automatic sleep** after 15 minutes of inactivity
- **Cold starts** when waking up
- **Good for**: Testing and development

### Starter Plan ($7/month)
- **Always on** - no sleeping
- **Custom domains**
- **Better performance**
- **Good for**: Production use

### Pro Plan ($25/month)
- **Horizontal scaling**
- **Advanced metrics**
- **Priority support**
- **Good for**: High-volume production

## 🔄 Automatic Deployments

Render automatically deploys when you push to your main branch:

```bash
# Make changes
git add .
git commit -m "Update conversation script"
git push origin main

# Render will automatically deploy the changes
```

## 📈 Monitoring & Logs

### View Logs
1. Go to your service in Render dashboard
2. Click "Logs" tab
3. View real-time logs

### Metrics
1. Click "Metrics" tab
2. View CPU, memory, and request metrics
3. Set up alerts for issues

### Health Checks
Render automatically monitors your `/health` endpoint and restarts if unhealthy.

## 🔒 Security Best Practices

### Environment Variables
- **Never commit** sensitive data to Git
- **Use Render's environment variables** for all secrets
- **Rotate API keys** regularly

### HTTPS
- Render provides **automatic HTTPS** for all apps
- **Custom domains** get free SSL certificates

### Access Control
- **Limit GitHub access** to necessary repositories
- **Use API keys** for authentication
- **Enable rate limiting** in your app

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs in Render dashboard
# Common fixes:
- Ensure package.json is in backend/ directory
- Check Node.js version compatibility
- Verify all dependencies are listed
```

#### 2. Environment Variable Issues
```bash
# Test environment variables
curl https://your-app-name.onrender.com/health/config

# Common fixes:
- Check for typos in variable names
- Ensure private keys have proper line breaks
- Verify all required variables are set
```

#### 3. Cold Start Issues (Free Tier)
```bash
# Free tier apps sleep after 15 minutes
# Solutions:
- Upgrade to Starter plan for always-on
- Use external monitoring to keep app awake
- Expect 10-30 second cold start delays
```

#### 4. Webhook Timeouts
```bash
# Render has 30-second timeout for HTTP requests
# Solutions:
- Optimize conversation processing
- Use async processing for long operations
- Implement proper error handling
```

### Getting Help

1. **Check Render Status**: [https://status.render.com](https://status.render.com)
2. **Render Documentation**: [https://render.com/docs](https://render.com/docs)
3. **Support**: Contact Render support through dashboard
4. **Community**: Render Discord community

## 🔄 Migration from Railway

If migrating from Railway:

1. **Export environment variables** from Railway
2. **Create new Render service** following this guide
3. **Import environment variables** to Render
4. **Update webhook URLs** in Twilio and n8n
5. **Test thoroughly** before switching DNS

## 📋 Deployment Checklist

- [ ] Repository pushed to GitHub
- [ ] Render service created and configured
- [ ] All environment variables set
- [ ] Health check endpoint working
- [ ] Twilio webhooks updated
- [ ] n8n workflow URLs updated
- [ ] Test calls working
- [ ] Google Sheets integration working
- [ ] Email service working
- [ ] Monitoring and alerts configured

## 🎉 Success!

Your AI Cold-Calling System is now deployed on Render.com! 

**Next steps:**
1. Monitor your first few calls
2. Check logs for any issues
3. Scale up if needed
4. Set up monitoring alerts

**Your app is live at**: `https://your-app-name.onrender.com`
