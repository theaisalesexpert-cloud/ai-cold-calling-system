# Complete Setup Checklist

Follow this checklist to ensure your AI Cold-Calling System is properly configured.

## 📋 Pre-Setup Requirements

### Accounts & Services
- [ ] **Twilio Account** - [Sign up here](https://www.twilio.com)
  - [ ] Phone number purchased with Voice capabilities
  - [ ] Account SID and Auth Token obtained
- [ ] **OpenAI Account** - [Sign up here](https://platform.openai.com)
  - [ ] API key created
  - [ ] Payment method added
  - [ ] Usage limits configured
- [ ] **Google Cloud Account** - [Sign up here](https://console.cloud.google.com)
  - [ ] Project created
  - [ ] Google Sheets API enabled
  - [ ] Service account created with JSON key
- [ ] **Gmail Account** - For sending follow-up emails
  - [ ] 2-factor authentication enabled
  - [ ] App password generated
- [ ] **n8n Cloud Account** - [Sign up here](https://n8n.cloud)
  - [ ] Workspace created
- [ ] **Deployment Platform** - Choose one:
  - [ ] Render.com account (recommended)
  - [ ] Railway account
  - [ ] Heroku account
  - [ ] DigitalOcean account

### Development Environment
- [ ] **Node.js 18+** installed
- [ ] **Git** installed
- [ ] **Code editor** (VS Code recommended)
- [ ] **Terminal/Command line** access

## 🚀 Setup Steps

### 1. Repository Setup
- [ ] Clone the repository
  ```bash
  git clone https://github.com/yourusername/ai-cold-calling-system.git
  cd ai-cold-calling-system
  ```
- [ ] Install dependencies
  ```bash
  cd backend
  npm install
  ```
- [ ] Copy environment template
  ```bash
  cp .env.example .env
  ```

### 2. Google Sheets Configuration
- [ ] Create new Google Sheet named "AI Cold Calling - Customer Database"
- [ ] Add column headers in row 1:
  - A: ID, B: Name, C: Phone, D: Email, E: Car Model
  - F: Status, G: Enquiry Date, H: Last Call Date, I: Call Result
  - J: Appointment Date, K: Notes, L: Call Duration, M: Sentiment
- [ ] Add sample customer data (at least 2-3 rows)
- [ ] Share sheet with service account email (Editor permissions)
- [ ] Copy Sheet ID from URL
- [ ] Test sheet access with service account

### 3. Environment Variables Configuration
Edit your `.env` file with all required variables:

#### Server Configuration
- [ ] `PORT=10000`
- [ ] `NODE_ENV=production`
- [ ] `BASE_URL=https://your-app-name.onrender.com`

#### Twilio Configuration
- [ ] `TWILIO_ACCOUNT_SID=your_account_sid`
- [ ] `TWILIO_AUTH_TOKEN=your_auth_token`
- [ ] `TWILIO_PHONE_NUMBER=+1234567890`
- [ ] `TWILIO_WEBHOOK_URL=https://your-app-name.onrender.com`

#### OpenAI Configuration
- [ ] `OPENAI_API_KEY=sk-your_api_key`
- [ ] `OPENAI_MODEL=gpt-4-turbo-preview`
- [ ] `OPENAI_MAX_TOKENS=150`
- [ ] `OPENAI_TEMPERATURE=0.7`

#### Google Services Configuration
- [ ] `GOOGLE_SHEETS_ID=your_sheet_id`
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@project.iam.gserviceaccount.com`
- [ ] `GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key\n-----END PRIVATE KEY-----"`
- [ ] `GOOGLE_PROJECT_ID=your_project_id`

#### Gmail Configuration
- [ ] `GMAIL_USER=your-email@gmail.com`
- [ ] `GMAIL_APP_PASSWORD=your_16_char_password`

#### Security Configuration
- [ ] `JWT_SECRET=your_jwt_secret`
- [ ] `API_KEY=your_api_key`

### 4. Local Testing
- [ ] Start the development server
  ```bash
  npm run dev
  ```
- [ ] Test health endpoint
  ```bash
  curl http://localhost:3000/health
  ```
- [ ] Test detailed health check
  ```bash
  curl http://localhost:3000/health/detailed
  ```
- [ ] Verify all services show "healthy" status
- [ ] Test Google Sheets connection
  ```bash
  curl http://localhost:3000/api/sheets/test
  ```

### 5. Deployment
Choose your deployment platform:

#### Render.com (Recommended)
- [ ] Push code to GitHub
- [ ] Connect Render to GitHub repository
- [ ] Create Web Service from your repository
- [ ] Add all environment variables in Render dashboard
- [ ] Deploy and get app URL
- [ ] Test deployed health endpoint

#### Alternative Platforms
- [ ] Configure deployment for chosen platform
- [ ] Set environment variables
- [ ] Deploy application
- [ ] Verify deployment success

### 6. Twilio Webhook Configuration
- [ ] Go to Twilio Console > Phone Numbers > Active numbers
- [ ] Click on your phone number
- [ ] Set webhook URL: `https://your-app-name.onrender.com/webhook/twilio/voice`
- [ ] Set HTTP method: POST
- [ ] Save configuration
- [ ] Test webhook endpoint
  ```bash
  curl https://your-app-name.onrender.com/webhook/twilio/test
  ```

### 7. n8n Workflow Setup
- [ ] Open n8n Cloud workspace
- [ ] Import workflow from `n8n-workflows/ai-calling-workflow.json`
- [ ] Configure credentials:
  - [ ] HTTP Header Auth (API Key)
  - [ ] Google Service Account
  - [ ] Gmail SMTP
- [ ] Update all webhook URLs to point to your deployed app
- [ ] Test workflow nodes individually
- [ ] Activate the workflow

### 8. System Testing
- [ ] Test manual call initiation
  ```bash
  curl -X POST https://your-app.railway.app/api/calls/test \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer your_api_key" \
    -d '{"phoneNumber": "+1234567890"}'
  ```
- [ ] Verify call connects and AI responds
- [ ] Check Google Sheets updates after call
- [ ] Test email sending functionality
- [ ] Trigger n8n workflow manually
- [ ] Verify end-to-end workflow

## ✅ Final Verification

### Health Checks
- [ ] All services show "healthy" in detailed health check
- [ ] Google Sheets connection successful
- [ ] Email service configured correctly
- [ ] Twilio webhooks responding
- [ ] n8n workflow active and functional

### Functionality Tests
- [ ] Manual call initiation works
- [ ] AI conversation flows properly
- [ ] Customer data updates in real-time
- [ ] Follow-up emails sent correctly
- [ ] Scheduled calls trigger via n8n

### Monitoring Setup
- [ ] Health check endpoints accessible
- [ ] Application logs available
- [ ] Error tracking configured (optional)
- [ ] Performance monitoring setup (optional)

## 🔧 Customization Checklist

### Business Configuration
- [ ] Update dealership name in conversation scripts
- [ ] Customize conversation flow for your needs
- [ ] Modify email templates with your branding
- [ ] Set appropriate call scheduling times
- [ ] Configure rate limiting for your volume

### Advanced Features (Optional)
- [ ] Add database for persistent storage
- [ ] Implement Redis for session management
- [ ] Set up SSL certificates for custom domain
- [ ] Configure load balancing for high volume
- [ ] Add analytics and reporting features

## 🚨 Troubleshooting Checklist

If something isn't working:

### Common Issues
- [ ] Check all environment variables are set correctly
- [ ] Verify API keys are valid and have sufficient credits
- [ ] Ensure service account has proper permissions
- [ ] Confirm webhook URLs are accessible
- [ ] Check application logs for errors

### Service-Specific Issues
- [ ] **Twilio**: Verify phone number and webhook configuration
- [ ] **OpenAI**: Check API key and usage limits
- [ ] **Google Sheets**: Confirm service account permissions
- [ ] **Gmail**: Verify app password and 2FA settings
- [ ] **n8n**: Check workflow activation and credentials

### Testing Commands
```bash
# Test individual services
curl https://your-app.railway.app/health/detailed
curl https://your-app.railway.app/api/sheets/test
curl https://your-app.railway.app/webhook/twilio/test

# Check logs
railway logs --tail  # or your platform's log command
```

## 📞 Support Resources

- **Documentation**: Check `/docs/` folder for detailed guides
- **API Reference**: `/docs/api-documentation.md`
- **Troubleshooting**: `/docs/troubleshooting.md`
- **Quick Start**: `/docs/quick-start.md`

## 🎉 Success Criteria

Your system is ready when:
- [ ] Health checks return all green
- [ ] Test calls connect and AI responds naturally
- [ ] Google Sheets update in real-time
- [ ] Follow-up emails are sent automatically
- [ ] n8n workflow runs scheduled calls
- [ ] All monitoring endpoints are functional

**Congratulations! Your AI Cold-Calling System is now live and ready to help you connect with customers automatically.**
