const request = require('supertest');
const app = require('../src/server');

describe('Health Check Endpoints', () => {
  describe('GET /health', () => {
    it('should return basic health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('GET /health/detailed', () => {
    it('should return detailed health status', async () => {
      const response = await request(app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('server');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('googleSheets');
      expect(response.body.services).toHaveProperty('email');
      expect(response.body.services).toHaveProperty('twilio');
      expect(response.body.services).toHaveProperty('openai');
    });
  });

  describe('GET /health/ready', () => {
    it('should return readiness status', async () => {
      const response = await request(app)
        .get('/health/ready');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /health/live', () => {
    it('should return liveness status', async () => {
      const response = await request(app)
        .get('/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /health/metrics', () => {
    it('should return system metrics', async () => {
      const response = await request(app)
        .get('/health/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('application');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.system).toHaveProperty('uptime');
      expect(response.body.system).toHaveProperty('memory');
    });
  });

  describe('GET /health/config', () => {
    it('should return configuration status', async () => {
      const response = await request(app)
        .get('/health/config')
        .expect(200);

      expect(response.body).toHaveProperty('environment');
      expect(response.body).toHaveProperty('services');
      expect(response.body).toHaveProperty('features');
      expect(response.body).toHaveProperty('limits');
    });
  });
});
