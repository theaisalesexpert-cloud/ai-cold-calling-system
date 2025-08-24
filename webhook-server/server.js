const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const axios = require('axios');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const winston = require('winston');
require('dotenv').config();

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Validate required environment variables
const requiredEnvVars = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
  'OPENAI_API_KEY',
  'ELEVENLABS_API_KEY',
  'ELEVENLABS_VOICE_ID'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error('Missing required environment variables:', { missingEnvVars });
  console.error('❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
  console.error('\n📋 Please add these environment variables in Render.com dashboard:');
  console.error('   Settings → Environment → Add Environment Variable');
  process.exit(1);
}

// Twilio client
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Store active call sessions
const activeCalls = new Map();

// Call session class
class CallSession {
  constructor(callSid, customerData) {
    this.callSid = callSid;
    this.sessionId = uuidv4();
    this.customerData = customerData;
    this.conversationHistory = [];
    this.currentStep = 'greeting';
    this.callOutcome = {};
    this.startTime = moment();
    this.isActive = true;
  }

  addMessage(role, content) {
    this.conversationHistory.push({
      role,
      content,
      timestamp: moment().toISOString()
    });
  }

  updateOutcome(key, value) {
    this.callOutcome[key] = value;
  }

  getConversationContext() {
    return this.conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: moment().toISOString(),
    activeCalls: activeCalls.size
  });
});

// Webhook endpoint for Twilio voice calls
app.post('/webhook/twilio/voice', async (req, res) => {
  try {
    const { CallSid, From, To, CallStatus } = req.body;
    
    logger.info('Twilio voice webhook received', { 
      CallSid, 
      From, 
      To, 
      CallStatus 
    });

    // Handle different call statuses
    switch (CallStatus) {
      case 'ringing':
        await handleCallRinging(CallSid, From, To);
        break;
      case 'in-progress':
        await handleCallInProgress(CallSid, From, To);
        break;
      case 'completed':
      case 'busy':
      case 'no-answer':
      case 'failed':
        await handleCallEnded(CallSid, CallStatus);
        break;
    }

    // Generate TwiML response
    const twiml = new twilio.twiml.VoiceResponse();
    
    if (CallStatus === 'in-progress') {
      // Start the conversation
      const session = activeCalls.get(CallSid);
      if (session) {
        const greeting = await generateGreeting(session.customerData);
        const audioUrl = await synthesizeSpeech(greeting);
        
        twiml.play(audioUrl);
        twiml.gather({
          input: 'speech',
          action: `/webhook/twilio/gather/${CallSid}`,
          method: 'POST',
          speechTimeout: 3,
          timeout: 10
        });
      }
    }

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    logger.error('Error in Twilio voice webhook', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle speech input from customer
app.post('/webhook/twilio/gather/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;
    const { SpeechResult, Confidence } = req.body;
    
    logger.info('Speech input received', { 
      callSid, 
      SpeechResult, 
      Confidence 
    });

    const session = activeCalls.get(callSid);
    if (!session) {
      logger.error('Session not found for call', { callSid });
      return res.status(404).json({ error: 'Session not found' });
    }

    // Add customer response to conversation history
    session.addMessage('user', SpeechResult);

    // Generate AI response based on conversation context
    const aiResponse = await generateAIResponse(session);
    
    // Add AI response to conversation history
    session.addMessage('assistant', aiResponse.text);

    // Update call outcome based on response
    updateCallOutcome(session, aiResponse);

    // Generate TwiML response
    const twiml = new twilio.twiml.VoiceResponse();
    
    if (aiResponse.shouldContinue) {
      // Synthesize and play AI response
      const audioUrl = await synthesizeSpeech(aiResponse.text);
      twiml.play(audioUrl);
      
      // Continue gathering input
      twiml.gather({
        input: 'speech',
        action: `/webhook/twilio/gather/${callSid}`,
        method: 'POST',
        speechTimeout: 3,
        timeout: 10
      });
    } else {
      // End the call
      const audioUrl = await synthesizeSpeech(aiResponse.text);
      twiml.play(audioUrl);
      twiml.hangup();
      
      // Finalize call session
      await finalizeCallSession(session);
    }

    res.type('text/xml');
    res.send(twiml.toString());

  } catch (error) {
    logger.error('Error processing speech input', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI Integration Functions

// Generate greeting message
async function generateGreeting(customerData) {
  const greeting = `Hi, is this ${customerData.name}? Hi ${customerData.name}, this is Sarah calling from Premium Auto Sales. You recently enquired about the ${customerData.carModel} — is now a good time to talk?`;
  return greeting;
}

// Generate AI response using OpenAI
async function generateAIResponse(session) {
  try {
    const systemPrompt = `You are Sarah, a friendly car dealership representative making a follow-up call.

Customer Info:
- Name: ${session.customerData.name}
- Car: ${session.customerData.carModel}
- Enquiry Date: ${session.customerData.enquiryDate}

Call Script Flow:
1. Confirm interest in original car
2. If yes, offer appointment
3. If no, offer similar cars
4. If interested in similar cars, get email

Keep responses natural, brief (1-2 sentences), and conversational.
Determine the customer's intent and respond accordingly.
End the call politely when appropriate.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...session.getConversationContext()
    ];

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: messages,
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 150,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiText = response.data.choices[0].message.content;

    // Determine if conversation should continue
    const shouldContinue = !aiText.toLowerCase().includes('goodbye') &&
                          !aiText.toLowerCase().includes('thank you for your time') &&
                          !aiText.toLowerCase().includes('have a great day');

    return {
      text: aiText,
      shouldContinue: shouldContinue
    };

  } catch (error) {
    logger.error('Error generating AI response', { error: error.message });
    return {
      text: "I apologize, but I'm having technical difficulties. Let me transfer you to a human representative.",
      shouldContinue: false
    };
  }
}

// Synthesize speech using ElevenLabs
async function synthesizeSpeech(text) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        text: text,
        model_id: process.env.ELEVENLABS_MODEL || 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    // In production, you'd save this to a CDN or cloud storage
    // For now, we'll return a placeholder URL
    const audioUrl = `${process.env.WEBHOOK_BASE_URL}/audio/${uuidv4()}.mp3`;

    // TODO: Save audio buffer to storage and return actual URL
    logger.info('Speech synthesized', { text: text.substring(0, 50), audioUrl });

    return audioUrl;

  } catch (error) {
    logger.error('Error synthesizing speech', { error: error.message });
    // Return a fallback TTS URL or handle gracefully
    return null;
  }
}

// Update call outcome based on AI response
function updateCallOutcome(session, aiResponse) {
  const text = aiResponse.text.toLowerCase();

  // Analyze response to extract outcomes
  if (text.includes('still interested') || text.includes('yes')) {
    session.updateOutcome('stillInterested', 'Yes');
  } else if (text.includes('not interested') || text.includes('no')) {
    session.updateOutcome('stillInterested', 'No');
  }

  if (text.includes('appointment') || text.includes('schedule')) {
    session.updateOutcome('wantsAppointment', 'Yes');
  }

  if (text.includes('similar cars') || text.includes('alternatives')) {
    session.updateOutcome('wantsSimilarCars', 'Yes');
  }

  if (text.includes('@') || text.includes('email')) {
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      session.updateOutcome('emailAddress', emailMatch[0]);
    }
  }
}

// Handle call events
async function handleCallRinging(callSid, from, to) {
  logger.info('Call ringing', { callSid, from, to });
  // Fetch customer data from n8n or Google Sheets
  const customerData = await fetchCustomerData(to);
  const session = new CallSession(callSid, customerData);
  activeCalls.set(callSid, session);
}

async function handleCallInProgress(callSid, from, to) {
  logger.info('Call in progress', { callSid, from, to });
  // Update call status in Google Sheets
  await updateCallStatus(callSid, 'Calling');
}

async function handleCallEnded(callSid, callStatus) {
  logger.info('Call ended', { callSid, callStatus });
  const session = activeCalls.get(callSid);
  if (session) {
    session.isActive = false;
    await finalizeCallSession(session);
    activeCalls.delete(callSid);
  }
}

// Finalize call session and update Google Sheets
async function finalizeCallSession(session) {
  try {
    const callData = {
      callSid: session.callSid,
      customerName: session.customerData.name,
      phoneNumber: session.customerData.phoneNumber,
      callOutcome: session.callOutcome,
      conversationHistory: session.conversationHistory,
      duration: moment().diff(session.startTime, 'minutes'),
      endTime: moment().toISOString()
    };

    // Update Google Sheets via n8n webhook
    await axios.post(`${process.env.N8N_WEBHOOK_URL}/call-completed`, callData);

    logger.info('Call session finalized', {
      callSid: session.callSid,
      outcome: session.callOutcome
    });

  } catch (error) {
    logger.error('Error finalizing call session', { error: error.message });
  }
}

// Fetch customer data (placeholder - implement based on your data source)
async function fetchCustomerData(phoneNumber) {
  // This would typically fetch from Google Sheets via n8n
  return {
    name: 'John Smith',
    phoneNumber: phoneNumber,
    carModel: 'BMW X5 2023',
    enquiryDate: '2024-01-15'
  };
}

// Update call status in Google Sheets
async function updateCallStatus(callSid, status) {
  try {
    await axios.post(`${process.env.N8N_WEBHOOK_URL}/call-status-update`, {
      callSid,
      status,
      timestamp: moment().toISOString()
    });
  } catch (error) {
    logger.error('Error updating call status', { error: error.message });
  }
}

// AI Integration Functions

// Generate greeting message
async function generateGreeting(customerData) {
  const greeting = `Hi, is this ${customerData.name}? Hi ${customerData.name}, this is Sarah calling from Premium Auto Sales. You recently enquired about the ${customerData.carModel} — is now a good time to talk?`;
  return greeting;
}

// Generate AI response using OpenAI
async function generateAIResponse(session) {
  try {
    const systemPrompt = `You are Sarah, a friendly car dealership representative making a follow-up call.

Customer Info:
- Name: ${session.customerData.name}
- Car: ${session.customerData.carModel}
- Enquiry Date: ${session.customerData.enquiryDate}

Call Script Flow:
1. Confirm interest in original car
2. If yes, offer appointment
3. If no, offer similar cars
4. If interested in similar cars, get email

Keep responses natural, brief (1-2 sentences), and conversational.
Determine the customer's intent and respond accordingly.
End the call politely when appropriate.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...session.getConversationContext()
    ];

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: messages,
      max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 150,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiText = response.data.choices[0].message.content;

    // Determine if conversation should continue
    const shouldContinue = !aiText.toLowerCase().includes('goodbye') &&
                          !aiText.toLowerCase().includes('thank you for your time') &&
                          !aiText.toLowerCase().includes('have a great day');

    return {
      text: aiText,
      shouldContinue: shouldContinue
    };

  } catch (error) {
    logger.error('Error generating AI response', { error: error.message });
    return {
      text: "I apologize, but I'm having technical difficulties. Let me transfer you to a human representative.",
      shouldContinue: false
    };
  }
}

// Synthesize speech using ElevenLabs
async function synthesizeSpeech(text) {
  try {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}`,
      {
        text: text,
        model_id: process.env.ELEVENLABS_MODEL || 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );

    // In production, you'd save this to a CDN or cloud storage
    // For now, we'll return a placeholder URL
    const audioUrl = `${process.env.WEBHOOK_BASE_URL}/audio/${uuidv4()}.mp3`;

    // TODO: Save audio buffer to storage and return actual URL
    logger.info('Speech synthesized', { text: text.substring(0, 50), audioUrl });

    return audioUrl;

  } catch (error) {
    logger.error('Error synthesizing speech', { error: error.message });
    // Return a fallback TTS URL or handle gracefully
    return null;
  }
}

// Update call outcome based on AI response
function updateCallOutcome(session, aiResponse) {
  const text = aiResponse.text.toLowerCase();

  // Analyze response to extract outcomes
  if (text.includes('still interested') || text.includes('yes')) {
    session.updateOutcome('stillInterested', 'Yes');
  } else if (text.includes('not interested') || text.includes('no')) {
    session.updateOutcome('stillInterested', 'No');
  }

  if (text.includes('appointment') || text.includes('schedule')) {
    session.updateOutcome('wantsAppointment', 'Yes');
  }

  if (text.includes('similar cars') || text.includes('alternatives')) {
    session.updateOutcome('wantsSimilarCars', 'Yes');
  }

  if (text.includes('@') || text.includes('email')) {
    const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      session.updateOutcome('emailAddress', emailMatch[0]);
    }
  }
}

// Handle call events
async function handleCallRinging(callSid, from, to) {
  logger.info('Call ringing', { callSid, from, to });
  // Fetch customer data from n8n or Google Sheets
  const customerData = await fetchCustomerData(to);
  const session = new CallSession(callSid, customerData);
  activeCalls.set(callSid, session);
}

async function handleCallInProgress(callSid, from, to) {
  logger.info('Call in progress', { callSid, from, to });
  // Update call status in Google Sheets
  await updateCallStatus(callSid, 'Calling');
}

async function handleCallEnded(callSid, callStatus) {
  logger.info('Call ended', { callSid, callStatus });
  const session = activeCalls.get(callSid);
  if (session) {
    session.isActive = false;
    await finalizeCallSession(session);
    activeCalls.delete(callSid);
  }
}

// Finalize call session and update Google Sheets
async function finalizeCallSession(session) {
  try {
    const callData = {
      callSid: session.callSid,
      customerName: session.customerData.name,
      phoneNumber: session.customerData.phoneNumber,
      callOutcome: session.callOutcome,
      conversationHistory: session.conversationHistory,
      duration: moment().diff(session.startTime, 'minutes'),
      endTime: moment().toISOString()
    };

    // Update Google Sheets via n8n webhook
    await axios.post(`${process.env.N8N_WEBHOOK_URL}/call-completed`, callData);

    logger.info('Call session finalized', {
      callSid: session.callSid,
      outcome: session.callOutcome
    });

  } catch (error) {
    logger.error('Error finalizing call session', { error: error.message });
  }
}

// Fetch customer data (placeholder - implement based on your data source)
async function fetchCustomerData(phoneNumber) {
  // This would typically fetch from Google Sheets via n8n
  return {
    name: 'John Smith',
    phoneNumber: phoneNumber,
    carModel: 'BMW X5 2023',
    enquiryDate: '2024-01-15'
  };
}

// Update call status in Google Sheets
async function updateCallStatus(callSid, status) {
  try {
    await axios.post(`${process.env.N8N_WEBHOOK_URL}/call-status-update`, {
      callSid,
      status,
      timestamp: moment().toISOString()
    });
  } catch (error) {
    logger.error('Error updating call status', { error: error.message });
  }
}

// Start server
app.listen(port, () => {
  logger.info(`AI Cold Calling Webhook Server running on port ${port}`);
});

module.exports = app;
