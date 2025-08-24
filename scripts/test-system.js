#!/usr/bin/env node

/**
 * AI Cold Calling System - Comprehensive Testing Script
 * Tests all components of the system to ensure proper functionality
 */

const axios = require('axios');
const twilio = require('twilio');
require('dotenv').config();

// Configuration
const config = {
  webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'https://theaisalesexpert.co.uk',
  n8nWebhookUrl: process.env.N8N_WEBHOOK_URL,
  testPhoneNumber: process.env.TEST_PHONE_NUMBER || '+1234567890',
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
  openaiApiKey: process.env.OPENAI_API_KEY,
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY,
  deepgramApiKey: process.env.DEEPGRAM_API_KEY
};

// Test results
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Utility functions
function logTest(name, passed, message = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}${message ? ': ' + message : ''}`);
  
  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

function logSection(title) {
  console.log(`\n🔧 ${title}`);
  console.log('='.repeat(50));
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test functions
async function testWebhookServer() {
  logSection('Testing Webhook Server');
  
  try {
    // Test health endpoint
    const response = await axios.get(`${config.webhookBaseUrl}/health`, {
      timeout: 10000
    });
    
    const isHealthy = response.status === 200 && response.data.status === 'healthy';
    logTest('Webhook Server Health Check', isHealthy, 
      isHealthy ? `Server is healthy` : `Server returned: ${response.status}`);
    
    return isHealthy;
  } catch (error) {
    logTest('Webhook Server Health Check', false, error.message);
    return false;
  }
}

async function testTwilioIntegration() {
  logSection('Testing Twilio Integration');
  
  if (!config.twilioAccountSid || !config.twilioAuthToken) {
    logTest('Twilio Credentials', false, 'Missing Twilio credentials');
    return false;
  }
  
  try {
    const client = twilio(config.twilioAccountSid, config.twilioAuthToken);
    
    // Test account access
    const account = await client.api.accounts(config.twilioAccountSid).fetch();
    logTest('Twilio Account Access', true, `Account: ${account.friendlyName}`);
    
    // Test phone numbers
    const phoneNumbers = await client.incomingPhoneNumbers.list({ limit: 5 });
    const hasPhoneNumbers = phoneNumbers.length > 0;
    logTest('Twilio Phone Numbers', hasPhoneNumbers, 
      hasPhoneNumbers ? `Found ${phoneNumbers.length} phone number(s)` : 'No phone numbers found');
    
    return hasPhoneNumbers;
  } catch (error) {
    logTest('Twilio Integration', false, error.message);
    return false;
  }
}

async function testOpenAIIntegration() {
  logSection('Testing OpenAI Integration');
  
  if (!config.openaiApiKey) {
    logTest('OpenAI API Key', false, 'Missing OpenAI API key');
    return false;
  }
  
  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a test assistant.' },
        { role: 'user', content: 'Say "test successful" if you can read this.' }
      ],
      max_tokens: 10
    }, {
      headers: {
        'Authorization': `Bearer ${config.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    const isWorking = response.status === 200 && response.data.choices?.[0]?.message?.content;
    logTest('OpenAI API', isWorking, 
      isWorking ? 'API responding correctly' : 'API not responding as expected');
    
    return isWorking;
  } catch (error) {
    logTest('OpenAI API', false, error.message);
    return false;
  }
}

async function testElevenLabsIntegration() {
  logSection('Testing ElevenLabs Integration');
  
  if (!config.elevenlabsApiKey) {
    logTest('ElevenLabs API Key', false, 'Missing ElevenLabs API key');
    return false;
  }
  
  try {
    // Test voices endpoint
    const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: {
        'xi-api-key': config.elevenlabsApiKey
      },
      timeout: 10000
    });
    
    const hasVoices = response.status === 200 && response.data.voices?.length > 0;
    logTest('ElevenLabs Voices', hasVoices, 
      hasVoices ? `Found ${response.data.voices.length} voices` : 'No voices found');
    
    return hasVoices;
  } catch (error) {
    logTest('ElevenLabs API', false, error.message);
    return false;
  }
}

async function testDeepgramIntegration() {
  logSection('Testing Deepgram Integration');
  
  if (!config.deepgramApiKey) {
    logTest('Deepgram API Key', false, 'Missing Deepgram API key');
    return false;
  }
  
  try {
    // Test projects endpoint
    const response = await axios.get('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${config.deepgramApiKey}`
      },
      timeout: 10000
    });
    
    const isWorking = response.status === 200;
    logTest('Deepgram API', isWorking, 
      isWorking ? 'API accessible' : `API returned: ${response.status}`);
    
    return isWorking;
  } catch (error) {
    logTest('Deepgram API', false, error.message);
    return false;
  }
}

async function testN8nWebhook() {
  logSection('Testing n8n Integration');
  
  if (!config.n8nWebhookUrl) {
    logTest('n8n Webhook URL', false, 'Missing n8n webhook URL');
    return false;
  }
  
  try {
    // Test webhook with sample data
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'System test'
    };
    
    const response = await axios.post(`${config.n8nWebhookUrl}/test`, testData, {
      timeout: 10000,
      validateStatus: (status) => status < 500 // Accept 4xx as valid (webhook might not exist yet)
    });
    
    const isAccessible = response.status < 500;
    logTest('n8n Webhook Accessibility', isAccessible, 
      `Webhook returned: ${response.status}`);
    
    return isAccessible;
  } catch (error) {
    logTest('n8n Webhook', false, error.message);
    return false;
  }
}

async function testTwilioWebhookConnectivity() {
  logSection('Testing Twilio Webhook Connectivity');
  
  try {
    // Test if Twilio can reach our webhook
    const webhookUrl = `${config.webhookBaseUrl}/webhook/twilio/voice`;
    
    // Simulate a Twilio webhook call
    const testPayload = {
      CallSid: 'test-call-sid',
      From: config.testPhoneNumber,
      To: config.testPhoneNumber,
      CallStatus: 'ringing'
    };
    
    const response = await axios.post(webhookUrl, testPayload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000
    });
    
    const isWorking = response.status === 200;
    logTest('Twilio Webhook Endpoint', isWorking, 
      isWorking ? 'Webhook responding' : `Webhook returned: ${response.status}`);
    
    return isWorking;
  } catch (error) {
    logTest('Twilio Webhook Endpoint', false, error.message);
    return false;
  }
}

async function testEndToEndFlow() {
  logSection('Testing End-to-End Flow');
  
  // This would test the complete flow but requires actual phone calls
  // For now, we'll test the webhook chain
  
  try {
    const testCallData = {
      callSid: 'test-call-' + Date.now(),
      customerName: 'Test Customer',
      phoneNumber: config.testPhoneNumber,
      callOutcome: {
        stillInterested: 'Yes',
        wantsAppointment: 'No',
        wantsSimilarCars: 'Yes',
        emailAddress: 'test@example.com'
      },
      conversationHistory: [
        { role: 'assistant', content: 'Hi, is this Test Customer?' },
        { role: 'user', content: 'Yes, this is Test Customer.' }
      ],
      duration: 2,
      endTime: new Date().toISOString()
    };
    
    // Test call completion webhook
    if (config.n8nWebhookUrl) {
      const response = await axios.post(`${config.n8nWebhookUrl}/call-completed`, testCallData, {
        timeout: 10000,
        validateStatus: (status) => status < 500
      });
      
      const isWorking = response.status < 400;
      logTest('End-to-End Webhook Flow', isWorking, 
        `Call completion webhook returned: ${response.status}`);
      
      return isWorking;
    } else {
      logTest('End-to-End Webhook Flow', false, 'n8n webhook URL not configured');
      return false;
    }
  } catch (error) {
    logTest('End-to-End Webhook Flow', false, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🧪 AI Cold Calling System - Comprehensive Test Suite');
  console.log('====================================================');
  console.log(`Testing against: ${config.webhookBaseUrl}`);
  console.log(`Test started: ${new Date().toISOString()}\n`);
  
  // Run all tests
  await testWebhookServer();
  await delay(1000);
  
  await testTwilioIntegration();
  await delay(1000);
  
  await testOpenAIIntegration();
  await delay(1000);
  
  await testElevenLabsIntegration();
  await delay(1000);
  
  await testDeepgramIntegration();
  await delay(1000);
  
  await testN8nWebhook();
  await delay(1000);
  
  await testTwilioWebhookConnectivity();
  await delay(1000);
  
  await testEndToEndFlow();
  
  // Print summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   - ${test.name}: ${test.message}`));
  }
  
  console.log(`\nTest completed: ${new Date().toISOString()}`);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = { runAllTests, testResults };
