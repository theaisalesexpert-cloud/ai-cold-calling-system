// Input Validation System
// Provides comprehensive validation for all API inputs

const Joi = require('joi');
const { ValidationError } = require('./errorHandler');

// Phone number validation regex (international format)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// Email validation schema
const emailSchema = Joi.string().email().required();

// Phone validation schema
const phoneSchema = Joi.string().pattern(phoneRegex).required();

// Validation schemas
const schemas = {
  // Call initiation validation
  callInitiation: Joi.object({
    customer_name: Joi.string().min(2).max(100).required(),
    phone_number: phoneSchema,
    car_model: Joi.string().min(2).max(100).required(),
    dealership_name: Joi.string().min(2).max(100).required(),
    bot_name: Joi.string().min(2).max(50).optional().default('Sarah'),
    priority: Joi.string().valid('low', 'medium', 'high').optional().default('medium'),
    scheduled_time: Joi.date().optional(),
    lead_source: Joi.string().max(100).optional(),
    notes: Joi.string().max(500).optional()
  }),

  // Customer response validation
  customerResponse: Joi.object({
    sessionId: Joi.string().uuid().required(),
    SpeechResult: Joi.string().max(1000).optional(),
    CallSid: Joi.string().required(),
    confidence: Joi.number().min(0).max(1).optional(),
    duration: Joi.number().min(0).optional()
  }),

  // Voice services validation
  textToSpeech: Joi.object({
    text: Joi.string().min(1).max(5000).required(),
    voice_id: Joi.string().optional(),
    stability: Joi.number().min(0).max(1).optional(),
    similarity_boost: Joi.number().min(0).max(1).optional(),
    style: Joi.number().min(0).max(1).optional(),
    use_speaker_boost: Joi.boolean().optional()
  }),

  speechToText: Joi.object({
    audio_url: Joi.string().uri().optional(),
    model: Joi.string().valid('nova-2', 'nova', 'enhanced', 'base').optional(),
    language: Joi.string().optional(),
    smart_format: Joi.boolean().optional(),
    punctuate: Joi.boolean().optional(),
    diarize: Joi.boolean().optional()
  }),

  // Email validation
  emailSend: Joi.object({
    to: emailSchema,
    subject: Joi.string().min(1).max(200).required(),
    template: Joi.string().valid('similar_cars_email', 'appointment_confirmation').required(),
    data: Joi.object().required(),
    priority: Joi.string().valid('low', 'normal', 'high').optional().default('normal')
  }),

  // Configuration validation
  config: Joi.object({
    TWILIO_ACCOUNT_SID: Joi.string().required(),
    TWILIO_AUTH_TOKEN: Joi.string().required(),
    TWILIO_PHONE_NUMBER: phoneSchema,
    OPENAI_API_KEY: Joi.string().required(),
    ELEVENLABS_API_KEY: Joi.string().required(),
    DEEPGRAM_API_KEY: Joi.string().required(),
    GOOGLE_SHEETS_ID: Joi.string().required(),
    N8N_WEBHOOK_URL: Joi.string().uri().required(),
    WEBHOOK_BASE_URL: Joi.string().uri().required(),
    DEALERSHIP_NAME: Joi.string().min(2).max(100).required(),
    BOT_NAME: Joi.string().min(2).max(50).required()
  }),

  // Lead data validation
  leadData: Joi.object({
    customer_name: Joi.string().min(2).max(100).required(),
    phone_number: phoneSchema,
    email: emailSchema.optional(),
    car_model: Joi.string().min(2).max(100).required(),
    inquiry_date: Joi.date().required(),
    lead_source: Joi.string().max(100).optional(),
    status: Joi.string().valid('pending', 'called', 'completed', 'failed').required(),
    priority: Joi.string().valid('low', 'medium', 'high').optional().default('medium'),
    notes: Joi.string().max(1000).optional(),
    follow_up_date: Joi.date().optional(),
    interested_in_similar: Joi.boolean().optional(),
    appointment_scheduled: Joi.boolean().optional()
  })
};

// Validation middleware factory
const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      throw new ValidationError(`Validation schema '${schemaName}' not found`);
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new ValidationError(errorMessage);
    }

    req.validatedData = value;
    next();
  };
};

// Validate query parameters
const validateQuery = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      throw new ValidationError(`Validation schema '${schemaName}' not found`);
    }

    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      throw new ValidationError(errorMessage);
    }

    req.validatedQuery = value;
    next();
  };
};

// Validate environment variables
const validateEnv = () => {
  const { error } = schemas.config.validate(process.env, {
    allowUnknown: true
  });

  if (error) {
    const errorMessage = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Environment validation failed: ${errorMessage}`);
  }
};

// Custom validators
const customValidators = {
  isValidPhoneNumber: (phone) => {
    return phoneRegex.test(phone);
  },

  isValidEmail: (email) => {
    const { error } = emailSchema.validate(email);
    return !error;
  },

  isValidSessionId: (sessionId) => {
    return /^call_\d+$/.test(sessionId) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sessionId);
  },

  sanitizeText: (text) => {
    if (typeof text !== 'string') return '';
    
    // Remove potentially harmful characters
    return text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 5000); // Limit length
  },

  sanitizePhoneNumber: (phone) => {
    if (typeof phone !== 'string') return '';
    
    // Remove all non-digit characters except +
    return phone.replace(/[^\d+]/g, '');
  }
};

module.exports = {
  schemas,
  validate,
  validateQuery,
  validateEnv,
  customValidators
};
