# AI Cold-Calling Workflow for Car Dealership

## Overview
Fully automated AI calling system that reads leads from Google Sheets, makes natural phone calls using Twilio Voice, and updates results in real-time.

## Architecture
- **n8n Cloud**: Workflow orchestration
- **Twilio Voice**: Phone call handling
- **OpenAI GPT**: Conversation intelligence
- **ElevenLabs**: Text-to-speech synthesis
- **Deepgram**: Speech-to-text transcription
- **Google Sheets**: Lead management
- **Render.com**: Webhook hosting
- **Domain**: theaisalesexpert.co.uk

## Features
- ✅ Automated cold calling from Google Sheets
- ✅ Natural AI conversations with branching logic
- ✅ Real-time Google Sheets updates
- ✅ Automatic email sending for prospects
- ✅ Professional voice synthesis
- ✅ Call recording and transcription

## Project Structure
```
/
├── n8n-workflows/          # n8n workflow JSON files
├── webhook-server/         # Render.com webhook handlers
├── config/                 # Configuration files
├── docs/                   # Documentation
├── scripts/               # Utility scripts
└── tests/                 # Test files
```

## Quick Start
1. Configure all API credentials in n8n
2. Set up Google Sheets with required columns
3. Deploy webhook server to Render.com
4. Import n8n workflows
5. Test with sample leads

## Documentation
- [Setup Guide](docs/setup-guide.md)
- [Configuration](docs/configuration.md)
- [API Reference](docs/api-reference.md)
- [Troubleshooting](docs/troubleshooting.md)

## Support
For technical support, refer to the documentation or contact the development team.
