const twilio = require('twilio');
const { twilioLogger } = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');
const elevenlabsService = require('./elevenlabsService');
const deepgramService = require('./deepgramService');

class TwilioService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    this.webhookUrl = process.env.TWILIO_WEBHOOK_URL;
    this.useElevenLabs = process.env.USE_ELEVENLABS === 'true';
    this.useDeepgram = process.env.USE_DEEPGRAM === 'true';

    twilioLogger.info('Twilio service initialized', {
      useElevenLabs: this.useElevenLabs,
      useDeepgram: this.useDeepgram
    });
  }

  /**
   * Initiate an outbound call
   */
  async initiateCall(toNumber, customerData) {
    try {
      twilioLogger.info('Initiating call', { toNumber, customerName: customerData.name });

      // Construct webhook URL with customer data
      const webhookUrl = `${this.webhookUrl}/webhook/twilio/voice?customerId=${customerData.id}&customerName=${encodeURIComponent(customerData.name)}&carModel=${encodeURIComponent(customerData.carModel)}`;

      const call = await this.client.calls.create({
        to: toNumber,
        from: this.fromNumber,
        url: webhookUrl,
        method: 'POST',
        statusCallback: `${this.webhookUrl}/webhook/twilio/status`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        record: true,
        recordingStatusCallback: `${this.webhookUrl}/webhook/twilio/recording`,
        timeout: parseInt(process.env.CALL_TIMEOUT) || 30,
        machineDetection: 'Enable',
        machineDetectionTimeout: 10
      });

      twilioLogger.info('Call initiated successfully', { 
        callSid: call.sid, 
        toNumber,
        status: call.status 
      });

      return {
        callSid: call.sid,
        status: call.status,
        to: call.to,
        from: call.from
      };
    } catch (error) {
      twilioLogger.error('Failed to initiate call', { 
        error: error.message, 
        toNumber,
        code: error.code 
      });
      throw new AppError(`Failed to initiate call: ${error.message}`, 500);
    }
  }

  /**
   * Generate TwiML for voice response with optional ElevenLabs
   */
  async generateVoiceResponse(message, nextAction = null, baseUrl = null) {
    const twiml = new twilio.twiml.VoiceResponse();

    if (message) {
      if (this.useElevenLabs && baseUrl) {
        try {
          // Use ElevenLabs for high-quality speech
          const audioResult = await elevenlabsService.generateSpeechForTwilio(message, baseUrl);
          if (audioResult) {
            twiml.play(audioResult.audioUrl);
          } else {
            // Fallback to Twilio TTS
            twiml.say({
              voice: 'alice',
              language: 'en-US'
            }, message);
          }
        } catch (error) {
          twilioLogger.warn('ElevenLabs failed, using Twilio TTS', { error: error.message });
          twiml.say({
            voice: 'alice',
            language: 'en-US'
          }, message);
        }
      } else {
        // Use Twilio built-in TTS
        twiml.say({
          voice: 'alice',
          language: 'en-US'
        }, message);
      }
    }

    if (nextAction) {
      switch (nextAction.type) {
        case 'gather':
          const gather = twiml.gather({
            input: 'speech',
            timeout: nextAction.timeout || 5,
            speechTimeout: nextAction.speechTimeout || 'auto',
            action: nextAction.action,
            method: 'POST',
            language: 'en-US',
            enhanced: true
          });
          
          if (nextAction.prompt) {
            gather.say({
              voice: 'alice',
              language: 'en-US'
            }, nextAction.prompt);
          }
          break;

        case 'redirect':
          twiml.redirect({
            method: 'POST'
          }, nextAction.url);
          break;

        case 'hangup':
          twiml.hangup();
          break;

        case 'pause':
          twiml.pause({ length: nextAction.duration || 1 });
          break;
      }
    }

    return twiml.toString();
  }

  /**
   * Generate TwiML for gathering speech input
   */
  generateGatherResponse(prompt, actionUrl, timeout = 5) {
    const twiml = new twilio.twiml.VoiceResponse();
    
    const gather = twiml.gather({
      input: 'speech',
      timeout: timeout,
      speechTimeout: 'auto',
      action: actionUrl,
      method: 'POST',
      language: 'en-US',
      enhanced: true,
      speechModel: 'phone_call'
    });

    gather.say({
      voice: 'alice',
      language: 'en-US'
    }, prompt);

    // Fallback if no input received
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, "I didn't hear anything. Let me try calling you back later. Goodbye!");
    
    twiml.hangup();

    return twiml.toString();
  }

  /**
   * Update call status
   */
  async updateCallStatus(callSid, status) {
    try {
      const call = await this.client.calls(callSid).update({ status });
      twilioLogger.info('Call status updated', { callSid, status });
      return call;
    } catch (error) {
      twilioLogger.error('Failed to update call status', { 
        error: error.message, 
        callSid, 
        status 
      });
      throw new AppError(`Failed to update call status: ${error.message}`, 500);
    }
  }

  /**
   * Get call details
   */
  async getCallDetails(callSid) {
    try {
      const call = await this.client.calls(callSid).fetch();
      return {
        sid: call.sid,
        status: call.status,
        duration: call.duration,
        startTime: call.startTime,
        endTime: call.endTime,
        price: call.price,
        direction: call.direction
      };
    } catch (error) {
      twilioLogger.error('Failed to get call details', { 
        error: error.message, 
        callSid 
      });
      throw new AppError(`Failed to get call details: ${error.message}`, 500);
    }
  }

  /**
   * End call
   */
  async endCall(callSid) {
    try {
      await this.updateCallStatus(callSid, 'completed');
      twilioLogger.info('Call ended', { callSid });
    } catch (error) {
      twilioLogger.error('Failed to end call', { error: error.message, callSid });
      throw error;
    }
  }

  /**
   * Enhanced transcription using Deepgram for call recordings
   */
  async transcribeRecording(recordingUrl) {
    if (this.useDeepgram) {
      try {
        twilioLogger.info('Using Deepgram for transcription', { recordingUrl });
        const result = await deepgramService.transcribeFromUrl(recordingUrl);

        return {
          transcript: result.transcript,
          confidence: result.confidence,
          sentiment: result.sentiment,
          topics: result.topics,
          service: 'deepgram',
          metadata: result.metadata
        };
      } catch (error) {
        twilioLogger.warn('Deepgram transcription failed, no fallback available', {
          error: error.message,
          recordingUrl
        });
        return null;
      }
    }

    // No transcription service available
    return null;
  }

  /**
   * Analyze call recording with Deepgram
   */
  async analyzeCallRecording(recordingUrl) {
    if (this.useDeepgram) {
      try {
        const analysis = await deepgramService.analyzeConversation(recordingUrl);

        twilioLogger.info('Call analysis completed', {
          recordingUrl,
          sentiment: analysis?.sentiment,
          topicsCount: analysis?.topics?.length || 0
        });

        return analysis;
      } catch (error) {
        twilioLogger.error('Call analysis failed', {
          error: error.message,
          recordingUrl
        });
        return null;
      }
    }

    return null;
  }

  /**
   * Get service status for health checks
   */
  getServiceStatus() {
    return {
      twilio: {
        status: 'healthy',
        fromNumber: this.fromNumber,
        webhookUrl: this.webhookUrl
      },
      elevenlabs: {
        enabled: this.useElevenLabs,
        status: this.useElevenLabs ? 'enabled' : 'disabled'
      },
      deepgram: {
        enabled: this.useDeepgram,
        status: this.useDeepgram ? 'enabled' : 'disabled'
      }
    };
  }
}

module.exports = new TwilioService();
