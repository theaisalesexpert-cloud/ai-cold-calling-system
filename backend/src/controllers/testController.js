const express = require('express');
const { catchAsync, AppError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const elevenlabsService = require('../services/elevenlabsService');
const deepgramService = require('../services/deepgramService');

const router = express.Router();

/**
 * Test ElevenLabs service
 */
router.post('/elevenlabs', catchAsync(async (req, res) => {
  const { text = "Hello, this is a test of ElevenLabs voice generation." } = req.body;

  logger.info('Testing ElevenLabs service', { textLength: text.length });

  try {
    // Check if service is enabled
    const healthCheck = await elevenlabsService.healthCheck();
    if (healthCheck.status !== 'healthy') {
      return res.status(503).json({
        success: false,
        error: 'ElevenLabs service not available',
        details: healthCheck
      });
    }

    // Generate speech
    const result = await elevenlabsService.generateSpeech(text);
    
    res.json({
      success: true,
      message: 'ElevenLabs test successful',
      data: {
        filename: result.filename,
        audioSize: result.size,
        mimeType: result.mimeType,
        audioUrl: `/audio/${result.filename}`,
        textLength: text.length
      }
    });

  } catch (error) {
    logger.error('ElevenLabs test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'ElevenLabs test failed',
      details: error.message
    });
  }
}));

/**
 * Test Deepgram service with a sample audio URL
 */
router.post('/deepgram', catchAsync(async (req, res) => {
  const { audioUrl = "https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav" } = req.body;

  logger.info('Testing Deepgram service', { audioUrl });

  try {
    // Check if service is enabled
    const healthCheck = await deepgramService.healthCheck();
    if (healthCheck.status !== 'healthy') {
      return res.status(503).json({
        success: false,
        error: 'Deepgram service not available',
        details: healthCheck
      });
    }

    // Transcribe audio
    const result = await deepgramService.transcribeFromUrl(audioUrl);
    
    res.json({
      success: true,
      message: 'Deepgram test successful',
      data: {
        transcript: result.transcript,
        confidence: result.confidence,
        sentiment: result.sentiment,
        topics: result.topics,
        metadata: result.metadata
      }
    });

  } catch (error) {
    logger.error('Deepgram test failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Deepgram test failed',
      details: error.message
    });
  }
}));

/**
 * Test both services together
 */
router.post('/both', catchAsync(async (req, res) => {
  const { text = "Hello, this is a test of both ElevenLabs and Deepgram services working together." } = req.body;

  logger.info('Testing both services', { textLength: text.length });

  const results = {
    elevenlabs: null,
    deepgram: null,
    errors: []
  };

  // Test ElevenLabs
  try {
    const elevenlabsHealth = await elevenlabsService.healthCheck();
    if (elevenlabsHealth.status === 'healthy') {
      const speechResult = await elevenlabsService.generateSpeech(text);
      results.elevenlabs = {
        success: true,
        filename: speechResult.filename,
        audioSize: speechResult.size,
        audioUrl: `/audio/${speechResult.filename}`
      };
    } else {
      results.elevenlabs = {
        success: false,
        error: 'Service not available',
        details: elevenlabsHealth
      };
    }
  } catch (error) {
    results.elevenlabs = {
      success: false,
      error: error.message
    };
    results.errors.push(`ElevenLabs: ${error.message}`);
  }

  // Test Deepgram with sample audio
  try {
    const deepgramHealth = await deepgramService.healthCheck();
    if (deepgramHealth.status === 'healthy') {
      const transcriptResult = await deepgramService.transcribeFromUrl(
        "https://static.deepgram.com/examples/Bueller-Life-moves-pretty-fast.wav"
      );
      results.deepgram = {
        success: true,
        transcript: transcriptResult.transcript,
        confidence: transcriptResult.confidence,
        sentiment: transcriptResult.sentiment
      };
    } else {
      results.deepgram = {
        success: false,
        error: 'Service not available',
        details: deepgramHealth
      };
    }
  } catch (error) {
    results.deepgram = {
      success: false,
      error: error.message
    };
    results.errors.push(`Deepgram: ${error.message}`);
  }

  res.json({
    success: results.errors.length === 0,
    message: results.errors.length === 0 ? 'Both services working' : 'Some services failed',
    data: results
  });
}));

/**
 * Get service configuration and status
 */
router.get('/status', catchAsync(async (req, res) => {
  const elevenlabsHealth = await elevenlabsService.healthCheck();
  const deepgramHealth = await deepgramService.healthCheck();

  res.json({
    elevenlabs: {
      enabled: process.env.USE_ELEVENLABS === 'true',
      configured: !!process.env.ELEVENLABS_API_KEY,
      health: elevenlabsHealth,
      config: {
        voiceId: process.env.ELEVENLABS_VOICE_ID,
        modelId: process.env.ELEVENLABS_MODEL_ID
      }
    },
    deepgram: {
      enabled: process.env.USE_DEEPGRAM === 'true',
      configured: !!process.env.DEEPGRAM_API_KEY,
      health: deepgramHealth,
      config: {
        model: process.env.DEEPGRAM_MODEL,
        language: process.env.DEEPGRAM_LANGUAGE
      }
    },
    environment: {
      USE_ELEVENLABS: process.env.USE_ELEVENLABS,
      USE_DEEPGRAM: process.env.USE_DEEPGRAM,
      ELEVENLABS_API_KEY_SET: !!process.env.ELEVENLABS_API_KEY,
      DEEPGRAM_API_KEY_SET: !!process.env.DEEPGRAM_API_KEY
    }
  });
}));

/**
 * Test ElevenLabs voices list
 */
router.get('/elevenlabs/voices', catchAsync(async (req, res) => {
  try {
    const voices = await elevenlabsService.getVoices();
    res.json({
      success: true,
      data: voices
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}));

module.exports = router;
