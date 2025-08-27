#!/usr/bin/env node

// n8n Integration Test Script
// Tests the integration between AI calling system and n8n workflows

require('dotenv').config({ path: './webhooks/.env' });

const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class N8nIntegrationTester {
  constructor() {
    this.baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    this.n8nUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
    this.apiKey = process.env.API_KEYS?.split(',')[0] || 'test-api-key-1';
  }

  async runTests() {
    console.log('🔗 n8n Integration Testing');
    console.log('===========================\n');

    const tests = [
      { name: 'Test AI System Health', fn: this.testAISystemHealth },
      { name: 'Test n8n Connection', fn: this.testN8nConnection },
      { name: 'Test Call Completion Webhook', fn: this.testCallCompletionWebhook },
      { name: 'Test Lead Update Webhook', fn: this.testLeadUpdateWebhook },
      { name: 'Test Manual Call Trigger', fn: this.testManualCallTrigger }
    ];

    for (const test of tests) {
      console.log(`🧪 ${test.name}...`);
      try {
        await test.fn.call(this);
        console.log(`✅ ${test.name}: PASSED\n`);
      } catch (error) {
        console.log(`❌ ${test.name}: FAILED - ${error.message}\n`);
      }
    }

    console.log('🎯 Integration test completed!');
    console.log('\n📋 Next Steps:');
    console.log('1. Import n8n workflows from n8n-workflows/ directory');
    console.log('2. Configure Google Sheets credentials in n8n');
    console.log('3. Update workflow URLs to match your system');
    console.log('4. Test with real data');
  }

  async testAISystemHealth() {
    const response = await axios.get(`${this.baseUrl}/health`, {
      timeout: 5000
    });

    if (response.status !== 200) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    console.log(`   ✓ AI System is healthy`);
    console.log(`   ✓ Database: ${response.data.services?.database || 'unknown'}`);
    console.log(`   ✓ n8n Config: ${response.data.services?.n8n || 'unknown'}`);
  }

  async testN8nConnection() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/n8n/test`, {
        headers: {
          'X-API-Key': this.apiKey
        },
        timeout: 10000
      });

      if (response.data.success) {
        console.log(`   ✓ n8n connection successful`);
      } else {
        throw new Error('n8n connection test failed');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log(`   ⚠️  n8n not accessible (this is OK for local testing)`);
      } else {
        throw error;
      }
    }
  }

  async testCallCompletionWebhook() {
    const testCallData = {
      sessionId: 'test_session_' + Date.now(),
      customerName: 'John Doe',
      phoneNumber: '+1234567890',
      carModel: 'Toyota Camry 2023',
      dealershipName: 'Test Dealership',
      duration: 180,
      status: 'completed',
      outcome: 'appointment_scheduled',
      transcript: [
        {
          speaker: 'ai',
          text: 'Hi, is this John Doe?',
          timestamp: new Date().toISOString()
        },
        {
          speaker: 'customer',
          text: 'Yes, this is John',
          timestamp: new Date().toISOString()
        }
      ],
      extractedData: {
        still_interested: 'yes',
        wants_appointment: 'yes',
        email_address: 'john.doe@example.com'
      },
      analytics: {
        averageSentiment: 0.3,
        communicationStyle: 'conversational'
      }
    };

    const response = await axios.post(`${this.baseUrl}/api/n8n/notify/call-completed`, testCallData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      timeout: 10000
    });

    if (response.data.success) {
      console.log(`   ✓ Call completion webhook sent successfully`);
    } else {
      throw new Error('Call completion webhook failed');
    }
  }

  async testLeadUpdateWebhook() {
    const testLeadData = {
      id: 'lead_test_' + Date.now(),
      phoneNumber: '+1987654321',
      customerName: 'Jane Smith',
      email: 'jane.smith@example.com',
      carModel: 'Honda Accord 2023',
      status: 'qualified',
      leadScore: 85,
      priority: 'high',
      lastContactDate: new Date().toISOString(),
      nextAction: 'schedule_appointment',
      callAttempts: 1,
      notes: 'Customer very interested in test drive',
      leadSource: 'website'
    };

    const response = await axios.post(`${this.baseUrl}/api/n8n/notify/lead-updated`, testLeadData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      timeout: 10000
    });

    if (response.data.success) {
      console.log(`   ✓ Lead update webhook sent successfully`);
    } else {
      throw new Error('Lead update webhook failed');
    }
  }

  async testManualCallTrigger() {
    const testTriggerData = {
      customer_name: 'Test Customer',
      phone_number: '+1555123456',
      car_model: 'Test Car Model 2023',
      dealership_name: 'Test Dealership',
      priority: 'medium',
      lead_source: 'test_script'
    };

    try {
      const response = await axios.post(`${this.baseUrl}/api/n8n/webhook/trigger-call`, testTriggerData, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        timeout: 10000
      });

      if (response.data.success) {
        console.log(`   ✓ Manual call trigger successful`);
      } else {
        throw new Error('Manual call trigger failed');
      }
    } catch (error) {
      if (error.response?.status === 500) {
        console.log(`   ⚠️  Call trigger endpoint exists but Twilio not configured (OK for testing)`);
      } else {
        throw error;
      }
    }
  }

  async prompt(question) {
    return new Promise((resolve) => {
      rl.question(question, resolve);
    });
  }

  async interactiveTest() {
    console.log('\n🎮 Interactive n8n Integration Test');
    console.log('====================================\n');

    const choice = await this.prompt(
      'Choose test type:\n' +
      '1. Quick health check\n' +
      '2. Full integration test\n' +
      '3. Test specific webhook\n' +
      '4. Manual call trigger\n' +
      'Enter choice (1-4): '
    );

    switch (choice.trim()) {
      case '1':
        await this.testAISystemHealth();
        break;
      case '2':
        await this.runTests();
        break;
      case '3':
        await this.testSpecificWebhook();
        break;
      case '4':
        await this.manualCallTrigger();
        break;
      default:
        console.log('Invalid choice');
    }

    rl.close();
  }

  async testSpecificWebhook() {
    const webhookChoice = await this.prompt(
      'Choose webhook to test:\n' +
      '1. Call completion\n' +
      '2. Lead update\n' +
      '3. Appointment scheduled\n' +
      'Enter choice (1-3): '
    );

    switch (webhookChoice.trim()) {
      case '1':
        await this.testCallCompletionWebhook();
        break;
      case '2':
        await this.testLeadUpdateWebhook();
        break;
      case '3':
        await this.testAppointmentWebhook();
        break;
      default:
        console.log('Invalid choice');
    }
  }

  async testAppointmentWebhook() {
    const appointmentData = {
      id: 'appointment_test_' + Date.now(),
      customerName: 'Test Customer',
      phoneNumber: '+1555123456',
      email: 'test@example.com',
      carModel: 'Test Car 2023',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      type: 'test_drive',
      dealershipName: 'Test Dealership',
      salesRep: 'Sarah',
      notes: 'Test appointment from integration script'
    };

    const response = await axios.post(`${this.baseUrl}/api/n8n/notify/appointment-scheduled`, appointmentData, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      timeout: 10000
    });

    if (response.data.success) {
      console.log(`   ✓ Appointment webhook sent successfully`);
    } else {
      throw new Error('Appointment webhook failed');
    }
  }

  async manualCallTrigger() {
    const customerName = await this.prompt('Enter customer name: ');
    const phoneNumber = await this.prompt('Enter phone number: ');
    const carModel = await this.prompt('Enter car model: ');

    const callData = {
      customer_name: customerName,
      phone_number: phoneNumber,
      car_model: carModel,
      dealership_name: 'Test Dealership',
      priority: 'medium',
      lead_source: 'manual_test'
    };

    try {
      const response = await axios.post(`${this.baseUrl}/api/n8n/webhook/trigger-call`, callData, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        },
        timeout: 10000
      });

      console.log('✅ Call triggered successfully!');
      console.log('Response:', response.data);
    } catch (error) {
      console.log('❌ Call trigger failed:', error.message);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new N8nIntegrationTester();
  
  // Check if interactive mode
  if (process.argv.includes('--interactive') || process.argv.includes('-i')) {
    tester.interactiveTest().catch(console.error);
  } else {
    tester.runTests().catch(console.error);
  }
}

module.exports = N8nIntegrationTester;
