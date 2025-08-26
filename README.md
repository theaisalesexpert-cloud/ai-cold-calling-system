# 🚀 Enhanced AI Cold-Calling System for Car Dealership

A comprehensive, enterprise-grade AI calling system that automates lead follow-ups with advanced conversation intelligence, real-time analytics, and complete compliance management.

## ✨ Enhanced Features

### 🤖 Advanced AI Capabilities
- **Context-Aware Conversations** - Dynamic conversation management with sentiment analysis
- **Real-Time Voice Processing** - ElevenLabs TTS with voice cloning and emotion detection
- **Intelligent Speech Recognition** - Deepgram STT with confidence scoring and intent classification
- **Adaptive Response Generation** - OpenAI GPT-4 with conversation state management

### 📊 Business Intelligence & Analytics
- **Real-Time Dashboard** - Comprehensive call analytics and performance metrics
- **Lead Scoring & Qualification** - Automated lead prioritization and conversion tracking
- **Sentiment Analysis** - Customer emotion tracking throughout conversations
- **Performance Optimization** - AI response time monitoring and quality metrics

### 🔒 Security & Compliance
- **GDPR Compliance** - Complete data protection and consent management
- **Call Recording Consent** - Automated consent verification and recording controls
- **Data Encryption** - End-to-end encryption for sensitive customer data
- **Audit Logging** - Comprehensive security event tracking

### 🏗️ Enterprise Architecture
- **Scalable Database Layer** - MongoDB with advanced analytics and reporting
- **Microservices Design** - Modular architecture with independent service scaling
- **Comprehensive Testing** - Unit, integration, and end-to-end test coverage
- **Production Monitoring** - Real-time system health and performance tracking

## Architecture

```
Google Sheets → n8n Workflow → Twilio Voice → AI Conversation → Results Update
                    ↓
            Email Automation (when needed)
```

## Services Used

- **n8n**: Workflow automation platform
- **Twilio Voice**: Phone calling service
- **OpenAI GPT**: Conversational AI
- **ElevenLabs**: Text-to-speech
- **Deepgram**: Speech-to-text
- **Google Sheets**: Lead data storage
- **Render.com**: Hosting platform

## Project Structure

```
/
├── n8n-workflows/          # n8n workflow JSON files
├── webhooks/              # Webhook handlers
├── config/                # Configuration files
├── scripts/               # Utility scripts
├── docs/                  # Documentation
└── tests/                 # Test files
```

## 🚀 Quick Start

### Option 1: Setup Wizard (Recommended)
```bash
npm install
npm run setup
```

### Option 2: Manual Setup
1. Copy `.env.example` to `.env` and fill in your credentials
2. Set up Google Sheets using template in `config/`
3. Deploy webhook server to Render.com
4. Import n8n workflow from `n8n-workflows/`
5. Configure Twilio webhooks
6. Test with sample leads

### Validate Setup
```bash
npm test
```

## 📚 Documentation

- **[Complete Setup Guide](docs/setup-guide.md)** - Detailed step-by-step instructions
- **[Deployment Checklist](docs/deployment-checklist.md)** - Pre and post-deployment tasks
- **[Google Sheets Setup](docs/google-sheets-setup.md)** - Sheet configuration guide
- **[Deploy to Render.com](scripts/deploy-to-render.md)** - Hosting deployment guide

## 🎯 Features in Detail

### AI Conversation Flow
- Natural greeting with customer name and car model
- Confirms interest in original vehicle
- Offers appointment scheduling
- Suggests similar alternatives if not interested
- Collects email for follow-up materials
- Graceful call endings

### Real-time Data Updates
- Updates Google Sheets during calls
- Tracks call attempts and outcomes
- Records conversation summaries
- Manages appointment scheduling
- Handles email automation triggers

### Voice Quality
- Human-like voice synthesis with ElevenLabs
- Accurate speech recognition with Deepgram
- Natural conversation pacing
- Professional dealership tone
