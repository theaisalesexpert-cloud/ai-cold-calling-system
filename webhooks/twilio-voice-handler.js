// Twilio Voice Webhook Handler
// This handles incoming and outgoing call events from Twilio

const express = require('express');
const twilio = require('twilio');
const axios = require('axios');
const VoiceServices = require('./voice-services');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Environment variables
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
  OPENAI_API_KEY,
  ELEVENLABS_API_KEY,
  DEEPGRAM_API_KEY,
  N8N_WEBHOOK_URL,
  WEBHOOK_BASE_URL
} = process.env;

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const voiceServices = new VoiceServices();

// Store active call sessions
const callSessions = new Map();

// Webhook endpoint for outgoing calls (initiated by n8n)
app.post('/webhook/call/initiate', async (req, res) => {
  try {
    const { customer_name, phone_number, car_model, dealership_name, bot_name } = req.body;
    
    // Create TwiML response for outgoing call
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Initialize call session
    const sessionId = `call_${Date.now()}`;
    callSessions.set(sessionId, {
      customer_name,
      phone_number,
      car_model,
      dealership_name,
      bot_name,
      conversation_state: 'greeting',
      call_start: new Date(),
      transcript: []
    });
    
    // Start with greeting
    const greeting = `Hi, is this ${customer_name}? Hi ${customer_name}, this is ${bot_name} calling from ${dealership_name}. You recently enquired about the ${car_model} — is now a good time to talk?`;
    
    // Convert text to speech and play
    twiml.say({
      voice: 'alice',
      language: 'en-US'
    }, greeting);
    
    // Gather customer response
    twiml.gather({
      input: 'speech',
      timeout: 10,
      speechTimeout: 3,
      action: `/webhook/call/response/${sessionId}`,
      method: 'POST'
    });
    
    // Fallback if no response
    twiml.say('I didn\'t hear a response. I\'ll try calling back later. Have a great day!');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// Webhook endpoint for handling customer responses
app.post('/webhook/call/response/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { SpeechResult, CallSid } = req.body;
    
    const session = callSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Add customer response to transcript
    session.transcript.push({
      speaker: 'customer',
      text: SpeechResult || 'No response',
      timestamp: new Date()
    });
    
    // Process response with AI
    const aiResponse = await processWithAI(session, SpeechResult);
    
    // Add AI response to transcript
    session.transcript.push({
      speaker: 'ai',
      text: aiResponse.text,
      timestamp: new Date()
    });
    
    // Update session state
    session.conversation_state = aiResponse.next_state;
    session.extracted_data = { ...session.extracted_data, ...aiResponse.extracted_data };
    
    const twiml = new twilio.twiml.VoiceResponse();
    
    if (aiResponse.should_continue) {
      // Continue conversation
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, aiResponse.text);
      
      if (aiResponse.expects_response) {
        twiml.gather({
          input: 'speech',
          timeout: 10,
          speechTimeout: 3,
          action: `/webhook/call/response/${sessionId}`,
          method: 'POST'
        });
        
        twiml.say('I didn\'t catch that. Could you repeat?');
      }
    } else {
      // End call
      twiml.say({
        voice: 'alice',
        language: 'en-US'
      }, aiResponse.text);
      twiml.hangup();
      
      // Send results back to n8n
      await sendResultsToN8N(session);
      
      // Clean up session
      callSessions.delete(sessionId);
    }
    
    res.type('text/xml');
    res.send(twiml.toString());
    
  } catch (error) {
    console.error('Error processing response:', error);
    
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say('I\'m sorry, there was a technical issue. I\'ll have someone call you back. Goodbye!');
    twiml.hangup();
    
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Process customer response with OpenAI
async function processWithAI(session, customerResponse) {
  try {
    const prompt = buildConversationPrompt(session, customerResponse);
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are Sarah, a friendly car dealership representative. Analyze the customer response and provide the next appropriate response in the conversation flow.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    const aiText = response.data.choices[0].message.content;
    
    // Parse AI response for structured data
    const analysis = await analyzeResponse(customerResponse, session.conversation_state);
    
    return {
      text: aiText,
      next_state: analysis.next_state,
      should_continue: analysis.should_continue,
      expects_response: analysis.expects_response,
      extracted_data: analysis.extracted_data
    };
    
  } catch (error) {
    console.error('Error processing with AI:', error);
    return {
      text: 'Thank you for your time. Have a great day!',
      next_state: 'end_call',
      should_continue: false,
      expects_response: false,
      extracted_data: {}
    };
  }
}

// Build conversation prompt for AI
function buildConversationPrompt(session, customerResponse) {
  return `
Current conversation state: ${session.conversation_state}
Customer: ${session.customer_name}
Car model: ${session.car_model}
Customer just said: "${customerResponse}"

Previous conversation:
${session.transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')}

Based on the conversation flow, what should I say next? Keep it natural and conversational.
`;
}

// Analyze customer response for data extraction
async function analyzeResponse(response, currentState) {
  // Simple rule-based analysis (can be enhanced with more AI)
  const lowerResponse = response.toLowerCase();
  
  let extracted_data = {};
  let next_state = currentState;
  let should_continue = true;
  let expects_response = true;
  
  // Extract email if present
  const emailMatch = response.match(/[\w.-]+@[\w.-]+\.\w+/);
  if (emailMatch) {
    extracted_data.email_address = emailMatch[0];
  }
  
  // Determine next state based on current state and response
  switch (currentState) {
    case 'greeting':
      if (lowerResponse.includes('yes') || lowerResponse.includes('sure')) {
        next_state = 'confirm_interest';
      } else if (lowerResponse.includes('no') || lowerResponse.includes('not now')) {
        next_state = 'reschedule';
      }
      break;
      
    case 'confirm_interest':
      if (lowerResponse.includes('yes') || lowerResponse.includes('still interested')) {
        extracted_data.still_interested = 'yes';
        next_state = 'arrange_appointment';
      } else if (lowerResponse.includes('no') || lowerResponse.includes('not interested')) {
        extracted_data.still_interested = 'no';
        next_state = 'offer_similar';
      }
      break;
      
    case 'arrange_appointment':
      if (lowerResponse.includes('yes') || lowerResponse.includes('appointment')) {
        extracted_data.wants_appointment = 'yes';
        next_state = 'schedule_appointment';
      } else {
        extracted_data.wants_appointment = 'no';
        next_state = 'offer_similar';
      }
      break;
      
    case 'offer_similar':
      if (lowerResponse.includes('yes') || lowerResponse.includes('interested')) {
        extracted_data.interested_similar = 'yes';
        next_state = 'collect_email';
      } else {
        extracted_data.interested_similar = 'no';
        next_state = 'end_call';
        should_continue = false;
        expects_response = false;
      }
      break;
      
    case 'collect_email':
      if (emailMatch) {
        next_state = 'end_call';
        should_continue = false;
        expects_response = false;
      }
      break;
  }
  
  return {
    next_state,
    should_continue,
    expects_response,
    extracted_data
  };
}

// Send call results back to n8n
async function sendResultsToN8N(session) {
  try {
    const callData = {
      phone_number: session.phone_number,
      call_duration: Math.floor((new Date() - session.call_start) / 1000),
      call_status: 'completed',
      transcript: session.transcript,
      extracted_data: session.extracted_data || {},
      call_notes: generateCallSummary(session)
    };
    
    await axios.post(`${N8N_WEBHOOK_URL}/webhook/call-completed`, callData);
    
  } catch (error) {
    console.error('Error sending results to n8n:', error);
  }
}

// Generate call summary
function generateCallSummary(session) {
  const data = session.extracted_data || {};
  let summary = `Call with ${session.customer_name} about ${session.car_model}. `;
  
  if (data.still_interested === 'yes') {
    summary += 'Customer still interested in original car. ';
  } else if (data.still_interested === 'no') {
    summary += 'Customer no longer interested in original car. ';
  }
  
  if (data.wants_appointment === 'yes') {
    summary += 'Wants to schedule appointment. ';
  }
  
  if (data.interested_similar === 'yes') {
    summary += 'Interested in similar cars. ';
  }
  
  if (data.email_address) {
    summary += `Email provided: ${data.email_address}. `;
  }
  
  return summary.trim();
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Twilio webhook server running on port ${PORT}`);
});

module.exports = app;
