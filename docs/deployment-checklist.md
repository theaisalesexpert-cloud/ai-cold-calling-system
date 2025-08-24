# AI Cold Calling System - Deployment Checklist

## Pre-Deployment Preparation

### ✅ 1. Credentials and API Keys
- [ ] Twilio Account SID and Auth Token
- [ ] Twilio phone number purchased and verified
- [ ] OpenAI API key with sufficient credits
- [ ] ElevenLabs API key and voice ID selected
- [ ] Deepgram API key
- [ ] Google Service Account JSON key
- [ ] Gmail App Password generated
- [ ] n8n Cloud instance accessible

### ✅ 2. Google Sheets Setup
- [ ] Spreadsheet created with correct column structure
- [ ] Service account email shared with edit permissions
- [ ] Sample data added for testing
- [ ] Data validation rules configured
- [ ] Spreadsheet ID copied for configuration

### ✅ 3. Domain and DNS
- [ ] Domain `theaisalesexpert.co.uk` configured in Squarespace
- [ ] DNS records ready for configuration
- [ ] SSL certificate requirements understood

## Deployment Steps

### 🚀 Phase 1: Webhook Server Deployment

#### Step 1: Prepare Code Repository
- [ ] Create GitHub repository
- [ ] Upload `webhook-server/` folder
- [ ] Create `.env` file with all credentials
- [ ] Test locally with `npm start`
- [ ] Commit and push to GitHub

#### Step 2: Deploy to Render.com
- [ ] Log into Render.com dashboard
- [ ] Create new Web Service
- [ ] Connect GitHub repository
- [ ] Configure service settings:
  - [ ] Name: `ai-cold-calling-webhook`
  - [ ] Environment: Node
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] Instance Type: Starter
- [ ] Add all environment variables from `.env`
- [ ] Deploy service
- [ ] Verify deployment success

#### Step 3: Configure Custom Domain
- [ ] Add custom domain in Render.com: `theaisalesexpert.co.uk`
- [ ] Configure DNS in Squarespace:
  - [ ] CNAME record: `www` → `your-service.onrender.com`
  - [ ] A record: `@` → Render's IP address
- [ ] Wait for SSL certificate provisioning (up to 24 hours)
- [ ] Test health endpoint: `https://theaisalesexpert.co.uk/health`

### 🔧 Phase 2: n8n Configuration

#### Step 4: Set Up n8n Credentials
- [ ] Google Sheets OAuth2 API credential
- [ ] Twilio API credential
- [ ] SMTP Email credential
- [ ] OpenAI API credential (if using n8n OpenAI node)
- [ ] ElevenLabs HTTP Header Auth credential

#### Step 5: Configure Environment Variables
- [ ] `TWILIO_PHONE_NUMBER`
- [ ] `GOOGLE_SPREADSHEET_ID`
- [ ] `EMAIL_USER`
- [ ] `ELEVENLABS_VOICE_ID`
- [ ] `DEALERSHIP_NAME`
- [ ] `CONTACT_PHONE`
- [ ] `CONTACT_EMAIL`

#### Step 6: Import Workflows
- [ ] Import `ai-cold-calling-main-workflow.json`
- [ ] Import `advanced-ai-conversation-workflow.json`
- [ ] Update all credential references
- [ ] Configure webhook URLs
- [ ] Test workflow execution

### 📞 Phase 3: Twilio Configuration

#### Step 7: Configure Phone Number
- [ ] Go to Twilio Console → Phone Numbers
- [ ] Select your phone number
- [ ] Set Voice URL: `https://theaisalesexpert.co.uk/webhook/twilio/voice`
- [ ] Set Voice Method: POST
- [ ] Set Status Callback URL: `https://theaisalesexpert.co.uk/webhook/twilio/status`
- [ ] Enable status callbacks for: initiated, ringing, answered, completed
- [ ] Save configuration

#### Step 8: Test Twilio Integration
- [ ] Make test call to verify webhook connectivity
- [ ] Check Twilio call logs for errors
- [ ] Verify TwiML response format
- [ ] Test call recording functionality

### 🧪 Phase 4: System Testing

#### Step 9: Component Testing
- [ ] Run `node scripts/test-system.js`
- [ ] Verify all API integrations working
- [ ] Test webhook endpoints individually
- [ ] Check Google Sheets read/write operations
- [ ] Validate email sending functionality

#### Step 10: End-to-End Testing
- [ ] Add test lead to Google Sheets with status "Pending"
- [ ] Verify n8n workflow triggers automatically
- [ ] Monitor call initiation and connection
- [ ] Test AI conversation flow
- [ ] Verify Google Sheets updates in real-time
- [ ] Check email sending for interested prospects
- [ ] Review call logs and recordings

### 📊 Phase 5: Production Readiness

#### Step 11: Performance Optimization
- [ ] Monitor response times
- [ ] Check memory and CPU usage
- [ ] Optimize AI prompts for speed
- [ ] Implement caching where appropriate
- [ ] Set up error monitoring

#### Step 12: Security Hardening
- [ ] Verify all API keys are secure
- [ ] Implement webhook signature verification
- [ ] Enable HTTPS everywhere
- [ ] Set up access logging
- [ ] Configure rate limiting

#### Step 13: Monitoring Setup
- [ ] Set up uptime monitoring
- [ ] Configure error alerting
- [ ] Monitor API usage and costs
- [ ] Track call success rates
- [ ] Set up log aggregation

## Go-Live Checklist

### 🎯 Final Validation
- [ ] All systems tested and working
- [ ] Documentation reviewed and complete
- [ ] Team trained on system operation
- [ ] Emergency procedures documented
- [ ] Backup and recovery plan in place

### 📈 Production Data
- [ ] Import real lead data to Google Sheets
- [ ] Verify phone number formats (E.164)
- [ ] Set appropriate call statuses
- [ ] Configure call scheduling if needed
- [ ] Set up data backup procedures

### 🚨 Launch Monitoring
- [ ] Monitor first 10 calls closely
- [ ] Check for any system errors
- [ ] Verify data accuracy
- [ ] Monitor customer feedback
- [ ] Adjust AI prompts if needed

## Post-Launch Tasks

### Week 1: Initial Monitoring
- [ ] Daily system health checks
- [ ] Review call success rates
- [ ] Monitor API costs
- [ ] Collect user feedback
- [ ] Document any issues

### Week 2-4: Optimization
- [ ] Analyze call performance data
- [ ] Optimize AI conversation flow
- [ ] Adjust voice settings if needed
- [ ] Refine email templates
- [ ] Scale infrastructure if needed

### Monthly: Maintenance
- [ ] Review and rotate API keys
- [ ] Update system documentation
- [ ] Analyze cost optimization opportunities
- [ ] Plan feature enhancements
- [ ] Conduct security review

## Rollback Plan

### If Issues Occur:
1. **Immediate Actions:**
   - [ ] Disable n8n workflows to stop new calls
   - [ ] Check system logs for errors
   - [ ] Verify all services are running

2. **Troubleshooting:**
   - [ ] Use troubleshooting guide
   - [ ] Test individual components
   - [ ] Check recent changes

3. **Emergency Rollback:**
   - [ ] Revert to last working configuration
   - [ ] Restore previous webhook server version
   - [ ] Contact support teams if needed

## Success Criteria

### Technical Metrics:
- [ ] 95%+ uptime
- [ ] <3 second response times
- [ ] 90%+ call connection rate
- [ ] <1% error rate

### Business Metrics:
- [ ] Successful lead follow-up
- [ ] Accurate data collection
- [ ] Positive customer feedback
- [ ] Cost-effective operation

## Support Contacts

### Emergency Contacts:
- **Render.com Support**: support@render.com
- **Twilio Support**: help@twilio.com
- **n8n Community**: community.n8n.io
- **OpenAI Support**: help.openai.com

### Documentation:
- Setup Guide: `docs/setup-guide.md`
- Configuration: `docs/configuration.md`
- Troubleshooting: `docs/troubleshooting.md`
- API Reference: `docs/api-reference.md`

---

**Deployment Team Sign-off:**

- [ ] Technical Lead: _________________ Date: _________
- [ ] QA Lead: _________________ Date: _________
- [ ] Business Owner: _________________ Date: _________

**System is ready for production deployment when all checkboxes are completed and signed off.**
