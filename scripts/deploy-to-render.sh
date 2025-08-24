#!/bin/bash

# AI Cold Calling System - Render.com Deployment Script
# This script helps deploy the webhook server to Render.com

echo "🚀 AI Cold Calling System - Render.com Deployment"
echo "=================================================="

# Check if required files exist
if [ ! -f "webhook-server/package.json" ]; then
    echo "❌ Error: webhook-server/package.json not found"
    exit 1
fi

if [ ! -f "webhook-server/server.js" ]; then
    echo "❌ Error: webhook-server/server.js not found"
    exit 1
fi

# Check if .env file exists
if [ ! -f "webhook-server/.env" ]; then
    echo "⚠️  Warning: .env file not found in webhook-server/"
    echo "Please create .env file with your credentials before deploying"
    echo "Use webhook-server/.env.example as a template"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📋 Pre-deployment Checklist:"
echo "=============================="
echo "✅ webhook-server/package.json exists"
echo "✅ webhook-server/server.js exists"

if [ -f "webhook-server/.env" ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file missing"
fi

echo ""
echo "🔧 Required Environment Variables for Render.com:"
echo "================================================="
echo "TWILIO_ACCOUNT_SID=your_twilio_account_sid"
echo "TWILIO_AUTH_TOKEN=your_twilio_auth_token"
echo "TWILIO_PHONE_NUMBER=your_twilio_phone_number"
echo "OPENAI_API_KEY=your_openai_api_key"
echo "ELEVENLABS_API_KEY=your_elevenlabs_api_key"
echo "ELEVENLABS_VOICE_ID=your_preferred_voice_id"
echo "DEEPGRAM_API_KEY=your_deepgram_api_key"
echo "GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account_email"
echo "GOOGLE_PRIVATE_KEY=your_private_key"
echo "GOOGLE_SPREADSHEET_ID=your_google_sheets_id"
echo "GOOGLE_SHEET_NAME=Leads"
echo "EMAIL_SERVICE=gmail"
echo "EMAIL_USER=your_email@gmail.com"
echo "EMAIL_PASSWORD=your_app_password"
echo "N8N_WEBHOOK_URL=https://your_n8n_instance.app.n8n.cloud/webhook"
echo "WEBHOOK_BASE_URL=https://theaisalesexpert.co.uk"
echo "PORT=3000"
echo "NODE_ENV=production"
echo "LOG_LEVEL=info"

echo ""
echo "📝 Render.com Deployment Instructions:"
echo "======================================"
echo "1. Push your code to GitHub repository"
echo "2. Log into Render.com dashboard"
echo "3. Create new 'Web Service'"
echo "4. Connect your GitHub repository"
echo "5. Configure service settings:"
echo "   - Name: ai-cold-calling-webhook"
echo "   - Environment: Node"
echo "   - Build Command: npm install"
echo "   - Start Command: npm start"
echo "   - Instance Type: Starter"
echo "6. Add all environment variables listed above"
echo "7. Deploy the service"
echo "8. Configure custom domain: theaisalesexpert.co.uk"

echo ""
echo "🌐 Domain Configuration:"
echo "======================="
echo "In your Squarespace DNS settings, add:"
echo "- CNAME record: www → your-service.onrender.com"
echo "- A record: @ → Render's IP address"

echo ""
echo "🧪 Testing Your Deployment:"
echo "=========================="
echo "1. Test health endpoint: https://theaisalesexpert.co.uk/health"
echo "2. Check webhook endpoints are accessible"
echo "3. Verify Twilio webhook configuration"
echo "4. Test with sample call"

echo ""
echo "✅ Deployment script completed!"
echo "Follow the instructions above to deploy to Render.com"
