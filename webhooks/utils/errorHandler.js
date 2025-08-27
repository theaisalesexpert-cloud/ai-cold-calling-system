// Enhanced Error Handling System
// Provides centralized error handling with proper logging and user-friendly responses

const logger = require('./logger');

class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
    this.type = 'validation';
  }
}

class APIError extends AppError {
  constructor(service, message, originalError = null) {
    super(`${service} API Error: ${message}`, 502);
    this.service = service;
    this.originalError = originalError;
    this.type = 'api';
  }
}

class CallError extends AppError {
  constructor(message, sessionId = null, phase = null) {
    super(message, 500);
    this.sessionId = sessionId;
    this.phase = phase;
    this.type = 'call';
  }
}

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  logger.error('Error occurred', {
    error: error.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ValidationError(message.join(', '));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new AppError(message, 401);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new AppError(message, 401);
  }

  // Twilio errors
  if (err.code && err.code.toString().startsWith('2')) {
    error = new APIError('Twilio', err.message, err);
  }

  // OpenAI errors
  if (err.response && err.response.data && err.response.data.error) {
    error = new APIError('OpenAI', err.response.data.error.message, err);
  }

  // ElevenLabs errors
  if (err.response && err.config && err.config.url && err.config.url.includes('elevenlabs')) {
    error = new APIError('ElevenLabs', err.message, err);
  }

  // Deepgram errors
  if (err.response && err.config && err.config.url && err.config.url.includes('deepgram')) {
    error = new APIError('Deepgram', err.message, err);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      type: error.type || 'server',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Graceful shutdown handler
const gracefulShutdown = (server) => {
  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Graceful shutdown initiated.`);
    
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

// Unhandled promise rejection handler
process.on('unhandledRejection', (err, promise) => {
  logger.error('Unhandled Promise Rejection', {
    error: err.message,
    stack: err.stack,
    promise: promise
  });
  
  // Close server & exit process
  process.exit(1);
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack
  });
  
  process.exit(1);
});

module.exports = {
  AppError,
  ValidationError,
  APIError,
  CallError,
  errorHandler,
  asyncHandler,
  gracefulShutdown
};
