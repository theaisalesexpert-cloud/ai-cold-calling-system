const { v4: uuidv4 } = require('uuid');
const { callLogger } = require('../utils/logger');
const openaiService = require('./openaiService');
const googleSheetsService = require('./googleSheetsService');
const emailService = require('./emailService');

class ConversationService {
  constructor() {
    this.activeConversations = new Map();
    this.conversationTimeout = parseInt(process.env.CONVERSATION_TIMEOUT) || 30000;
    this.maxTurns = parseInt(process.env.MAX_CONVERSATION_TURNS) || 20;
  }

  /**
   * Initialize a new conversation
   */
  initializeConversation(callSid, customerData) {
    const conversationId = uuidv4();
    
    const conversation = {
      id: conversationId,
      callSid,
      customerData,
      currentStep: 'greeting',
      history: [],
      startTime: new Date(),
      lastActivity: new Date(),
      turnCount: 0,
      context: {
        customerResponded: false,
        appointmentScheduled: false,
        emailCollected: false,
        interestedInOriginalCar: null,
        interestedInAlternatives: null,
        sentiment: 'neutral'
      }
    };

    this.activeConversations.set(callSid, conversation);
    
    callLogger.info('Conversation initialized', {
      conversationId,
      callSid,
      customerName: customerData.name
    });

    // Set timeout to clean up conversation
    setTimeout(() => {
      this.cleanupConversation(callSid);
    }, this.conversationTimeout);

    return conversation;
  }

  /**
   * Process customer input and generate AI response
   */
  async processCustomerInput(callSid, customerInput, isFirstMessage = false) {
    try {
      const conversation = this.activeConversations.get(callSid);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Update last activity
      conversation.lastActivity = new Date();
      conversation.turnCount++;

      // Check if conversation has exceeded max turns
      if (conversation.turnCount > this.maxTurns) {
        callLogger.warn('Conversation exceeded max turns', { 
          callSid, 
          turnCount: conversation.turnCount 
        });
        return this.generateClosingResponse(conversation);
      }

      // Generate AI response
      const aiResponse = await openaiService.generateResponse(
        conversation,
        customerInput,
        conversation.customerData
      );

      // Update conversation history
      if (!isFirstMessage && customerInput) {
        conversation.history.push({
          customer: customerInput,
          ai: aiResponse.response,
          timestamp: new Date(),
          step: conversation.currentStep
        });
      } else if (isFirstMessage) {
        conversation.history.push({
          ai: aiResponse.response,
          timestamp: new Date(),
          step: conversation.currentStep
        });
      }

      // Update conversation context
      await this.updateConversationContext(conversation, customerInput, aiResponse);

      // Update current step
      conversation.currentStep = aiResponse.nextStep;

      callLogger.info('Customer input processed', {
        callSid,
        currentStep: conversation.currentStep,
        turnCount: conversation.turnCount
      });

      // Check if conversation should end
      if (aiResponse.nextStep === 'completed' || aiResponse.nextStep === 'closing') {
        await this.finalizeConversation(conversation);
      }

      return {
        response: aiResponse.response,
        nextStep: aiResponse.nextStep,
        shouldContinue: !['completed', 'closing'].includes(aiResponse.nextStep),
        conversationContext: conversation.context
      };

    } catch (error) {
      callLogger.error('Failed to process customer input', {
        error: error.message,
        callSid
      });
      
      // Return fallback response
      return {
        response: "I'm sorry, I'm having trouble hearing you. Let me call you back later. Thank you!",
        nextStep: 'closing',
        shouldContinue: false
      };
    }
  }

  /**
   * Update conversation context based on customer input and AI response
   */
  async updateConversationContext(conversation, customerInput, aiResponse) {
    if (!customerInput) return;

    const lowerInput = customerInput.toLowerCase();
    
    // Analyze sentiment
    const sentiment = await openaiService.analyzeSentiment(customerInput);
    conversation.context.sentiment = sentiment.toLowerCase();

    // Update context based on current step
    switch (conversation.currentStep) {
      case 'interest_check':
        conversation.context.interestedInOriginalCar = 
          lowerInput.includes('yes') || lowerInput.includes('interested') || lowerInput.includes('still');
        break;

      case 'appointment':
        conversation.context.appointmentScheduled = 
          lowerInput.includes('yes') || lowerInput.includes('schedule') || lowerInput.includes('appointment');
        break;

      case 'alternatives':
        conversation.context.interestedInAlternatives = 
          lowerInput.includes('yes') || lowerInput.includes('interested') || lowerInput.includes('similar');
        break;

      case 'email_collection':
        const email = await openaiService.extractInformation(customerInput, 'email');
        if (email && email !== 'NONE') {
          conversation.context.emailCollected = true;
          conversation.context.customerEmail = email;
        }
        break;
    }

    conversation.context.customerResponded = true;
  }

  /**
   * Generate initial greeting
   */
  async generateInitialGreeting(callSid, customerData) {
    const conversation = this.initializeConversation(callSid, customerData);
    
    const greeting = `Hi, is this ${customerData.name}? This is Sarah calling from ${customerData.dealershipName || 'Premier Auto'}. You recently enquired about the ${customerData.carModel} - is now a good time to talk?`;
    
    conversation.history.push({
      ai: greeting,
      timestamp: new Date(),
      step: 'greeting'
    });

    return {
      response: greeting,
      nextStep: 'interest_check',
      shouldContinue: true
    };
  }

  /**
   * Generate closing response
   */
  generateClosingResponse(conversation) {
    let closingMessage = '';
    
    if (conversation.context.appointmentScheduled) {
      closingMessage = `Perfect! We'll see you for your appointment. Thank you ${conversation.customerData.name}, and have a great day!`;
    } else if (conversation.context.emailCollected) {
      closingMessage = `Thank you ${conversation.customerData.name}! I'll send you those car options shortly. Have a wonderful day!`;
    } else {
      closingMessage = `Thank you for your time ${conversation.customerData.name}. Feel free to call us if you have any questions. Have a great day!`;
    }

    return {
      response: closingMessage,
      nextStep: 'completed',
      shouldContinue: false
    };
  }

  /**
   * Finalize conversation and update records
   */
  async finalizeConversation(conversation) {
    try {
      // Determine call result
      let callResult = 'completed';
      let status = 'contacted';

      if (conversation.context.appointmentScheduled) {
        callResult = 'appointment_scheduled';
        status = 'appointment_scheduled';
      } else if (conversation.context.interestedInOriginalCar) {
        callResult = 'interested';
        status = 'interested';
      } else if (conversation.context.interestedInAlternatives) {
        callResult = 'interested_alternatives';
        status = 'interested';
      } else {
        callResult = 'not_interested';
        status = 'not_interested';
      }

      // Update Google Sheets
      const updateData = {
        status,
        lastCallDate: new Date().toISOString().split('T')[0],
        callResult,
        sentiment: conversation.context.sentiment,
        notes: this.generateCallNotes(conversation)
      };

      if (conversation.context.customerEmail) {
        updateData.email = conversation.context.customerEmail;
      }

      await googleSheetsService.updateCustomerRecord(
        conversation.customerData.id,
        updateData
      );

      // Send follow-up email if needed
      if (conversation.context.emailCollected && conversation.context.customerEmail) {
        await emailService.sendSimilarCarsEmail(
          conversation.context.customerEmail,
          conversation.customerData.name,
          conversation.customerData.carModel
        );
      }

      callLogger.info('Conversation finalized', {
        callSid: conversation.callSid,
        result: callResult,
        customerName: conversation.customerData.name
      });

    } catch (error) {
      callLogger.error('Failed to finalize conversation', {
        error: error.message,
        callSid: conversation.callSid
      });
    }
  }

  /**
   * Generate call notes summary
   */
  generateCallNotes(conversation) {
    const notes = [];
    
    if (conversation.context.interestedInOriginalCar) {
      notes.push('Interested in original car');
    }
    
    if (conversation.context.appointmentScheduled) {
      notes.push('Appointment scheduled');
    }
    
    if (conversation.context.interestedInAlternatives) {
      notes.push('Interested in similar cars');
    }
    
    if (conversation.context.emailCollected) {
      notes.push('Email collected for follow-up');
    }
    
    notes.push(`Sentiment: ${conversation.context.sentiment}`);
    notes.push(`Turns: ${conversation.turnCount}`);
    
    return notes.join('; ');
  }

  /**
   * Get conversation by call SID
   */
  getConversation(callSid) {
    return this.activeConversations.get(callSid);
  }

  /**
   * Clean up conversation
   */
  cleanupConversation(callSid) {
    const conversation = this.activeConversations.get(callSid);
    if (conversation) {
      callLogger.info('Cleaning up conversation', {
        callSid,
        duration: Date.now() - conversation.startTime.getTime()
      });
      this.activeConversations.delete(callSid);
    }
  }

  /**
   * Get active conversations count
   */
  getActiveConversationsCount() {
    return this.activeConversations.size;
  }

  /**
   * Get conversation statistics
   */
  getConversationStats() {
    const conversations = Array.from(this.activeConversations.values());
    
    return {
      active: conversations.length,
      averageTurns: conversations.length > 0 
        ? conversations.reduce((sum, conv) => sum + conv.turnCount, 0) / conversations.length 
        : 0,
      byStep: conversations.reduce((acc, conv) => {
        acc[conv.currentStep] = (acc[conv.currentStep] || 0) + 1;
        return acc;
      }, {})
    };
  }
}

module.exports = new ConversationService();
