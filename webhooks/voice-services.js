// Enhanced Voice Services Integration
// Handles ElevenLabs TTS, Deepgram STT, real-time streaming, and advanced audio processing

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Readable, Transform } = require('stream');
const { promisify } = require('util');
const logger = require('./utils/logger');
const config = require('./utils/config');
const { APIError, ValidationError } = require('./utils/errorHandler');
const { customValidators } = require('./utils/validation');

class VoiceServices {
  constructor() {
    // Load configuration
    const aiConfig = config.getAIConfig();

    this.elevenLabsApiKey = aiConfig.elevenlabs.apiKey;
    this.elevenLabsVoiceId = aiConfig.elevenlabs.voiceId;
    this.elevenLabsModel = aiConfig.elevenlabs.model;
    this.deepgramApiKey = aiConfig.deepgram.apiKey;
    this.deepgramModel = aiConfig.deepgram.model;
    this.deepgramLanguage = aiConfig.deepgram.language;

    // API endpoints
    this.elevenLabsBaseUrl = 'https://api.elevenlabs.io/v1';
    this.deepgramBaseUrl = 'https://api.deepgram.com/v1';

    // Performance tracking
    this.performanceMetrics = {
      ttsRequests: 0,
      sttRequests: 0,
      averageTtsTime: 0,
      averageSttTime: 0,
      errors: 0
    };

    // Voice cache for frequently used phrases
    this.voiceCache = new Map();
    this.maxCacheSize = 100;

    // Initialize audio processing capabilities
    this.initializeAudioProcessing();
  }

  initializeAudioProcessing() {
    // Audio format configurations
    this.audioFormats = {
      twilio: {
        encoding: 'mulaw',
        sampleRate: 8000,
        channels: 1
      },
      elevenlabs: {
        encoding: 'mp3',
        sampleRate: 22050,
        channels: 1
      },
      deepgram: {
        encoding: 'wav',
        sampleRate: 16000,
        channels: 1
      }
    };
  }

  /**
   * Convert text to speech using ElevenLabs with enhanced features
   * @param {string} text - Text to convert to speech
   * @param {object} options - Voice options
   * @returns {Promise<Buffer>} Audio buffer
   */
  async textToSpeech(text, options = {}) {
    const startTime = Date.now();

    try {
      // Validate input
      if (!text || typeof text !== 'string') {
        throw new ValidationError('Text is required and must be a string');
      }

      text = customValidators.sanitizeText(text);

      // Check cache first
      const cacheKey = this.generateCacheKey(text, options);
      if (this.voiceCache.has(cacheKey)) {
        logger.info('TTS cache hit', { text: text.substring(0, 50) });
        return this.voiceCache.get(cacheKey);
      }

      const voiceSettings = {
        stability: options.stability || config.get('ai.elevenlabs.stability'),
        similarity_boost: options.similarity_boost || config.get('ai.elevenlabs.similarityBoost'),
        style: options.style || 0.0,
        use_speaker_boost: options.use_speaker_boost || true
      };

      const requestData = {
        text: text,
        model_id: options.model_id || this.elevenLabsModel,
        voice_settings: voiceSettings
      };

      // Add emotion and style if specified
      if (options.emotion) {
        requestData.voice_settings.emotion = options.emotion;
      }

      logger.info('TTS request initiated', {
        textLength: text.length,
        voiceId: this.elevenLabsVoiceId,
        model: requestData.model_id
      });

      const response = await axios.post(
        `${this.elevenLabsBaseUrl}/text-to-speech/${this.elevenLabsVoiceId}`,
        requestData,
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey
          },
          responseType: 'arraybuffer',
          timeout: 30000
        }
      );

      const audioBuffer = Buffer.from(response.data);

      // Cache the result if it's not too large
      if (audioBuffer.length < 1024 * 1024 && this.voiceCache.size < this.maxCacheSize) {
        this.voiceCache.set(cacheKey, audioBuffer);
      }

      // Update performance metrics
      const duration = Date.now() - startTime;
      this.updateTtsMetrics(duration, true);

      logger.performance('TTS completed', duration, {
        textLength: text.length,
        audioSize: audioBuffer.length,
        cached: false
      });

      return audioBuffer;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateTtsMetrics(duration, false);

      logger.error('ElevenLabs TTS Error', {
        error: error.message,
        text: text?.substring(0, 100),
        duration
      });

      if (error.response?.status === 429) {
        throw new APIError('ElevenLabs', 'Rate limit exceeded. Please try again later.', error);
      } else if (error.response?.status === 401) {
        throw new APIError('ElevenLabs', 'Invalid API key', error);
      } else {
        throw new APIError('ElevenLabs', 'Failed to convert text to speech', error);
      }
    }
  }

  /**
   * Convert speech to text using Deepgram with enhanced features
   * @param {Buffer|string} audioData - Audio buffer or file path
   * @param {object} options - Transcription options
   * @returns {Promise<object>} Transcription result with confidence and metadata
   */
  async speechToText(audioData, options = {}) {
    const startTime = Date.now();

    try {
      let audioBuffer;

      if (typeof audioData === 'string') {
        if (!fs.existsSync(audioData)) {
          throw new ValidationError('Audio file not found');
        }
        audioBuffer = fs.readFileSync(audioData);
      } else if (Buffer.isBuffer(audioData)) {
        audioBuffer = audioData;
      } else {
        throw new ValidationError('Audio data must be a Buffer or file path');
      }

      // Validate audio size
      if (audioBuffer.length === 0) {
        throw new ValidationError('Audio buffer is empty');
      }

      if (audioBuffer.length > 25 * 1024 * 1024) { // 25MB limit
        throw new ValidationError('Audio file too large (max 25MB)');
      }

      const params = new URLSearchParams({
        model: options.model || this.deepgramModel,
        language: options.language || this.deepgramLanguage,
        smart_format: options.smart_format || 'true',
        punctuate: options.punctuate || 'true',
        diarize: options.diarize || 'false',
        filler_words: options.filler_words || 'false',
        utterances: options.utterances || 'true',
        sentiment: options.sentiment || 'true',
        topics: options.topics || 'true',
        intents: options.intents || 'true'
      });

      logger.info('STT request initiated', {
        audioSize: audioBuffer.length,
        model: params.get('model'),
        language: params.get('language')
      });

      const response = await axios.post(
        `${this.deepgramBaseUrl}/listen?${params.toString()}`,
        audioBuffer,
        {
          headers: {
            'Authorization': `Token ${this.deepgramApiKey}`,
            'Content-Type': this.detectAudioContentType(audioBuffer)
          },
          timeout: 60000 // 60 second timeout for large files
        }
      );

      const results = response.data.results;
      const channel = results?.channels?.[0];
      const alternative = channel?.alternatives?.[0];

      if (!alternative?.transcript) {
        throw new APIError('Deepgram', 'No transcript found in response');
      }

      // Extract enhanced data
      const transcriptionResult = {
        transcript: alternative.transcript.trim(),
        confidence: alternative.confidence || 0,
        words: alternative.words || [],
        sentiment: results.sentiment || null,
        topics: results.topics || [],
        intents: results.intents || [],
        summary: results.summary || null,
        metadata: {
          duration: results.metadata?.duration || 0,
          channels: results.metadata?.channels || 1,
          model: results.metadata?.model_info || {}
        }
      };

      // Update performance metrics
      const duration = Date.now() - startTime;
      this.updateSttMetrics(duration, true);

      logger.performance('STT completed', duration, {
        audioSize: audioBuffer.length,
        transcriptLength: transcriptionResult.transcript.length,
        confidence: transcriptionResult.confidence
      });

      return transcriptionResult;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateSttMetrics(duration, false);

      logger.error('Deepgram STT Error', {
        error: error.message,
        audioSize: audioData?.length || 'unknown',
        duration
      });

      if (error.response?.status === 429) {
        throw new APIError('Deepgram', 'Rate limit exceeded. Please try again later.', error);
      } else if (error.response?.status === 401) {
        throw new APIError('Deepgram', 'Invalid API key', error);
      } else {
        throw new APIError('Deepgram', 'Failed to convert speech to text', error);
      }
    }
  }

  /**
   * Get available ElevenLabs voices
   * @returns {Promise<Array>} List of available voices
   */
  async getAvailableVoices() {
    try {
      const response = await axios.get(`${this.elevenLabsBaseUrl}/voices`, {
        headers: {
          'xi-api-key': this.elevenLabsApiKey
        }
      });

      return response.data.voices.map(voice => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        preview_url: voice.preview_url
      }));
    } catch (error) {
      console.error('Error fetching voices:', error.response?.data || error.message);
      throw new Error('Failed to fetch available voices');
    }
  }

  /**
   * Save audio buffer to file
   * @param {Buffer} audioBuffer - Audio data
   * @param {string} filename - Output filename
   * @returns {Promise<string>} File path
   */
  async saveAudioToFile(audioBuffer, filename) {
    try {
      const audioDir = path.join(__dirname, 'audio');
      
      // Create audio directory if it doesn't exist
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }

      const filePath = path.join(audioDir, filename);
      fs.writeFileSync(filePath, audioBuffer);
      
      return filePath;
    } catch (error) {
      console.error('Error saving audio file:', error);
      throw new Error('Failed to save audio file');
    }
  }

  /**
   * Convert audio format (if needed for Twilio compatibility)
   * @param {Buffer} audioBuffer - Input audio buffer
   * @param {string} outputFormat - Desired output format
   * @returns {Promise<Buffer>} Converted audio buffer
   */
  async convertAudioFormat(audioBuffer, outputFormat = 'wav') {
    // For now, return as-is. In production, you might want to use ffmpeg
    // to convert between formats for better Twilio compatibility
    return audioBuffer;
  }

  /**
   * Stream audio for real-time playback
   * @param {string} text - Text to convert and stream
   * @returns {Promise<Readable>} Audio stream
   */
  async streamTextToSpeech(text) {
    try {
      const audioBuffer = await this.textToSpeech(text);
      return Readable.from(audioBuffer);
    } catch (error) {
      console.error('Error streaming TTS:', error);
      throw error;
    }
  }

  /**
   * Validate audio quality and duration
   * @param {Buffer} audioBuffer - Audio buffer to validate
   * @returns {object} Validation results
   */
  validateAudio(audioBuffer) {
    const sizeInMB = audioBuffer.length / (1024 * 1024);
    
    return {
      isValid: sizeInMB < 10, // Limit to 10MB
      size: sizeInMB,
      sizeFormatted: `${sizeInMB.toFixed(2)} MB`
    };
  }

  /**
   * Get enhanced voice service status with performance metrics
   * @returns {Promise<object>} Service status
   */
  async getServiceStatus() {
    const status = {
      elevenlabs: false,
      deepgram: false,
      timestamp: new Date().toISOString(),
      performance: this.performanceMetrics,
      cache: {
        size: this.voiceCache.size,
        maxSize: this.maxCacheSize
      }
    };

    try {
      const startTime = Date.now();
      await axios.get(`${this.elevenLabsBaseUrl}/voices`, {
        headers: { 'xi-api-key': this.elevenLabsApiKey },
        timeout: 5000
      });
      status.elevenlabs = true;
      status.elevenLabsResponseTime = Date.now() - startTime;
    } catch (error) {
      logger.error('ElevenLabs health check failed', { error: error.message });
      status.elevenLabsError = error.message;
    }

    try {
      const startTime = Date.now();
      await axios.get(`${this.deepgramBaseUrl}/projects`, {
        headers: { 'Authorization': `Token ${this.deepgramApiKey}` },
        timeout: 5000
      });
      status.deepgram = true;
      status.deepgramResponseTime = Date.now() - startTime;
    } catch (error) {
      logger.error('Deepgram health check failed', { error: error.message });
      status.deepgramError = error.message;
    }

    return status;
  }

  // Helper methods
  generateCacheKey(text, options) {
    const optionsStr = JSON.stringify(options);
    return `${text.substring(0, 100)}_${Buffer.from(optionsStr).toString('base64')}`;
  }

  updateTtsMetrics(duration, success) {
    this.performanceMetrics.ttsRequests++;
    if (success) {
      this.performanceMetrics.averageTtsTime =
        (this.performanceMetrics.averageTtsTime + duration) / 2;
    } else {
      this.performanceMetrics.errors++;
    }
  }

  updateSttMetrics(duration, success) {
    this.performanceMetrics.sttRequests++;
    if (success) {
      this.performanceMetrics.averageSttTime =
        (this.performanceMetrics.averageSttTime + duration) / 2;
    } else {
      this.performanceMetrics.errors++;
    }
  }

  detectAudioContentType(audioBuffer) {
    // Simple audio format detection based on file headers
    const header = audioBuffer.slice(0, 12);

    if (header.includes(Buffer.from('RIFF'))) {
      return 'audio/wav';
    } else if (header.includes(Buffer.from('ID3')) || header[0] === 0xFF) {
      return 'audio/mpeg';
    } else if (header.includes(Buffer.from('OggS'))) {
      return 'audio/ogg';
    } else if (header.includes(Buffer.from('fLaC'))) {
      return 'audio/flac';
    }

    return 'audio/wav'; // Default fallback
  }

  /**
   * Real-time streaming TTS for live conversations
   * @param {string} text - Text to convert
   * @param {object} options - Streaming options
   * @returns {Promise<Readable>} Audio stream
   */
  async streamTextToSpeechRealtime(text, options = {}) {
    try {
      // For real-time streaming, we'll use ElevenLabs streaming API
      const response = await axios.post(
        `${this.elevenLabsBaseUrl}/text-to-speech/${this.elevenLabsVoiceId}/stream`,
        {
          text: text,
          model_id: options.model_id || this.elevenLabsModel,
          voice_settings: {
            stability: options.stability || 0.75,
            similarity_boost: options.similarity_boost || 0.75
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey
          },
          responseType: 'stream'
        }
      );

      return response.data;
    } catch (error) {
      logger.error('Real-time TTS streaming error', { error: error.message });
      throw new APIError('ElevenLabs', 'Failed to stream text to speech', error);
    }
  }

  /**
   * Voice cloning capabilities
   * @param {string} name - Voice name
   * @param {Array} audioFiles - Array of audio file paths for training
   * @returns {Promise<string>} Voice ID
   */
  async cloneVoice(name, audioFiles) {
    try {
      const formData = new FormData();
      formData.append('name', name);

      for (const filePath of audioFiles) {
        const audioBuffer = fs.readFileSync(filePath);
        formData.append('files', audioBuffer, path.basename(filePath));
      }

      const response = await axios.post(
        `${this.elevenLabsBaseUrl}/voices/add`,
        formData,
        {
          headers: {
            'xi-api-key': this.elevenLabsApiKey,
            ...formData.getHeaders()
          }
        }
      );

      logger.info('Voice cloned successfully', { name, voiceId: response.data.voice_id });
      return response.data.voice_id;
    } catch (error) {
      logger.error('Voice cloning failed', { error: error.message, name });
      throw new APIError('ElevenLabs', 'Failed to clone voice', error);
    }
  }

  /**
   * Clear voice cache
   */
  clearCache() {
    this.voiceCache.clear();
    logger.info('Voice cache cleared');
  }

  /**
   * Get performance metrics
   * @returns {object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheHitRate: this.voiceCache.size > 0 ?
        (this.performanceMetrics.ttsRequests - this.voiceCache.size) / this.performanceMetrics.ttsRequests : 0,
      uptime: process.uptime()
    };
  }
}

module.exports = VoiceServices;
