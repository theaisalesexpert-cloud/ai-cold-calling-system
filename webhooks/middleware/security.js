// Security Middleware
// Comprehensive security measures for the AI calling system

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const config = require('../utils/config');
const { ValidationError, AppError } = require('../utils/errorHandler');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.security('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.path,
        method: req.method
      });
      
      res.status(429).json({
        success: false,
        error: {
          message,
          type: 'rate_limit',
          retryAfter: Math.round(windowMs / 1000)
        }
      });
    }
  });
};

// Different rate limits for different endpoints
const rateLimiters = {
  // General API rate limiting
  general: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // limit each IP to 100 requests per windowMs
    'Too many requests from this IP, please try again later'
  ),
  
  // Stricter rate limiting for call initiation
  callInitiation: createRateLimiter(
    60 * 1000, // 1 minute
    10, // limit each IP to 10 call initiations per minute
    'Too many call initiation requests, please try again later'
  ),
  
  // Very strict rate limiting for authentication
  auth: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // limit each IP to 5 auth attempts per 15 minutes
    'Too many authentication attempts, please try again later'
  )
};

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.elevenlabs.io", "https://api.deepgram.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request validation middleware
const validateRequest = (req, res, next) => {
  // Check for required headers
  const requiredHeaders = ['user-agent', 'content-type'];
  for (const header of requiredHeaders) {
    if (!req.get(header)) {
      logger.security('Missing required header', {
        header,
        ip: req.ip,
        endpoint: req.path
      });
      return res.status(400).json({
        success: false,
        error: {
          message: `Missing required header: ${header}`,
          type: 'validation'
        }
      });
    }
  }

  // Validate content type for POST requests
  if (req.method === 'POST' && !req.is('application/json') && !req.is('application/x-www-form-urlencoded')) {
    logger.security('Invalid content type', {
      contentType: req.get('content-type'),
      ip: req.ip,
      endpoint: req.path
    });
    return res.status(400).json({
      success: false,
      error: {
        message: 'Invalid content type',
        type: 'validation'
      }
    });
  }

  next();
};

// IP whitelist middleware
const ipWhitelist = (req, res, next) => {
  const allowedIPs = process.env.ALLOWED_IPS ? process.env.ALLOWED_IPS.split(',') : [];
  
  if (allowedIPs.length > 0) {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      logger.security('IP not whitelisted', {
        ip: clientIP,
        endpoint: req.path,
        userAgent: req.get('User-Agent')
      });
      
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied',
          type: 'authorization'
        }
      });
    }
  }
  
  next();
};

// Twilio webhook signature verification
const verifyTwilioSignature = (req, res, next) => {
  const twilioSignature = req.get('X-Twilio-Signature');
  
  if (!twilioSignature) {
    logger.security('Missing Twilio signature', {
      ip: req.ip,
      endpoint: req.path
    });
    return res.status(401).json({
      success: false,
      error: {
        message: 'Missing Twilio signature',
        type: 'authentication'
      }
    });
  }

  const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
  const body = req.rawBody || '';
  
  const expectedSignature = crypto
    .createHmac('sha1', config.getTwilioConfig().authToken)
    .update(url + body)
    .digest('base64');

  if (twilioSignature !== `sha1=${expectedSignature}`) {
    logger.security('Invalid Twilio signature', {
      ip: req.ip,
      endpoint: req.path,
      expectedSignature: `sha1=${expectedSignature}`,
      receivedSignature: twilioSignature
    });
    
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid signature',
        type: 'authentication'
      }
    });
  }

  next();
};

// JWT authentication middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.get('Authorization');
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Access token required',
        type: 'authentication'
      }
    });
  }

  jwt.verify(token, config.getSecurityConfig().jwtSecret, (err, user) => {
    if (err) {
      logger.security('Invalid JWT token', {
        ip: req.ip,
        endpoint: req.path,
        error: err.message
      });
      
      return res.status(403).json({
        success: false,
        error: {
          message: 'Invalid or expired token',
          type: 'authentication'
        }
      });
    }

    req.user = user;
    next();
  });
};

// API key authentication middleware
const authenticateAPIKey = (req, res, next) => {
  const apiKey = req.get('X-API-Key') || req.query.api_key;
  const validAPIKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'API key required',
        type: 'authentication'
      }
    });
  }

  if (!validAPIKeys.includes(apiKey)) {
    logger.security('Invalid API key', {
      ip: req.ip,
      endpoint: req.path,
      apiKey: apiKey.substring(0, 8) + '...'
    });
    
    return res.status(401).json({
      success: false,
      error: {
        message: 'Invalid API key',
        type: 'authentication'
      }
    });
  }

  next();
};

// Request sanitization middleware
const sanitizeRequest = (req, res, next) => {
  // Sanitize query parameters
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = req.query[key]
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
    }
  }

  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

function sanitizeObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key]
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '')
        .trim();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = config.getSecurityConfig().corsOrigins;
    
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.security('CORS origin blocked', { origin, ip: req?.ip });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Twilio-Signature'],
  maxAge: 86400 // 24 hours
};

// Security audit logging
const auditLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('Request audit', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('Content-Length'),
      referer: req.get('Referer')
    });

    // Log security events
    if (res.statusCode === 401 || res.statusCode === 403) {
      logger.security('Unauthorized access attempt', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        statusCode: res.statusCode
      });
    }
  });

  next();
};

// Generate secure session ID
const generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash sensitive data
const hashData = (data, salt = null) => {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt: actualSalt };
};

// Verify hashed data
const verifyHash = (data, hash, salt) => {
  const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// Encrypt sensitive data
const encryptData = (data) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(config.getSecurityConfig().jwtSecret, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('additional data'));
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

// Decrypt sensitive data
const decryptData = (encryptedData) => {
  const algorithm = 'aes-256-gcm';
  const key = crypto.scryptSync(config.getSecurityConfig().jwtSecret, 'salt', 32);
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAAD(Buffer.from('additional data'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

module.exports = {
  rateLimiters,
  securityHeaders,
  validateRequest,
  ipWhitelist,
  verifyTwilioSignature,
  authenticateJWT,
  authenticateAPIKey,
  sanitizeRequest,
  corsOptions,
  auditLogger,
  generateSessionId,
  hashData,
  verifyHash,
  encryptData,
  decryptData
};
