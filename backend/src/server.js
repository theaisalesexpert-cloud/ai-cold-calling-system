const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const { errorHandler } = require('./utils/errorHandler');
const twilioRoutes = require('./controllers/twilioController');
const callRoutes = require('./controllers/callController');
const sheetsRoutes = require('./controllers/sheetsController');
const healthRoutes = require('./controllers/healthController');
const audioRoutes = require('./controllers/audioController');

const app = express();
const PORT = process.env.PORT || 3000;

// Log startup information
logger.info('Starting AI Cold-Calling System', {
  nodeVersion: process.version,
  environment: process.env.NODE_ENV,
  port: PORT
});

// Check critical environment variables
const requiredEnvVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'OPENAI_API_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables', { missingEnvVars });
  logger.info('The application will start but some features may not work properly');
}

// Log optional environment variables status
const optionalEnvVars = {
  'GMAIL_USER': !!process.env.GMAIL_USER,
  'GMAIL_APP_PASSWORD': !!process.env.GMAIL_APP_PASSWORD,
  'GOOGLE_SHEETS_ID': !!process.env.GOOGLE_SHEETS_ID,
  'ELEVENLABS_API_KEY': !!process.env.ELEVENLABS_API_KEY,
  'DEEPGRAM_API_KEY': !!process.env.DEEPGRAM_API_KEY
};

logger.info('Optional services configuration', optionalEnvVars);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN?.split(','),
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/health', healthRoutes);
app.use('/webhook/twilio', twilioRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/sheets', sheetsRoutes);
app.use('/audio', audioRoutes);

// Root endpoint
app.get('/', (_, res) => {
  res.json({
    message: 'AI Cold-Calling System API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      twilio_webhook: '/webhook/twilio',
      calls: '/api/calls',
      sheets: '/api/sheets'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 AI Cold-Calling System started on port ${PORT}`);
  logger.info(`📱 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Base URL: ${process.env.BASE_URL || `http://localhost:${PORT}`}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
