# Production Deployment Guide

## Overview

This guide covers deploying the Enhanced AI Cold-Calling System to production with high availability, security, and monitoring.

## Prerequisites

### Required Services
- **MongoDB Atlas** (or self-hosted MongoDB cluster)
- **Redis Cloud** (or self-hosted Redis)
- **Render.com** (or AWS/GCP/Azure)
- **Twilio Account** with verified phone number
- **OpenAI API** access
- **ElevenLabs** account
- **Deepgram** account
- **Google Cloud Platform** (for Sheets API)
- **Domain name** with SSL certificate

### Development Tools
- Node.js 18+ and npm 8+
- Git
- Docker (optional)
- MongoDB Compass (for database management)

## Environment Setup

### 1. Database Configuration

#### MongoDB Atlas Setup
1. Create MongoDB Atlas cluster
2. Configure network access (whitelist your server IPs)
3. Create database user with read/write permissions
4. Get connection string

#### Redis Setup
1. Create Redis Cloud instance
2. Note host, port, and password
3. Configure memory limits and persistence

### 2. Environment Variables

Create `.env` file in the webhooks directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-calling-system
REDIS_HOST=redis-12345.c1.us-east-1-2.ec2.cloud.redislabs.com
REDIS_PORT=12345
REDIS_PASSWORD=your-redis-password

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# AI Services
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=200
OPENAI_TEMPERATURE=0.7

ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL=eleven_monolingual_v1

DEEPGRAM_API_KEY=your-deepgram-api-key
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US

# Google Services
GOOGLE_SHEETS_ID=your-google-sheets-id
GOOGLE_CREDENTIALS_PATH=./config/google-credentials.json

# n8n Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.com
N8N_API_KEY=your-n8n-api-key

# Domain and URLs
DOMAIN=your-domain.com
WEBHOOK_BASE_URL=https://your-domain.com

# Business Configuration
DEALERSHIP_NAME=Your Dealership Name
BOT_NAME=Sarah
DEFAULT_REP_NAME=Sarah from Your Dealership
TIMEZONE=America/New_York
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=17:00
BUSINESS_DAYS=monday,tuesday,wednesday,thursday,friday

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRE=30d
API_KEYS=api-key-1,api-key-2,api-key-3
ALLOWED_IPS=192.168.1.100,10.0.0.50  # Optional IP whitelist

# Rate Limiting
RATE_LIMIT_WINDOW=900000  # 15 minutes in ms
RATE_LIMIT_MAX=100
CORS_ORIGINS=https://your-domain.com,https://admin.your-domain.com

# Email Configuration (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Performance Configuration
CACHE_ENABLED=true
CACHE_TTL=3600
COMPRESSION_ENABLED=true
REQUEST_TIMEOUT=30000

# Call Configuration
MAX_CALL_DURATION=300
SPEECH_TIMEOUT=3
GATHER_TIMEOUT=10
MAX_CALL_RETRIES=3
RETRY_DELAY=3600000
RECORD_CALLS=false  # Set to true if you have consent
```

## Deployment Options

### Option 1: Render.com Deployment (Recommended)

#### 1. Prepare Repository
```bash
# Ensure your code is in a Git repository
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

#### 2. Create Render Service
1. Go to [Render.com](https://render.com)
2. Connect your GitHub repository
3. Create new Web Service
4. Configure build and start commands:
   - **Build Command**: `cd webhooks && npm install`
   - **Start Command**: `cd webhooks && npm start`
   - **Environment**: Node

#### 3. Configure Environment Variables
Add all environment variables from your `.env` file to Render's environment settings.

#### 4. Configure Health Checks
- **Health Check Path**: `/health`
- **Health Check Timeout**: 30 seconds

#### 5. Configure Custom Domain
1. Add your custom domain in Render settings
2. Configure DNS records:
   ```
   Type: CNAME
   Name: @
   Value: your-app.onrender.com
   ```

### Option 2: Docker Deployment

#### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY webhooks/package*.json ./
RUN npm ci --only=production

# Copy application code
COPY webhooks/ ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

CMD ["npm", "start"]
```

#### 2. Create docker-compose.yml
```yaml
version: '3.8'

services:
  ai-calling-system:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    restart: unless-stopped
    depends_on:
      - redis
      - mongodb

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    volumes:
      - mongodb_data:/data/db
    restart: unless-stopped

volumes:
  redis_data:
  mongodb_data:
```

#### 3. Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f ai-calling-system

# Scale the application
docker-compose up -d --scale ai-calling-system=3
```

### Option 3: AWS/GCP/Azure Deployment

#### AWS Elastic Beanstalk
1. Install EB CLI: `pip install awsebcli`
2. Initialize: `eb init`
3. Create environment: `eb create production`
4. Deploy: `eb deploy`

#### Google Cloud Run
```bash
# Build and push container
gcloud builds submit --tag gcr.io/PROJECT-ID/ai-calling-system

# Deploy to Cloud Run
gcloud run deploy ai-calling-system \
  --image gcr.io/PROJECT-ID/ai-calling-system \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

## Post-Deployment Configuration

### 1. Database Initialization
```bash
# Run database migrations (if any)
npm run db:migrate

# Create initial indexes
npm run db:index

# Seed initial data
npm run db:seed
```

### 2. SSL Certificate Setup
Configure SSL certificate for your domain:
- **Render.com**: Automatic SSL with custom domains
- **Docker**: Use nginx reverse proxy with Let's Encrypt
- **Cloud providers**: Use their SSL certificate services

### 3. Twilio Webhook Configuration
Configure Twilio webhooks to point to your production URLs:

1. Go to Twilio Console > Phone Numbers
2. Configure webhook URLs:
   - **Voice URL**: `https://your-domain.com/webhook/call/initiate`
   - **Status Callback URL**: `https://your-domain.com/webhook/call/status`
   - **HTTP Method**: POST

### 4. n8n Workflow Configuration
Update your n8n workflow with production URLs:
- **Webhook URL**: `https://your-domain.com/webhook/call-completed`
- **API endpoints**: `https://your-domain.com/api/*`

## Monitoring and Logging

### 1. Application Monitoring
```bash
# Install monitoring tools
npm install --save newrelic @sentry/node

# Configure in your app
const newrelic = require('newrelic');
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.NODE_ENV
});
```

### 2. Log Management
Configure centralized logging:
```javascript
// In your logger configuration
const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

const logger = winston.createLogger({
  transports: [
    new LoggingWinston(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 3. Health Checks
Implement comprehensive health checks:
```javascript
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      elevenlabs: await checkElevenLabsHealth(),
      deepgram: await checkDeepgramHealth()
    }
  };
  
  const isHealthy = Object.values(health.services).every(service => service.status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json(health);
});
```

## Security Hardening

### 1. Network Security
- Configure firewall rules
- Use VPC/private networks
- Implement DDoS protection
- Enable WAF (Web Application Firewall)

### 2. Application Security
```javascript
// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const rateLimit = require('express-rate-limit');
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### 3. Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement proper session management
- Regular security audits

## Performance Optimization

### 1. Caching Strategy
```javascript
const redis = require('redis');
const client = redis.createClient(process.env.REDIS_URL);

// Cache frequently accessed data
app.use('/api/analytics', cacheMiddleware(300)); // 5 minutes
app.use('/api/leads', cacheMiddleware(60)); // 1 minute
```

### 2. Database Optimization
- Create proper indexes
- Use connection pooling
- Implement read replicas for analytics
- Regular database maintenance

### 3. CDN Configuration
Configure CDN for static assets:
- Audio files
- Images
- CSS/JS files
- API responses (where appropriate)

## Backup and Disaster Recovery

### 1. Database Backups
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
mongodump --uri="$MONGODB_URI" --out=$BACKUP_DIR
tar -czf "$BACKUP_DIR.tar.gz" $BACKUP_DIR
aws s3 cp "$BACKUP_DIR.tar.gz" s3://your-backup-bucket/
```

### 2. Application Backups
- Code repository backups
- Configuration backups
- Log file archival
- Certificate backups

### 3. Recovery Procedures
Document and test recovery procedures:
1. Database restoration
2. Application deployment
3. Configuration restoration
4. DNS failover
5. Certificate renewal

## Maintenance

### 1. Regular Updates
```bash
# Update dependencies
npm audit
npm update

# Security patches
npm audit fix

# System updates
apt update && apt upgrade
```

### 2. Performance Monitoring
- Monitor response times
- Track error rates
- Monitor resource usage
- Analyze call quality metrics

### 3. Capacity Planning
- Monitor growth trends
- Plan for scaling
- Optimize resource allocation
- Review cost optimization

## Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head

# Optimize Node.js memory
node --max-old-space-size=4096 app.js
```

#### Database Connection Issues
```bash
# Check MongoDB connection
mongosh "mongodb+srv://..."

# Check connection pool
db.runCommand({serverStatus: 1}).connections
```

#### API Rate Limits
- Monitor API usage
- Implement exponential backoff
- Use multiple API keys
- Cache responses when possible

### Log Analysis
```bash
# Search for errors
grep -i error /app/logs/combined.log

# Monitor real-time logs
tail -f /app/logs/combined.log | grep ERROR

# Analyze call patterns
grep "call_start" /app/logs/calls.log | wc -l
```

## Support and Maintenance

### 1. Monitoring Alerts
Set up alerts for:
- High error rates
- Response time degradation
- Service unavailability
- Resource exhaustion

### 2. Regular Health Checks
- Daily system health reports
- Weekly performance reviews
- Monthly security audits
- Quarterly capacity planning

### 3. Documentation Updates
- Keep deployment docs current
- Update API documentation
- Maintain troubleshooting guides
- Document configuration changes
