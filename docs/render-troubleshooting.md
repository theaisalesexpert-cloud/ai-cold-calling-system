# Render.com Deployment Troubleshooting

Quick fixes for common Render.com deployment issues.

## 🚨 Common Deployment Errors

### 1. Email Service Initialization Error

**Error:**
```
AppError: Failed to initialize email service
    at EmailService.initializeTransporter
```

**Cause:** Gmail credentials not set in environment variables.

**Solution:**
✅ **The app now handles missing email credentials gracefully**
- Email service will be disabled if credentials are missing
- App will start successfully without email functionality
- Add `GMAIL_USER` and `GMAIL_APP_PASSWORD` to enable emails

**Steps to fix:**
1. Go to Render dashboard → Your service → Environment
2. Add these variables:
   ```
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your_16_char_app_password
   ```
3. Redeploy the service

### 2. Google Sheets Permission Error

**Error:**
```
Error: The caller does not have permission
```

**Cause:** Service account not added to Google Sheet or incorrect credentials.

**Solution:**
1. **Check service account email** in your JSON key file
2. **Share Google Sheet** with service account email
3. **Give Editor permissions**
4. **Verify environment variables**:
   ```
   GOOGLE_SHEETS_ID=your_sheet_id
   GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----"
   ```

### 3. Port Configuration Error

**Error:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Cause:** Wrong port configuration for Render.

**Solution:**
1. **Update environment variable**:
   ```
   PORT=10000
   ```
2. **Or remove PORT variable** (Render sets it automatically)

### 4. Build Command Errors

**Error:**
```
npm ERR! missing script: build
```

**Cause:** Incorrect build command configuration.

**Solution:**
1. **Set correct build command** in Render dashboard:
   ```
   cd backend && npm install
   ```
2. **Set correct start command**:
   ```
   cd backend && npm start
   ```

### 5. Environment Variables Not Loading

**Error:**
```
Missing required environment variables
```

**Cause:** Environment variables not set in Render dashboard.

**Solution:**
1. **Go to Render dashboard** → Your service → Environment
2. **Add all required variables**:
   ```
   NODE_ENV=production
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   OPENAI_API_KEY=sk-your_api_key
   # ... add all other variables
   ```
3. **Click "Save Changes"**
4. **Redeploy** the service

## 🔧 Quick Fixes

### Fix 1: Restart Service
```bash
# In Render dashboard:
# 1. Go to your service
# 2. Click "Manual Deploy" → "Deploy latest commit"
```

### Fix 2: Check Logs
```bash
# In Render dashboard:
# 1. Go to your service
# 2. Click "Logs" tab
# 3. Look for error messages
```

### Fix 3: Verify Environment Variables
```bash
# Test your deployed app:
curl https://your-app-name.onrender.com/health/config
```

### Fix 4: Test Individual Services
```bash
# Test health check
curl https://your-app-name.onrender.com/health/detailed

# Test Google Sheets (if configured)
curl https://your-app-name.onrender.com/api/sheets/test

# Test Twilio webhook
curl https://your-app-name.onrender.com/webhook/twilio/test
```

## 📋 Deployment Checklist

Before deploying, ensure:

- [ ] **Repository pushed** to GitHub
- [ ] **Build command** set: `cd backend && npm install`
- [ ] **Start command** set: `cd backend && npm start`
- [ ] **Environment variables** added in Render dashboard
- [ ] **Health check path** set: `/health`
- [ ] **Auto-deploy** enabled for main branch

## 🔍 Debugging Steps

### Step 1: Check Service Status
1. Go to Render dashboard
2. Check if service is "Live" or has errors
3. Look at recent deployments

### Step 2: Review Logs
1. Click "Logs" tab in Render dashboard
2. Look for error messages during startup
3. Check for missing environment variables

### Step 3: Test Endpoints
```bash
# Basic health check
curl https://your-app-name.onrender.com/health

# Detailed health check
curl https://your-app-name.onrender.com/health/detailed

# Configuration check
curl https://your-app-name.onrender.com/health/config
```

### Step 4: Verify Environment Variables
1. Check all required variables are set
2. Verify no typos in variable names
3. Ensure private keys have proper formatting

## 🆘 Emergency Recovery

### If App Won't Start:
1. **Check logs** for specific error messages
2. **Verify environment variables** are set correctly
3. **Try manual deploy** with latest commit
4. **Contact Render support** if issue persists

### If App Starts But Features Don't Work:
1. **Check health/detailed endpoint** for service status
2. **Verify API keys** are valid and have credits
3. **Test individual services** separately
4. **Check external service status** (Twilio, OpenAI, etc.)

## 📞 Getting Help

### Render Support Resources:
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Status Page**: [status.render.com](https://status.render.com)
- **Support**: Contact through Render dashboard

### Project Support:
- **GitHub Issues**: Create issue in repository
- **Documentation**: Check `/docs/` folder
- **Health Endpoints**: Use built-in diagnostics

## ✅ Success Indicators

Your deployment is successful when:

- [ ] **Service shows "Live"** in Render dashboard
- [ ] **Health check returns 200**: `curl https://your-app-name.onrender.com/health`
- [ ] **No errors in logs** during startup
- [ ] **All services show healthy**: Check `/health/detailed`
- [ ] **Twilio webhooks work**: Test with `/webhook/twilio/test`

## 🔄 Common Post-Deployment Tasks

### Update Twilio Webhooks:
1. Go to Twilio Console
2. Update webhook URL to your Render app
3. Test webhook functionality

### Update n8n Workflow:
1. Update all URLs in n8n workflow
2. Test workflow execution
3. Activate automated workflows

### Monitor Performance:
1. Check Render metrics dashboard
2. Monitor response times
3. Set up alerts for downtime

---

**💡 Pro Tip**: Always test your deployment with the health endpoints before updating external services like Twilio webhooks!
