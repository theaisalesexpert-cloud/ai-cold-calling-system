#!/usr/bin/env node

/**
 * Credential Verification Script
 * Run this before deploying to Render.com to verify all your API credentials work
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 AI Cold-Calling System - Credential Verification');
console.log('====================================================');
console.log('This script will help you verify all your API credentials before deployment.\n');

const credentials = {
  twilio: {},
  openai: {},
  elevenlabs: {},
  deepgram: {},
  google: {},
  email: {},
  n8n: {}
};

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function collectCredentials() {
  console.log('📞 TWILIO CREDENTIALS');
  console.log('----------------------');
  credentials.twilio.accountSid = await askQuestion('Twilio Account SID (starts with AC): ');
  credentials.twilio.authToken = await askQuestion('Twilio Auth Token: ');
  credentials.twilio.phoneNumber = await askQuestion('Twilio Phone Number (e.g., +1234567890): ');

  console.log('\n🤖 OPENAI CREDENTIALS');
  console.log('---------------------');
  credentials.openai.apiKey = await askQuestion('OpenAI API Key (starts with sk-): ');

  console.log('\n🎤 ELEVENLABS CREDENTIALS');
  console.log('-------------------------');
  credentials.elevenlabs.apiKey = await askQuestion('ElevenLabs API Key: ');
  credentials.elevenlabs.voiceId = await askQuestion('ElevenLabs Voice ID: ');

  console.log('\n🎯 DEEPGRAM CREDENTIALS');
  console.log('-----------------------');
  credentials.deepgram.apiKey = await askQuestion('Deepgram API Key: ');

  console.log('\n📊 GOOGLE SHEETS CREDENTIALS');
  console.log('-----------------------------');
  credentials.google.serviceAccountEmail = await askQuestion('Google Service Account Email: ');
  credentials.google.spreadsheetId = await askQuestion('Google Spreadsheet ID (from URL): ');
  console.log('Note: Private key will be needed for deployment (not collected here for security)');

  console.log('\n📧 EMAIL CREDENTIALS');
  console.log('--------------------');
  credentials.email.user = await askQuestion('Gmail Address: ');
  console.log('Note: Gmail App Password will be needed for deployment (not collected here for security)');

  console.log('\n🔗 N8N CREDENTIALS');
  console.log('------------------');
  credentials.n8n.webhookUrl = await askQuestion('n8n Webhook URL (e.g., https://your-instance.app.n8n.cloud/webhook): ');

  return credentials;
}

function validateCredentials(creds) {
  const issues = [];

  // Validate Twilio
  if (!creds.twilio.accountSid || !creds.twilio.accountSid.startsWith('AC')) {
    issues.push('❌ Twilio Account SID should start with "AC"');
  }
  if (!creds.twilio.authToken || creds.twilio.authToken.length < 20) {
    issues.push('❌ Twilio Auth Token seems too short');
  }
  if (!creds.twilio.phoneNumber || !creds.twilio.phoneNumber.startsWith('+')) {
    issues.push('❌ Twilio Phone Number should start with "+" (E.164 format)');
  }

  // Validate OpenAI
  if (!creds.openai.apiKey || !creds.openai.apiKey.startsWith('sk-')) {
    issues.push('❌ OpenAI API Key should start with "sk-"');
  }

  // Validate ElevenLabs
  if (!creds.elevenlabs.apiKey || creds.elevenlabs.apiKey.length < 10) {
    issues.push('❌ ElevenLabs API Key seems too short');
  }
  if (!creds.elevenlabs.voiceId || creds.elevenlabs.voiceId.length < 10) {
    issues.push('❌ ElevenLabs Voice ID seems too short');
  }

  // Validate Deepgram
  if (!creds.deepgram.apiKey || creds.deepgram.apiKey.length < 10) {
    issues.push('❌ Deepgram API Key seems too short');
  }

  // Validate Google
  if (!creds.google.serviceAccountEmail || !creds.google.serviceAccountEmail.includes('@')) {
    issues.push('❌ Google Service Account Email should be a valid email');
  }
  if (!creds.google.spreadsheetId || creds.google.spreadsheetId.length < 20) {
    issues.push('❌ Google Spreadsheet ID seems too short');
  }

  // Validate Email
  if (!creds.email.user || !creds.email.user.includes('@')) {
    issues.push('❌ Email address should be valid');
  }

  // Validate n8n
  if (!creds.n8n.webhookUrl || !creds.n8n.webhookUrl.startsWith('https://')) {
    issues.push('❌ n8n Webhook URL should start with "https://"');
  }

  return issues;
}

function generateEnvVariables(creds) {
  return `
# Copy these environment variables to Render.com:
# ================================================

NODE_ENV=production
PORT=3000
WEBHOOK_BASE_URL=https://theaisalesexpert.co.uk
LOG_LEVEL=info

# Twilio Configuration
TWILIO_ACCOUNT_SID=${creds.twilio.accountSid}
TWILIO_AUTH_TOKEN=${creds.twilio.authToken}
TWILIO_PHONE_NUMBER=${creds.twilio.phoneNumber}

# OpenAI Configuration
OPENAI_API_KEY=${creds.openai.apiKey}
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=150
OPENAI_TEMPERATURE=0.7

# ElevenLabs Configuration
ELEVENLABS_API_KEY=${creds.elevenlabs.apiKey}
ELEVENLABS_VOICE_ID=${creds.elevenlabs.voiceId}
ELEVENLABS_MODEL=eleven_monolingual_v1

# Deepgram Configuration
DEEPGRAM_API_KEY=${creds.deepgram.apiKey}
DEEPGRAM_MODEL=nova-2
DEEPGRAM_LANGUAGE=en-US

# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL=${creds.google.serviceAccountEmail}
GOOGLE_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
GOOGLE_SPREADSHEET_ID=${creds.google.spreadsheetId}
GOOGLE_SHEET_NAME=Leads

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=${creds.email.user}
EMAIL_PASSWORD=YOUR_GMAIL_APP_PASSWORD_HERE

# n8n Configuration
N8N_WEBHOOK_URL=${creds.n8n.webhookUrl}
`;
}

async function main() {
  try {
    const creds = await collectCredentials();
    
    console.log('\n🔍 VALIDATING CREDENTIALS');
    console.log('==========================');
    
    const issues = validateCredentials(creds);
    
    if (issues.length === 0) {
      console.log('✅ All credentials look good!');
      
      console.log('\n📋 ENVIRONMENT VARIABLES FOR RENDER.COM');
      console.log('========================================');
      console.log(generateEnvVariables(creds));
      
      console.log('\n⚠️  IMPORTANT REMINDERS:');
      console.log('- Replace YOUR_PRIVATE_KEY_HERE with your actual Google private key');
      console.log('- Replace YOUR_GMAIL_APP_PASSWORD_HERE with your Gmail app password');
      console.log('- Copy ALL these variables to Render.com Environment Variables section');
      console.log('- Do NOT commit these credentials to Git!');
      
    } else {
      console.log('\n❌ ISSUES FOUND:');
      issues.forEach(issue => console.log(issue));
      console.log('\nPlease fix these issues before deploying.');
    }
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Fix any credential issues above');
    console.log('2. Follow the deployment guide: render-deploy-instructions.md');
    console.log('3. Use the deployment checklist: DEPLOYMENT-CHECKLIST.md');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { validateCredentials, generateEnvVariables };
