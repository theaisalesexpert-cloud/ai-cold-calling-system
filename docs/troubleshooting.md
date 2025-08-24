# AI Cold Calling System - Troubleshooting Guide

## Common Issues and Solutions

### 1. Webhook Server Issues

#### Problem: Webhook server not responding
**Symptoms:**
- Health check fails at `https://theaisalesexpert.co.uk/health`
- Twilio calls fail to connect
- n8n workflows timeout

**Solutions:**
1. Check Render.com service status
2. Verify environment variables are set correctly
3. Check server logs in Render.com dashboard
4. Ensure domain DNS is configured properly

**Debug Commands:**
```bash
# Test health endpoint
curl https://theaisalesexpert.co.uk/health

# Check DNS resolution
nslookup theaisalesexpert.co.uk

# Test webhook endpoint
curl -X POST https://theaisalesexpert.co.uk/webhook/twilio/voice \
  -d "CallSid=test&From=+1234567890&To=+1234567890&CallStatus=ringing"
```

#### Problem: SSL certificate issues
**Symptoms:**
- HTTPS requests fail
- Twilio webhook errors
- Browser security warnings

**Solutions:**
1. Wait for Render.com to provision SSL certificate (can take up to 24 hours)
2. Verify domain ownership in Render.com
3. Check DNS propagation using online tools
4. Contact Render.com support if certificate doesn't provision

### 2. Twilio Integration Issues

#### Problem: Calls not connecting
**Symptoms:**
- Twilio returns error codes
- Calls go straight to voicemail
- No webhook events received

**Solutions:**
1. Verify phone number is verified in Twilio
2. Check account balance and billing
3. Ensure webhook URLs are accessible
4. Verify TwiML response format

**Common Error Codes:**
- `11200`: HTTP retrieval failure - webhook URL not accessible
- `13224`: Dial timeout - number not reachable
- `30001`: Queue overflow - too many concurrent calls

**Debug Steps:**
```bash
# Test Twilio credentials
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}.json" \
  -u "{AccountSid}:{AuthToken}"

# Check phone number configuration
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/IncomingPhoneNumbers.json" \
  -u "{AccountSid}:{AuthToken}"
```

#### Problem: Voice quality issues
**Symptoms:**
- Robotic or distorted voice
- Audio cutting out
- Poor speech recognition

**Solutions:**
1. Adjust ElevenLabs voice settings (stability, similarity boost)
2. Use higher quality audio format
3. Implement audio buffering
4. Check network latency between services

### 3. AI Integration Issues

#### Problem: OpenAI API failures
**Symptoms:**
- AI responses are empty or error messages
- Long response times
- Rate limit errors

**Solutions:**
1. Verify API key is valid and has sufficient credits
2. Check rate limits and upgrade plan if needed
3. Implement retry logic with exponential backoff
4. Use appropriate model (gpt-4 vs gpt-3.5-turbo)

**Rate Limit Handling:**
```javascript
// Implement retry with backoff
async function callOpenAI(messages, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages
      });
      return response;
    } catch (error) {
      if (error.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
}
```

#### Problem: ElevenLabs speech synthesis issues
**Symptoms:**
- No audio generated
- Poor voice quality
- API errors

**Solutions:**
1. Verify API key and voice ID
2. Check character limits (ElevenLabs has limits per request)
3. Adjust voice settings for better quality
4. Implement audio caching to reduce API calls

**Voice Settings Optimization:**
```json
{
  "stability": 0.5,
  "similarity_boost": 0.5,
  "style": 0.0,
  "use_speaker_boost": true
}
```

### 4. Google Sheets Integration Issues

#### Problem: Sheets not updating
**Symptoms:**
- Call outcomes not recorded
- Status remains "Pending"
- Permission errors

**Solutions:**
1. Verify service account has edit permissions
2. Check Google Sheets API quotas
3. Ensure sheet structure matches expected format
4. Verify spreadsheet ID is correct

**Permission Setup:**
1. Share sheet with service account email
2. Grant "Editor" permissions
3. Verify API is enabled in Google Cloud Console

#### Problem: Data format issues
**Symptoms:**
- Phone numbers not recognized
- Date format errors
- Dropdown validation failures

**Solutions:**
1. Ensure phone numbers are in E.164 format (+1234567890)
2. Use YYYY-MM-DD format for dates
3. Set up data validation rules in Google Sheets
4. Implement data sanitization in webhook server

### 5. n8n Workflow Issues

#### Problem: Workflows not triggering
**Symptoms:**
- Google Sheets changes don't trigger workflow
- Webhooks not receiving data
- Executions not appearing in history

**Solutions:**
1. Check workflow is active
2. Verify Google Sheets trigger configuration
3. Test webhook endpoints manually
4. Check n8n execution limits

#### Problem: Credential errors
**Symptoms:**
- Authentication failures
- API connection errors
- Permission denied errors

**Solutions:**
1. Re-authenticate all credentials
2. Check credential expiration dates
3. Verify API keys are correct
4. Test credentials individually

### 6. Performance Issues

#### Problem: Slow response times
**Symptoms:**
- Long delays in conversation
- Timeouts in Twilio calls
- Poor user experience

**Solutions:**
1. Optimize AI prompts for shorter responses
2. Implement caching for common responses
3. Use faster AI models when appropriate
4. Scale up Render.com instance

**Performance Monitoring:**
```javascript
// Add timing to webhook responses
const startTime = Date.now();
// ... process request
const duration = Date.now() - startTime;
logger.info('Request processed', { duration, endpoint: req.path });
```

#### Problem: High API costs
**Symptoms:**
- Unexpected billing charges
- Rate limit warnings
- Budget alerts

**Solutions:**
1. Implement response caching
2. Optimize prompt lengths
3. Use cheaper models for simple tasks
4. Monitor usage with alerts

### 7. Data Quality Issues

#### Problem: Incorrect call outcomes
**Symptoms:**
- Wrong customer responses recorded
- Missing email addresses
- Inaccurate appointment scheduling

**Solutions:**
1. Improve AI prompt engineering
2. Add validation rules for extracted data
3. Implement confidence scoring
4. Add human review for critical outcomes

#### Problem: Phone number issues
**Symptoms:**
- Calls to wrong numbers
- Invalid number errors
- International calling issues

**Solutions:**
1. Validate phone numbers before calling
2. Use phone number parsing libraries
3. Handle international formats properly
4. Implement number verification

### 8. Security Issues

#### Problem: Unauthorized access
**Symptoms:**
- Unexpected API usage
- Security warnings
- Unauthorized data access

**Solutions:**
1. Rotate API keys regularly
2. Implement webhook signature verification
3. Use HTTPS for all communications
4. Monitor access logs

**Webhook Security:**
```javascript
// Verify Twilio webhook signature
const crypto = require('crypto');

function verifyTwilioSignature(signature, url, params, authToken) {
  const data = Object.keys(params)
    .sort()
    .map(key => `${key}${params[key]}`)
    .join('');
  
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(url + data)
    .digest('base64');
  
  return signature === `sha1=${expectedSignature}`;
}
```

## Debugging Tools

### 1. Log Analysis
Check logs in this order:
1. Render.com application logs
2. n8n execution history
3. Twilio call logs
4. Google Sheets activity log

### 2. Testing Tools
Use these tools for debugging:
- `scripts/test-system.js` - Comprehensive system test
- Postman/curl for API testing
- Twilio Console for call debugging
- n8n workflow testing

### 3. Monitoring Setup
Implement monitoring for:
- API response times
- Error rates
- Call success rates
- System uptime

## Getting Help

### 1. Check Documentation
- Review setup guide
- Check configuration settings
- Verify API documentation

### 2. Community Resources
- n8n Community Forum
- Twilio Developer Documentation
- OpenAI Community
- Stack Overflow

### 3. Support Contacts
- Render.com Support
- Twilio Support
- OpenAI Support
- ElevenLabs Support

### 4. Emergency Procedures
If system is completely down:
1. Check Render.com service status
2. Verify domain DNS settings
3. Test individual API endpoints
4. Rollback to last working configuration
5. Contact relevant support teams

Remember to always test changes in a development environment before applying to production!
