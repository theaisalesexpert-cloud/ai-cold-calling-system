const request = require('supertest');
const app = require('../../src/server');

describe('API Integration Tests', () => {
  const apiKey = process.env.API_KEY || 'test-api-key';
  
  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      await request(app)
        .get('/api/calls/statistics')
        .expect(401);
    });

    it('should accept requests with valid API key', async () => {
      await request(app)
        .get('/api/calls/statistics')
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(200);
    });
  });

  describe('Call Management API', () => {
    describe('GET /api/calls/statistics', () => {
      it('should return call statistics', async () => {
        const response = await request(app)
          .get('/api/calls/statistics')
          .set('Authorization', `Bearer ${apiKey}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('sheets');
        expect(response.body.data).toHaveProperty('conversations');
      });
    });

    describe('GET /api/calls/customers/ready', () => {
      it('should return customers ready for calling', async () => {
        const response = await request(app)
          .get('/api/calls/customers/ready')
          .set('Authorization', `Bearer ${apiKey}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('customers');
        expect(response.body.data).toHaveProperty('count');
        expect(Array.isArray(response.body.data.customers)).toBe(true);
      });
    });

    describe('POST /api/calls/test', () => {
      it('should initiate a test call', async () => {
        const response = await request(app)
          .post('/api/calls/test')
          .set('Authorization', `Bearer ${apiKey}`)
          .send({
            phoneNumber: '+1234567890'
          })
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('callSid');
      });

      it('should reject invalid phone numbers', async () => {
        await request(app)
          .post('/api/calls/test')
          .set('Authorization', `Bearer ${apiKey}`)
          .send({
            phoneNumber: 'invalid-number'
          })
          .expect(400);
      });
    });

    describe('GET /api/calls/active', () => {
      it('should return active calls information', async () => {
        const response = await request(app)
          .get('/api/calls/active')
          .set('Authorization', `Bearer ${apiKey}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('activeCount');
        expect(typeof response.body.data.activeCount).toBe('number');
      });
    });
  });

  describe('Google Sheets API', () => {
    describe('GET /api/sheets/test', () => {
      it('should test Google Sheets connection', async () => {
        const response = await request(app)
          .get('/api/sheets/test')
          .set('Authorization', `Bearer ${apiKey}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('data');
      });
    });

    describe('GET /api/sheets/customers', () => {
      it('should return customer data', async () => {
        const response = await request(app)
          .get('/api/sheets/customers')
          .set('Authorization', `Bearer ${apiKey}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('customers');
        expect(response.body.data).toHaveProperty('count');
        expect(Array.isArray(response.body.data.customers)).toBe(true);
      });
    });

    describe('GET /api/sheets/statistics', () => {
      it('should return sheets statistics', async () => {
        const response = await request(app)
          .get('/api/sheets/statistics')
          .set('Authorization', `Bearer ${apiKey}`)
          .expect(200);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('total');
        expect(typeof response.body.data.total).toBe('number');
      });
    });

    describe('POST /api/sheets/customers', () => {
      it('should add a new customer', async () => {
        const newCustomer = {
          name: 'Test Customer',
          phone: '+1234567890',
          email: 'test@example.com',
          carModel: '2023 Test Car',
          status: 'new'
        };

        const response = await request(app)
          .post('/api/sheets/customers')
          .set('Authorization', `Bearer ${apiKey}`)
          .send(newCustomer)
          .expect(201);

        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toHaveProperty('customerId');
      });

      it('should reject customers without required fields', async () => {
        const invalidCustomer = {
          email: 'test@example.com'
          // Missing name and phone
        };

        await request(app)
          .post('/api/sheets/customers')
          .set('Authorization', `Bearer ${apiKey}`)
          .send(invalidCustomer)
          .expect(400);
      });
    });
  });

  describe('Twilio Webhooks', () => {
    describe('GET /webhook/twilio/test', () => {
      it('should return webhook test response', async () => {
        const response = await request(app)
          .get('/webhook/twilio/test')
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('activeConversations');
      });
    });

    describe('POST /webhook/twilio/voice', () => {
      it('should handle voice webhook', async () => {
        const twilioData = {
          CallSid: 'CA1234567890abcdef',
          From: '+1234567890',
          To: '+1987654321'
        };

        const response = await request(app)
          .post('/webhook/twilio/voice')
          .send(twilioData)
          .expect(200);

        expect(response.headers['content-type']).toMatch(/xml/);
        expect(response.text).toContain('<Response>');
      });
    });

    describe('POST /webhook/twilio/status', () => {
      it('should handle status webhook', async () => {
        const statusData = {
          CallSid: 'CA1234567890abcdef',
          CallStatus: 'completed',
          CallDuration: '180',
          From: '+1234567890',
          To: '+1987654321'
        };

        await request(app)
          .post('/webhook/twilio/status')
          .send(statusData)
          .expect(200);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 errors', async () => {
      const response = await request(app)
        .get('/api/nonexistent-endpoint')
        .set('Authorization', `Bearer ${apiKey}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle rate limiting', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const requests = Array(10).fill().map(() =>
        request(app)
          .get('/api/calls/statistics')
          .set('Authorization', `Bearer ${apiKey}`)
      );

      const responses = await Promise.all(requests);
      
      // At least some requests should succeed
      const successfulRequests = responses.filter(r => r.status === 200);
      expect(successfulRequests.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    it('should validate phone number format', async () => {
      const invalidPhoneNumbers = [
        '1234567890',      // Missing country code
        '+123',            // Too short
        'not-a-number',    // Invalid format
        ''                 // Empty
      ];

      for (const phoneNumber of invalidPhoneNumbers) {
        await request(app)
          .post('/api/calls/test')
          .set('Authorization', `Bearer ${apiKey}`)
          .send({ phoneNumber })
          .expect(400);
      }
    });

    it('should validate email format in customer creation', async () => {
      const invalidCustomer = {
        name: 'Test Customer',
        phone: '+1234567890',
        email: 'invalid-email',
        carModel: '2023 Test Car'
      };

      await request(app)
        .post('/api/sheets/customers')
        .set('Authorization', `Bearer ${apiKey}`)
        .send(invalidCustomer)
        .expect(400);
    });
  });
});
