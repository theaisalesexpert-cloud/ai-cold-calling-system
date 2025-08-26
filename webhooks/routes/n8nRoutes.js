// n8n Integration Routes
// API endpoints for n8n workflow integration

const express = require('express');
const router = express.Router();
const n8nIntegration = require('../services/n8nIntegration');
const { asyncHandler } = require('../utils/errorHandler');
const { validate } = require('../utils/validation');
const { authenticateAPIKey } = require('../middleware/security');
const logger = require('../utils/logger');

// Apply authentication to all routes
router.use(authenticateAPIKey);

/**
 * Test n8n connection
 * GET /api/n8n/test
 */
router.get('/test', asyncHandler(async (req, res) => {
  const result = await n8nIntegration.testConnection();
  
  res.json({
    success: result.success,
    data: result,
    timestamp: new Date().toISOString()
  });
}));

/**
 * Get n8n integration status
 * GET /api/n8n/status
 */
router.get('/status', asyncHandler(async (req, res) => {
  const status = n8nIntegration.getStatus();
  
  res.json({
    success: true,
    data: status,
    timestamp: new Date().toISOString()
  });
}));

/**
 * Manually trigger call completion webhook
 * POST /api/n8n/notify/call-completed
 */
router.post('/notify/call-completed', 
  validate('callCompletion'),
  asyncHandler(async (req, res) => {
    const callData = req.validatedData;
    
    const result = await n8nIntegration.notifyCallCompleted(callData);
    
    logger.info('Manual call completion notification sent', {
      sessionId: callData.sessionId,
      outcome: callData.outcome
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Call completion notification sent to n8n'
    });
  })
);

/**
 * Manually trigger lead update webhook
 * POST /api/n8n/notify/lead-updated
 */
router.post('/notify/lead-updated',
  validate('leadUpdate'),
  asyncHandler(async (req, res) => {
    const leadData = req.validatedData;
    
    const result = await n8nIntegration.notifyLeadUpdated(leadData);
    
    logger.info('Manual lead update notification sent', {
      leadId: leadData.id,
      status: leadData.status
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Lead update notification sent to n8n'
    });
  })
);

/**
 * Manually trigger appointment notification
 * POST /api/n8n/notify/appointment-scheduled
 */
router.post('/notify/appointment-scheduled',
  validate('appointmentScheduled'),
  asyncHandler(async (req, res) => {
    const appointmentData = req.validatedData;
    
    const result = await n8nIntegration.notifyAppointmentScheduled(appointmentData);
    
    logger.info('Manual appointment notification sent', {
      appointmentId: appointmentData.id,
      customerName: appointmentData.customerName
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Appointment notification sent to n8n'
    });
  })
);

/**
 * Request follow-up action
 * POST /api/n8n/request/follow-up
 */
router.post('/request/follow-up',
  validate('followUpRequest'),
  asyncHandler(async (req, res) => {
    const followUpData = req.validatedData;
    
    const result = await n8nIntegration.requestFollowUp(followUpData);
    
    logger.info('Follow-up request sent', {
      customerName: followUpData.customerName,
      followUpType: followUpData.type
    });
    
    res.json({
      success: true,
      data: result,
      message: 'Follow-up request sent to n8n'
    });
  })
);

/**
 * Trigger specific n8n workflow
 * POST /api/n8n/trigger/:workflowId
 */
router.post('/trigger/:workflowId', asyncHandler(async (req, res) => {
  const { workflowId } = req.params;
  const data = req.body;
  
  const result = await n8nIntegration.triggerWorkflow(workflowId, data);
  
  logger.info('n8n workflow triggered manually', {
    workflowId,
    executionId: result.executionId
  });
  
  res.json({
    success: true,
    data: result,
    message: `Workflow ${workflowId} triggered successfully`
  });
}));

/**
 * Get workflow execution status
 * GET /api/n8n/execution/:executionId
 */
router.get('/execution/:executionId', asyncHandler(async (req, res) => {
  const { executionId } = req.params;
  
  const result = await n8nIntegration.getExecutionStatus(executionId);
  
  res.json({
    success: true,
    data: result,
    message: 'Execution status retrieved'
  });
}));

/**
 * Webhook endpoint for n8n to trigger calls
 * POST /api/n8n/webhook/trigger-call
 */
router.post('/webhook/trigger-call', asyncHandler(async (req, res) => {
  const {
    customer_name,
    phone_number,
    car_model,
    dealership_name,
    priority = 'medium',
    scheduled_time,
    lead_source = 'n8n_workflow'
  } = req.body;
  
  // Validate required fields
  if (!customer_name || !phone_number || !car_model) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Missing required fields: customer_name, phone_number, car_model',
        type: 'validation'
      }
    });
  }
  
  // Create call initiation request
  const callRequest = {
    customer_name,
    phone_number,
    car_model,
    dealership_name: dealership_name || 'Your Dealership',
    bot_name: 'Sarah',
    priority,
    scheduled_time,
    lead_source
  };
  
  // Forward to call initiation endpoint
  const axios = require('axios');
  const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
  
  try {
    const response = await axios.post(`${baseUrl}/webhook/call/initiate`, callRequest, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    logger.info('Call triggered from n8n webhook', {
      customerName: customer_name,
      phoneNumber: phone_number,
      carModel: car_model
    });
    
    res.json({
      success: true,
      data: {
        message: 'Call initiated successfully',
        callRequest,
        twilioResponse: response.status
      }
    });
  } catch (error) {
    logger.error('Failed to initiate call from n8n webhook', {
      error: error.message,
      customerName: customer_name
    });
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to initiate call',
        details: error.message
      }
    });
  }
}));

/**
 * Webhook endpoint for n8n to update lead status
 * POST /api/n8n/webhook/update-lead
 */
router.post('/webhook/update-lead', asyncHandler(async (req, res) => {
  const {
    phone_number,
    status,
    priority,
    notes,
    next_action,
    follow_up_date
  } = req.body;
  
  if (!phone_number) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'phone_number is required',
        type: 'validation'
      }
    });
  }
  
  // Update lead in database
  const Lead = require('../models/Lead');
  
  try {
    const lead = await Lead.findOne({ phoneNumber: phone_number });
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Lead not found',
          type: 'not_found'
        }
      });
    }
    
    // Update lead fields
    if (status) lead.status = status;
    if (priority) lead.priority = priority;
    if (notes) lead.notes = notes;
    if (follow_up_date) lead.nextCallDate = new Date(follow_up_date);
    
    await lead.save();
    
    logger.info('Lead updated from n8n webhook', {
      leadId: lead.id,
      phoneNumber: phone_number,
      status
    });
    
    res.json({
      success: true,
      data: {
        message: 'Lead updated successfully',
        leadId: lead.id,
        updatedFields: { status, priority, notes }
      }
    });
  } catch (error) {
    logger.error('Failed to update lead from n8n webhook', {
      error: error.message,
      phoneNumber: phone_number
    });
    
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update lead',
        details: error.message
      }
    });
  }
}));

/**
 * Health check for n8n integration
 * GET /api/n8n/health
 */
router.get('/health', asyncHandler(async (req, res) => {
  const status = n8nIntegration.getStatus();
  const connectionTest = await n8nIntegration.testConnection();
  
  res.json({
    success: true,
    data: {
      integration: status,
      connection: connectionTest,
      endpoints: {
        webhooks: Object.keys(n8nIntegration.webhookEndpoints),
        api: [
          '/api/n8n/test',
          '/api/n8n/status',
          '/api/n8n/notify/*',
          '/api/n8n/trigger/:workflowId',
          '/api/n8n/webhook/*'
        ]
      }
    },
    timestamp: new Date().toISOString()
  });
}));

module.exports = router;
