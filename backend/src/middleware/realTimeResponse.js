const logger = require('../utils/logger');

/**
 * Real-time response middleware to ensure fast, reliable responses
 */
class RealTimeResponseMiddleware {
  constructor() {
    this.responseTimeouts = new Map();
    this.maxResponseTime = 3000; // 3 seconds max response time
    this.retryAttempts = 2;
  }

  /**
   * Middleware to handle real-time responses
   */
  handleRealTimeResponse() {
    return async (req, res, next) => {
      const startTime = Date.now();
      const callSid = req.body.CallSid || req.params.callSid || 'unknown';
      
      // Set response timeout
      const timeoutId = setTimeout(() => {
        if (!res.headersSent) {
          logger.error('Response timeout - sending emergency fallback', {
            callSid,
            url: req.url,
            method: req.method,
            responseTime: Date.now() - startTime
          });
          
          // Send emergency TwiML response
          res.type('text/xml');
          res.send(`<?xml version="1.0" encoding="UTF-8"?>
            <Response>
              <Say voice="alice" language="en-US">I'm sorry, we're experiencing technical difficulties. Please call back in a few minutes. Goodbye.</Say>
              <Hangup/>
            </Response>`);
        }
      }, this.maxResponseTime);

      this.responseTimeouts.set(callSid, timeoutId);

      // Override res.send to clear timeout
      const originalSend = res.send;
      res.send = function(data) {
        const responseTime = Date.now() - startTime;
        
        // Clear timeout
        const timeoutId = this.responseTimeouts.get(callSid);
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.responseTimeouts.delete(callSid);
        }

        logger.info('Response sent', {
          callSid,
          responseTime,
          url: req.url,
          method: req.method,
          dataLength: data ? data.length : 0
        });

        return originalSend.call(this, data);
      }.bind(this);

      // Handle errors
      res.on('error', (error) => {
        logger.error('Response error', {
          callSid,
          error: error.message,
          url: req.url
        });
      });

      next();
    };
  }

  /**
   * Ensure fast ElevenLabs generation
   */
  async ensureFastSpeechGeneration(text, baseUrl, maxWaitTime = 2000) {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Speech generation timeout'));
      }, maxWaitTime);

      try {
        const elevenlabsService = require('../services/elevenlabsService');
        const result = await elevenlabsService.generateSpeechForTwilio(text, baseUrl);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Cleanup timeouts
   */
  cleanup() {
    for (const [callSid, timeoutId] of this.responseTimeouts) {
      clearTimeout(timeoutId);
      logger.info('Cleaned up timeout', { callSid });
    }
    this.responseTimeouts.clear();
  }
}

module.exports = new RealTimeResponseMiddleware();
