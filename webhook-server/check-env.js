#!/usr/bin/env node

/**
 * Environment Variable Checker
 * Run this to verify all required environment variables are set
 */

require('dotenv').config();

const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN', 
  'TWILIO_PHONE_NUMBER',
  'OPENAI_API_KEY',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID',
  'DEEPGRAM_API_KEY',
  'GOOGLE_SERVICE_ACCOUNT_EMAIL',
  'GOOGLE_PRIVATE_KEY',
  'GOOGLE_SPREADSHEET_ID',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'N8N_WEBHOOK_URL',
  'WEBHOOK_BASE_URL'
];

console.log('🔍 Checking Environment Variables...\n');

let allGood = true;
const missing = [];
const present = [];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    present.push(varName);
    console.log(`✅ ${varName}: Set`);
  } else {
    missing.push(varName);
    console.log(`❌ ${varName}: Missing`);
    allGood = false;
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Present: ${present.length}`);
console.log(`❌ Missing: ${missing.length}`);

if (!allGood) {
  console.log('\n🚨 Missing Environment Variables:');
  missing.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  
  console.log('\n📋 To fix this in Render.com:');
  console.log('1. Go to your service dashboard');
  console.log('2. Click "Environment" tab');
  console.log('3. Add each missing variable');
  console.log('4. Redeploy your service');
  
  process.exit(1);
} else {
  console.log('\n🎉 All environment variables are set!');
  console.log('Your service should start successfully.');
}
