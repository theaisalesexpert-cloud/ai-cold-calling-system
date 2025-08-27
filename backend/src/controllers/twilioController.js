const express = require('express');
const twilio = require('twilio');
const { twilioLogger } = require('../utils/logger');
const { catchAsync } = require('../utils/errorHandler');
const conversationService = require('../services/conversationService');
const googleSheetsService = require('../services/googleSheetsService');

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

/**
 * Handle incoming voice calls (initial webhook)
 */
router.post('/voice', catchAsync(async (req, res) => {
  const { CallSid, From, To } = req.body;

  twilioLogger.info('Voice webhook received', {
    callSid: CallSid,
    from: From,
    to: To,
    body: req.body,
    query: req.query
  });

  try {
    // Create TwiML response
    const twiml = new VoiceResponse();

    // Simple greeting that always works
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Hello! This is Sarah from Premier Auto. Thank you for your interest in our vehicles.');

    // Pause for a moment
    twiml.pause({ length: 1 });

    // Try to get customer data and start conversation
    let customerData = null;
    try {
      // Try to find customer by phone number
      const customers = await googleSheetsService.getCustomerData();
      customerData = customers.find(c =>
        c.phone === From ||
        c.phone === From.replace('+1', '') ||
        c.phone === '+1' + From.replace('+', '')
      );
    } catch (error) {
      twilioLogger.warn('Could not fetch customer data', { error: error.message });
    }

    // Use default customer data if not found
    if (!customerData) {
      customerData = {
        id: `TEMP_${Date.now()}`,
        name: 'Valued Customer',
        phone: From,
        carModel: 'one of our vehicles',
        dealershipName: 'Premier Auto',
        enquiryDate: new Date().toISOString().split('T')[0]
      };
    }

    // Start conversation
    let conversationResponse;
    try {
      conversationResponse = await conversationService.generateInitialGreeting(CallSid, customerData);
    } catch (error) {
      twilioLogger.warn('Could not generate AI response, using fallback', { error: error.message });
      conversationResponse = {
        response: `Hi ${customerData.name}, are you still interested in ${customerData.carModel}?`,
        nextStep: 'interest_check'
      };
    }

    // Add the AI response
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, conversationResponse.response);

    // Gather speech input
    const gather = twiml.gather({
      input: 'speech',
      timeout: 10,
      speechTimeout: 'auto',
      action: '/webhook/twilio/gather',
      method: 'POST'
    });

    gather.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Please let me know if you are still interested.');

    // Fallback if no input
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'I did not hear a response. Thank you for your time. Goodbye.');

    twiml.hangup();

    // Set response headers and send
    res.type('text/xml');
    res.send(twiml.toString());

    twilioLogger.info('TwiML response sent successfully', {
      callSid: CallSid,
      customerData: customerData ? customerData.id : 'unknown',
      twimlLength: twiml.toString().length
    });

  } catch (error) {
    twilioLogger.error('Error in voice webhook', {
      error: error.message,
      stack: error.stack,
      callSid: CallSid
    });

    // Fallback TwiML - always works
    const fallbackTwiml = new VoiceResponse();

    fallbackTwiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Hello! Thank you for calling Premier Auto. We are experiencing technical difficulties. Please call back later. Goodbye.');

    fallbackTwiml.hangup();

    res.type('text/xml');
    res.send(fallbackTwiml.toString());
  }
}));

/**
 * Handle speech input from customer
 */
router.post('/gather', catchAsync(async (req, res) => {
  const { CallSid, SpeechResult, Confidence } = req.body;
  
  twilioLogger.info('Gather webhook received', {
    callSid: CallSid,
    speechResult: SpeechResult,
    confidence: Confidence
  });

  try {
    let conversation;
    try {
      conversation = conversationService.getConversation(CallSid);
    } catch (error) {
      twilioLogger.warn('Could not get conversation, creating fallback', { error: error.message });
    }

    if (!conversation) {
      twilioLogger.warn('Conversation not found for gather, ending call', { callSid: CallSid });

      const twiml = new VoiceResponse();
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, "Thank you for your interest. We'll follow up with you soon. Goodbye!");
      twiml.hangup();

      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // Check confidence level
    const confidenceThreshold = 0.5;
    if (parseFloat(Confidence) < confidenceThreshold) {
      twilioLogger.warn('Low confidence speech recognition', {
        callSid: CallSid,
        confidence: Confidence
      });

      const twiml = new VoiceResponse();
      const gather = twiml.gather({
        input: 'speech',
        timeout: 8,
        speechTimeout: 'auto',
        action: '/webhook/twilio/gather',
        method: 'POST'
      });

      gather.say({
        voice: 'alice',
        language: 'en-US'
      }, "I'm sorry, I didn't catch that. Could you please repeat?");

      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, "Thank you for your time. Goodbye!");
      twiml.hangup();

      res.type('text/xml');
      return res.send(twiml.toString());
    }

    // Process customer input
    let result;
    try {
      result = await conversationService.processCustomerInput(CallSid, SpeechResult);
    } catch (error) {
      twilioLogger.error('Error processing customer input', { error: error.message });

      const twiml = new VoiceResponse();
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, "Thank you for your interest. We'll be in touch soon. Goodbye!");
      twiml.hangup();

      res.type('text/xml');
      return res.send(twiml.toString());
    }

    const twiml = new VoiceResponse();

    if (result.shouldContinue) {
      // Continue conversation
      const gather = twiml.gather({
        input: 'speech',
        timeout: 10,
        speechTimeout: 'auto',
        action: '/webhook/twilio/gather',
        method: 'POST'
      });

      gather.say({
        voice: 'alice',
        language: 'en-US'
      }, result.response);

      // Fallback if no response
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, "Thank you for your time. We'll follow up with you. Goodbye!");
      twiml.hangup();
    } else {
      // End conversation
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, result.response);
      twiml.hangup();
    }

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    twilioLogger.error('Error in gather webhook', {
      error: error.message,
      stack: error.stack,
      callSid: CallSid
    });

    // Fallback response
    const fallbackTwiml = new VoiceResponse();
    fallbackTwiml.say({
      voice: 'alice',
      language: 'en-US'
    }, "Thank you for your time. We'll follow up with you soon. Goodbye!");
    fallbackTwiml.hangup();

    res.type('text/xml');
    res.send(fallbackTwiml.toString());
  }
}));

/**
 * Handle call status updates
 */
router.post('/status', catchAsync(async (req, res) => {
  const { CallSid, CallStatus, CallDuration, From, To } = req.body;

  twilioLogger.info('Call status update', {
    callSid: CallSid,
    status: CallStatus,
    duration: CallDuration,
    from: From,
    to: To
  });

  try {
    // Handle different call statuses
    switch (CallStatus) {
      case 'completed':
        // Clean up conversation
        try {
          conversationService.cleanupConversation(CallSid);
        } catch (error) {
          twilioLogger.warn('Error cleaning up conversation', { error: error.message });
        }

        // Update call duration in sheets if conversation exists
        let conversation;
        try {
          conversation = conversationService.getConversation(CallSid);
        } catch (error) {
          twilioLogger.warn('Could not get conversation for status update', { error: error.message });
        }
        if (conversation && CallDuration) {
          await googleSheetsService.updateCustomerRecord(
            conversation.customerData.id,
            { callDuration: CallDuration }
          );
        }
        break;

      case 'failed':
      case 'busy':
      case 'no-answer':
        // Update customer record with failed call status
        twilioLogger.warn('Call failed', {
          callSid: CallSid,
          status: CallStatus,
          from: From
        });
        
        // Try to find customer and update status
        try {
          const customers = await googleSheetsService.getCustomerData();
          const customer = customers.find(c => c.phone === From);
          if (customer) {
            await googleSheetsService.updateCustomerRecord(customer.id, {
              lastCallDate: new Date().toISOString().split('T')[0],
              callResult: CallStatus,
              status: 'call_failed'
            });
          }
        } catch (updateError) {
          twilioLogger.error('Failed to update customer record for failed call', {
            error: updateError.message,
            callSid: CallSid
          });
        }
        break;

      case 'answered':
        twilioLogger.info('Call answered', { callSid: CallSid });
        break;
    }

    res.status(200).send('OK');

  } catch (error) {
    twilioLogger.error('Error handling call status', {
      error: error.message,
      callSid: CallSid,
      status: CallStatus
    });
    
    res.status(500).send('Error processing status update');
  }
}));

/**
 * Handle recording status updates
 */
router.post('/recording', catchAsync(async (req, res) => {
  const { CallSid, RecordingUrl, RecordingDuration } = req.body;

  twilioLogger.info('Recording status update', {
    callSid: CallSid,
    recordingUrl: RecordingUrl,
    duration: RecordingDuration
  });

  try {
    // Store recording information
    const conversation = conversationService.getConversation(CallSid);
    if (conversation) {
      await googleSheetsService.updateCustomerRecord(
        conversation.customerData.id,
        {
          recordingUrl: RecordingUrl,
          recordingDuration: RecordingDuration
        }
      );
    }

    res.status(200).send('OK');

  } catch (error) {
    twilioLogger.error('Error handling recording status', {
      error: error.message,
      callSid: CallSid
    });
    
    res.status(500).send('Error processing recording update');
  }
}));

/**
 * Handle machine detection
 */
router.post('/machine', catchAsync(async (req, res) => {
  const { CallSid, AnsweredBy } = req.body;

  twilioLogger.info('Machine detection result', {
    callSid: CallSid,
    answeredBy: AnsweredBy
  });

  if (AnsweredBy === 'machine_start' || AnsweredBy === 'machine_end_beep') {
    // Leave voicemail message
    const twiml = new VoiceResponse();
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, "Hi, this is Sarah from Premier Auto. We're following up on your recent car inquiry. Please call us back at your convenience. Thank you!");
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());
  } else {
    // Continue with normal flow - redirect to voice webhook
    const twiml = new VoiceResponse();
    twiml.redirect(`${process.env.BASE_URL}/webhook/twilio/voice`);

    res.type('text/xml');
    res.send(twiml.toString());
  }
}));

/**
 * Test endpoint for Twilio webhook
 */
router.get('/test', (req, res) => {
  res.json({
    message: 'Twilio webhook endpoint is working',
    timestamp: new Date().toISOString(),
    activeConversations: conversationService.getActiveConversationsCount()
  });
});

/**
 * Test TwiML generation
 */
router.get('/test-twiml', (req, res) => {
  try {
    const twiml = new VoiceResponse();

    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Hello! This is a test of the TwiML generation. If you can hear this, the system is working correctly.');

    twiml.pause({ length: 1 });

    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, 'Thank you for testing. Goodbye!');

    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    twilioLogger.error('Error generating test TwiML', { error: error.message });
    res.status(500).json({ error: 'Failed to generate TwiML' });
  }
});

module.exports = router;
