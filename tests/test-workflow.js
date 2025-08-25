// Test Suite for AI Cold Calling Workflow
// Run with: npm test

const axios = require('axios');
const assert = require('assert');
require('dotenv').config();

class WorkflowTester {
  constructor() {
    this.baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    this.testResults = [];
  }

  async runAllTests() {
    console.log('🚀 Starting AI Cold Calling Workflow Tests...\n');

    const tests = [
      { name: 'Health Check', fn: this.testHealthCheck },
      { name: 'Voice Services Status', fn: this.testVoiceServices },
      { name: 'Google Sheets Connection', fn: this.testGoogleSheetsConnection },
      { name: 'Twilio Configuration', fn: this.testTwilioConfig },
      { name: 'Email Service', fn: this.testEmailService },
      { name: 'Conversation Flow', fn: this.testConversationFlow },
      { name: 'End-to-End Workflow', fn: this.testEndToEndWorkflow }
    ];

    for (const test of tests) {
      try {
        console.log(`🧪 Running: ${test.name}...`);
        await test.fn.call(this);
        this.testResults.push({ name: test.name, status: 'PASS', error: null });
        console.log(`✅ ${test.name}: PASSED\n`);
      } catch (error) {
        this.testResults.push({ name: test.name, status: 'FAIL', error: error.message });
        console.log(`❌ ${test.name}: FAILED - ${error.message}\n`);
      }
    }

    this.printSummary();
  }

  async testHealthCheck() {
    const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.status, 'healthy');
  }

  async testVoiceServices() {
    // Test if voice services are properly configured
    const VoiceServices = require('../webhooks/voice-services');
    const voiceServices = new VoiceServices();
    
    const status = await voiceServices.getServiceStatus();
    
    if (!status.elevenlabs) {
      throw new Error('ElevenLabs service not available');
    }
    
    if (!status.deepgram) {
      throw new Error('Deepgram service not available');
    }

    // Test basic TTS functionality
    const testText = "Hello, this is a test message.";
    const audioBuffer = await voiceServices.textToSpeech(testText);
    
    assert(audioBuffer instanceof Buffer, 'TTS should return a Buffer');
    assert(audioBuffer.length > 0, 'Audio buffer should not be empty');
  }

  async testGoogleSheetsConnection() {
    // This would require actual Google Sheets API testing
    // For now, we'll check if credentials are configured
    const requiredEnvVars = [
      'GOOGLE_SHEETS_ID',
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_PRIVATE_KEY'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing environment variable: ${envVar}`);
      }
    }

    console.log('   📊 Google Sheets credentials configured');
  }

  async testTwilioConfig() {
    const requiredEnvVars = [
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing environment variable: ${envVar}`);
      }
    }

    // Test Twilio client initialization
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    // Test account fetch (validates credentials)
    try {
      await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log('   📞 Twilio credentials validated');
    } catch (error) {
      throw new Error(`Twilio authentication failed: ${error.message}`);
    }
  }

  async testEmailService() {
    const requiredEnvVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS'
    ];

    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Missing environment variable: ${envVar}`);
      }
    }

    console.log('   📧 Email service credentials configured');
  }

  async testConversationFlow() {
    // Test conversation prompt loading
    const fs = require('fs');
    const path = require('path');
    
    const promptsPath = path.join(__dirname, '../config/conversation-prompts.json');
    
    if (!fs.existsSync(promptsPath)) {
      throw new Error('Conversation prompts file not found');
    }

    const prompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
    
    // Validate required conversation states
    const requiredStates = [
      'greeting',
      'confirm_interest',
      'arrange_appointment',
      'offer_similar',
      'collect_email'
    ];

    for (const state of requiredStates) {
      if (!prompts.conversation_flow[state]) {
        throw new Error(`Missing conversation state: ${state}`);
      }
    }

    console.log('   💬 Conversation flow configuration validated');
  }

  async testEndToEndWorkflow() {
    // Test the complete workflow with mock data
    const mockLead = {
      customer_name: 'Test Customer',
      phone_number: '+1234567890',
      car_model: 'Test Car Model 2024',
      dealership_name: process.env.DEALERSHIP_NAME || 'Test Dealership',
      bot_name: process.env.BOT_NAME || 'Sarah'
    };

    // Test webhook endpoint for call initiation
    try {
      const response = await axios.post(`${this.baseUrl}/webhook/call/initiate`, mockLead, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      assert(response.status === 200, 'Call initiation should return 200');
      assert(response.headers['content-type'].includes('text/xml'), 'Should return TwiML XML');
      
      console.log('   🔄 End-to-end workflow test completed');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Webhook server not running. Start with: npm start');
      }
      throw error;
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(50));

    const passed = this.testResults.filter(r => r.status === 'PASS').length;
    const failed = this.testResults.filter(r => r.status === 'FAIL').length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${this.testResults.length}`);

    if (failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`   • ${r.name}: ${r.error}`));
    }

    console.log('\n' + '='.repeat(50));
    
    if (failed === 0) {
      console.log('🎉 All tests passed! Your AI calling system is ready to go!');
    } else {
      console.log('⚠️  Some tests failed. Please fix the issues before deploying.');
      process.exit(1);
    }
  }
}

// Sample test data for manual testing
const sampleTestData = {
  leads: [
    {
      customer_name: 'John Smith',
      phone_number: '+1234567890',
      car_model: 'Toyota Camry 2024',
      enquiry_date: '2024-01-15',
      call_status: 'pending',
      call_attempts: 0
    },
    {
      customer_name: 'Sarah Johnson',
      phone_number: '+1987654321',
      car_model: 'Honda Accord 2024',
      enquiry_date: '2024-01-16',
      call_status: 'pending',
      call_attempts: 1
    }
  ],
  
  conversationScenarios: [
    {
      name: 'Interested in Original Car',
      responses: ['Yes', 'Still interested', 'Yes, I want to schedule'],
      expectedOutcome: 'schedule_appointment'
    },
    {
      name: 'Not Interested, Wants Similar',
      responses: ['No', 'Not interested in that one', 'Yes, similar cars'],
      expectedOutcome: 'collect_email'
    },
    {
      name: 'Not Interested at All',
      responses: ['No', 'Not interested', 'No thanks'],
      expectedOutcome: 'end_call'
    }
  ]
};

// Export for use in other test files
module.exports = { WorkflowTester, sampleTestData };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new WorkflowTester();
  tester.runAllTests().catch(console.error);
}
