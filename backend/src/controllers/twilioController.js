const express = require('express');
const twilio = require('twilio');
const { twilioLogger } = require('../utils/logger');
const { catchAsync } = require('../utils/errorHandler');
const twilioService = require('../services/twilioService');
const conversationService = require('../services/conversationService');
const googleSheetsService = require('../services/googleSheetsService');

const router = express.Router();

/**
 * Handle incoming voice calls (initial webhook)
 */
router.post('/voice', catchAsync(async (req, res) => {
  const { CallSid, From, To } = req.body;
  const customerId = req.query.customerId;
  const customerName = decodeURIComponent(req.query.customerName || '');
  const carModel = decodeURIComponent(req.query.carModel || '');

  twilioLogger.info('Voice webhook received', {
    callSid: CallSid,
    from: From,
    to: To,
    customerId
  });

  try {
    // Get customer data
    let customerData;
    if (customerId) {
      const customers = await googleSheetsService.getCustomerData();
      customerData = customers.find(c => c.id === customerId || c.customerId === customerId);
    }

    if (!customerData) {
      customerData = {
        id: customerId || 'unknown',
        name: customerName || 'Customer',
        phone: From,
        carModel: carModel || 'vehicle',
        dealershipName: 'Premier Auto'
      };
    }

    // Generate initial greeting
    const response = await conversationService.generateInitialGreeting(CallSid, customerData);
    
    // Generate TwiML response
    const twiml = twilioService.generateGatherResponse(
      response.response,
      `${process.env.TWILIO_WEBHOOK_URL}/gather`,
      10
    );

    res.type('text/xml');
    res.send(twiml);

  } catch (error) {
    twilioLogger.error('Error in voice webhook', {
      error: error.message,
      callSid: CallSid
    });

    // Fallback response
    const twiml = twilioService.generateVoiceResponse(
      "I'm sorry, we're experiencing technical difficulties. We'll call you back shortly. Thank you!",
      { type: 'hangup' }
    );

    res.type('text/xml');
    res.send(twiml);
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
    const conversation = conversationService.getConversation(CallSid);
    
    if (!conversation) {
      twilioLogger.error('Conversation not found for gather', { callSid: CallSid });
      
      const twiml = twilioService.generateVoiceResponse(
        "I'm sorry, there was an issue with our system. Thank you for calling!",
        { type: 'hangup' }
      );
      
      res.type('text/xml');
      return res.send(twiml);
    }

    // Check confidence level
    const confidenceThreshold = 0.5;
    if (parseFloat(Confidence) < confidenceThreshold) {
      twilioLogger.warn('Low confidence speech recognition', {
        callSid: CallSid,
        confidence: Confidence
      });
      
      const twiml = twilioService.generateGatherResponse(
        "I'm sorry, I didn't catch that. Could you please repeat?",
        `${process.env.TWILIO_WEBHOOK_URL}/gather`,
        8
      );
      
      res.type('text/xml');
      return res.send(twiml);
    }

    // Process customer input
    const result = await conversationService.processCustomerInput(
      CallSid,
      SpeechResult
    );

    if (result.shouldContinue) {
      // Continue conversation
      const twiml = twilioService.generateGatherResponse(
        result.response,
        `${process.env.TWILIO_WEBHOOK_URL}/gather`,
        10
      );
      
      res.type('text/xml');
      res.send(twiml);
    } else {
      // End conversation
      const twiml = twilioService.generateVoiceResponse(
        result.response,
        { type: 'hangup' }
      );
      
      res.type('text/xml');
      res.send(twiml);
    }

  } catch (error) {
    twilioLogger.error('Error in gather webhook', {
      error: error.message,
      callSid: CallSid
    });

    // Fallback response
    const twiml = twilioService.generateVoiceResponse(
      "Thank you for your time. We'll follow up with you soon. Goodbye!",
      { type: 'hangup' }
    );

    res.type('text/xml');
    res.send(twiml);
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
        conversationService.cleanupConversation(CallSid);
        
        // Update call duration in sheets if conversation exists
        const conversation = conversationService.getConversation(CallSid);
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
    const twiml = twilioService.generateVoiceResponse(
      "Hi, this is Sarah from Premier Auto. We're following up on your recent car inquiry. Please call us back at your convenience at 123-456-7890. Thank you!",
      { type: 'hangup' }
    );
    
    res.type('text/xml');
    res.send(twiml);
  } else {
    // Continue with normal flow
    res.redirect(307, `${process.env.TWILIO_WEBHOOK_URL}/voice`);
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

module.exports = router;
