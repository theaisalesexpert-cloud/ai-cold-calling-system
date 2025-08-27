// Integration Tests for Call Flow
// Tests the complete call workflow from initiation to completion

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const nock = require('nock');

// Import the app
const app = require('../../twilio-voice-handler');
const Call = require('../../models/Call');
const Lead = require('../../models/Lead');

describe('Call Flow Integration Tests', () => {
  let mongoServer;
  let mongoUri;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Call.deleteMany({});
    await Lead.deleteMany({});
    
    // Clear nock interceptors
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Call Initiation', () => {
    test('should initiate a call successfully', async () => {
      const callData = {
        customer_name: 'John Doe',
        phone_number: '+1234567890',
        car_model: 'Toyota Camry 2023',
        dealership_name: 'Test Dealership',
        bot_name: 'Sarah'
      };

      const response = await request(app)
        .post('/webhook/call/initiate')
        .send(callData)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/xml');
      expect(response.text).toContain('Hi, is this John Doe?');
      expect(response.text).toContain('Toyota Camry 2023');
    });

    test('should validate required fields', async () => {
      const incompleteData = {
        customer_name: 'John Doe'
        // Missing required fields
      };

      await request(app)
        .post('/webhook/call/initiate')
        .send(incompleteData)
        .expect(400);
    });

    test('should check consent before initiating call', async () => {
      const callData = {
        customer_name: 'John Doe',
        phone_number: '+1234567890',
        car_model: 'Toyota Camry 2023',
        dealership_name: 'Test Dealership',
        bot_name: 'Sarah'
      };

      // Mock consent check to return no consent
      jest.spyOn(require('../../middleware/compliance').complianceManager, 'getConsentStatus')
        .mockResolvedValue({
          calls: false,
          marketing: false,
          recording: false
        });

      await request(app)
        .post('/webhook/call/initiate')
        .send(callData)
        .expect(403);
    });
  });

  describe('Customer Response Processing', () => {
    let sessionId;

    beforeEach(async () => {
      // Create a test session
      sessionId = 'test_session_123';
      
      // Mock OpenAI response
      nock('https://api.openai.com')
        .post('/v1/chat/completions')
        .reply(200, {
          choices: [{
            message: {
              content: JSON.stringify({
                text: 'Great! Would you like to schedule an appointment?',
                nextState: 'arrange_appointment',
                shouldContinue: true,
                expectsResponse: true,
                suggestedActions: ['schedule_appointment']
              })
            }
          }]
        });
    });

    test('should process positive customer response', async () => {
      const responseData = {
        SpeechResult: 'Yes, I am still interested',
        CallSid: 'test_call_sid'
      };

      const response = await request(app)
        .post(`/webhook/call/response/${sessionId}`)
        .send(responseData)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/xml');
      expect(response.text).toContain('Great! Would you like to schedule an appointment?');
    });

    test('should handle negative customer response', async () => {
      nock('https://api.openai.com')
        .post('/v1/chat/completions')
        .reply(200, {
          choices: [{
            message: {
              content: JSON.stringify({
                text: 'No problem! Would you be interested in similar cars?',
                nextState: 'offer_similar',
                shouldContinue: true,
                expectsResponse: true,
                suggestedActions: ['offer_similar_cars']
              })
            }
          }]
        });

      const responseData = {
        SpeechResult: 'No, I am not interested anymore',
        CallSid: 'test_call_sid'
      };

      const response = await request(app)
        .post(`/webhook/call/response/${sessionId}`)
        .send(responseData)
        .expect(200);

      expect(response.text).toContain('similar cars');
    });

    test('should handle session not found', async () => {
      const responseData = {
        SpeechResult: 'Yes, I am interested',
        CallSid: 'test_call_sid'
      };

      await request(app)
        .post('/webhook/call/response/nonexistent_session')
        .send(responseData)
        .expect(404);
    });

    test('should extract email from customer response', async () => {
      const responseData = {
        SpeechResult: 'My email is john.doe@example.com',
        CallSid: 'test_call_sid'
      };

      await request(app)
        .post(`/webhook/call/response/${sessionId}`)
        .send(responseData)
        .expect(200);

      // Verify email was extracted (would need to check session data)
    });
  });

  describe('Call Completion', () => {
    test('should handle call completion successfully', async () => {
      // Create a test lead
      const lead = new Lead({
        customerName: 'John Doe',
        phoneNumber: '+1234567890',
        carModel: 'Toyota Camry 2023',
        leadSource: 'website',
        inquiryDate: new Date(),
        status: 'new'
      });
      await lead.save();

      // Mock n8n webhook
      nock('http://localhost:5678')
        .post('/webhook/call-completed')
        .reply(200, { success: true });

      const callData = {
        phone_number: '+1234567890',
        call_duration: 120,
        call_status: 'completed',
        transcript: [
          {
            speaker: 'ai',
            text: 'Hello, is this John?',
            timestamp: new Date()
          },
          {
            speaker: 'customer',
            text: 'Yes, this is John',
            timestamp: new Date()
          }
        ],
        extracted_data: {
          still_interested: 'yes',
          wants_appointment: 'yes'
        },
        call_notes: 'Customer interested in scheduling appointment'
      };

      const response = await request(app)
        .post('/webhook/call-completed')
        .send(callData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify call record was created
      const callRecord = await Call.findOne({ 'business.phoneNumber': '+1234567890' });
      expect(callRecord).toBeTruthy();
      expect(callRecord.duration).toBe(120);
      expect(callRecord.status).toBe('completed');
    });

    test('should update lead status after call', async () => {
      const lead = new Lead({
        customerName: 'Jane Smith',
        phoneNumber: '+1987654321',
        carModel: 'Honda Accord 2023',
        leadSource: 'website',
        inquiryDate: new Date(),
        status: 'new'
      });
      await lead.save();

      const callData = {
        phone_number: '+1987654321',
        call_duration: 90,
        call_status: 'completed',
        extracted_data: {
          still_interested: 'no'
        }
      };

      await request(app)
        .post('/webhook/call-completed')
        .send(callData)
        .expect(200);

      // Verify lead status was updated
      const updatedLead = await Lead.findOne({ phoneNumber: '+1987654321' });
      expect(updatedLead.status).toBe('contacted');
      expect(updatedLead.callAttempts).toBe(1);
    });
  });

  describe('Call Status Updates', () => {
    test('should handle Twilio call status updates', async () => {
      const statusData = {
        CallSid: 'test_call_sid_123',
        CallStatus: 'completed',
        CallDuration: '120',
        From: '+1234567890',
        To: '+1987654321'
      };

      const response = await request(app)
        .post('/webhook/call/status')
        .send(statusData)
        .expect(200);

      expect(response.text).toBe('OK');
    });

    test('should log call status changes', async () => {
      const statusData = {
        CallSid: 'test_call_sid_456',
        CallStatus: 'failed',
        CallDuration: '0',
        From: '+1234567890',
        To: '+1987654321'
      };

      await request(app)
        .post('/webhook/call/status')
        .send(statusData)
        .expect(200);

      // Verify logging occurred (would need to check logs)
    });
  });

  describe('Error Handling', () => {
    test('should handle OpenAI API failures gracefully', async () => {
      const sessionId = 'test_session_error';

      // Mock OpenAI to return an error
      nock('https://api.openai.com')
        .post('/v1/chat/completions')
        .reply(500, { error: 'Internal server error' });

      const responseData = {
        SpeechResult: 'Yes, I am interested',
        CallSid: 'test_call_sid'
      };

      const response = await request(app)
        .post(`/webhook/call/response/${sessionId}`)
        .send(responseData)
        .expect(200);

      // Should return fallback response
      expect(response.text).toContain('technical issue');
    });

    test('should handle database connection failures', async () => {
      // Temporarily close database connection
      await mongoose.disconnect();

      const callData = {
        customer_name: 'John Doe',
        phone_number: '+1234567890',
        car_model: 'Toyota Camry 2023',
        dealership_name: 'Test Dealership',
        bot_name: 'Sarah'
      };

      await request(app)
        .post('/webhook/call/initiate')
        .send(callData)
        .expect(500);

      // Reconnect for other tests
      await mongoose.connect(mongoUri);
    });
  });

  describe('Security and Validation', () => {
    test('should validate Twilio signature', async () => {
      const callData = {
        customer_name: 'John Doe',
        phone_number: '+1234567890',
        car_model: 'Toyota Camry 2023',
        dealership_name: 'Test Dealership',
        bot_name: 'Sarah'
      };

      // Request without proper Twilio signature
      await request(app)
        .post('/webhook/call/initiate')
        .send(callData)
        .expect(401);
    });

    test('should sanitize input data', async () => {
      const maliciousData = {
        customer_name: '<script>alert("xss")</script>John Doe',
        phone_number: '+1234567890',
        car_model: 'Toyota Camry 2023',
        dealership_name: 'Test Dealership',
        bot_name: 'Sarah'
      };

      const response = await request(app)
        .post('/webhook/call/initiate')
        .send(maliciousData)
        .expect(200);

      // Verify script tags were removed
      expect(response.text).not.toContain('<script>');
      expect(response.text).toContain('John Doe');
    });

    test('should enforce rate limiting', async () => {
      const callData = {
        customer_name: 'John Doe',
        phone_number: '+1234567890',
        car_model: 'Toyota Camry 2023',
        dealership_name: 'Test Dealership',
        bot_name: 'Sarah'
      };

      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(15).fill().map(() => 
        request(app)
          .post('/webhook/call/initiate')
          .send(callData)
      );

      const responses = await Promise.all(requests);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Analytics Integration', () => {
    test('should track call metrics', async () => {
      const callData = {
        phone_number: '+1234567890',
        call_duration: 150,
        call_status: 'completed',
        extracted_data: {
          still_interested: 'yes'
        }
      };

      await request(app)
        .post('/webhook/call-completed')
        .send(callData)
        .expect(200);

      // Verify analytics data was recorded
      const analytics = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      expect(analytics.body.overview.totalCalls).toBeGreaterThan(0);
    });
  });
});
