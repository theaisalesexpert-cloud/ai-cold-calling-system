// Simple Local Test Server
// Minimal server for testing the AI calling system locally without external dependencies

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock data for testing
const mockLeads = [
  {
    id: 'lead_1',
    customerName: 'John Doe',
    phoneNumber: '+1234567890',
    carModel: 'Toyota Camry 2023',
    status: 'new',
    priority: 'medium'
  },
  {
    id: 'lead_2',
    customerName: 'Jane Smith',
    phoneNumber: '+1987654321',
    carModel: 'Honda Accord 2023',
    status: 'contacted',
    priority: 'high'
  }
];

const mockCalls = [
  {
    sessionId: 'call_123',
    customerName: 'John Doe',
    phoneNumber: '+1234567890',
    status: 'completed',
    duration: 180,
    outcome: 'appointment_scheduled'
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: 'local-test',
    timestamp: new Date().toISOString(),
    message: 'AI Cold Calling System - Local Test Server',
    services: {
      server: 'running',
      database: process.env.MONGODB_URI ? 'configured' : 'not configured',
      twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'not configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured',
      elevenlabs: process.env.ELEVENLABS_API_KEY ? 'configured' : 'not configured',
      deepgram: process.env.DEEPGRAM_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: 'Local test server is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    apis: {
      twilio: process.env.TWILIO_ACCOUNT_SID ? 'configured' : 'missing TWILIO_ACCOUNT_SID',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing OPENAI_API_KEY',
      elevenlabs: process.env.ELEVENLABS_API_KEY ? 'configured' : 'missing ELEVENLABS_API_KEY',
      deepgram: process.env.DEEPGRAM_API_KEY ? 'configured' : 'missing DEEPGRAM_API_KEY'
    },
    next_steps: [
      'Add your API keys to the .env file',
      'Run: npm run test-local to test API connections',
      'Run: npm run dev to start the full application'
    ]
  });
});

// Mock call initiation endpoint
app.post('/webhook/call/initiate', (req, res) => {
  const { customer_name, phone_number, car_model, dealership_name, bot_name } = req.body;
  
  if (!customer_name || !phone_number || !car_model) {
    return res.status(400).json({
      error: 'Missing required fields: customer_name, phone_number, car_model'
    });
  }

  // Generate mock TwiML response
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hi, is this ${customer_name}? Hi ${customer_name}, this is ${bot_name || 'Sarah'} calling from ${dealership_name || 'Test Dealership'}. You recently enquired about the ${car_model} — is now a good time to talk?</Say>
  <Gather input="speech" timeout="10" speechTimeout="3" action="/webhook/call/response/mock_session_${Date.now()}">
  </Gather>
</Response>`;

  res.set('Content-Type', 'text/xml');
  res.send(twiml);
});

// Mock customer response endpoint
app.post('/webhook/call/response/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const { SpeechResult } = req.body;
  
  console.log(`Mock call response - Session: ${sessionId}, Speech: ${SpeechResult}`);
  
  // Generate mock AI response based on input
  let response = "Thank you for your response. ";
  
  if (SpeechResult && SpeechResult.toLowerCase().includes('yes')) {
    response += "Great! Would you like to schedule an appointment to see the car?";
  } else if (SpeechResult && SpeechResult.toLowerCase().includes('no')) {
    response += "No problem! Would you be interested in hearing about similar cars we have available?";
  } else {
    response += "I understand. Is there anything specific you'd like to know about the car?";
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${response}</Say>
  <Gather input="speech" timeout="10" speechTimeout="3" action="/webhook/call/response/${sessionId}">
  </Gather>
</Response>`;

  res.set('Content-Type', 'text/xml');
  res.send(twiml);
});

// Mock analytics endpoints
app.get('/api/analytics/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      overview: {
        totalCalls: 25,
        totalLeads: 15,
        conversionRate: 12.5,
        averageCallDuration: 145,
        successRate: 78.2
      },
      calls: {
        completedCalls: 20,
        appointmentsScheduled: 3,
        interestedInSimilar: 5,
        averageSentiment: 0.15
      },
      performance: {
        averageAiResponseTime: 1250,
        averageTtsLatency: 800,
        averageSttLatency: 650,
        overallPerformanceScore: 92
      }
    }
  });
});

app.get('/api/analytics/realtime', (req, res) => {
  res.json({
    success: true,
    data: {
      activeCalls: Math.floor(Math.random() * 5),
      recentCalls: Math.floor(Math.random() * 20),
      systemHealth: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
        }
      },
      timestamp: new Date().toISOString()
    }
  });
});

// Mock leads endpoints
app.get('/api/leads', (req, res) => {
  res.json({
    success: true,
    data: mockLeads,
    pagination: {
      total: mockLeads.length,
      page: 1,
      limit: 10
    }
  });
});

app.get('/api/leads/for-calling', (req, res) => {
  const availableLeads = mockLeads.filter(lead => lead.status === 'new');
  res.json({
    success: true,
    data: availableLeads
  });
});

// Mock calls endpoints
app.get('/api/calls', (req, res) => {
  res.json({
    success: true,
    data: mockCalls
  });
});

// Mock voice services endpoints
app.get('/api/voice/status', (req, res) => {
  res.json({
    success: true,
    data: {
      elevenlabs: !!process.env.ELEVENLABS_API_KEY,
      deepgram: !!process.env.DEEPGRAM_API_KEY,
      elevenLabsResponseTime: 245,
      deepgramResponseTime: 180,
      performance: {
        ttsRequests: 50,
        sttRequests: 45,
        averageTtsTime: 800,
        averageSttTime: 650,
        errors: 2
      },
      cache: {
        size: 15,
        maxSize: 100
      }
    }
  });
});

// Mock TTS endpoint
app.post('/api/voice/tts', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      error: { message: 'Text is required' }
    });
  }

  res.json({
    success: true,
    data: {
      audioUrl: `http://localhost:${PORT}/mock-audio/${encodeURIComponent(text)}.mp3`,
      duration: text.length * 0.1, // Mock duration based on text length
      size: text.length * 100, // Mock file size
      format: 'mp3'
    }
  });
});

// Serve static files for testing
app.use('/static', express.static(path.join(__dirname, 'public')));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'This is a local test server. Available endpoints:',
    endpoints: [
      'GET /health - Health check',
      'GET /test - Test configuration',
      'POST /webhook/call/initiate - Mock call initiation',
      'GET /api/analytics/dashboard - Mock analytics',
      'GET /api/leads - Mock leads data',
      'GET /api/voice/status - Mock voice services status'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 AI Cold Calling System - Local Test Server');
  console.log('==============================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log('\n📋 Available endpoints:');
  console.log('  GET  /health - Health check');
  console.log('  GET  /test - Configuration test');
  console.log('  POST /webhook/call/initiate - Mock call initiation');
  console.log('  GET  /api/analytics/dashboard - Mock analytics');
  console.log('  GET  /api/leads - Mock leads data');
  console.log('  GET  /api/voice/status - Voice services status');
  console.log('\n💡 Next steps:');
  console.log('  1. Visit http://localhost:3000/test to check configuration');
  console.log('  2. Add your API keys to webhooks/.env');
  console.log('  3. Run: npm run test-local to test API connections');
  console.log('  4. Run: npm run dev for full application');
  console.log('\n');
});

module.exports = app;
