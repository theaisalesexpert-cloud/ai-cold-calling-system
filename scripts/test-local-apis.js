#!/usr/bin/env node

// Local API Testing Script
// Tests all external APIs and services in local environment

require('dotenv').config({ path: './webhooks/.env' });

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class LocalAPITester {
  constructor() {
    this.results = {
      twilio: { status: 'pending', message: '', details: {} },
      openai: { status: 'pending', message: '', details: {} },
      elevenlabs: { status: 'pending', message: '', details: {} },
      deepgram: { status: 'pending', message: '', details: {} },
      mongodb: { status: 'pending', message: '', details: {} },
      redis: { status: 'pending', message: '', details: {} },
      local_server: { status: 'pending', message: '', details: {} }
    };
  }

  async runAllTests() {
    console.log('🧪 AI Cold Calling System - Local API Testing');
    console.log('==============================================\n');

    const tests = [
      { name: 'Local Server', fn: this.testLocalServer },
      { name: 'MongoDB', fn: this.testMongoDB },
      { name: 'Redis', fn: this.testRedis },
      { name: 'Twilio', fn: this.testTwilio },
      { name: 'OpenAI', fn: this.testOpenAI },
      { name: 'ElevenLabs', fn: this.testElevenLabs },
      { name: 'Deepgram', fn: this.testDeepgram }
    ];

    for (const test of tests) {
      console.log(`🔍 Testing ${test.name}...`);
      try {
        await test.fn.call(this);
        console.log(`✅ ${test.name}: PASSED\n`);
      } catch (error) {
        console.log(`❌ ${test.name}: FAILED - ${error.message}\n`);
      }
    }

    this.printSummary();
    this.generateReport();
  }

  async testLocalServer() {
    try {
      const response = await axios.get('http://localhost:3000/health', {
        timeout: 5000
      });
      
      this.results.local_server = {
        status: 'success',
        message: 'Local server is running',
        details: {
          status: response.status,
          data: response.data
        }
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        this.results.local_server = {
          status: 'warning',
          message: 'Local server not running. Start with: npm run dev',
          details: { error: error.message }
        };
      } else {
        throw error;
      }
    }
  }

  async testMongoDB() {
    try {
      const mongoose = require('mongoose');
      const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-calling-system-dev';
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      
      await mongoose.connection.db.admin().ping();
      
      this.results.mongodb = {
        status: 'success',
        message: 'MongoDB connection successful',
        details: {
          uri: uri.replace(/\/\/.*@/, '//***:***@'), // Hide credentials
          database: mongoose.connection.name
        }
      };
      
      await mongoose.disconnect();
    } catch (error) {
      this.results.mongodb = {
        status: 'error',
        message: 'MongoDB connection failed',
        details: { error: error.message }
      };
      throw error;
    }
  }

  async testRedis() {
    try {
      const redis = require('redis');
      const client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        connectTimeout: 5000
      });

      await client.connect();
      await client.ping();
      
      this.results.redis = {
        status: 'success',
        message: 'Redis connection successful',
        details: {
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        }
      };
      
      await client.disconnect();
    } catch (error) {
      this.results.redis = {
        status: 'warning',
        message: 'Redis connection failed (optional service)',
        details: { error: error.message }
      };
      // Don't throw for Redis as it's optional
    }
  }

  async testTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      this.results.twilio = {
        status: 'warning',
        message: 'Twilio credentials not configured',
        details: { note: 'Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env' }
      };
      return;
    }

    try {
      const twilio = require('twilio');
      const client = twilio(accountSid, authToken);
      
      // Test by fetching account info
      const account = await client.api.accounts(accountSid).fetch();
      
      this.results.twilio = {
        status: 'success',
        message: 'Twilio API connection successful',
        details: {
          accountSid: accountSid,
          accountStatus: account.status,
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not configured'
        }
      };
    } catch (error) {
      this.results.twilio = {
        status: 'error',
        message: 'Twilio API connection failed',
        details: { error: error.message }
      };
      throw error;
    }
  }

  async testOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      this.results.openai = {
        status: 'warning',
        message: 'OpenAI API key not configured',
        details: { note: 'Add OPENAI_API_KEY to .env' }
      };
      return;
    }

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello, this is a test.' }],
        max_tokens: 10
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      this.results.openai = {
        status: 'success',
        message: 'OpenAI API connection successful',
        details: {
          model: 'gpt-3.5-turbo',
          usage: response.data.usage,
          responseTime: response.headers['x-response-time'] || 'N/A'
        }
      };
    } catch (error) {
      this.results.openai = {
        status: 'error',
        message: 'OpenAI API connection failed',
        details: { 
          error: error.response?.data?.error?.message || error.message,
          status: error.response?.status
        }
      };
      throw error;
    }
  }

  async testElevenLabs() {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      this.results.elevenlabs = {
        status: 'warning',
        message: 'ElevenLabs API key not configured',
        details: { note: 'Add ELEVENLABS_API_KEY to .env' }
      };
      return;
    }

    try {
      const response = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey
        },
        timeout: 10000
      });

      this.results.elevenlabs = {
        status: 'success',
        message: 'ElevenLabs API connection successful',
        details: {
          voicesCount: response.data.voices?.length || 0,
          defaultVoiceId: process.env.ELEVENLABS_VOICE_ID || 'Not configured'
        }
      };
    } catch (error) {
      this.results.elevenlabs = {
        status: 'error',
        message: 'ElevenLabs API connection failed',
        details: { 
          error: error.response?.data?.detail || error.message,
          status: error.response?.status
        }
      };
      throw error;
    }
  }

  async testDeepgram() {
    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      this.results.deepgram = {
        status: 'warning',
        message: 'Deepgram API key not configured',
        details: { note: 'Add DEEPGRAM_API_KEY to .env' }
      };
      return;
    }

    try {
      const response = await axios.get('https://api.deepgram.com/v1/projects', {
        headers: {
          'Authorization': `Token ${apiKey}`
        },
        timeout: 10000
      });

      this.results.deepgram = {
        status: 'success',
        message: 'Deepgram API connection successful',
        details: {
          projectsCount: response.data.projects?.length || 0,
          model: process.env.DEEPGRAM_MODEL || 'nova-2'
        }
      };
    } catch (error) {
      this.results.deepgram = {
        status: 'error',
        message: 'Deepgram API connection failed',
        details: { 
          error: error.response?.data?.err_msg || error.message,
          status: error.response?.status
        }
      };
      throw error;
    }
  }

  printSummary() {
    console.log('📊 Test Summary');
    console.log('===============\n');

    const statusCounts = {
      success: 0,
      warning: 0,
      error: 0
    };

    Object.entries(this.results).forEach(([service, result]) => {
      const icon = result.status === 'success' ? '✅' : 
                   result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`${icon} ${service.toUpperCase()}: ${result.message}`);
      statusCounts[result.status]++;
    });

    console.log('\n📈 Overall Status:');
    console.log(`✅ Success: ${statusCounts.success}`);
    console.log(`⚠️  Warning: ${statusCounts.warning}`);
    console.log(`❌ Error: ${statusCounts.error}`);

    if (statusCounts.error === 0) {
      console.log('\n🎉 All critical services are working!');
    } else {
      console.log('\n⚠️  Some services need attention before full functionality.');
    }
  }

  generateReport() {
    const reportPath = path.join(__dirname, '..', 'local-test-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      environment: 'local',
      results: this.results,
      summary: {
        total: Object.keys(this.results).length,
        success: Object.values(this.results).filter(r => r.status === 'success').length,
        warning: Object.values(this.results).filter(r => r.status === 'warning').length,
        error: Object.values(this.results).filter(r => r.status === 'error').length
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new LocalAPITester();
  tester.runAllTests().catch(console.error);
}

module.exports = LocalAPITester;
