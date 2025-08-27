#!/usr/bin/env node

// Local Development Setup Script
// Automates the setup process for local development

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class LocalSetup {
  constructor() {
    this.config = {};
    this.rootDir = path.join(__dirname, '..');
    this.webhooksDir = path.join(this.rootDir, 'webhooks');
  }

  async run() {
    console.log('🚀 AI Cold Calling System - Local Setup');
    console.log('=====================================\n');

    try {
      await this.checkPrerequisites();
      await this.setupEnvironment();
      await this.installDependencies();
      await this.setupDatabase();
      await this.createTestData();
      await this.startServices();
      
      console.log('\n✅ Local setup completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Get your API keys from the respective services');
      console.log('2. Update the .env file with your actual API keys');
      console.log('3. Run: npm run dev');
      console.log('4. Visit: http://localhost:3000/health');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...\n');

    const requirements = [
      { name: 'Node.js', command: 'node --version', minVersion: '16.0.0' },
      { name: 'npm', command: 'npm --version', minVersion: '8.0.0' },
      { name: 'MongoDB', command: 'mongod --version', optional: true },
      { name: 'Redis', command: 'redis-server --version', optional: true }
    ];

    for (const req of requirements) {
      try {
        const output = execSync(req.command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${req.name}: ${output.trim().split('\n')[0]}`);
      } catch (error) {
        if (req.optional) {
          console.log(`⚠️  ${req.name}: Not installed (optional)`);
        } else {
          throw new Error(`${req.name} is required but not installed`);
        }
      }
    }

    console.log('\n');
  }

  async setupEnvironment() {
    console.log('⚙️  Setting up environment...\n');

    const envLocalPath = path.join(this.webhooksDir, '.env.local');
    const envPath = path.join(this.webhooksDir, '.env');

    if (!fs.existsSync(envPath)) {
      if (fs.existsSync(envLocalPath)) {
        fs.copyFileSync(envLocalPath, envPath);
        console.log('✅ Created .env file from .env.local template');
      } else {
        throw new Error('.env.local template not found');
      }
    } else {
      console.log('✅ .env file already exists');
    }

    // Create necessary directories
    const dirs = [
      path.join(this.webhooksDir, 'logs'),
      path.join(this.webhooksDir, 'audio'),
      path.join(this.webhooksDir, 'uploads'),
      path.join(this.rootDir, 'config')
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${path.relative(this.rootDir, dir)}`);
      }
    });

    console.log('\n');
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...\n');

    try {
      // Install root dependencies
      console.log('Installing root dependencies...');
      execSync('npm install', { 
        cwd: this.rootDir, 
        stdio: 'inherit' 
      });

      // Install webhooks dependencies
      console.log('Installing webhooks dependencies...');
      execSync('npm install', { 
        cwd: this.webhooksDir, 
        stdio: 'inherit' 
      });

      console.log('✅ Dependencies installed successfully\n');
    } catch (error) {
      throw new Error('Failed to install dependencies');
    }
  }

  async setupDatabase() {
    console.log('🗄️  Setting up database...\n');

    const useDocker = await this.prompt('Use Docker for databases? (y/n): ');

    if (useDocker.toLowerCase() === 'y') {
      await this.setupWithDocker();
    } else {
      await this.setupWithoutDocker();
    }
  }

  async setupWithDocker() {
    console.log('🐳 Setting up with Docker...\n');

    // Check if Docker is available
    try {
      execSync('docker --version', { stdio: 'pipe' });
      console.log('✅ Docker is available');
    } catch (error) {
      console.log('❌ Docker not found. Please install Docker Desktop first.');
      console.log('Download from: https://www.docker.com/products/docker-desktop/');
      throw new Error('Docker required for this setup option');
    }

    // Start MongoDB with Docker
    try {
      execSync('docker run -d --name mongodb-local -p 27017:27017 mongo:6', {
        stdio: 'pipe'
      });
      console.log('✅ Started MongoDB with Docker');
      await this.waitForService('mongodb://localhost:27017', 'MongoDB');
    } catch (error) {
      if (error.message.includes('already in use')) {
        console.log('✅ MongoDB container already running');
      } else {
        console.log('⚠️  Could not start MongoDB with Docker:', error.message);
      }
    }

    // Start Redis with Docker
    try {
      execSync('docker run -d --name redis-local -p 6379:6379 redis:alpine', {
        stdio: 'pipe'
      });
      console.log('✅ Started Redis with Docker');
    } catch (error) {
      if (error.message.includes('already in use')) {
        console.log('✅ Redis container already running');
      } else {
        console.log('⚠️  Could not start Redis with Docker:', error.message);
      }
    }

    // Start n8n with Docker
    try {
      execSync('docker run -d --name n8n-local -p 5678:5678 n8nio/n8n', {
        stdio: 'pipe'
      });
      console.log('✅ Started n8n with Docker');
      console.log('📍 n8n available at: http://localhost:5678');
    } catch (error) {
      if (error.message.includes('already in use')) {
        console.log('✅ n8n container already running');
      } else {
        console.log('⚠️  Could not start n8n with Docker:', error.message);
      }
    }
  }

  async setupWithoutDocker() {
    console.log('💻 Setting up without Docker...\n');

    // Check if MongoDB is running locally
    try {
      execSync('mongosh --eval "db.runCommand({ping: 1})"', {
        stdio: 'pipe',
        timeout: 5000
      });
      console.log('✅ MongoDB is running locally');
    } catch (error) {
      console.log('⚠️  MongoDB not running locally');
      console.log('Options:');
      console.log('1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
      console.log('2. Use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
      console.log('3. Use Docker: Restart setup and choose Docker option');
    }

    // Check Redis
    try {
      execSync('redis-cli ping', { stdio: 'pipe', timeout: 2000 });
      console.log('✅ Redis is running locally');
    } catch (error) {
      console.log('⚠️  Redis not running (optional service)');
      console.log('Install Redis: https://redis.io/download');
    }

    console.log('\n💡 For n8n, you can:');
    console.log('1. Use n8n Cloud: https://n8n.cloud (recommended)');
    console.log('2. Install locally: npm install n8n -g && n8n start');
  }

    // Setup Redis (optional)
    try {
      execSync('redis-cli ping', { stdio: 'pipe', timeout: 2000 });
      console.log('✅ Redis is running');
    } catch (error) {
      console.log('⚠️  Redis not running. Starting with Docker...');
      
      try {
        execSync('docker run -d --name redis-local -p 6379:6379 redis:alpine', {
          stdio: 'pipe'
        });
        console.log('✅ Started Redis with Docker');
      } catch (dockerError) {
        console.log('⚠️  Could not start Redis with Docker (optional)');
      }
    }

    console.log('\n');
  }

  async createTestData() {
    console.log('📊 Creating test data...\n');

    const testLeadsPath = path.join(this.rootDir, 'config', 'test-leads.json');
    const testLeads = [
      {
        customerName: 'John Doe',
        phoneNumber: '+1234567890',
        email: 'john.doe@example.com',
        carModel: 'Toyota Camry 2023',
        leadSource: 'website',
        priority: 'medium',
        status: 'new',
        inquiryDate: new Date().toISOString()
      },
      {
        customerName: 'Jane Smith',
        phoneNumber: '+1987654321',
        email: 'jane.smith@example.com',
        carModel: 'Honda Accord 2023',
        leadSource: 'referral',
        priority: 'high',
        status: 'new',
        inquiryDate: new Date().toISOString()
      }
    ];

    fs.writeFileSync(testLeadsPath, JSON.stringify(testLeads, null, 2));
    console.log('✅ Created test leads data');

    // Create Google credentials template
    const googleCredsPath = path.join(this.rootDir, 'config', 'google-credentials.json.template');
    const googleCredsTemplate = {
      "type": "service_account",
      "project_id": "your-project-id",
      "private_key_id": "your-private-key-id",
      "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
      "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
      "client_id": "your-client-id",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token"
    };

    fs.writeFileSync(googleCredsPath, JSON.stringify(googleCredsTemplate, null, 2));
    console.log('✅ Created Google credentials template');

    console.log('\n');
  }

  async startServices() {
    console.log('🚀 Starting services...\n');

    // Create a simple test script
    const testScriptPath = path.join(this.webhooksDir, 'test-local.js');
    const testScript = `
const express = require('express');
const app = express();

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: 'local',
    timestamp: new Date().toISOString(),
    message: 'AI Cold Calling System is running locally!'
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Local test endpoint working!',
    apis: {
      twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
      elevenlabs: process.env.ELEVENLABS_API_KEY ? 'configured' : 'not configured',
      deepgram: process.env.DEEPGRAM_API_KEY ? 'configured' : 'not configured'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`🚀 Local test server running on http://localhost:\${PORT}\`);
  console.log(\`📊 Health check: http://localhost:\${PORT}/health\`);
  console.log(\`🧪 Test endpoint: http://localhost:\${PORT}/test\`);
});
`;

    fs.writeFileSync(testScriptPath, testScript);
    console.log('✅ Created local test script');

    console.log('\n');
  }

  async waitForService(url, serviceName, timeout = 30000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        // Simple connection test
        await new Promise((resolve, reject) => {
          const net = require('net');
          const [host, port] = url.replace('mongodb://', '').split(':');
          const socket = net.createConnection(parseInt(port), host);
          
          socket.on('connect', () => {
            socket.destroy();
            resolve();
          });
          
          socket.on('error', reject);
          
          setTimeout(() => {
            socket.destroy();
            reject(new Error('Timeout'));
          }, 2000);
        });
        
        console.log(`✅ ${serviceName} is ready`);
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    throw new Error(`${serviceName} did not become ready within ${timeout}ms`);
  }

  async prompt(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new LocalSetup();
  setup.run().catch(console.error);
}

module.exports = LocalSetup;
