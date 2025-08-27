#!/usr/bin/env node

// Render.com Deployment Helper Script
// Helps prepare and deploy the AI calling system to Render

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class RenderDeployment {
  constructor() {
    this.config = {
      serviceName: 'ai-calling-system',
      region: 'oregon',
      plan: 'starter',
      nodeVersion: '18',
      rootDirectory: 'webhooks'
    };
  }

  async run() {
    console.log('🚀 Render.com Deployment Helper');
    console.log('===============================\n');

    try {
      await this.checkPrerequisites();
      await this.prepareForDeployment();
      await this.generateEnvironmentTemplate();
      await this.createRenderConfig();
      await this.showDeploymentInstructions();
      
      console.log('\n✅ Deployment preparation completed!');
      
    } catch (error) {
      console.error('\n❌ Deployment preparation failed:', error.message);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...\n');

    // Check if git repository exists
    try {
      execSync('git status', { stdio: 'pipe' });
      console.log('✅ Git repository found');
    } catch (error) {
      throw new Error('Git repository not found. Initialize with: git init');
    }

    // Check if webhooks directory exists
    if (!fs.existsSync('webhooks')) {
      throw new Error('webhooks directory not found');
    }
    console.log('✅ Webhooks directory found');

    // Check package.json in webhooks
    const packageJsonPath = path.join('webhooks', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found in webhooks directory');
    }
    console.log('✅ package.json found');

    // Check main server file
    const serverFiles = ['twilio-voice-handler.js', 'server.js', 'app.js', 'index.js'];
    const serverFile = serverFiles.find(file => 
      fs.existsSync(path.join('webhooks', file))
    );
    
    if (!serverFile) {
      throw new Error('Main server file not found in webhooks directory');
    }
    console.log(`✅ Main server file found: ${serverFile}`);

    console.log('\n');
  }

  async prepareForDeployment() {
    console.log('📦 Preparing for deployment...\n');

    // Update package.json for Render
    const packageJsonPath = path.join('webhooks', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Ensure required scripts
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    packageJson.scripts.start = packageJson.scripts.start || 'node twilio-voice-handler.js';
    packageJson.scripts.build = packageJson.scripts.build || 'echo "No build step required"';

    // Set Node.js version
    if (!packageJson.engines) {
      packageJson.engines = {};
    }
    packageJson.engines.node = '18.x';

    // Write updated package.json
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Updated package.json for Render');

    // Create .gitignore if it doesn't exist
    const gitignorePath = '.gitignore';
    if (!fs.existsSync(gitignorePath)) {
      const gitignoreContent = `
# Dependencies
node_modules/
npm-debug.log*

# Environment variables
.env
.env.local
.env.production

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed

# Coverage directory used by tools like istanbul
coverage/

# Temporary folders
tmp/
temp/

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE files
.vscode/
.idea/
*.swp
*.swo

# Audio files (if large)
audio/*.mp3
audio/*.wav

# Uploads
uploads/*
!uploads/.gitkeep
`.trim();

      fs.writeFileSync(gitignorePath, gitignoreContent);
      console.log('✅ Created .gitignore file');
    }

    console.log('\n');
  }

  async generateEnvironmentTemplate() {
    console.log('⚙️  Generating environment template...\n');

    const envTemplate = `# Render.com Environment Variables Template
# Copy these to your Render service environment variables

# Server Configuration
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
LOG_LEVEL=info

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-calling-system
REDIS_URL=redis://red-xxxxx:6379

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# AI Services
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=200
OPENAI_TEMPERATURE=0.7

ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL
ELEVENLABS_MODEL=eleven_monolingual_v1

DEEPGRAM_API_KEY=your_deepgram_api_key
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US

# n8n Integration
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook
N8N_API_KEY=your_n8n_api_key
N8N_BASE_URL=https://your-n8n-instance.app.n8n.cloud

# Domain and URLs (Update after deployment)
DOMAIN=your-app-name.onrender.com
WEBHOOK_BASE_URL=https://your-app-name.onrender.com

# Business Configuration
DEALERSHIP_NAME=Your Dealership Name
BOT_NAME=Sarah
DEFAULT_REP_NAME=Sarah from Your Dealership
TIMEZONE=America/New_York
BUSINESS_HOURS_START=09:00
BUSINESS_HOURS_END=17:00

# Security Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-for-production
JWT_EXPIRE=30d
API_KEYS=prod-api-key-1,prod-api-key-2,prod-api-key-3

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
CORS_ORIGINS=https://your-app-name.onrender.com

# Performance Configuration
CACHE_ENABLED=true
CACHE_TTL=3600
COMPRESSION_ENABLED=true
REQUEST_TIMEOUT=30000

# Call Configuration
MAX_CALL_DURATION=300
SPEECH_TIMEOUT=3
GATHER_TIMEOUT=10
RECORD_CALLS=false
`;

    fs.writeFileSync('render-env-template.txt', envTemplate);
    console.log('✅ Created render-env-template.txt');
    console.log('   📝 Use this template to set environment variables in Render');

    console.log('\n');
  }

  async createRenderConfig() {
    console.log('🔧 Creating Render configuration...\n');

    const renderConfig = {
      services: [
        {
          type: 'web',
          name: this.config.serviceName,
          env: 'node',
          region: this.config.region,
          plan: this.config.plan,
          buildCommand: 'cd webhooks && npm install',
          startCommand: 'cd webhooks && npm start',
          healthCheckPath: '/health',
          envVars: [
            {
              key: 'NODE_ENV',
              value: 'production'
            },
            {
              key: 'PORT',
              value: '10000'
            }
          ]
        }
      ]
    };

    fs.writeFileSync('render.yaml', `# Render.com Configuration
# This file can be used for Infrastructure as Code deployment

${JSON.stringify(renderConfig, null, 2)}
`);

    console.log('✅ Created render.yaml configuration');
    console.log('\n');
  }

  async showDeploymentInstructions() {
    console.log('📋 Deployment Instructions');
    console.log('==========================\n');

    console.log('🔗 **Step 1: Push to GitHub**');
    console.log('```bash');
    console.log('git add .');
    console.log('git commit -m "Prepare for Render deployment"');
    console.log('git push origin main');
    console.log('```\n');

    console.log('🌐 **Step 2: Create Render Web Service**');
    console.log('1. Go to https://dashboard.render.com');
    console.log('2. Click "New +" → "Web Service"');
    console.log('3. Connect your GitHub repository');
    console.log('4. Configure:');
    console.log(`   - Name: ${this.config.serviceName}`);
    console.log('   - Environment: Node');
    console.log(`   - Region: ${this.config.region}`);
    console.log('   - Branch: main');
    console.log(`   - Root Directory: ${this.config.rootDirectory}`);
    console.log('   - Build Command: npm install');
    console.log('   - Start Command: npm start\n');

    console.log('🗄️  **Step 3: Set up Database**');
    console.log('Option A - MongoDB Atlas (Recommended):');
    console.log('1. Go to https://www.mongodb.com/atlas');
    console.log('2. Create free cluster');
    console.log('3. Get connection string');
    console.log('4. Add to Render environment variables\n');
    
    console.log('Option B - Render PostgreSQL:');
    console.log('1. In Render: "New +" → "PostgreSQL"');
    console.log('2. Copy connection string to environment variables\n');

    console.log('🔴 **Step 4: Create Redis (Optional)**');
    console.log('1. In Render: "New +" → "Redis"');
    console.log('2. Copy Redis URL to environment variables\n');

    console.log('⚙️  **Step 5: Configure Environment Variables**');
    console.log('1. In your Render Web Service → Environment');
    console.log('2. Copy variables from render-env-template.txt');
    console.log('3. Replace placeholder values with real API keys\n');

    console.log('🔗 **Step 6: Update Webhook URLs**');
    console.log('After deployment, update:');
    console.log('1. Twilio webhook URLs');
    console.log('2. n8n workflow URLs');
    console.log('3. Any other external service webhooks\n');

    console.log('🧪 **Step 7: Test Deployment**');
    console.log('```bash');
    console.log('curl https://your-app-name.onrender.com/health');
    console.log('curl https://your-app-name.onrender.com/api/n8n/test');
    console.log('```\n');

    console.log('📁 **Files Created:**');
    console.log('- render-env-template.txt (Environment variables)');
    console.log('- render.yaml (Infrastructure config)');
    console.log('- Updated package.json (Render-ready)');
    console.log('- .gitignore (if missing)\n');

    console.log('🎯 **Next Steps:**');
    console.log('1. Commit and push changes to GitHub');
    console.log('2. Create Render services as described above');
    console.log('3. Configure environment variables');
    console.log('4. Deploy and test');
    console.log('5. Update external webhook URLs\n');

    console.log('📚 **Documentation:**');
    console.log('- Full guide: docs/render-deployment.md');
    console.log('- Render docs: https://render.com/docs');
    console.log('- Support: https://render.com/support\n');
  }

  async prompt(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }
}

// Run deployment helper if called directly
if (require.main === module) {
  const deployment = new RenderDeployment();
  deployment.run().catch(console.error);
}

module.exports = RenderDeployment;
