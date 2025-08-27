const express = require('express');
const { callLogger } = require('../utils/logger');
const { catchAsync, AppError } = require('../utils/errorHandler');
const twilioService = require('../services/twilioService');
const conversationService = require('../services/conversationService');
const googleSheetsService = require('../services/googleSheetsService');

const router = express.Router();

/**
 * Initiate a new call
 */
router.post('/initiate', catchAsync(async (req, res) => {
  const { customerId, phoneNumber } = req.body;

  if (!customerId && !phoneNumber) {
    throw new AppError('Either customerId or phoneNumber is required', 400);
  }

  callLogger.info('Call initiation requested', { customerId, phoneNumber });

  try {
    let customerData;

    if (customerId) {
      // Get customer data from sheets
      const customers = await googleSheetsService.getCustomerData();
      customerData = customers.find(c => c.id === customerId || c.customerId === customerId);
      
      if (!customerData) {
        throw new AppError('Customer not found', 404);
      }
    } else {
      // Create temporary customer data
      customerData = {
        id: `TEMP_${Date.now()}`,
        name: 'Customer',
        phone: phoneNumber,
        carModel: 'vehicle',
        dealershipName: 'Premier Auto'
      };
    }

    // Initiate the call
    const callResult = await twilioService.initiateCall(
      customerData.phone,
      customerData
    );

    res.json({
      success: true,
      message: 'Call initiated successfully',
      data: {
        callSid: callResult.callSid,
        status: callResult.status,
        customerName: customerData.name,
        phoneNumber: customerData.phone
      }
    });

  } catch (error) {
    callLogger.error('Failed to initiate call', {
      error: error.message,
      customerId,
      phoneNumber
    });
    throw error;
  }
}));

/**
 * Get call status
 */
router.get('/status/:callSid', catchAsync(async (req, res) => {
  const { callSid } = req.params;

  const callDetails = await twilioService.getCallDetails(callSid);
  const conversation = conversationService.getConversation(callSid);

  res.json({
    success: true,
    data: {
      call: callDetails,
      conversation: conversation ? {
        id: conversation.id,
        currentStep: conversation.currentStep,
        turnCount: conversation.turnCount,
        startTime: conversation.startTime,
        context: conversation.context
      } : null
    }
  });
}));

/**
 * End a call
 */
router.post('/end/:callSid', catchAsync(async (req, res) => {
  const { callSid } = req.params;

  await twilioService.endCall(callSid);
  conversationService.cleanupConversation(callSid);

  res.json({
    success: true,
    message: 'Call ended successfully'
  });
}));

/**
 * Get conversation history
 */
router.get('/conversation/:callSid', catchAsync(async (req, res) => {
  const { callSid } = req.params;
  
  const conversation = conversationService.getConversation(callSid);
  
  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  res.json({
    success: true,
    data: {
      conversationId: conversation.id,
      customerData: conversation.customerData,
      currentStep: conversation.currentStep,
      history: conversation.history,
      context: conversation.context,
      startTime: conversation.startTime,
      turnCount: conversation.turnCount
    }
  });
}));

/**
 * Bulk initiate calls for multiple customers
 */
router.post('/bulk-initiate', catchAsync(async (req, res) => {
  const { customerIds, delay = 5000 } = req.body;

  if (!customerIds || !Array.isArray(customerIds)) {
    throw new AppError('customerIds array is required', 400);
  }

  callLogger.info('Bulk call initiation requested', { 
    count: customerIds.length,
    delay 
  });

  const results = [];
  const customers = await googleSheetsService.getCustomerData();

  for (let i = 0; i < customerIds.length; i++) {
    const customerId = customerIds[i];
    
    try {
      const customerData = customers.find(c => c.id === customerId || c.customerId === customerId);
      
      if (!customerData) {
        results.push({
          customerId,
          success: false,
          error: 'Customer not found'
        });
        continue;
      }

      const callResult = await twilioService.initiateCall(
        customerData.phone,
        customerData
      );

      results.push({
        customerId,
        success: true,
        callSid: callResult.callSid,
        status: callResult.status
      });

      // Add delay between calls to avoid rate limiting
      if (i < customerIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (error) {
      callLogger.error('Failed to initiate bulk call', {
        error: error.message,
        customerId
      });
      
      results.push({
        customerId,
        success: false,
        error: error.message
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;

  res.json({
    success: true,
    message: `Bulk call initiation completed. ${successCount} successful, ${failureCount} failed.`,
    data: {
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    }
  });
}));

/**
 * Get customers ready for calling
 */
router.get('/customers/ready', catchAsync(async (req, res) => {
  const customers = await googleSheetsService.getCustomersForCalling();

  res.json({
    success: true,
    data: {
      customers,
      count: customers.length
    }
  });
}));

/**
 * Get call statistics
 */
router.get('/statistics', catchAsync(async (req, res) => {
  const [sheetStats, conversationStats] = await Promise.all([
    googleSheetsService.getCallStatistics(),
    conversationService.getConversationStats()
  ]);

  res.json({
    success: true,
    data: {
      sheets: sheetStats,
      conversations: conversationStats,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * Test call functionality
 */
router.post('/test', catchAsync(async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    throw new AppError('phoneNumber is required for test call', 400);
  }

  const testCustomerData = {
    id: 'TEST_' + Date.now(),
    name: 'Test Customer',
    phone: phoneNumber,
    carModel: 'Test Vehicle',
    dealershipName: 'Premier Auto'
  };

  const callResult = await twilioService.initiateCall(
    phoneNumber,
    testCustomerData
  );

  res.json({
    success: true,
    message: 'Test call initiated successfully',
    data: {
      callSid: callResult.callSid,
      status: callResult.status,
      phoneNumber
    }
  });
}));

/**
 * Get active calls
 */
router.get('/active', catchAsync(async (req, res) => {
  const conversationStats = conversationService.getConversationStats();

  res.json({
    success: true,
    data: {
      activeCount: conversationStats.active,
      averageTurns: conversationStats.averageTurns,
      byStep: conversationStats.byStep
    }
  });
}));

/**
 * Manual conversation step override (for testing/debugging)
 */
router.post('/conversation/:callSid/step', catchAsync(async (req, res) => {
  const { callSid } = req.params;
  const { step, customerInput } = req.body;

  if (!step) {
    throw new AppError('step is required', 400);
  }

  const conversation = conversationService.getConversation(callSid);
  
  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  // Update conversation step
  conversation.currentStep = step;

  if (customerInput) {
    const result = await conversationService.processCustomerInput(
      callSid,
      customerInput
    );

    res.json({
      success: true,
      message: 'Conversation step updated and processed',
      data: {
        currentStep: conversation.currentStep,
        response: result.response,
        nextStep: result.nextStep
      }
    });
  } else {
    res.json({
      success: true,
      message: 'Conversation step updated',
      data: {
        currentStep: conversation.currentStep
      }
    });
  }
}));

module.exports = router;
