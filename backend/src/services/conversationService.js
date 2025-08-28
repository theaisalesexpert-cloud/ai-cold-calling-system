const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const openaiService = require('./openaiService');
const googleSheetsService = require('./googleSheetsService');
const emailService = require('./emailService');

// Conversation flow steps following the exact script
const STEPS = {
  GREETING: 'greeting',
  GREETING_RESPONSE: 'greeting_response',
  CONFIRM_INTEREST: 'confirm_interest',
  INTEREST_RESPONSE: 'interest_response',
  ARRANGE_APPOINTMENT: 'arrange_appointment',
  APPOINTMENT_RESPONSE: 'appointment_response',
  OFFER_SIMILAR: 'offer_similar',
  SIMILAR_RESPONSE: 'similar_response',
  COLLECT_EMAIL: 'collect_email',
  EMAIL_RESPONSE: 'email_response',
  END_CALL: 'end_call'
};

class ConversationService {
  constructor() {
    this.conversations = new Map();
    this.conversationTimeout = 300000; // 5 minutes
  }

  /**
   * Generate initial greeting (Step 1)
   */
  async generateInitialGreeting(callSid, customerData) {
    try {
      const conversation = {
        id: uuidv4(),
        callSid,
        customerData,
        currentStep: STEPS.GREETING,
        startTime: new Date(),
        lastActivity: new Date(),
        context: {
          customerName: customerData.name,
          carModel: customerData.carModel,
          dealershipName: customerData.dealershipName || 'Premier Auto',
          botName: 'Sarah'
        },
        data: {
          interestedInOriginal: null,
          appointmentDateTime: null,
          interestedInSimilar: null,
          email: customerData.email || null
        },
        history: []
      };

      this.conversations.set(callSid, conversation);

      // Step 1: Greeting & Personalization (exact script)
      const greeting = `Hi ${conversation.context.customerName}, this is ${conversation.context.botName} from ${conversation.context.dealershipName}. You recently enquired about the ${conversation.context.carModel}. Is now a good time to talk?`;

      conversation.history.push({
        role: 'assistant',
        content: greeting,
        step: STEPS.GREETING,
        timestamp: new Date()
      });

      // Set cleanup timeout
      setTimeout(() => {
        this.cleanupConversation(callSid);
      }, this.conversationTimeout);

      logger.info('Initial greeting generated', {
        callSid,
        customerName: customerData.name,
        carModel: customerData.carModel
      });

      return {
        response: greeting,
        nextStep: STEPS.GREETING_RESPONSE,
        shouldContinue: true
      };

    } catch (error) {
      logger.error('Failed to generate initial greeting', {
        error: error.message,
        callSid
      });
      throw error;
    }
  }

  /**
   * Process customer input and generate appropriate response
   */
  async processCustomerInput(callSid, customerInput) {
    try {
      const conversation = this.conversations.get(callSid);
      
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.lastActivity = new Date();
      
      // Add customer input to history
      conversation.history.push({
        role: 'user',
        content: customerInput,
        step: conversation.currentStep,
        timestamp: new Date()
      });

      let response;

      // Process based on current step
      switch (conversation.currentStep) {
        case STEPS.GREETING_RESPONSE:
          response = await this.handleGreetingResponse(conversation, customerInput);
          break;
        
        case STEPS.INTEREST_RESPONSE:
          response = await this.handleInterestResponse(conversation, customerInput);
          break;
        
        case STEPS.APPOINTMENT_RESPONSE:
          response = await this.handleAppointmentResponse(conversation, customerInput);
          break;
        
        case STEPS.SIMILAR_RESPONSE:
          response = await this.handleSimilarResponse(conversation, customerInput);
          break;
        
        case STEPS.EMAIL_RESPONSE:
          response = await this.handleEmailResponse(conversation, customerInput);
          break;
        
        default:
          response = await this.handleUnexpectedInput(conversation, customerInput);
      }

      // Add AI response to history
      conversation.history.push({
        role: 'assistant',
        content: response.message,
        step: response.nextStep,
        timestamp: new Date()
      });

      conversation.currentStep = response.nextStep;

      logger.info('Customer input processed', {
        callSid,
        currentStep: conversation.currentStep,
        customerInput: customerInput.substring(0, 100)
      });

      return {
        response: response.message,
        nextStep: response.nextStep,
        shouldContinue: response.shouldContinue
      };

    } catch (error) {
      logger.error('Failed to process customer input', {
        error: error.message,
        callSid,
        customerInput
      });
      throw error;
    }
  }

  /**
   * Handle greeting response (Step 1 → Step 2)
   */
  async handleGreetingResponse(conversation, input) {
    const lowerInput = input.toLowerCase().trim();

    // Check for positive responses
    if (this.containsPositive(lowerInput)) {
      // Customer said yes, proceed to confirm interest (Step 2)
      conversation.currentStep = STEPS.CONFIRM_INTEREST;
      return {
        message: `I just wanted to check — are you still interested in the ${conversation.context.carModel}?`,
        nextStep: STEPS.INTEREST_RESPONSE,
        shouldContinue: true
      };
    }

    // Check for negative/busy responses
    if (this.containsNegative(lowerInput) ||
        lowerInput.includes('busy') ||
        lowerInput.includes('not now') ||
        lowerInput.includes('bad time') ||
        lowerInput.includes('later')) {
      // Customer is busy, politely reschedule
      return {
        message: `No problem at all! I'll give you a call back at a better time. Have a great day, ${conversation.context.customerName}!`,
        nextStep: STEPS.END_CALL,
        shouldContinue: false
      };
    }

    // Handle unclear responses - ask for clarification
    return {
      message: `I just want to make sure - is this a good time for a quick chat about the ${conversation.context.carModel}?`,
      nextStep: STEPS.GREETING_RESPONSE,
      shouldContinue: true
    };
  }

  /**
   * Handle interest response (Step 2 → Step 3 or 4)
   */
  async handleInterestResponse(conversation, input) {
    const lowerInput = input.toLowerCase();
    
    if (this.containsPositive(lowerInput)) {
      // Customer is still interested - Update Column D = Yes
      conversation.data.interestedInOriginal = true;
      await this.updateGoogleSheet(conversation, 'D', 'Yes');
      
      conversation.currentStep = STEPS.ARRANGE_APPOINTMENT;
      return {
        message: `Great! Would you like to arrange an appointment to see or test drive the ${conversation.context.carModel}?`,
        nextStep: STEPS.APPOINTMENT_RESPONSE,
        shouldContinue: true
      };
    } else if (this.containsNegative(lowerInput)) {
      // Customer not interested in original - Update Column D = No
      conversation.data.interestedInOriginal = false;
      await this.updateGoogleSheet(conversation, 'D', 'No');
      
      conversation.currentStep = STEPS.OFFER_SIMILAR;
      return {
        message: `No problem — sometimes the exact model isn't the right fit. Would you be interested in hearing about similar cars we currently have available?`,
        nextStep: STEPS.SIMILAR_RESPONSE,
        shouldContinue: true
      };
    } else {
      // Unclear response, clarify
      return {
        message: `Just to confirm - are you still looking for the ${conversation.context.carModel}, or has your situation changed?`,
        nextStep: STEPS.INTEREST_RESPONSE,
        shouldContinue: true
      };
    }
  }

  /**
   * Handle appointment response (Step 3)
   */
  async handleAppointmentResponse(conversation, input) {
    const lowerInput = input.toLowerCase();
    
    if (this.containsPositive(lowerInput)) {
      // Customer wants appointment
      const dateTimeMatch = this.extractDateTime(input);
      if (dateTimeMatch) {
        // Save appointment - Update Column E
        conversation.data.appointmentDateTime = dateTimeMatch;
        await this.updateGoogleSheet(conversation, 'E', dateTimeMatch);
        
        return {
          message: `Perfect! I've scheduled your appointment for ${dateTimeMatch}. We'll send you a confirmation shortly. Thanks ${conversation.context.customerName}!`,
          nextStep: STEPS.END_CALL,
          shouldContinue: false
        };
      } else {
        // Ask for specific date/time
        return {
          message: `What date and time works best for you?`,
          nextStep: STEPS.APPOINTMENT_RESPONSE,
          shouldContinue: true
        };
      }
    } else if (this.containsNegative(lowerInput)) {
      // No appointment, offer similar cars
      conversation.currentStep = STEPS.OFFER_SIMILAR;
      return {
        message: `No problem — sometimes the exact model isn't the right fit. Would you be interested in hearing about similar cars we currently have available?`,
        nextStep: STEPS.SIMILAR_RESPONSE,
        shouldContinue: true
      };
    } else {
      // Unclear response
      return {
        message: `Would you like to schedule a time to come in and see the ${conversation.context.carModel}?`,
        nextStep: STEPS.APPOINTMENT_RESPONSE,
        shouldContinue: true
      };
    }
  }

  /**
   * Handle similar cars response (Step 4 → Step 5 or End)
   */
  async handleSimilarResponse(conversation, input) {
    const lowerInput = input.toLowerCase();
    
    if (this.containsPositive(lowerInput)) {
      // Customer interested in similar cars - Update Column F = Yes
      conversation.data.interestedInSimilar = true;
      await this.updateGoogleSheet(conversation, 'F', 'Yes');
      
      conversation.currentStep = STEPS.COLLECT_EMAIL;
      return {
        message: `Perfect! What's the best email address to send those similar car options to?`,
        nextStep: STEPS.EMAIL_RESPONSE,
        shouldContinue: true
      };
    } else if (this.containsNegative(lowerInput)) {
      // Not interested in similar cars - Update Column F = No
      conversation.data.interestedInSimilar = false;
      await this.updateGoogleSheet(conversation, 'F', 'No');
      
      return {
        message: `No problem at all, ${conversation.context.customerName}. Thank you for your time, and feel free to contact us if anything changes. Have a great day!`,
        nextStep: STEPS.END_CALL,
        shouldContinue: false
      };
    } else {
      // Unclear response
      return {
        message: `Would you like me to send you information about similar vehicles that might interest you?`,
        nextStep: STEPS.SIMILAR_RESPONSE,
        shouldContinue: true
      };
    }
  }

  /**
   * Handle email response (Step 5 → End)
   */
  async handleEmailResponse(conversation, input) {
    const email = this.extractEmail(input);
    
    if (email) {
      // Save email - Update Column G
      conversation.data.email = email;
      await this.updateGoogleSheet(conversation, 'G', email);
      
      // Send similar car options email
      await this.sendSimilarCarsEmail(conversation, email);
      
      return {
        message: `Thanks ${conversation.context.customerName}! I'll send you the details shortly. Have a great day!`,
        nextStep: STEPS.END_CALL,
        shouldContinue: false
      };
    } else if (conversation.data.email) {
      // Use existing email
      await this.sendSimilarCarsEmail(conversation, conversation.data.email);
      
      return {
        message: `I'll send it to your email on file: ${conversation.data.email}. Thanks ${conversation.context.customerName}!`,
        nextStep: STEPS.END_CALL,
        shouldContinue: false
      };
    } else {
      // Ask for email again
      return {
        message: `Could you please provide your email address so I can send you the similar car options?`,
        nextStep: STEPS.EMAIL_RESPONSE,
        shouldContinue: true
      };
    }
  }

  /**
   * Handle unexpected input with AI assistance
   */
  async handleUnexpectedInput(conversation, input) {
    try {
      const context = `
      Customer: ${conversation.context.customerName}
      Car Model: ${conversation.context.carModel}
      Current Step: ${conversation.currentStep}
      Customer said: "${input}"
      
      Respond appropriately and guide back to the conversation flow.
      `;
      
      const aiResponse = await openaiService.generateResponse(context, conversation.history);
      
      return {
        message: aiResponse,
        nextStep: conversation.currentStep,
        shouldContinue: true
      };
    } catch (error) {
      logger.error('AI response failed', { error: error.message });
      return {
        message: `I'm sorry, could you repeat that? I want to make sure I understand you correctly.`,
        nextStep: conversation.currentStep,
        shouldContinue: true
      };
    }
  }

  // Helper methods for better response detection
  containsPositive(input) {
    const positiveWords = [
      'yes', 'yeah', 'yep', 'yup', 'sure', 'okay', 'ok', 'alright', 'right',
      'definitely', 'absolutely', 'certainly', 'of course', 'sounds good',
      'interested', 'good time', 'perfect', 'great', 'fine', 'works',
      'i am', 'i would', 'i will', 'let\'s do', 'go ahead'
    ];
    return positiveWords.some(word => input.includes(word));
  }

  containsNegative(input) {
    const negativeWords = [
      'no', 'nope', 'not', 'nah', 'never', 'none',
      'busy', 'later', 'bad time', 'not now', 'not interested',
      'not really', 'don\'t think', 'can\'t', 'won\'t',
      'not a good time', 'call back', 'another time'
    ];
    return negativeWords.some(word => input.includes(word));
  }

  extractDateTime(input) {
    // Simple date/time extraction - can be enhanced
    const dateTimePatterns = [
      /tomorrow at (\d+(?::\d+)?(?:\s*(?:am|pm))?)/i,
      /(\w+day) at (\d+(?::\d+)?(?:\s*(?:am|pm))?)/i,
      /(\d+\/\d+(?:\/\d+)?) at (\d+(?::\d+)?(?:\s*(?:am|pm))?)/i
    ];
    
    for (const pattern of dateTimePatterns) {
      const match = input.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return null;
  }

  extractEmail(input) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = input.match(emailPattern);
    return match ? match[0] : null;
  }

  async updateGoogleSheet(conversation, column, value) {
    try {
      await googleSheetsService.updateCustomerData(
        conversation.customerData.phone,
        { [column]: value }
      );
      logger.info('Google Sheet updated', {
        callSid: conversation.callSid,
        column,
        value
      });
    } catch (error) {
      logger.error('Failed to update Google Sheet', {
        error: error.message,
        callSid: conversation.callSid
      });
    }
  }

  async sendSimilarCarsEmail(conversation, email) {
    try {
      await emailService.sendSimilarCarsEmail(email, {
        customerName: conversation.context.customerName,
        originalCarModel: conversation.context.carModel,
        dealershipName: conversation.context.dealershipName
      });
      logger.info('Similar cars email sent', {
        callSid: conversation.callSid,
        email
      });
    } catch (error) {
      logger.error('Failed to send similar cars email', {
        error: error.message,
        callSid: conversation.callSid
      });
    }
  }

  getConversation(callSid) {
    return this.conversations.get(callSid);
  }

  cleanupConversation(callSid) {
    this.conversations.delete(callSid);
    logger.info('Conversation cleaned up', { callSid });
  }
}

module.exports = new ConversationService();
