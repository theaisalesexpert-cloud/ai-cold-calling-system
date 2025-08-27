// Advanced AI Conversation Management System
// Handles context-aware conversations with sentiment analysis and dynamic responses

const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../utils/config');
const { APIError, ValidationError } = require('../utils/errorHandler');

class ConversationManager {
  constructor() {
    this.openaiConfig = config.getAIConfig().openai;
    this.conversationContexts = new Map();
    this.sentimentAnalyzer = new SentimentAnalyzer();
    this.intentClassifier = new IntentClassifier();
    this.responseGenerator = new ResponseGenerator();
    
    // Conversation flow states
    this.conversationStates = {
      GREETING: 'greeting',
      CONFIRM_INTEREST: 'confirm_interest',
      ARRANGE_APPOINTMENT: 'arrange_appointment',
      SCHEDULE_APPOINTMENT: 'schedule_appointment',
      OFFER_SIMILAR: 'offer_similar',
      COLLECT_EMAIL: 'collect_email',
      RESCHEDULE: 'reschedule',
      END_CALL: 'end_call'
    };

    // Load conversation prompts
    this.loadConversationPrompts();
  }

  async loadConversationPrompts() {
    try {
      const fs = require('fs');
      const path = require('path');
      const promptsPath = path.join(__dirname, '../../config/conversation-prompts.json');
      
      if (fs.existsSync(promptsPath)) {
        this.conversationPrompts = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
      } else {
        this.conversationPrompts = this.getDefaultPrompts();
      }
    } catch (error) {
      logger.error('Failed to load conversation prompts', { error: error.message });
      this.conversationPrompts = this.getDefaultPrompts();
    }
  }

  /**
   * Process customer response and generate AI reply
   * @param {string} sessionId - Conversation session ID
   * @param {string} customerResponse - Customer's speech input
   * @param {object} sessionData - Current session data
   * @returns {Promise<object>} AI response with next actions
   */
  async processCustomerResponse(sessionId, customerResponse, sessionData) {
    try {
      // Get or create conversation context
      let context = this.conversationContexts.get(sessionId);
      if (!context) {
        context = this.createConversationContext(sessionData);
        this.conversationContexts.set(sessionId, context);
      }

      // Analyze customer response
      const analysis = await this.analyzeCustomerResponse(customerResponse, context);
      
      // Update context with new information
      this.updateConversationContext(context, customerResponse, analysis);
      
      // Generate appropriate AI response
      const aiResponse = await this.generateAIResponse(context, analysis);
      
      // Update conversation state
      context.currentState = aiResponse.nextState;
      context.turnCount++;
      
      // Log conversation step
      logger.conversationStep(sessionId, context.currentState, customerResponse, aiResponse.text);
      
      return {
        text: aiResponse.text,
        nextState: aiResponse.nextState,
        shouldContinue: aiResponse.shouldContinue,
        expectsResponse: aiResponse.expectsResponse,
        extractedData: analysis.extractedData,
        sentiment: analysis.sentiment,
        confidence: analysis.confidence,
        suggestedActions: aiResponse.suggestedActions
      };

    } catch (error) {
      logger.error('Error processing customer response', {
        sessionId,
        error: error.message,
        customerResponse: customerResponse?.substring(0, 100)
      });
      
      return this.getErrorResponse();
    }
  }

  createConversationContext(sessionData) {
    return {
      sessionId: sessionData.sessionId || `session_${Date.now()}`,
      customerName: sessionData.customer_name,
      phoneNumber: sessionData.phone_number,
      carModel: sessionData.car_model,
      dealershipName: sessionData.dealership_name,
      botName: sessionData.bot_name,
      currentState: this.conversationStates.GREETING,
      conversationHistory: [],
      extractedData: {},
      sentimentHistory: [],
      turnCount: 0,
      startTime: new Date(),
      lastActivity: new Date(),
      customerProfile: {
        communicationStyle: 'unknown',
        urgencyLevel: 'medium',
        interests: [],
        concerns: []
      }
    };
  }

  async analyzeCustomerResponse(response, context) {
    try {
      // Sentiment analysis
      const sentiment = await this.sentimentAnalyzer.analyze(response);
      
      // Intent classification
      const intent = await this.intentClassifier.classify(response, context.currentState);
      
      // Extract structured data
      const extractedData = this.extractDataFromResponse(response, context.currentState);
      
      // Analyze communication style
      const communicationStyle = this.analyzeCommunicationStyle(response, context);
      
      return {
        sentiment,
        intent,
        extractedData,
        communicationStyle,
        confidence: intent.confidence,
        urgency: this.detectUrgency(response, sentiment)
      };

    } catch (error) {
      logger.error('Error analyzing customer response', { error: error.message });
      return {
        sentiment: { score: 0, label: 'neutral' },
        intent: { name: 'unknown', confidence: 0 },
        extractedData: {},
        communicationStyle: 'unknown',
        confidence: 0,
        urgency: 'medium'
      };
    }
  }

  async generateAIResponse(context, analysis) {
    try {
      // Build conversation prompt
      const prompt = this.buildConversationPrompt(context, analysis);
      
      // Get AI response from OpenAI
      const aiResponse = await this.callOpenAI(prompt, context);
      
      // Parse and structure the response
      const structuredResponse = this.parseAIResponse(aiResponse, context, analysis);
      
      return structuredResponse;

    } catch (error) {
      logger.error('Error generating AI response', { error: error.message });
      return this.getFallbackResponse(context);
    }
  }

  buildConversationPrompt(context, analysis) {
    const businessConfig = config.getBusinessConfig();
    
    return `
You are ${context.botName}, a professional and friendly representative from ${context.dealershipName}.

CUSTOMER CONTEXT:
- Name: ${context.customerName}
- Car of Interest: ${context.carModel}
- Current State: ${context.currentState}
- Conversation Turn: ${context.turnCount}
- Customer Sentiment: ${analysis.sentiment.label} (${analysis.sentiment.score})
- Detected Intent: ${analysis.intent.name}
- Communication Style: ${analysis.communicationStyle}

CONVERSATION HISTORY:
${context.conversationHistory.slice(-3).map(h => `${h.speaker}: ${h.text}`).join('\n')}

CURRENT CUSTOMER RESPONSE: "${context.conversationHistory[context.conversationHistory.length - 1]?.text || 'No response'}"

EXTRACTED DATA: ${JSON.stringify(analysis.extractedData)}

INSTRUCTIONS:
1. Respond naturally and professionally as ${context.botName}
2. Stay focused on the conversation goal for state: ${context.currentState}
3. Adapt your tone to match the customer's ${analysis.communicationStyle} style
4. Address any concerns or sentiment issues (current: ${analysis.sentiment.label})
5. Keep responses concise (under 50 words)
6. Use the customer's name naturally
7. If the customer seems frustrated, acknowledge and redirect positively

RESPONSE FORMAT:
{
  "text": "Your response here",
  "nextState": "next_conversation_state",
  "shouldContinue": true/false,
  "expectsResponse": true/false,
  "suggestedActions": ["action1", "action2"]
}

Generate an appropriate response:`;
  }

  async callOpenAI(prompt, context) {
    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: this.openaiConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert car dealership representative. Always respond with valid JSON in the specified format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: this.openaiConfig.temperature,
        max_tokens: this.openaiConfig.maxTokens,
        response_format: { type: "json_object" }
      }, {
        headers: {
          'Authorization': `Bearer ${this.openaiConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return JSON.parse(response.data.choices[0].message.content);
    } catch (error) {
      logger.error('OpenAI API call failed', { error: error.message });
      throw new APIError('OpenAI', 'Failed to generate AI response', error);
    }
  }

  parseAIResponse(aiResponse, context, analysis) {
    return {
      text: aiResponse.text || 'Thank you for your time.',
      nextState: aiResponse.nextState || this.conversationStates.END_CALL,
      shouldContinue: aiResponse.shouldContinue !== false,
      expectsResponse: aiResponse.expectsResponse !== false,
      suggestedActions: aiResponse.suggestedActions || []
    };
  }

  updateConversationContext(context, customerResponse, analysis) {
    // Add to conversation history
    context.conversationHistory.push({
      speaker: 'customer',
      text: customerResponse,
      timestamp: new Date(),
      sentiment: analysis.sentiment,
      intent: analysis.intent
    });

    // Update extracted data
    Object.assign(context.extractedData, analysis.extractedData);

    // Update sentiment history
    context.sentimentHistory.push({
      timestamp: new Date(),
      sentiment: analysis.sentiment,
      turn: context.turnCount
    });

    // Update customer profile
    if (analysis.communicationStyle !== 'unknown') {
      context.customerProfile.communicationStyle = analysis.communicationStyle;
    }
    
    context.customerProfile.urgencyLevel = analysis.urgency;
    context.lastActivity = new Date();
  }

  extractDataFromResponse(response, currentState) {
    const extractedData = {};
    const lowerResponse = response.toLowerCase();

    // Extract email addresses
    const emailMatch = response.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      extractedData.email_address = emailMatch[0];
    }

    // Extract phone numbers
    const phoneMatch = response.match(/(\+?1?[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
    if (phoneMatch) {
      extractedData.phone_number = phoneMatch[0];
    }

    // Extract time preferences
    const timePatterns = ['morning', 'afternoon', 'evening', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    for (const pattern of timePatterns) {
      if (lowerResponse.includes(pattern)) {
        extractedData.preferred_time = extractedData.preferred_time || [];
        extractedData.preferred_time.push(pattern);
      }
    }

    // State-specific extractions
    switch (currentState) {
      case this.conversationStates.CONFIRM_INTEREST:
        if (lowerResponse.includes('yes') || lowerResponse.includes('still interested')) {
          extractedData.still_interested = 'yes';
        } else if (lowerResponse.includes('no') || lowerResponse.includes('not interested')) {
          extractedData.still_interested = 'no';
        }
        break;

      case this.conversationStates.ARRANGE_APPOINTMENT:
        if (lowerResponse.includes('yes') || lowerResponse.includes('appointment')) {
          extractedData.wants_appointment = 'yes';
        } else if (lowerResponse.includes('no')) {
          extractedData.wants_appointment = 'no';
        }
        break;

      case this.conversationStates.OFFER_SIMILAR:
        if (lowerResponse.includes('yes') || lowerResponse.includes('interested')) {
          extractedData.interested_similar = 'yes';
        } else if (lowerResponse.includes('no')) {
          extractedData.interested_similar = 'no';
        }
        break;
    }

    return extractedData;
  }

  analyzeCommunicationStyle(response, context) {
    const length = response.length;
    const wordCount = response.split(' ').length;
    
    if (length < 10) return 'brief';
    if (length > 100) return 'detailed';
    if (response.includes('!') || response.includes('?')) return 'expressive';
    if (wordCount < 5) return 'concise';
    
    return 'conversational';
  }

  detectUrgency(response, sentiment) {
    const urgentWords = ['urgent', 'asap', 'quickly', 'soon', 'immediately', 'rush'];
    const hasUrgentWords = urgentWords.some(word => response.toLowerCase().includes(word));
    
    if (hasUrgentWords || sentiment.score < -0.5) return 'high';
    if (sentiment.score > 0.5) return 'low';
    return 'medium';
  }

  getErrorResponse() {
    return {
      text: "I apologize, but I'm having some technical difficulties. Let me have someone call you back shortly.",
      nextState: this.conversationStates.END_CALL,
      shouldContinue: false,
      expectsResponse: false,
      extractedData: {},
      sentiment: { score: 0, label: 'neutral' },
      confidence: 0,
      suggestedActions: ['schedule_callback']
    };
  }

  getFallbackResponse(context) {
    return {
      text: `Thank you for your time, ${context.customerName}. I'll have someone from our team follow up with you soon.`,
      nextState: this.conversationStates.END_CALL,
      shouldContinue: false,
      expectsResponse: false,
      suggestedActions: ['schedule_callback']
    };
  }

  getDefaultPrompts() {
    return {
      conversation_flow: {
        greeting: {
          script: "Hi, is this {customer_name}? Hi {customer_name}, this is {bot_name} calling from {dealership_name}. You recently enquired about the {car_model} — is now a good time to talk?",
          next_steps: { yes: "confirm_interest", no: "reschedule" }
        }
      }
    };
  }

  // Cleanup old conversation contexts
  cleanupOldContexts() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [sessionId, context] of this.conversationContexts.entries()) {
      if (now - context.lastActivity > maxAge) {
        this.conversationContexts.delete(sessionId);
        logger.info('Cleaned up old conversation context', { sessionId });
      }
    }
  }

  getConversationSummary(sessionId) {
    const context = this.conversationContexts.get(sessionId);
    if (!context) return null;

    return {
      sessionId,
      customerName: context.customerName,
      carModel: context.carModel,
      duration: new Date() - context.startTime,
      turnCount: context.turnCount,
      finalState: context.currentState,
      extractedData: context.extractedData,
      sentimentTrend: this.calculateSentimentTrend(context.sentimentHistory),
      customerProfile: context.customerProfile
    };
  }

  calculateSentimentTrend(sentimentHistory) {
    if (sentimentHistory.length < 2) return 'stable';
    
    const recent = sentimentHistory.slice(-3);
    const trend = recent[recent.length - 1].sentiment.score - recent[0].sentiment.score;
    
    if (trend > 0.2) return 'improving';
    if (trend < -0.2) return 'declining';
    return 'stable';
  }
}

// Sentiment Analysis Helper
class SentimentAnalyzer {
  async analyze(text) {
    // Simple rule-based sentiment analysis
    // In production, you might want to use a more sophisticated service
    const positiveWords = ['yes', 'great', 'good', 'excellent', 'perfect', 'love', 'interested', 'definitely'];
    const negativeWords = ['no', 'bad', 'terrible', 'hate', 'not interested', 'never', 'awful'];
    
    const words = text.toLowerCase().split(' ');
    let score = 0;
    
    for (const word of words) {
      if (positiveWords.includes(word)) score += 1;
      if (negativeWords.includes(word)) score -= 1;
    }
    
    // Normalize score
    const normalizedScore = Math.max(-1, Math.min(1, score / words.length * 10));
    
    let label = 'neutral';
    if (normalizedScore > 0.1) label = 'positive';
    if (normalizedScore < -0.1) label = 'negative';
    
    return { score: normalizedScore, label };
  }
}

// Intent Classification Helper
class IntentClassifier {
  async classify(text, currentState) {
    const lowerText = text.toLowerCase();
    
    // Define intents based on current state and keywords
    const intents = {
      affirmative: ['yes', 'sure', 'okay', 'definitely', 'absolutely'],
      negative: ['no', 'not really', 'nope', 'not interested'],
      schedule: ['appointment', 'schedule', 'meet', 'visit', 'come in'],
      email: ['email', 'send', 'mail', '@'],
      reschedule: ['later', 'another time', 'call back', 'not now'],
      question: ['?', 'what', 'how', 'when', 'where', 'why']
    };
    
    let bestIntent = 'unknown';
    let maxScore = 0;
    
    for (const [intent, keywords] of Object.entries(intents)) {
      const score = keywords.reduce((acc, keyword) => {
        return acc + (lowerText.includes(keyword) ? 1 : 0);
      }, 0);
      
      if (score > maxScore) {
        maxScore = score;
        bestIntent = intent;
      }
    }
    
    return {
      name: bestIntent,
      confidence: Math.min(1, maxScore / 3) // Normalize confidence
    };
  }
}

// Response Generation Helper
class ResponseGenerator {
  generateResponse(intent, context, sentiment) {
    // This could be expanded with more sophisticated response generation
    // For now, it's handled by the main conversation manager
    return null;
  }
}

module.exports = ConversationManager;
