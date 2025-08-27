# Troubleshooting Guide

Common issues and solutions for the AI Cold-Calling System.

## 🚨 Common Issues

### 0. Render.com Deployment Issues

#### Issue: App fails to start on Render

**Symptoms:**
- "Failed to initialize email service" error
- App crashes during startup
- Service shows as "Deploy failed"

**Solutions:**

1. **Email service initialization error** (Most common):
   ```bash
   # The app now handles missing Gmail credentials gracefully
   # Add these environment variables in Render dashboard:
   GMAIL_USER=your-email@gmail.com
   GMAIL_APP_PASSWORD=your_16_char_app_password
   ```

2. **Missing environment variables**:
   - Check Render dashboard → Environment tab
   - Ensure all required variables are set
   - Verify no typos in variable names

3. **Port configuration**:
   ```bash
   # Set in Render dashboard:
   PORT=10000
   # Or remove PORT variable (Render sets automatically)
   ```

**Quick Fix**: See [Render Troubleshooting Guide](render-troubleshooting.md) for detailed solutions.

### 1. Call Initiation Problems

#### Issue: "Failed to initiate call" error

**Symptoms:**
- API returns 500 error when trying to initiate calls
- Twilio webhook not receiving calls

**Possible Causes & Solutions:**

1. **Invalid Twilio credentials**
   ```bash
   # Check your Twilio credentials
   curl -u "ACCOUNT_SID:AUTH_TOKEN" \
     https://api.twilio.com/2010-04-01/Accounts/ACCOUNT_SID.json
   ```
   - Verify `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` are correct
   - Check if credentials are active in Twilio Console

2. **Invalid phone number format**
   - Ensure phone numbers include country code: `+1234567890`
   - Verify the number is not on Twilio's blocked list

3. **Webhook URL not accessible**
   ```bash
   # Test webhook accessibility
   curl https://your-app.railway.app/webhook/twilio/test
   ```
   - Ensure your app is deployed and running
   - Check if webhook URL is configured in Twilio Console

#### Issue: Calls connect but no AI response

**Symptoms:**
- Call connects but customer hears silence
- No conversation flow starts

**Solutions:**

1. **Check OpenAI API key**
   ```bash
   # Test OpenAI connection
   curl https://your-app.railway.app/health/detailed
   ```
   - Verify `OPENAI_API_KEY` is valid and has credits
   - Check OpenAI usage limits

2. **Verify conversation service**
   ```bash
   # Check active conversations
   curl https://your-app.railway.app/api/calls/active
   ```

### 2. Google Sheets Integration Issues

#### Issue: "Permission denied" when accessing sheets

**Symptoms:**
- 403 errors when trying to read/write to Google Sheets
- "The caller does not have permission" error

**Solutions:**

1. **Check service account permissions**
   - Ensure service account email is added to the Google Sheet
   - Verify the service account has "Editor" permissions
   - Check if the sheet ID is correct

2. **Verify service account credentials**
   ```bash
   # Test Google Sheets connection
   curl https://your-app.railway.app/api/sheets/test
   ```
   - Check if `GOOGLE_PRIVATE_KEY` is properly formatted
   - Ensure all Google environment variables are set

3. **Sheet structure validation**
   ```bash
   # Validate sheet structure
   curl https://your-app.railway.app/api/sheets/validate
   ```

#### Issue: Data not updating in Google Sheets

**Symptoms:**
- API calls succeed but data doesn't appear in sheets
- Old data not being updated

**Solutions:**

1. **Check column mapping**
   - Verify column headers match expected format
   - Check if row indices are correct

2. **Verify sheet name**
   - Ensure the sheet is named "Customers" (case-sensitive)
   - Check if there are multiple sheets with similar names

### 3. Email Service Problems

#### Issue: Emails not being sent

**Symptoms:**
- No follow-up emails received by customers
- Email service errors in logs

**Solutions:**

1. **Check Gmail credentials**
   ```bash
   # Test email configuration
   curl https://your-app.railway.app/health/detailed
   ```
   - Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are correct
   - Ensure 2-factor authentication is enabled on Gmail
   - Check if app password is generated correctly

2. **Verify email templates**
   - Check if email templates are loading correctly
   - Verify customer email addresses are valid

### 4. n8n Workflow Issues

#### Issue: Workflow not triggering

**Symptoms:**
- Scheduled calls not happening
- Manual triggers not working

**Solutions:**

1. **Check workflow activation**
   - Ensure workflow is activated in n8n
   - Verify cron trigger is configured correctly

2. **Verify webhook URLs**
   - Update webhook URLs to point to your deployed app
   - Check if API authentication is configured

3. **Test individual nodes**
   - Test each node in the workflow individually
   - Check node configurations and credentials

### 5. API Authentication Issues

#### Issue: "Unauthorized" errors

**Symptoms:**
- 401 errors when calling API endpoints
- "Invalid token" messages

**Solutions:**

1. **Check API key configuration**
   ```bash
   # Test with correct API key
   curl -H "Authorization: Bearer your_api_key" \
     https://your-app.railway.app/api/calls/statistics
   ```
   - Verify `API_KEY` environment variable is set
   - Ensure API key is included in request headers

2. **Verify rate limiting**
   - Check if you're hitting rate limits
   - Review rate limiting configuration

## 🔧 Debugging Steps

### 1. Check System Health

```bash
# Basic health check
curl https://your-app.railway.app/health

# Detailed health check
curl https://your-app.railway.app/health/detailed

# System metrics
curl https://your-app.railway.app/health/metrics
```

### 2. Test Individual Services

```bash
# Test Google Sheets
curl https://your-app.railway.app/api/sheets/test

# Test Twilio webhook
curl https://your-app.railway.app/webhook/twilio/test

# Test call initiation
curl -X POST https://your-app.railway.app/api/calls/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{"phoneNumber": "+1234567890"}'
```

### 3. Check Logs

**Railway:**
```bash
railway logs
```

**Heroku:**
```bash
heroku logs --tail
```

**Local development:**
```bash
npm run dev
# Check console output and log files
```

### 4. Verify Environment Variables

```bash
# Check if all required variables are set
curl https://your-app.railway.app/health/config
```

Common missing variables:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `OPENAI_API_KEY`
- `GOOGLE_SHEETS_ID`
- `GOOGLE_PRIVATE_KEY`

## 🐛 Error Code Reference

### HTTP Status Codes

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid API key
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side error

### Application Error Codes

- **TWILIO_ERROR**: Twilio API error
- **OPENAI_ERROR**: OpenAI API error
- **SHEETS_ERROR**: Google Sheets API error
- **EMAIL_ERROR**: Email service error
- **CONVERSATION_ERROR**: Conversation logic error

## 🔍 Monitoring and Alerts

### Key Metrics to Monitor

1. **Call Success Rate**
   ```bash
   curl https://your-app.railway.app/api/calls/statistics
   ```

2. **API Response Times**
   - Monitor health check response times
   - Track API endpoint performance

3. **Error Rates**
   - Monitor application logs for errors
   - Track failed API calls

4. **Resource Usage**
   ```bash
   curl https://your-app.railway.app/health/metrics
   ```

### Setting Up Alerts

1. **Uptime Monitoring**
   - Use services like Pingdom or UptimeRobot
   - Monitor `/health` endpoint

2. **Error Tracking**
   - Configure Sentry for error tracking
   - Set up email alerts for critical errors

3. **Performance Monitoring**
   - Use New Relic or similar services
   - Monitor API response times

## 🛠️ Advanced Troubleshooting

### Database Connection Issues

If you add a database later:

```bash
# Test database connection
curl https://your-app.railway.app/health/storage
```

### Memory Issues

```bash
# Check memory usage
curl https://your-app.railway.app/health/metrics
```

If memory usage is high:
1. Check for memory leaks in conversation service
2. Implement proper cleanup of inactive conversations
3. Consider increasing server resources

### Performance Issues

```bash
# Check active conversations
curl https://your-app.railway.app/api/calls/active
```

If performance is slow:
1. Monitor concurrent conversation count
2. Implement connection pooling for external APIs
3. Add caching for frequently accessed data

## 📞 Getting Help

### Self-Service Resources

1. **API Documentation**: Check `/docs/api-documentation.md`
2. **Health Endpoints**: Use built-in health checks
3. **Log Analysis**: Review application logs

### External Service Support

1. **Twilio Support**: [Twilio Help Center](https://support.twilio.com)
2. **OpenAI Support**: [OpenAI Help Center](https://help.openai.com)
3. **Google Cloud Support**: [Google Cloud Support](https://cloud.google.com/support)
4. **Railway Support**: [Railway Help](https://railway.app/help)

### Community Resources

1. **GitHub Issues**: Report bugs and feature requests
2. **Stack Overflow**: Search for similar issues
3. **Discord/Slack**: Join relevant communities

## 🔄 Recovery Procedures

### Service Recovery

1. **Restart Application**
   ```bash
   # Railway
   railway restart
   
   # Heroku
   heroku restart
   ```

2. **Clear Conversation State**
   ```bash
   # If conversations are stuck
   curl -X POST https://your-app.railway.app/api/calls/cleanup
   ```

3. **Reset Rate Limits**
   - Wait for rate limit window to reset
   - Or restart the application

### Data Recovery

1. **Google Sheets Backup**
   - Use Google Sheets version history
   - Restore from CSV backup if available

2. **Call Recordings**
   - Access recordings from Twilio Console
   - Download important recordings for analysis

### Emergency Procedures

1. **Stop All Calls**
   ```bash
   # End all active calls
   curl -X POST https://your-app.railway.app/api/calls/emergency-stop
   ```

2. **Disable Workflows**
   - Deactivate n8n workflows
   - Prevent new calls from being initiated

3. **Notify Stakeholders**
   - Send status updates
   - Provide estimated recovery time

## 📊 Performance Optimization

### Common Performance Issues

1. **Slow API Responses**
   - Implement caching
   - Optimize database queries
   - Use connection pooling

2. **High Memory Usage**
   - Clean up inactive conversations
   - Implement proper garbage collection
   - Monitor memory leaks

3. **Rate Limiting**
   - Implement exponential backoff
   - Add request queuing
   - Monitor API usage

### Optimization Strategies

1. **Caching**
   - Cache customer data
   - Cache API responses
   - Use Redis for session storage

2. **Connection Pooling**
   - Pool database connections
   - Reuse HTTP connections
   - Implement connection limits

3. **Monitoring**
   - Add performance metrics
   - Monitor response times
   - Track resource usage
