# 🖥️ Local Development Guide

## Quick Start

### 1. Automated Setup (Recommended)
```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd AI

# Run automated local setup
npm run local-setup

# Copy environment template and configure
cp webhooks/.env.local webhooks/.env
# Edit webhooks/.env with your API keys
```

### 2. Manual Setup

#### Prerequisites Installation

**Windows:**
```powershell
# Install Node.js from https://nodejs.org/
# Install MongoDB Community from https://www.mongodb.com/try/download/community
# Install Redis (optional) - use Docker or Windows Subsystem for Linux

# Using Chocolatey (optional)
choco install nodejs mongodb redis-64

# Using Docker for databases
docker run -d --name mongodb-local -p 27017:27017 mongo:6
docker run -d --name redis-local -p 6379:6379 redis:alpine
```

**macOS:**
```bash
# Using Homebrew
brew install node mongodb/brew/mongodb-community redis

# Start services
brew services start mongodb-community
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Redis
sudo apt-get install redis-server

# Start services
sudo systemctl start mongod
sudo systemctl start redis-server
```

## Configuration

### 1. Environment Variables

Create `webhooks/.env` file:
```bash
# Copy the template
cp webhooks/.env.local webhooks/.env

# Edit with your actual API keys
nano webhooks/.env  # or use your preferred editor
```

### 2. Required API Keys

You'll need to sign up for these services and get API keys:

#### Twilio (Required for calls)
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up for a free account
3. Get your Account SID and Auth Token
4. Buy a phone number (or use trial number)

#### OpenAI (Required for AI conversations)
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account and add billing
3. Generate an API key

#### ElevenLabs (Required for voice synthesis)
1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for an account
3. Get your API key from settings

#### Deepgram (Required for speech recognition)
1. Go to [Deepgram Console](https://console.deepgram.com/)
2. Sign up for an account
3. Create an API key

### 3. Optional Services

#### Google Sheets (Optional)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable Sheets API
3. Create service account credentials
4. Download JSON and save as `config/google-credentials.json`

## Running the Application

### 1. Install Dependencies
```bash
# Install all dependencies
npm run install-deps

# Or manually
cd webhooks && npm install
```

### 2. Test API Connections
```bash
# Test all external APIs
npm run test-local

# This will check:
# - MongoDB connection
# - Redis connection (optional)
# - Twilio API
# - OpenAI API
# - ElevenLabs API
# - Deepgram API
```

### 3. Start Development Server
```bash
# Start with hot reload
npm run dev

# Or start simple test server
npm run local-start
```

### 4. Verify Installation
Visit these URLs in your browser:
- **Health Check**: http://localhost:3000/health
- **Test Endpoint**: http://localhost:3000/test
- **API Status**: http://localhost:3000/api/voice/status

## Testing the System

### 1. Unit Tests
```bash
cd webhooks
npm test
```

### 2. Integration Tests
```bash
cd webhooks
npm run test:integration
```

### 3. Manual Testing

#### Test Voice Services
```bash
# Test TTS (Text-to-Speech)
curl -X POST http://localhost:3000/api/voice/tts \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-1" \
  -d '{"text": "Hello, this is a test"}'

# Test STT (Speech-to-Text) - requires audio file
curl -X POST http://localhost:3000/api/voice/stt \
  -H "X-API-Key: test-api-key-1" \
  -F "audio=@test-audio.wav"
```

#### Test Call Initiation (Mock)
```bash
curl -X POST http://localhost:3000/webhook/call/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "customer_name": "John Doe",
    "phone_number": "+1234567890",
    "car_model": "Toyota Camry 2023",
    "dealership_name": "Test Dealership",
    "bot_name": "Sarah"
  }'
```

#### Test Analytics
```bash
curl -X GET http://localhost:3000/api/analytics/dashboard \
  -H "X-API-Key: test-api-key-1"
```

## Local Development Features

### 1. Hot Reload
The development server automatically restarts when you make changes to the code.

### 2. Debug Logging
Set `LOG_LEVEL=debug` in your `.env` file to see detailed logs.

### 3. Mock Mode
Set `MOCK_EXTERNAL_APIS=true` to use mock responses instead of real API calls.

### 4. Test Data
The system automatically creates test leads and call data for development.

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh --eval "db.runCommand({ping: 1})"

# Start MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Or use Docker
docker run -d --name mongodb-local -p 27017:27017 mongo:6
```

#### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
# Windows: redis-server
# macOS: brew services start redis
# Linux: sudo systemctl start redis-server

# Or use Docker
docker run -d --name redis-local -p 6379:6379 redis:alpine
```

#### API Key Issues
1. Double-check your API keys in the `.env` file
2. Ensure there are no extra spaces or quotes
3. Verify the keys are valid by testing them directly

#### Port Already in Use
```bash
# Find what's using port 3000
# Windows: netstat -ano | findstr :3000
# macOS/Linux: lsof -i :3000

# Kill the process or change the port in .env
PORT=3001
```

### Debug Mode

Enable debug mode for detailed logging:
```bash
# In your .env file
NODE_ENV=development
LOG_LEVEL=debug
DEBUG=*
```

### Performance Monitoring

Monitor your local development:
```bash
# Check system resources
curl http://localhost:3000/api/analytics/realtime

# Check performance metrics
curl http://localhost:3000/api/performance/metrics
```

## Development Workflow

### 1. Making Changes
1. Edit code in your preferred editor
2. Server automatically restarts (if using `npm run dev`)
3. Test your changes at http://localhost:3000

### 2. Testing Changes
```bash
# Run unit tests
npm test

# Run specific test file
npm test -- --testNamePattern="VoiceServices"

# Run with coverage
npm run test:coverage
```

### 3. Database Management
```bash
# View database contents
mongosh ai-calling-system-dev

# Clear test data
db.calls.deleteMany({})
db.leads.deleteMany({})

# Create indexes
db.calls.createIndex({ "startTime": -1 })
db.leads.createIndex({ "phoneNumber": 1 })
```

## IDE Setup

### VS Code Extensions (Recommended)
- **ES6 Mocha Snippets**: For testing
- **MongoDB for VS Code**: Database management
- **REST Client**: API testing
- **GitLens**: Git integration
- **Prettier**: Code formatting
- **ESLint**: Code linting

### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/logs": true
  }
}
```

## Next Steps

Once your local environment is working:

1. **Customize Configuration**: Modify conversation scripts, voice settings, etc.
2. **Add Features**: Implement new functionality using the existing architecture
3. **Test Thoroughly**: Use the comprehensive test suite
4. **Deploy**: Follow the deployment guide when ready for production

## Getting Help

If you encounter issues:

1. Check the logs in `webhooks/logs/`
2. Run the diagnostic script: `npm run test-local`
3. Review the troubleshooting section above
4. Check the main documentation in `docs/`

Happy coding! 🚀
