const OpenAI = require('openai');
const { openaiLogger } = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 150;
    this.temperature = parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7;
  }

  /**
   * Generate AI response based on conversation context
   */
  async generateResponse(conversationContext, customerInput, customerData) {
    try {
      const systemPrompt = this.buildSystemPrompt(customerData);
      const messages = this.buildMessages(systemPrompt, conversationContext, customerInput);

      openaiLogger.info('Generating AI response', { 
        customerName: customerData.name,
        conversationStep: conversationContext.currentStep,
        inputLength: customerInput?.length || 0
      });

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: this.maxTokens,
        temperature: this.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const response = completion.choices[0].message.content.trim();
      
      openaiLogger.info('AI response generated', { 
        responseLength: response.length,
        tokensUsed: completion.usage.total_tokens
      });

      return {
        response,
        tokensUsed: completion.usage.total_tokens,
        nextStep: this.determineNextStep(response, conversationContext)
      };
    } catch (error) {
      openaiLogger.error('Failed to generate AI response', { 
        error: error.message,
        customerName: customerData.name 
      });
      throw new AppError(`Failed to generate AI response: ${error.message}`, 500);
    }
  }

  /**
   * Build system prompt for the AI
   */
  buildSystemPrompt(customerData) {
    return `You are a friendly car dealership representative calling ${customerData.name} who previously enquired about a ${customerData.carModel}. 

IMPORTANT GUIDELINES:
- Keep responses under 30 words and conversational
- Sound natural and human-like, not robotic
- Be polite and respectful
- Follow the conversation flow strictly
- Ask only ONE question at a time
- Wait for customer response before proceeding

CONVERSATION FLOW:
1. GREETING: "Hi, is this [Customer Name]? This is [Your Name] from [Dealership]. You recently enquired about the [Car Model] - is now a good time to talk?"

2. INTEREST CHECK: "Are you still interested in the [Car Model]?"
   - If YES → go to APPOINTMENT
   - If NO → go to ALTERNATIVES

3. APPOINTMENT: "Great! Would you like to arrange another appointment to see or test drive the [Car Model]?"
   - If YES → schedule and end call
   - If NO → go to ALTERNATIVES

4. ALTERNATIVES: "No problem. Would you be interested in hearing about similar cars we currently have available?"
   - If YES → go to EMAIL COLLECTION
   - If NO → thank and end call

5. EMAIL COLLECTION: "Perfect! What's the best email address to send those similar car options to?"
   - Collect email and end call

RESPONSE RULES:
- Never repeat the same question
- Adapt to customer's tone and energy
- If customer seems busy, offer to call back
- If customer is unclear, politely ask for clarification
- Always confirm important details (email, appointment times)

Customer Details:
- Name: ${customerData.name}
- Car Model: ${customerData.carModel}
- Phone: ${customerData.phone}
- Previous Enquiry Date: ${customerData.enquiryDate || 'Recently'}`;
  }

  /**
   * Build conversation messages for OpenAI
   */
  buildMessages(systemPrompt, conversationContext, customerInput) {
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (conversationContext.history && conversationContext.history.length > 0) {
      conversationContext.history.forEach(exchange => {
        messages.push({ role: 'assistant', content: exchange.ai });
        if (exchange.customer) {
          messages.push({ role: 'user', content: exchange.customer });
        }
      });
    }

    // Add current customer input
    if (customerInput) {
      messages.push({ role: 'user', content: customerInput });
    }

    // Add context about current step
    const stepContext = this.getStepContext(conversationContext.currentStep);
    if (stepContext) {
      messages.push({ role: 'system', content: stepContext });
    }

    return messages;
  }

  /**
   * Get context for current conversation step
   */
  getStepContext(currentStep) {
    const stepContexts = {
      'greeting': 'Start with the greeting. Confirm you\'re speaking to the right person and ask if it\'s a good time to talk.',
      'interest_check': 'Ask if they\'re still interested in the original car model they enquired about.',
      'appointment': 'They\'re interested! Ask if they want to schedule an appointment or test drive.',
      'alternatives': 'They\'re not interested in the original car. Ask if they want to hear about similar options.',
      'email_collection': 'They want similar car options. Ask for their email address to send the information.',
      'closing': 'Wrap up the conversation politely and professionally.'
    };

    return stepContexts[currentStep] || null;
  }

  /**
   * Determine next conversation step based on AI response and context
   */
  determineNextStep(response, conversationContext) {
    const currentStep = conversationContext.currentStep;
    const lowerResponse = response.toLowerCase();

    // Simple step progression logic
    const stepFlow = {
      'greeting': 'interest_check',
      'interest_check': lowerResponse.includes('yes') || lowerResponse.includes('interested') ? 'appointment' : 'alternatives',
      'appointment': lowerResponse.includes('yes') || lowerResponse.includes('schedule') ? 'closing' : 'alternatives',
      'alternatives': lowerResponse.includes('yes') || lowerResponse.includes('interested') ? 'email_collection' : 'closing',
      'email_collection': 'closing',
      'closing': 'completed'
    };

    return stepFlow[currentStep] || 'closing';
  }

  /**
   * Analyze customer sentiment
   */
  async analyzeSentiment(customerInput) {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Analyze the sentiment of the customer response. Respond with only: POSITIVE, NEGATIVE, or NEUTRAL'
          },
          {
            role: 'user',
            content: customerInput
          }
        ],
        max_tokens: 10,
        temperature: 0.1,
      });

      return completion.choices[0].message.content.trim().toUpperCase();
    } catch (error) {
      openaiLogger.error('Failed to analyze sentiment', { error: error.message });
      return 'NEUTRAL';
    }
  }

  /**
   * Extract key information from customer response
   */
  async extractInformation(customerInput, extractionType) {
    try {
      let prompt = '';
      
      switch (extractionType) {
        case 'email':
          prompt = 'Extract the email address from this text. If no email is found, respond with "NONE". Only return the email address, nothing else.';
          break;
        case 'appointment_preference':
          prompt = 'Extract any date/time preferences mentioned. If none found, respond with "NONE". Be concise.';
          break;
        case 'intent':
          prompt = 'Determine if the customer is expressing: INTERESTED, NOT_INTERESTED, MAYBE, or UNCLEAR';
          break;
        default:
          return null;
      }

      const completion = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: customerInput }
        ],
        max_tokens: 50,
        temperature: 0.1,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      openaiLogger.error('Failed to extract information', { 
        error: error.message, 
        extractionType 
      });
      return null;
    }
  }
}

module.exports = new OpenAIService();
