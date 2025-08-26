// Configuration Management System
// Centralized configuration with validation and environment-specific settings

require('dotenv').config();
const { validateEnv } = require('./validation');
const logger = require('./logger');

class ConfigManager {
  constructor() {
    this.config = {};
    this.loadConfiguration();
    this.validateConfiguration();
  }

  loadConfiguration() {
    // Server configuration
    this.config.server = {
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || '0.0.0.0',
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info'
    };

    // Twilio configuration
    this.config.twilio = {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
      webhookUrl: process.env.WEBHOOK_BASE_URL,
      statusCallbackUrl: `${process.env.WEBHOOK_BASE_URL}/webhook/call/status`
    };

    // AI Services configuration
    this.config.ai = {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 200,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
      },
      elevenlabs: {
        apiKey: process.env.ELEVENLABS_API_KEY,
        voiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
        model: process.env.ELEVENLABS_MODEL || 'eleven_monolingual_v1',
        stability: parseFloat(process.env.ELEVENLABS_STABILITY) || 0.75,
        similarityBoost: parseFloat(process.env.ELEVENLABS_SIMILARITY_BOOST) || 0.75
      },
      deepgram: {
        apiKey: process.env.DEEPGRAM_API_KEY,
        model: process.env.DEEPGRAM_MODEL || 'nova-2',
        language: process.env.DEEPGRAM_LANGUAGE || 'en-US'
      }
    };

    // Database configuration
    this.config.database = {
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-calling-system',
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
          serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 5000
        }
      },
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB) || 0
      }
    };

    // Google Services configuration
    this.config.google = {
      sheets: {
        id: process.env.GOOGLE_SHEETS_ID,
        credentialsPath: process.env.GOOGLE_CREDENTIALS_PATH || './config/google-credentials.json'
      }
    };

    // Email configuration
    this.config.email = {
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        password: process.env.SMTP_PASS
      }
    };

    // n8n configuration
    this.config.n8n = {
      webhookUrl: process.env.N8N_WEBHOOK_URL,
      apiKey: process.env.N8N_API_KEY
    };

    // Business configuration
    this.config.business = {
      dealershipName: process.env.DEALERSHIP_NAME || 'Your Dealership',
      botName: process.env.BOT_NAME || 'Sarah',
      defaultRepName: process.env.DEFAULT_REP_NAME || 'Sarah from Your Dealership',
      timezone: process.env.TIMEZONE || 'America/New_York',
      businessHours: {
        start: process.env.BUSINESS_HOURS_START || '09:00',
        end: process.env.BUSINESS_HOURS_END || '17:00',
        days: (process.env.BUSINESS_DAYS || 'monday,tuesday,wednesday,thursday,friday').split(',')
      }
    };

    // Security configuration
    this.config.security = {
      jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
      jwtExpire: process.env.JWT_EXPIRE || '30d',
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
    };

    // Call configuration
    this.config.calling = {
      maxCallDuration: parseInt(process.env.MAX_CALL_DURATION) || 300, // 5 minutes
      speechTimeout: parseInt(process.env.SPEECH_TIMEOUT) || 3,
      gatherTimeout: parseInt(process.env.GATHER_TIMEOUT) || 10,
      maxRetries: parseInt(process.env.MAX_CALL_RETRIES) || 3,
      retryDelay: parseInt(process.env.RETRY_DELAY) || 3600000, // 1 hour
      recordCalls: process.env.RECORD_CALLS === 'true'
    };

    // Performance configuration
    this.config.performance = {
      cacheEnabled: process.env.CACHE_ENABLED !== 'false',
      cacheTtl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
      compressionEnabled: process.env.COMPRESSION_ENABLED !== 'false',
      requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000 // 30 seconds
    };
  }

  validateConfiguration() {
    try {
      validateEnv();
      logger.info('Configuration validation passed');
    } catch (error) {
      logger.error('Configuration validation failed', { error: error.message });
      throw error;
    }
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj && obj[key], this.config);
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.config);
    target[lastKey] = value;
  }

  isDevelopment() {
    return this.config.server.environment === 'development';
  }

  isProduction() {
    return this.config.server.environment === 'production';
  }

  isTest() {
    return this.config.server.environment === 'test';
  }

  getAll() {
    return { ...this.config };
  }

  // Get configuration for specific service
  getTwilioConfig() {
    return this.config.twilio;
  }

  getAIConfig() {
    return this.config.ai;
  }

  getDatabaseConfig() {
    return this.config.database;
  }

  getBusinessConfig() {
    return this.config.business;
  }

  getSecurityConfig() {
    return this.config.security;
  }

  getCallingConfig() {
    return this.config.calling;
  }
}

// Create singleton instance
const configManager = new ConfigManager();

module.exports = configManager;
