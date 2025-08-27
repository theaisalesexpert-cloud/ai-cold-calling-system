<<<<<<< HEAD
# 🚀 Render.com Deployment Guide

## Overview

Deploy your AI Cold Calling System to Render.com with managed databases and automatic scaling.

## 🎯 Deployment Architecture

```
GitHub Repository → Render Web Service → Render PostgreSQL/MongoDB
                                    ↓
                  Render Redis → External APIs (Twilio, OpenAI, etc.)
```

## 📋 Prerequisites

1. **Render.com account** ✅ (You have this)
2. **GitHub repository** with your code
3. **API keys** for external services
4. **Domain name** (optional)

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
=======
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

>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

<<<<<<< HEAD
2. **Verify your `package.json`** in the `webhooks` directory:
```json
{
  "scripts": {
    "start": "node twilio-voice-handler.js",
    "build": "echo 'No build step required'"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### Step 2: Create Render Services

#### A. Create Web Service

1. **Go to Render Dashboard**
2. **Click "New +"** → **"Web Service"**
3. **Connect GitHub repository**
4. **Configure service**:
   - **Name**: `ai-calling-system`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `webhooks`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### B. Create MongoDB Database

1. **Click "New +"** → **"PostgreSQL"** (or use external MongoDB)
2. **For MongoDB**, use **MongoDB Atlas** (recommended):
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create free cluster
   - Get connection string

#### C. Create Redis Instance

1. **Click "New +"** → **"Redis"**
2. **Configure**:
   - **Name**: `ai-calling-redis`
   - **Plan**: Start with free tier
   - **Region**: Same as web service

### Step 3: Environment Variables

In your Render Web Service, add these environment variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=10000
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-calling-system
REDIS_URL=redis://red-xxxxx:6379

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# AI Services
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
DEEPGRAM_API_KEY=your_deepgram_api_key

# n8n Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook
N8N_API_KEY=your_n8n_api_key

# Domain and URLs
DOMAIN=your-app-name.onrender.com
WEBHOOK_BASE_URL=https://your-app-name.onrender.com

# Business Configuration
DEALERSHIP_NAME=Your Dealership Name
BOT_NAME=Sarah
TIMEZONE=America/New_York

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-for-production
API_KEYS=prod-api-key-1,prod-api-key-2,prod-api-key-3

# Performance Configuration
CACHE_ENABLED=true
COMPRESSION_ENABLED=true
```

### Step 4: Configure Custom Domain (Optional)

1. **In Render Dashboard** → **Your Service** → **Settings**
2. **Custom Domains** → **Add Custom Domain**
3. **Add your domain**: `ai-calling.yourdomain.com`
4. **Update DNS** with provided CNAME record
5. **SSL Certificate** will be automatically provisioned

### Step 5: Configure Webhooks

Once deployed, update your external service webhooks:

#### Twilio Webhooks
1. **Go to Twilio Console** → **Phone Numbers**
2. **Update webhook URLs**:
   - **Voice URL**: `https://your-app.onrender.com/webhook/call/initiate`
   - **Status Callback**: `https://your-app.onrender.com/webhook/call/status`

#### n8n Webhooks
Update your n8n workflows with production URLs:
- Replace `http://localhost:3000` with `https://your-app.onrender.com`

## 🔧 Render-Specific Configuration

### Build Configuration

Create `render.yaml` in your project root:

```yaml
services:
  - type: web
    name: ai-calling-system
    env: node
    region: oregon
    plan: starter
    buildCommand: cd webhooks && npm install
    startCommand: cd webhooks && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
    healthCheckPath: /health

  - type: redis
    name: ai-calling-redis
    region: oregon
    plan: starter
    maxmemoryPolicy: allkeys-lru

databases:
  - name: ai-calling-db
    databaseName: ai_calling_system
    user: ai_calling_user
    region: oregon
    plan: starter
```

### Health Check Endpoint

Ensure your health check works for Render:

```javascript
// In your main server file
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: 'configured',
      apis: {
        twilio: !!process.env.TWILIO_ACCOUNT_SID,
        openai: !!process.env.OPENAI_API_KEY,
        elevenlabs: !!process.env.ELEVENLABS_API_KEY
      }
    }
  });
});
```

## 🗄️ Database Setup Options

### Option 1: MongoDB Atlas (Recommended)

1. **Create MongoDB Atlas account**
2. **Create free cluster**
3. **Configure network access** (allow all IPs: `0.0.0.0/0`)
4. **Create database user**
5. **Get connection string**
6. **Add to Render environment variables**

### Option 2: Render PostgreSQL + Mongoose

If you prefer PostgreSQL:

```bash
# Install PostgreSQL adapter
npm install pg mongoose-legacy-pluralize

# Update connection in your app
const mongoose = require('mongoose');
// Use PostgreSQL connection string from Render
```

## 🚀 Deployment Process

### Automatic Deployment

1. **Push to GitHub**:
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

2. **Render automatically**:
   - Detects changes
   - Builds application
   - Deploys new version
   - Runs health checks

### Manual Deployment

1. **In Render Dashboard**
2. **Go to your service**
3. **Click "Manual Deploy"**
4. **Select branch and deploy**

## 📊 Monitoring and Logs

### View Logs
1. **Render Dashboard** → **Your Service** → **Logs**
2. **Real-time log streaming**
3. **Filter by log level**

### Monitoring
1. **Built-in metrics** (CPU, Memory, Response time)
2. **Custom health checks**
3. **Uptime monitoring**

### Alerts
1. **Configure in Render Dashboard**
2. **Email/Slack notifications**
3. **Service down alerts**

## 🔒 Security Configuration

### Environment Variables
- **Never commit secrets** to GitHub
- **Use Render's environment variable management**
- **Rotate API keys regularly**

### HTTPS
- **Automatic SSL certificates**
- **Force HTTPS redirects**
- **HSTS headers enabled**

### Rate Limiting
```javascript
// Configure for production
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

## 🎯 Performance Optimization

### Render-Specific Optimizations

1. **Enable compression**:
```javascript
const compression = require('compression');
app.use(compression());
```

2. **Configure caching**:
```javascript
// Use Redis for caching
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);
```

3. **Optimize startup time**:
```javascript
// Lazy load heavy dependencies
const heavyModule = () => require('./heavy-module');
```

### Scaling Configuration

1. **Horizontal scaling**: Render automatically scales
2. **Vertical scaling**: Upgrade plan as needed
3. **Database scaling**: Use MongoDB Atlas auto-scaling

## 🧪 Testing Production Deployment

### Pre-deployment Testing
```bash
# Test locally with production-like environment
NODE_ENV=production npm start

# Test API endpoints
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/api/voice/status
```

### Post-deployment Testing
```bash
# Test call initiation
curl -X POST https://your-app.onrender.com/webhook/call/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "Test Customer",
    "phone_number": "+1234567890",
    "car_model": "Test Car 2023"
  }'

# Test n8n integration
curl https://your-app.onrender.com/api/n8n/test
```

## 🚨 Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Check build logs in Render dashboard
# Ensure package.json is in webhooks directory
# Verify Node.js version compatibility
```

**Database Connection Issues**:
```bash
# Check MongoDB Atlas network access
# Verify connection string format
# Test connection locally first
```

**Environment Variable Issues**:
```bash
# Double-check variable names
# Ensure no trailing spaces
# Test with curl commands
```

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug

# Check specific service logs
DEBUG=express:*,mongoose:*
```

## 🎉 Success Checklist

- ✅ Service deploys successfully
- ✅ Health check returns 200
- ✅ Database connection works
- ✅ External APIs respond
- ✅ Webhooks receive requests
- ✅ n8n integration works
- ✅ Custom domain configured (if applicable)
- ✅ SSL certificate active
- ✅ Monitoring alerts configured

## 💰 Cost Optimization

### Free Tier Usage
- **Web Service**: Free tier available
- **Redis**: Free tier (25MB)
- **PostgreSQL**: Free tier (1GB)
- **MongoDB Atlas**: Free tier (512MB)

### Scaling Strategy
1. **Start with free tiers**
2. **Monitor usage metrics**
3. **Upgrade services as needed**
4. **Use auto-scaling features**

## 🔄 CI/CD Pipeline

### Automatic Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy to Render

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST "https://api.render.com/deploy/srv-xxxxx" \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"
```

Your AI calling system is now ready for production on Render! 🚀
=======
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
>>>>>>> 0a7fd6d198d04d024ed664dcd4aedbddab32b139
