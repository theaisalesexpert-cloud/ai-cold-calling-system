# Deployment Guide

This guide covers deploying your AI Cold-Calling System to production.

## 🚀 Quick Deployment (Railway - Recommended)

Railway offers the easiest deployment with automatic HTTPS and environment variable management.

### Step 1: Prepare Your Repository

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: AI Cold-Calling System"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-cold-calling-system.git
   git push -u origin main
   ```

### Step 2: Deploy to Railway

1. **Sign up**: Go to [Railway](https://railway.app) and sign up with GitHub
2. **Create new project**: Click "New Project" > "Deploy from GitHub repo"
3. **Select repository**: Choose your AI cold-calling repository
4. **Configure build**: Railway auto-detects Node.js projects
5. **Set environment variables**: Add all variables from your `.env` file

### Step 3: Configure Environment Variables

In Railway dashboard, go to Variables tab and add:

```env
# Server Configuration
PORT=3000
NODE_ENV=production
BASE_URL=https://your-app.railway.app

# Add all other environment variables from environment-setup.md
```

### Step 4: Deploy

Railway automatically deploys when you push to GitHub. Monitor the deployment in the Railway dashboard.

## 🔧 Alternative Deployment Options

### Heroku Deployment

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Login and create app**:
   ```bash
   heroku login
   heroku create your-app-name
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set BASE_URL=https://your-app-name.herokuapp.com
   # Add all other environment variables
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

### DigitalOcean App Platform

1. **Create account**: Sign up at [DigitalOcean](https://digitalocean.com)
2. **Create app**: Go to Apps > Create App
3. **Connect GitHub**: Select your repository
4. **Configure**:
   - Build command: `npm install`
   - Run command: `npm start`
   - Environment variables: Add all required variables
5. **Deploy**: Click "Create Resources"

### AWS EC2 Deployment

1. **Launch EC2 instance**:
   - Choose Ubuntu 20.04 LTS
   - t3.micro for testing, t3.small+ for production
   - Configure security groups (ports 22, 80, 443, 3000)

2. **Connect and setup**:
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Clone repository
   git clone https://github.com/yourusername/ai-cold-calling-system.git
   cd ai-cold-calling-system/backend
   
   # Install dependencies
   npm install
   
   # Create .env file
   nano .env
   # Add all environment variables
   
   # Start with PM2
   pm2 start src/server.js --name "ai-calling"
   pm2 startup
   pm2 save
   ```

3. **Setup Nginx reverse proxy**:
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/ai-calling
   ```

   Add configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/ai-calling /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Setup SSL with Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 🔒 Production Security Checklist

### Environment Variables Security

1. **Never commit `.env` files** to version control
2. **Use strong, unique API keys** for production
3. **Rotate API keys regularly**
4. **Use different keys** for development and production

### Server Security

1. **Enable HTTPS** (automatic with Railway/Heroku)
2. **Set up rate limiting** (already configured in the app)
3. **Use helmet.js** for security headers (already included)
4. **Monitor for vulnerabilities**:
   ```bash
   npm audit
   npm audit fix
   ```

### API Security

1. **Implement API key authentication**:
   ```env
   API_KEY=your_secure_api_key_here
   ```

2. **Use CORS properly**:
   ```env
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

3. **Set up request logging** for monitoring

## 📊 Monitoring & Logging

### Application Monitoring

1. **Health checks**: Use the built-in health endpoints
   - `/health` - Basic health check
   - `/health/detailed` - Detailed service status
   - `/health/metrics` - Application metrics

2. **Error tracking with Sentry**:
   ```bash
   npm install @sentry/node
   ```
   
   Add to your environment:
   ```env
   SENTRY_DSN=your_sentry_dsn_here
   ```

3. **Performance monitoring with New Relic**:
   ```bash
   npm install newrelic
   ```
   
   Add to your environment:
   ```env
   NEW_RELIC_LICENSE_KEY=your_license_key_here
   ```

### Log Management

1. **Structured logging**: The app uses Winston for structured logging
2. **Log levels**: Configure appropriate log levels for production
   ```env
   LOG_LEVEL=info
   ```

3. **Log aggregation**: Consider using services like:
   - Papertrail
   - Loggly
   - AWS CloudWatch

## 🔄 CI/CD Pipeline

### GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd backend
        npm ci
        
    - name: Run tests
      run: |
        cd backend
        npm test
        
    - name: Deploy to Railway
      uses: railwayapp/railway-deploy-action@v1.1.0
      with:
        railway_token: ${{ secrets.RAILWAY_TOKEN }}
        service: 'ai-calling-backend'
```

### Automated Testing

1. **Unit tests**:
   ```bash
   npm test
   ```

2. **Integration tests**:
   ```bash
   npm run test:integration
   ```

3. **Health check tests**:
   ```bash
   curl https://your-app.railway.app/health
   ```

## 🚦 Post-Deployment Setup

### 1. Configure Twilio Webhooks

After deployment, update your Twilio phone number webhooks:

1. Go to Twilio Console > Phone Numbers > Manage > Active numbers
2. Click on your phone number
3. Set webhook URL: `https://your-app.railway.app/webhook/twilio/voice`
4. Set HTTP method: POST
5. Save configuration

### 2. Import n8n Workflow

1. Open your n8n Cloud instance
2. Go to Workflows
3. Click "Import from file"
4. Upload `n8n-workflows/ai-calling-workflow.json`
5. Update webhook URLs to point to your deployed app
6. Configure credentials (API keys, Google Sheets, etc.)
7. Activate the workflow

### 3. Test the Complete System

1. **Test health endpoints**:
   ```bash
   curl https://your-app.railway.app/health/detailed
   ```

2. **Test Google Sheets integration**:
   ```bash
   curl https://your-app.railway.app/api/sheets/test
   ```

3. **Test manual call initiation**:
   ```bash
   curl -X POST https://your-app.railway.app/api/calls/test \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_api_key" \
     -d '{"phoneNumber": "+1234567890"}'
   ```

4. **Test n8n workflow**: Trigger the workflow manually in n8n

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load balancing**: Use Railway's automatic load balancing
2. **Database**: Consider adding PostgreSQL for persistent data
3. **Redis**: Add Redis for session management and caching

### Performance Optimization

1. **Connection pooling**: Implement connection pooling for external APIs
2. **Caching**: Cache frequently accessed data
3. **Rate limiting**: Implement proper rate limiting for external APIs

### Cost Optimization

1. **Monitor usage**: Track API usage and costs
2. **Optimize calls**: Implement smart retry logic
3. **Resource monitoring**: Monitor CPU and memory usage

## 🆘 Troubleshooting Deployment

### Common Issues

1. **Build failures**:
   - Check Node.js version compatibility
   - Verify all dependencies are in package.json
   - Check for syntax errors

2. **Environment variable issues**:
   - Verify all required variables are set
   - Check for typos in variable names
   - Ensure proper formatting (especially for private keys)

3. **Webhook issues**:
   - Verify webhook URLs are accessible
   - Check SSL certificate validity
   - Test webhook endpoints manually

4. **API connection issues**:
   - Verify API keys are correct
   - Check service status pages
   - Test API connections individually

### Getting Help

1. **Check application logs** in your deployment platform
2. **Use health check endpoints** to diagnose issues
3. **Test individual components** to isolate problems
4. **Review service documentation** for API-specific issues

## 🔄 Maintenance

### Regular Tasks

1. **Update dependencies** monthly:
   ```bash
   npm update
   npm audit fix
   ```

2. **Monitor API usage** and costs
3. **Review logs** for errors and performance issues
4. **Test system functionality** weekly
5. **Backup Google Sheets data** regularly

### Updates and Rollbacks

1. **Use version tags** for releases:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. **Test updates** in staging environment first
3. **Have rollback plan** ready
4. **Monitor after deployments** for issues
