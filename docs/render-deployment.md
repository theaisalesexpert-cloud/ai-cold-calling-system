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
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

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
