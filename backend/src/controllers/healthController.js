const express = require('express');
const { catchAsync } = require('../utils/errorHandler');
const twilioService = require('../services/twilioService');
const googleSheetsService = require('../services/googleSheetsService');
const emailService = require('../services/emailService');
const conversationService = require('../services/conversationService');

const router = express.Router();

/**
 * Basic health check
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

/**
 * Detailed health check with service status
 */
router.get('/detailed', catchAsync(async (req, res) => {
  const healthChecks = {
    server: {
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    },
    services: {}
  };

  // Check Google Sheets service
  try {
    await googleSheetsService.validateSheetStructure();
    healthChecks.services.googleSheets = {
      status: 'healthy',
      message: 'Connection successful'
    };
  } catch (error) {
    healthChecks.services.googleSheets = {
      status: 'unhealthy',
      message: error.message
    };
  }

  // Check Email service
  try {
    await emailService.testEmailConfiguration();
    healthChecks.services.email = {
      status: 'healthy',
      message: 'Configuration valid'
    };
  } catch (error) {
    healthChecks.services.email = {
      status: 'unhealthy',
      message: error.message
    };
  }

  // Check Twilio service (basic validation)
  try {
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      healthChecks.services.twilio = {
        status: 'healthy',
        message: 'Configuration present'
      };
    } else {
      healthChecks.services.twilio = {
        status: 'unhealthy',
        message: 'Missing configuration'
      };
    }
  } catch (error) {
    healthChecks.services.twilio = {
      status: 'unhealthy',
      message: error.message
    };
  }

  // Check OpenAI service
  try {
    if (process.env.OPENAI_API_KEY) {
      healthChecks.services.openai = {
        status: 'healthy',
        message: 'API key configured'
      };
    } else {
      healthChecks.services.openai = {
        status: 'unhealthy',
        message: 'Missing API key'
      };
    }
  } catch (error) {
    healthChecks.services.openai = {
      status: 'unhealthy',
      message: error.message
    };
  }

  // Check conversation service
  try {
    const stats = conversationService.getConversationStats();
    healthChecks.services.conversations = {
      status: 'healthy',
      message: 'Service operational',
      activeConversations: stats.active
    };
  } catch (error) {
    healthChecks.services.conversations = {
      status: 'unhealthy',
      message: error.message
    };
  }

  // Determine overall health
  const unhealthyServices = Object.values(healthChecks.services)
    .filter(service => service.status === 'unhealthy');
  
  const overallStatus = unhealthyServices.length === 0 ? 'healthy' : 'degraded';

  res.json({
    status: overallStatus,
    ...healthChecks,
    unhealthyServices: unhealthyServices.length
  });
}));

/**
 * Readiness check (for Kubernetes/Docker)
 */
router.get('/ready', catchAsync(async (req, res) => {
  try {
    // Check critical services
    await googleSheetsService.validateSheetStructure();
    
    res.json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * Liveness check (for Kubernetes/Docker)
 */
router.get('/live', (req, res) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * System metrics
 */
router.get('/metrics', catchAsync(async (req, res) => {
  const metrics = {
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version
    },
    application: {
      activeConversations: conversationService.getActiveConversationsCount(),
      conversationStats: conversationService.getConversationStats()
    },
    timestamp: new Date().toISOString()
  };

  // Add Google Sheets stats if available
  try {
    const sheetsStats = await googleSheetsService.getCallStatistics();
    metrics.application.sheetsStats = sheetsStats;
  } catch (error) {
    metrics.application.sheetsStats = { error: error.message };
  }

  res.json(metrics);
}));

/**
 * Configuration check (without sensitive data)
 */
router.get('/config', (req, res) => {
  const config = {
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    baseUrl: process.env.BASE_URL,
    services: {
      twilio: {
        configured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
        phoneNumber: process.env.TWILIO_PHONE_NUMBER ? '***configured***' : 'missing'
      },
      openai: {
        configured: !!process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'default'
      },
      googleSheets: {
        configured: !!(process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL),
        sheetsId: process.env.GOOGLE_SHEETS_ID ? '***configured***' : 'missing'
      },
      email: {
        configured: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
        user: process.env.GMAIL_USER || 'not configured'
      },
      elevenlabs: {
        configured: !!process.env.ELEVENLABS_API_KEY
      },
      deepgram: {
        configured: !!process.env.DEEPGRAM_API_KEY
      }
    },
    features: {
      cors: process.env.ENABLE_CORS === 'true',
      debug: process.env.DEBUG === 'true',
      conversationLogging: process.env.ENABLE_CONVERSATION_LOGGING === 'true'
    },
    limits: {
      maxCallDuration: process.env.MAX_CALL_DURATION || 300,
      conversationTimeout: process.env.CONVERSATION_TIMEOUT || 30000,
      maxConversationTurns: process.env.MAX_CONVERSATION_TURNS || 20
    }
  };

  res.json(config);
});

/**
 * Database/Storage health (for future expansion)
 */
router.get('/storage', catchAsync(async (req, res) => {
  const storageHealth = {
    googleSheets: {
      status: 'unknown',
      message: 'Not tested'
    }
  };

  // Test Google Sheets connection
  try {
    const customers = await googleSheetsService.getCustomerData();
    storageHealth.googleSheets = {
      status: 'healthy',
      message: 'Connection successful',
      recordCount: customers.length
    };
  } catch (error) {
    storageHealth.googleSheets = {
      status: 'unhealthy',
      message: error.message
    };
  }

  const overallStatus = Object.values(storageHealth)
    .every(service => service.status === 'healthy') ? 'healthy' : 'degraded';

  res.json({
    status: overallStatus,
    storage: storageHealth,
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
