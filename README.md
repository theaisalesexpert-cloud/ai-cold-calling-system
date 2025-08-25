# AI Cold-Calling System for Car Dealership

A fully automated AI calling system that reads leads from Google Sheets, makes conversational phone calls using Twilio Voice, and updates results in real-time.

## Features

- 🤖 AI-powered conversational calling using OpenAI GPT
- 📞 Natural voice synthesis with ElevenLabs
- 🎤 Speech-to-text with Deepgram
- 📊 Real-time Google Sheets integration
- 📧 Automated email follow-ups
- 🔄 Complete n8n workflow automation

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
