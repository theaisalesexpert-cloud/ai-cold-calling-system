#!/usr/bin/env node

// Setup Wizard for AI Cold Calling System
// Run with: node scripts/setup-wizard.js

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class SetupWizard {
  constructor() {
    this.config = {};
    this.envPath = path.join(__dirname, '../.env');
  }

  async run() {
    console.log('🚀 AI Cold Calling System Setup Wizard');
    console.log('=====================================\n');
    
    console.log('This wizard will help you configure your AI calling system.');
    console.log('Please have all your API keys and credentials ready.\n');

    try {
      await this.collectTwilioConfig();
      await this.collectOpenAIConfig();
      await this.collectElevenLabsConfig();
      await this.collectDeepgramConfig();
      await this.collectGoogleSheetsConfig();
      await this.collectDomainConfig();
      await this.collectDealershipConfig();
      await this.collectEmailConfig();
      
      await this.saveConfiguration();
      await this.validateConfiguration();
      
      console.log('\n🎉 Setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Deploy webhook server to Render.com');
      console.log('2. Import n8n workflow');
      console.log('3. Configure Twilio webhooks');
      console.log('4. Test with sample leads');
      console.log('\nRun "npm test" to validate your configuration.');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async collectTwilioConfig() {
    console.log('📞 Twilio Configuration');
    console.log('------------------------');
    
    this.config.TWILIO_ACCOUNT_SID = await this.prompt('Twilio Account SID: ');
    this.config.TWILIO_AUTH_TOKEN = await this.prompt('Twilio Auth Token: ');
    this.config.TWILIO_PHONE_NUMBER = await this.prompt('Twilio Phone Number (E.164 format, e.g., +1234567890): ');
    
    // Validate Twilio credentials
    try {
      const twilio = require('twilio');
      const client = twilio(this.config.TWILIO_ACCOUNT_SID, this.config.TWILIO_AUTH_TOKEN);
      await client.api.accounts(this.config.TWILIO_ACCOUNT_SID).fetch();
      console.log('✅ Twilio credentials validated\n');
    } catch (error) {
      throw new Error(`Twilio validation failed: ${error.message}`);
    }
  }

  async collectOpenAIConfig() {
    console.log('🤖 OpenAI Configuration');
    console.log('------------------------');
    
    this.config.OPENAI_API_KEY = await this.prompt('OpenAI API Key: ');
    
    // Validate OpenAI key
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${this.config.OPENAI_API_KEY}` },
        timeout: 10000
      });
      console.log('✅ OpenAI API key validated\n');
    } catch (error) {
      throw new Error(`OpenAI validation failed: ${error.message}`);
    }
  }

  async collectElevenLabsConfig() {
    console.log('🎤 ElevenLabs Configuration');
    console.log('---------------------------');
    
    this.config.ELEVENLABS_API_KEY = await this.prompt('ElevenLabs API Key: ');
    
    // Get available voices
    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: { 'xi-api-key': this.config.ELEVENLABS_API_KEY }
      });
      
      console.log('\nAvailable voices:');
      response.data.voices.forEach((voice, index) => {
        console.log(`${index + 1}. ${voice.name} (${voice.voice_id})`);
      });
      
      const voiceChoice = await this.prompt('\nSelect voice number (or press Enter for default): ');
      if (voiceChoice && voiceChoice.trim()) {
        const voiceIndex = parseInt(voiceChoice) - 1;
        if (voiceIndex >= 0 && voiceIndex < response.data.voices.length) {
          this.config.ELEVENLABS_VOICE_ID = response.data.voices[voiceIndex].voice_id;
        }
      }
      
      if (!this.config.ELEVENLABS_VOICE_ID) {
        this.config.ELEVENLABS_VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Default Bella voice
      }
      
      console.log('✅ ElevenLabs configuration validated\n');
    } catch (error) {
      throw new Error(`ElevenLabs validation failed: ${error.message}`);
    }
  }

  async collectDeepgramConfig() {
    console.log('🎧 Deepgram Configuration');
    console.log('-------------------------');
    
    this.config.DEEPGRAM_API_KEY = await this.prompt('Deepgram API Key: ');
    
    // Validate Deepgram key
    try {
      await axios.get('https://api.deepgram.com/v1/projects', {
        headers: { 'Authorization': `Token ${this.config.DEEPGRAM_API_KEY}` },
        timeout: 10000
      });
      console.log('✅ Deepgram API key validated\n');
    } catch (error) {
      throw new Error(`Deepgram validation failed: ${error.message}`);
    }
  }

  async collectGoogleSheetsConfig() {
    console.log('📊 Google Sheets Configuration');
    console.log('-------------------------------');
    
    this.config.GOOGLE_SHEETS_ID = await this.prompt('Google Sheets ID (from URL): ');
    this.config.GOOGLE_SERVICE_ACCOUNT_EMAIL = await this.prompt('Service Account Email: ');
    
    console.log('Paste your private key (including -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY-----):');
    this.config.GOOGLE_PRIVATE_KEY = await this.prompt('');
    
    console.log('✅ Google Sheets configuration saved\n');
  }

  async collectDomainConfig() {
    console.log('🌐 Domain Configuration');
    console.log('-----------------------');
    
    this.config.DOMAIN = await this.prompt('Your domain (e.g., theaisalesexpert.co.uk): ') || 'theaisalesexpert.co.uk';
    this.config.WEBHOOK_BASE_URL = `https://${this.config.DOMAIN}`;
    this.config.N8N_WEBHOOK_URL = await this.prompt('n8n webhook URL (from n8n cloud): ');
    
    console.log('✅ Domain configuration saved\n');
  }

  async collectDealershipConfig() {
    console.log('🏢 Dealership Configuration');
    console.log('---------------------------');
    
    this.config.DEALERSHIP_NAME = await this.prompt('Dealership Name: ');
    this.config.BOT_NAME = await this.prompt('AI Assistant Name (e.g., Sarah): ') || 'Sarah';
    this.config.DEFAULT_REP_NAME = `${this.config.BOT_NAME} from ${this.config.DEALERSHIP_NAME}`;
    
    console.log('✅ Dealership configuration saved\n');
  }

  async collectEmailConfig() {
    console.log('📧 Email Configuration');
    console.log('----------------------');
    
    this.config.SMTP_HOST = await this.prompt('SMTP Host (e.g., smtp.gmail.com): ') || 'smtp.gmail.com';
    this.config.SMTP_PORT = await this.prompt('SMTP Port (e.g., 587): ') || '587';
    this.config.SMTP_USER = await this.prompt('Email Address: ');
    this.config.SMTP_PASS = await this.prompt('Email Password/App Password: ');
    
    console.log('✅ Email configuration saved\n');
  }

  async saveConfiguration() {
    console.log('💾 Saving configuration...');
    
    let envContent = '';
    for (const [key, value] of Object.entries(this.config)) {
      envContent += `${key}=${value}\n`;
    }
    
    fs.writeFileSync(this.envPath, envContent);
    console.log('✅ Configuration saved to .env file\n');
  }

  async validateConfiguration() {
    console.log('🔍 Validating configuration...');
    
    // Check if all required variables are set
    const requiredVars = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER',
      'OPENAI_API_KEY',
      'ELEVENLABS_API_KEY',
      'DEEPGRAM_API_KEY',
      'GOOGLE_SHEETS_ID',
      'DEALERSHIP_NAME'
    ];
    
    const missing = requiredVars.filter(varName => !this.config[varName]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
    
    console.log('✅ Configuration validation passed\n');
  }

  prompt(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Run setup wizard if this file is executed directly
if (require.main === module) {
  const wizard = new SetupWizard();
  wizard.run().catch(console.error);
}

module.exports = SetupWizard;
