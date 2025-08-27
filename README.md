# 🤖 AI Cold-Calling System

**The Complete Automated AI Cold-Calling Solution for Car Dealerships**

Transform your car sales process with AI-powered cold calling that sounds human, adapts to customer responses, and automatically manages your entire sales pipeline.

## ✨ What This System Does

🎯 **Automatically calls potential car buyers** who previously enquired about vehicles
🗣️ **Conducts natural, human-like conversations** using advanced AI
📊 **Updates Google Sheets in real-time** with call results and customer data
📧 **Sends personalized follow-up emails** with similar car options
📅 **Schedules appointments** for interested customers
🔄 **Runs completely automated** through n8n workflows

## 🎬 How It Works

1. **📋 Reads customer data** from your Google Sheet
2. **📞 Initiates AI-powered calls** using Twilio Voice
3. **🤖 Conducts intelligent conversations** following your script
4. **📝 Updates results instantly** in Google Sheets
5. **📧 Sends follow-up emails** to interested customers
6. **🔁 Repeats daily** for maximum coverage

## 🚀 Key Features

### 🎙️ Advanced AI Conversations
- **Natural speech recognition** with Deepgram
- **Human-like responses** powered by OpenAI GPT-4
- **Adaptive conversation flow** that handles various customer responses
- **Sentiment analysis** to gauge customer interest

### 📊 Real-Time Data Management
- **Google Sheets integration** for live customer data
- **Automatic status updates** after each call
- **Call recording and transcription** storage
- **Performance analytics** and reporting

### 📧 Automated Follow-Up
- **Personalized email templates** for interested customers
- **Similar car recommendations** based on original enquiry
- **Appointment confirmation emails** with calendar integration
- **Professional branding** and customizable templates

### 🔄 Workflow Automation
- **n8n visual workflows** for easy management
- **Scheduled daily calling** campaigns
- **Bulk call processing** with smart delays
- **Error handling and retry logic**

## 📋 Prerequisites

### Required Accounts & API Keys

1. **n8n Cloud Account** - [Sign up here](https://n8n.cloud)
2. **Twilio Account** - [Sign up here](https://www.twilio.com)
3. **OpenAI API Key** - [Get API key](https://platform.openai.com/api-keys)
4. **Google Cloud Account** - For Sheets API and Gmail
5. **Hosting Service** - Railway (recommended), Heroku, or VPS

### Required Software

- Node.js 18+
- npm or yarn
- Git

## 🏗️ Project Structure

```
ai-cold-calling-system/
├── backend/                 # Node.js Express server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── services/        # Business logic
│   │   ├── utils/          # Helper functions
│   │   └── config/         # Configuration files
│   ├── package.json
│   └── .env.example
├── n8n-workflows/          # n8n workflow JSON files
├── google-sheets/          # Sheets templates and setup
├── docs/                   # Documentation and guides
└── deployment/             # Deployment configurations
```

## ⚡ Quick Start (30 Minutes)

### 🎯 Option 1: One-Click Deploy

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/ai-cold-calling-system)

### 🛠️ Option 2: Manual Setup

#### 1. Clone and Install
```bash
git clone https://github.com/yourusername/ai-cold-calling-system.git
cd ai-cold-calling-system/backend
npm install
cp .env.example .env
```

#### 2. Configure Environment
Edit `.env` with your API keys (see [Setup Checklist](SETUP_CHECKLIST.md)):
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
OPENAI_API_KEY=sk-your_api_key
GOOGLE_SHEETS_ID=your_sheet_id
# ... and more
```

#### 3. Deploy to Render
```bash
# Push to GitHub first
git add . && git commit -m "Initial setup" && git push

# Deploy to Render (via dashboard)
# 1. Go to render.com and connect GitHub
# 2. Create new Web Service from your repo
# 3. Add environment variables
# 4. Deploy automatically
```

#### 4. Setup Google Sheets
1. Create sheet with customer data
2. Share with service account
3. Test connection: `curl https://your-app-name.onrender.com/api/sheets/test`

#### 5. Configure Twilio Webhooks
1. Set webhook URL: `https://your-app-name.onrender.com/webhook/twilio/voice`
2. Test: `curl https://your-app-name.onrender.com/webhook/twilio/test`

#### 6. Import n8n Workflow
1. Import `n8n-workflows/ai-calling-workflow.json`
2. Configure credentials and URLs
3. Activate workflow

## 🎯 Live Demo & Testing

### Test Your System
```bash
# Health check
curl https://your-app-name.onrender.com/health/detailed

# Test call (replace with your number)
curl -X POST https://your-app-name.onrender.com/api/calls/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_api_key" \
  -d '{"phoneNumber": "+1234567890"}'
```

### Monitor Performance
- **📊 Dashboard**: `https://your-app-name.onrender.com/health/metrics`
- **📞 Call Stats**: `https://your-app-name.onrender.com/api/calls/statistics`
- **📋 Customer Data**: `https://your-app-name.onrender.com/api/sheets/customers`

## 🗣️ Conversation Flow

Your AI follows this proven car dealership script:

```
1. 👋 GREETING
   "Hi, is this [Customer]? This is Sarah from [Dealership].
    You recently enquired about the [Car Model] - is now a good time?"

2. ❓ INTEREST CHECK
   "Are you still interested in the [Car Model]?"

3. 📅 APPOINTMENT (if interested)
   "Great! Would you like to schedule a test drive?"

4. 🚗 ALTERNATIVES (if not interested)
   "Would you like to hear about similar cars we have?"

5. 📧 EMAIL COLLECTION
   "What's the best email to send those options to?"

6. 💾 DATA UPDATE
   Results automatically saved to Google Sheets
```

## 📚 Documentation

### 🚀 Getting Started
- **[📋 Setup Checklist](SETUP_CHECKLIST.md)** - Complete setup guide
- **[⚡ Quick Start](docs/quick-start.md)** - 30-minute setup
- **[🔧 Environment Setup](docs/environment-setup.md)** - Detailed configuration

### 🔧 Technical Guides
- **[🚀 Render Deployment](docs/render-deployment.md)** - Render.com deployment guide
- **[📖 API Documentation](docs/api-documentation.md)** - Complete API reference
- **[🛠️ Troubleshooting](docs/troubleshooting.md)** - Common issues & solutions

## 🛠️ Development & Customization

### Local Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Check code quality
npm run lint
```

### Customize for Your Business
```javascript
// Modify conversation script in src/services/openaiService.js
buildSystemPrompt(customerData) {
  return `You are a friendly representative from ${customerData.dealershipName}...`;
}

// Update email templates in src/services/emailService.js
generateSimilarCarsEmailHTML(customerName, originalCarModel) {
  return `<h1>Your Custom Dealership</h1>...`;
}
```

## 📊 System Architecture

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│   n8n Cloud │───▶│ Node.js API  │───▶│ Twilio Voice│
│  Workflows  │    │   Backend    │    │   Calls     │
└─────────────┘    └──────────────┘    └─────────────┘
                           │
                           ▼
                   ┌──────────────┐    ┌─────────────┐
                   │ Google Sheets│───▶│ Gmail SMTP  │
                   │   Database   │    │   Emails    │
                   └──────────────┘    └─────────────┘
```

## 🔒 Security & Compliance

- **🔐 API Key Authentication** for all endpoints
- **🛡️ Rate limiting** to prevent abuse
- **🔒 HTTPS encryption** for all communications
- **📝 Call recording** with consent (configurable)
- **🗃️ Data privacy** compliant with GDPR/CCPA

## 📈 Performance & Scaling

### Current Capacity
- **📞 Concurrent calls**: 10+ simultaneous conversations
- **📊 Data processing**: 1000+ customers in Google Sheets
- **⚡ Response time**: <2 seconds for API calls
- **🔄 Throughput**: 100+ calls per hour

### Scaling Options
- **🚀 Horizontal scaling** with load balancers
- **💾 Database upgrade** from Sheets to PostgreSQL
- **📦 Redis caching** for improved performance
- **☁️ Multi-region deployment** for global reach

## 🤝 Support & Community

### 📞 Getting Help
1. **📋 Check the [Setup Checklist](SETUP_CHECKLIST.md)**
2. **🛠️ Review [Troubleshooting Guide](docs/troubleshooting.md)**
3. **📖 Read [API Documentation](docs/api-documentation.md)**
4. **🐛 Create GitHub Issue** for bugs
5. **💬 Join our Discord** for community support

### 🔗 Useful Links
- **🛠️ Render Troubleshooting**: [Quick fixes for deployment issues](docs/render-troubleshooting.md)
- **📋 Setup Checklist**: [Complete setup guide](SETUP_CHECKLIST.md)
- **🔧 n8n Setup**: [Configure workflows with Set nodes](docs/n8n-setup-guide.md)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Star this repo if it helped you!**

Made with ❤️ for car dealerships worldwide

[🚀 Deploy Now](https://render.com/deploy?repo=https://github.com/yourusername/ai-cold-calling-system) • [📖 Documentation](docs/) • [🐛 Report Bug](https://github.com/yourusername/ai-cold-calling-system/issues)

</div>
