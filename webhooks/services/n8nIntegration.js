// n8n Integration Service
// Handles all communication between the AI calling system and n8n workflows

const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../utils/config');
const { APIError } = require('../utils/errorHandler');

class N8nIntegrationService {
  constructor() {
    this.n8nConfig = {
      webhookUrl: process.env.N8N_WEBHOOK_URL,
      apiKey: process.env.N8N_API_KEY,
      workflowId: process.env.N8N_WORKFLOW_ID,
      baseUrl: process.env.N8N_BASE_URL || 'http://localhost:5678'
    };

    // Webhook endpoints for different events
    this.webhookEndpoints = {
      callCompleted: `${this.n8nConfig.webhookUrl}/call-completed`,
      leadUpdated: `${this.n8nConfig.webhookUrl}/lead-updated`,
      appointmentScheduled: `${this.n8nConfig.webhookUrl}/appointment-scheduled`,
      followUpRequired: `${this.n8nConfig.webhookUrl}/follow-up-required`,
      callFailed: `${this.n8nConfig.webhookUrl}/call-failed`
    };
  }

  /**
   * Send call completion data to n8n
   * @param {object} callData - Complete call information
   */
  async notifyCallCompleted(callData) {
    try {
      const payload = {
        event: 'call_completed',
        timestamp: new Date().toISOString(),
        data: {
          phone_number: callData.phoneNumber,
          customer_name: callData.customerName,
          car_model: callData.carModel,
          dealership_name: callData.dealershipName,
          call_duration: callData.duration,
          call_status: callData.status,
          outcome: callData.outcome,
          transcript: callData.transcript,
          extracted_data: callData.extractedData,
          sentiment_summary: this.calculateSentimentSummary(callData.analytics),
          next_action: this.determineNextAction(callData.outcome, callData.extractedData),
          call_notes: this.generateCallNotes(callData),
          session_id: callData.sessionId,
          call_sid: callData.callSid,
          performance_metrics: {
            ai_response_time: callData.performance?.aiResponseTime,
            audio_quality: callData.technical?.audioQuality,
            error_count: callData.performance?.errorCount
          }
        }
      };

      const response = await this.sendWebhook('callCompleted', payload);
      
      logger.info('Call completion sent to n8n', {
        sessionId: callData.sessionId,
        outcome: callData.outcome,
        webhookResponse: response.status
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to notify n8n of call completion', {
        sessionId: callData.sessionId,
        error: error.message
      });
      throw new APIError('n8n', 'Failed to send call completion notification', error);
    }
  }

  /**
   * Send lead update to n8n
   * @param {object} leadData - Lead information
   */
  async notifyLeadUpdated(leadData) {
    try {
      const payload = {
        event: 'lead_updated',
        timestamp: new Date().toISOString(),
        data: {
          lead_id: leadData.id,
          phone_number: leadData.phoneNumber,
          customer_name: leadData.customerName,
          email: leadData.email,
          car_model: leadData.carModel,
          status: leadData.status,
          lead_score: leadData.leadScore,
          priority: leadData.priority,
          last_contact: leadData.lastContactDate,
          next_action: leadData.nextAction,
          call_attempts: leadData.callAttempts,
          notes: leadData.notes,
          source: leadData.leadSource,
          qualification: leadData.qualificationCriteria,
          preferences: leadData.preferences
        }
      };

      const response = await this.sendWebhook('leadUpdated', payload);
      
      logger.info('Lead update sent to n8n', {
        leadId: leadData.id,
        status: leadData.status,
        webhookResponse: response.status
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to notify n8n of lead update', {
        leadId: leadData.id,
        error: error.message
      });
      throw new APIError('n8n', 'Failed to send lead update notification', error);
    }
  }

  /**
   * Send appointment scheduling notification to n8n
   * @param {object} appointmentData - Appointment details
   */
  async notifyAppointmentScheduled(appointmentData) {
    try {
      const payload = {
        event: 'appointment_scheduled',
        timestamp: new Date().toISOString(),
        data: {
          appointment_id: appointmentData.id,
          customer_name: appointmentData.customerName,
          phone_number: appointmentData.phoneNumber,
          email: appointmentData.email,
          car_model: appointmentData.carModel,
          appointment_date: appointmentData.date,
          appointment_type: appointmentData.type,
          dealership_name: appointmentData.dealershipName,
          sales_rep: appointmentData.salesRep,
          notes: appointmentData.notes,
          source_call_id: appointmentData.sourceCallId,
          confirmation_required: true,
          reminder_settings: {
            email_reminder: true,
            sms_reminder: true,
            reminder_times: ['24h', '2h']
          }
        }
      };

      const response = await this.sendWebhook('appointmentScheduled', payload);
      
      logger.info('Appointment notification sent to n8n', {
        appointmentId: appointmentData.id,
        customerName: appointmentData.customerName,
        appointmentDate: appointmentData.date
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to notify n8n of appointment', {
        appointmentId: appointmentData.id,
        error: error.message
      });
      throw new APIError('n8n', 'Failed to send appointment notification', error);
    }
  }

  /**
   * Request follow-up action from n8n
   * @param {object} followUpData - Follow-up requirements
   */
  async requestFollowUp(followUpData) {
    try {
      const payload = {
        event: 'follow_up_required',
        timestamp: new Date().toISOString(),
        data: {
          customer_name: followUpData.customerName,
          phone_number: followUpData.phoneNumber,
          email: followUpData.email,
          car_model: followUpData.carModel,
          follow_up_type: followUpData.type, // 'email', 'call', 'sms'
          follow_up_reason: followUpData.reason,
          scheduled_date: followUpData.scheduledDate,
          priority: followUpData.priority,
          template: followUpData.template,
          personalization_data: followUpData.personalizationData,
          original_call_data: followUpData.originalCallData
        }
      };

      const response = await this.sendWebhook('followUpRequired', payload);
      
      logger.info('Follow-up request sent to n8n', {
        customerName: followUpData.customerName,
        followUpType: followUpData.type,
        scheduledDate: followUpData.scheduledDate
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to request follow-up from n8n', {
        customerName: followUpData.customerName,
        error: error.message
      });
      throw new APIError('n8n', 'Failed to send follow-up request', error);
    }
  }

  /**
   * Notify n8n of call failure
   * @param {object} failureData - Call failure information
   */
  async notifyCallFailed(failureData) {
    try {
      const payload = {
        event: 'call_failed',
        timestamp: new Date().toISOString(),
        data: {
          session_id: failureData.sessionId,
          customer_name: failureData.customerName,
          phone_number: failureData.phoneNumber,
          car_model: failureData.carModel,
          failure_reason: failureData.reason,
          error_details: failureData.errorDetails,
          attempt_number: failureData.attemptNumber,
          max_attempts: failureData.maxAttempts,
          retry_scheduled: failureData.retryScheduled,
          next_retry_date: failureData.nextRetryDate,
          escalation_required: failureData.attemptNumber >= failureData.maxAttempts
        }
      };

      const response = await this.sendWebhook('callFailed', payload);
      
      logger.info('Call failure notification sent to n8n', {
        sessionId: failureData.sessionId,
        reason: failureData.reason,
        attemptNumber: failureData.attemptNumber
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to notify n8n of call failure', {
        sessionId: failureData.sessionId,
        error: error.message
      });
      // Don't throw error for failure notifications to avoid cascading failures
    }
  }

  /**
   * Trigger n8n workflow execution
   * @param {string} workflowId - n8n workflow ID
   * @param {object} data - Data to pass to workflow
   */
  async triggerWorkflow(workflowId, data) {
    try {
      const url = `${this.n8nConfig.baseUrl}/api/v1/workflows/${workflowId}/execute`;
      
      const response = await axios.post(url, data, {
        headers: {
          'Authorization': `Bearer ${this.n8nConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      logger.info('n8n workflow triggered', {
        workflowId,
        executionId: response.data.executionId
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to trigger n8n workflow', {
        workflowId,
        error: error.message
      });
      throw new APIError('n8n', 'Failed to trigger workflow', error);
    }
  }

  /**
   * Get workflow execution status
   * @param {string} executionId - Execution ID
   */
  async getExecutionStatus(executionId) {
    try {
      const url = `${this.n8nConfig.baseUrl}/api/v1/executions/${executionId}`;
      
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.n8nConfig.apiKey}`
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get n8n execution status', {
        executionId,
        error: error.message
      });
      throw new APIError('n8n', 'Failed to get execution status', error);
    }
  }

  /**
   * Send webhook to n8n
   * @param {string} endpoint - Webhook endpoint key
   * @param {object} payload - Data to send
   */
  async sendWebhook(endpoint, payload) {
    const webhookUrl = this.webhookEndpoints[endpoint];
    
    if (!webhookUrl) {
      throw new Error(`Unknown webhook endpoint: ${endpoint}`);
    }

    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'AI-Calling-System/1.0'
      },
      timeout: 15000
    });

    return response;
  }

  /**
   * Calculate sentiment summary from analytics
   * @param {object} analytics - Call analytics data
   */
  calculateSentimentSummary(analytics) {
    if (!analytics || !analytics.averageSentiment) {
      return 'neutral';
    }

    const sentiment = analytics.averageSentiment;
    if (sentiment > 0.1) return 'positive';
    if (sentiment < -0.1) return 'negative';
    return 'neutral';
  }

  /**
   * Determine next action based on call outcome
   * @param {string} outcome - Call outcome
   * @param {object} extractedData - Extracted data from call
   */
  determineNextAction(outcome, extractedData) {
    switch (outcome) {
      case 'appointment_scheduled':
        return 'send_appointment_confirmation';
      case 'interested_similar':
        return 'send_similar_cars_email';
      case 'callback_requested':
        return 'schedule_callback';
      case 'not_interested':
        return extractedData?.email_address ? 'add_to_nurture_campaign' : 'mark_as_closed';
      case 'no_response':
        return 'schedule_retry_call';
      default:
        return 'manual_review_required';
    }
  }

  /**
   * Generate call notes summary
   * @param {object} callData - Call data
   */
  generateCallNotes(callData) {
    const notes = [];
    
    notes.push(`Call duration: ${callData.duration} seconds`);
    notes.push(`Outcome: ${callData.outcome}`);
    
    if (callData.extractedData?.still_interested === 'yes') {
      notes.push('Customer confirmed interest');
    }
    
    if (callData.extractedData?.wants_appointment === 'yes') {
      notes.push('Customer wants to schedule appointment');
    }
    
    if (callData.extractedData?.email_address) {
      notes.push(`Email collected: ${callData.extractedData.email_address}`);
    }
    
    if (callData.analytics?.communicationStyle) {
      notes.push(`Communication style: ${callData.analytics.communicationStyle}`);
    }
    
    const sentimentSummary = this.calculateSentimentSummary(callData.analytics);
    notes.push(`Overall sentiment: ${sentimentSummary}`);
    
    return notes.join('. ');
  }

  /**
   * Test n8n connection
   */
  async testConnection() {
    try {
      const testPayload = {
        event: 'connection_test',
        timestamp: new Date().toISOString(),
        data: {
          message: 'Testing connection from AI Calling System',
          system_status: 'healthy'
        }
      };

      // Try to send to the main webhook URL
      const response = await axios.post(this.n8nConfig.webhookUrl, testPayload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      logger.info('n8n connection test successful', {
        status: response.status,
        webhookUrl: this.n8nConfig.webhookUrl
      });

      return {
        success: true,
        status: response.status,
        message: 'Connection successful'
      };
    } catch (error) {
      logger.error('n8n connection test failed', {
        error: error.message,
        webhookUrl: this.n8nConfig.webhookUrl
      });

      return {
        success: false,
        error: error.message,
        message: 'Connection failed'
      };
    }
  }

  /**
   * Get integration status
   */
  getStatus() {
    return {
      configured: !!this.n8nConfig.webhookUrl,
      webhookUrl: this.n8nConfig.webhookUrl,
      hasApiKey: !!this.n8nConfig.apiKey,
      endpoints: Object.keys(this.webhookEndpoints),
      lastTest: null // Could store last test result
    };
  }
}

// Create singleton instance
const n8nIntegration = new N8nIntegrationService();

module.exports = n8nIntegration;
