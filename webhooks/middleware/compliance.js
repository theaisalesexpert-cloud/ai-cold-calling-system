// GDPR and Compliance Middleware
// Handles data protection, consent management, and regulatory compliance

const logger = require('../utils/logger');
const config = require('../utils/config');
const { ValidationError } = require('../utils/errorHandler');

class ComplianceManager {
  constructor() {
    this.consentTypes = {
      MARKETING: 'marketing',
      CALLS: 'calls',
      SMS: 'sms',
      EMAIL: 'email',
      RECORDING: 'recording',
      DATA_PROCESSING: 'data_processing'
    };

    this.dataRetentionPeriods = {
      CALL_RECORDINGS: 90, // days
      TRANSCRIPTS: 365, // days
      PERSONAL_DATA: 2555, // days (7 years)
      ANALYTICS_DATA: 1095 // days (3 years)
    };

    this.sensitiveDataFields = [
      'phoneNumber',
      'email',
      'customerName',
      'address',
      'creditCard',
      'ssn',
      'dob'
    ];
  }

  /**
   * Middleware to check consent before processing
   */
  checkConsent(requiredConsentTypes = []) {
    return async (req, res, next) => {
      try {
        const { phoneNumber, customerData } = req.body;
        
        if (!phoneNumber && !customerData?.phoneNumber) {
          return next();
        }

        const phone = phoneNumber || customerData.phoneNumber;
        const consent = await this.getConsentStatus(phone);

        // Check if all required consents are given
        for (const consentType of requiredConsentTypes) {
          if (!consent[consentType]) {
            logger.security('Consent violation attempted', {
              phoneNumber: this.maskPhoneNumber(phone),
              requiredConsent: consentType,
              ip: req.ip
            });

            return res.status(403).json({
              success: false,
              error: {
                message: `Consent required for ${consentType}`,
                type: 'consent_required',
                consentType
              }
            });
          }
        }

        // Log consent check
        logger.info('Consent verified', {
          phoneNumber: this.maskPhoneNumber(phone),
          consentTypes: requiredConsentTypes,
          ip: req.ip
        });

        req.consentVerified = true;
        req.customerConsent = consent;
        next();
      } catch (error) {
        logger.error('Consent check failed', { error: error.message });
        next(error);
      }
    };
  }

  /**
   * Middleware to handle data subject rights (GDPR Article 15-22)
   */
  handleDataSubjectRights() {
    return async (req, res, next) => {
      const { action, phoneNumber, email } = req.body;
      
      if (!action || !['access', 'rectification', 'erasure', 'portability', 'restriction'].includes(action)) {
        return next();
      }

      try {
        const identifier = phoneNumber || email;
        if (!identifier) {
          throw new ValidationError('Phone number or email required for data subject requests');
        }

        logger.info('Data subject request received', {
          action,
          identifier: this.maskIdentifier(identifier),
          ip: req.ip
        });

        switch (action) {
          case 'access':
            req.dataSubjectResponse = await this.handleDataAccess(identifier);
            break;
          case 'rectification':
            req.dataSubjectResponse = await this.handleDataRectification(identifier, req.body.corrections);
            break;
          case 'erasure':
            req.dataSubjectResponse = await this.handleDataErasure(identifier);
            break;
          case 'portability':
            req.dataSubjectResponse = await this.handleDataPortability(identifier);
            break;
          case 'restriction':
            req.dataSubjectResponse = await this.handleProcessingRestriction(identifier);
            break;
        }

        next();
      } catch (error) {
        logger.error('Data subject request failed', { error: error.message, action });
        next(error);
      }
    };
  }

  /**
   * Middleware to anonymize sensitive data in logs
   */
  anonymizeLogging() {
    return (req, res, next) => {
      // Override console methods to anonymize sensitive data
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = (...args) => originalLog(...this.anonymizeArgs(args));
      console.error = (...args) => originalError(...this.anonymizeArgs(args));
      console.warn = (...args) => originalWarn(...this.anonymizeArgs(args));

      // Restore original methods after request
      res.on('finish', () => {
        console.log = originalLog;
        console.error = originalError;
        console.warn = originalWarn;
      });

      next();
    };
  }

  /**
   * Middleware to add data retention headers
   */
  addRetentionHeaders() {
    return (req, res, next) => {
      const dataType = this.determineDataType(req.path);
      const retentionPeriod = this.dataRetentionPeriods[dataType] || this.dataRetentionPeriods.ANALYTICS_DATA;
      
      res.set('Data-Retention-Period', `${retentionPeriod} days`);
      res.set('Data-Classification', this.classifyDataSensitivity(req.body));
      
      next();
    };
  }

  /**
   * Middleware to validate call recording consent
   */
  validateRecordingConsent() {
    return async (req, res, next) => {
      try {
        const { phoneNumber } = req.body;
        
        if (!phoneNumber) {
          return next();
        }

        const consent = await this.getConsentStatus(phoneNumber);
        
        if (!consent.recording) {
          // Add TwiML instruction to not record
          req.recordingDisabled = true;
          
          logger.info('Call recording disabled due to consent', {
            phoneNumber: this.maskPhoneNumber(phoneNumber)
          });
        }

        next();
      } catch (error) {
        logger.error('Recording consent check failed', { error: error.message });
        next(error);
      }
    };
  }

  /**
   * Get consent status for a phone number
   */
  async getConsentStatus(phoneNumber) {
    // In a real implementation, this would query the database
    // For now, return default consents
    return {
      [this.consentTypes.MARKETING]: false,
      [this.consentTypes.CALLS]: true,
      [this.consentTypes.SMS]: false,
      [this.consentTypes.EMAIL]: false,
      [this.consentTypes.RECORDING]: false,
      [this.consentTypes.DATA_PROCESSING]: true,
      consentDate: new Date(),
      ipAddress: '127.0.0.1'
    };
  }

  /**
   * Handle data access request (GDPR Article 15)
   */
  async handleDataAccess(identifier) {
    logger.info('Processing data access request', {
      identifier: this.maskIdentifier(identifier)
    });

    // In a real implementation, this would gather all data for the individual
    return {
      message: 'Data access request processed',
      requestId: this.generateRequestId(),
      estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  /**
   * Handle data rectification request (GDPR Article 16)
   */
  async handleDataRectification(identifier, corrections) {
    logger.info('Processing data rectification request', {
      identifier: this.maskIdentifier(identifier),
      corrections: Object.keys(corrections || {})
    });

    return {
      message: 'Data rectification request processed',
      requestId: this.generateRequestId(),
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }

  /**
   * Handle data erasure request (GDPR Article 17)
   */
  async handleDataErasure(identifier) {
    logger.info('Processing data erasure request', {
      identifier: this.maskIdentifier(identifier)
    });

    return {
      message: 'Data erasure request processed',
      requestId: this.generateRequestId(),
      estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  /**
   * Handle data portability request (GDPR Article 20)
   */
  async handleDataPortability(identifier) {
    logger.info('Processing data portability request', {
      identifier: this.maskIdentifier(identifier)
    });

    return {
      message: 'Data portability request processed',
      requestId: this.generateRequestId(),
      estimatedCompletion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };
  }

  /**
   * Handle processing restriction request (GDPR Article 18)
   */
  async handleProcessingRestriction(identifier) {
    logger.info('Processing restriction request', {
      identifier: this.maskIdentifier(identifier)
    });

    return {
      message: 'Processing restriction request processed',
      requestId: this.generateRequestId(),
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };
  }

  /**
   * Mask phone number for logging
   */
  maskPhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.length < 4) return '***';
    return phoneNumber.slice(0, 3) + '*'.repeat(phoneNumber.length - 6) + phoneNumber.slice(-3);
  }

  /**
   * Mask identifier for logging
   */
  maskIdentifier(identifier) {
    if (identifier.includes('@')) {
      // Email
      const [local, domain] = identifier.split('@');
      return local.slice(0, 2) + '*'.repeat(local.length - 2) + '@' + domain;
    } else {
      // Phone number
      return this.maskPhoneNumber(identifier);
    }
  }

  /**
   * Anonymize arguments for logging
   */
  anonymizeArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'string') {
        return this.anonymizeString(arg);
      } else if (typeof arg === 'object' && arg !== null) {
        return this.anonymizeObject(arg);
      }
      return arg;
    });
  }

  /**
   * Anonymize string data
   */
  anonymizeString(str) {
    // Phone number pattern
    str = str.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, (match) => this.maskPhoneNumber(match));
    
    // Email pattern
    str = str.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (match) => this.maskIdentifier(match));
    
    // Credit card pattern
    str = str.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '**** **** **** ****');
    
    // SSN pattern
    str = str.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****');
    
    return str;
  }

  /**
   * Anonymize object data
   */
  anonymizeObject(obj) {
    const anonymized = { ...obj };
    
    for (const field of this.sensitiveDataFields) {
      if (anonymized[field]) {
        if (field === 'phoneNumber') {
          anonymized[field] = this.maskPhoneNumber(anonymized[field]);
        } else if (field === 'email') {
          anonymized[field] = this.maskIdentifier(anonymized[field]);
        } else {
          anonymized[field] = '***';
        }
      }
    }
    
    return anonymized;
  }

  /**
   * Determine data type from request path
   */
  determineDataType(path) {
    if (path.includes('/call/')) return 'CALL_RECORDINGS';
    if (path.includes('/transcript/')) return 'TRANSCRIPTS';
    if (path.includes('/analytics/')) return 'ANALYTICS_DATA';
    return 'PERSONAL_DATA';
  }

  /**
   * Classify data sensitivity
   */
  classifyDataSensitivity(data) {
    if (!data || typeof data !== 'object') return 'public';
    
    const hasSensitiveData = this.sensitiveDataFields.some(field => data[field]);
    
    if (hasSensitiveData) return 'sensitive';
    if (data.transcript || data.recording) return 'confidential';
    return 'internal';
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return 'REQ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Check if data retention period has expired
   */
  isRetentionExpired(dataType, createdDate) {
    const retentionPeriod = this.dataRetentionPeriods[dataType];
    const expirationDate = new Date(createdDate.getTime() + retentionPeriod * 24 * 60 * 60 * 1000);
    return new Date() > expirationDate;
  }

  /**
   * Schedule data cleanup for expired records
   */
  async scheduleDataCleanup() {
    logger.info('Scheduling data cleanup for expired records');
    
    // This would typically be implemented as a cron job
    // For now, just log the action
    const cleanupDate = new Date();
    cleanupDate.setHours(2, 0, 0, 0); // Schedule for 2 AM
    
    return {
      scheduledFor: cleanupDate,
      types: Object.keys(this.dataRetentionPeriods)
    };
  }
}

const complianceManager = new ComplianceManager();

module.exports = {
  ComplianceManager,
  complianceManager,
  checkConsent: complianceManager.checkConsent.bind(complianceManager),
  handleDataSubjectRights: complianceManager.handleDataSubjectRights.bind(complianceManager),
  anonymizeLogging: complianceManager.anonymizeLogging.bind(complianceManager),
  addRetentionHeaders: complianceManager.addRetentionHeaders.bind(complianceManager),
  validateRecordingConsent: complianceManager.validateRecordingConsent.bind(complianceManager)
};
