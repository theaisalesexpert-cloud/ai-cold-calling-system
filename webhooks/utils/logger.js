// Enhanced Logging System
// Provides structured logging with different levels and outputs

const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += ` | Meta: ${JSON.stringify(meta)}`;
    }
    
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'ai-calling-system' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Call-specific logs
    new winston.transports.File({
      filename: path.join(logsDir, 'calls.log'),
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    })
  ],
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Enhanced logging methods
const enhancedLogger = {
  // Standard logging methods
  error: (message, meta = {}) => logger.error(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  info: (message, meta = {}) => logger.info(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  
  // Call-specific logging
  callStart: (sessionId, customerData) => {
    logger.info('Call initiated', {
      sessionId,
      customer: customerData.customer_name,
      phone: customerData.phone_number,
      car_model: customerData.car_model,
      event: 'call_start'
    });
  },
  
  callEnd: (sessionId, duration, outcome) => {
    logger.info('Call completed', {
      sessionId,
      duration,
      outcome,
      event: 'call_end'
    });
  },
  
  conversationStep: (sessionId, step, customerResponse, aiResponse) => {
    logger.info('Conversation step', {
      sessionId,
      step,
      customerResponse,
      aiResponse: aiResponse.substring(0, 100) + '...',
      event: 'conversation_step'
    });
  },
  
  // API call logging
  apiCall: (service, endpoint, duration, success, error = null) => {
    const level = success ? 'info' : 'error';
    logger[level](`API call to ${service}`, {
      service,
      endpoint,
      duration,
      success,
      error: error?.message,
      event: 'api_call'
    });
  },
  
  // Performance logging
  performance: (operation, duration, metadata = {}) => {
    logger.info(`Performance: ${operation}`, {
      operation,
      duration,
      ...metadata,
      event: 'performance'
    });
  },
  
  // Security logging
  security: (event, details) => {
    logger.warn(`Security event: ${event}`, {
      event: 'security',
      securityEvent: event,
      ...details
    });
  }
};

module.exports = enhancedLogger;
