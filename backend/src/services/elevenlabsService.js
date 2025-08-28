const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

class ElevenLabsService {
  constructor() {
    if (!process.env.ELEVENLABS_API_KEY) {
      logger.warn('ElevenLabs API key not configured - service disabled');
      this.enabled = false;
      return;
    }

    this.apiKey = process.env.ELEVENLABS_API_KEY;
    this.voiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default: Bella
    this.modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2';
    this.baseUrl = 'https://api.elevenlabs.io/v1';
    this.enabled = true;

    // Create audio directory if it doesn't exist
    this.audioDir = path.join(__dirname, '../../temp/audio');
    try {
      if (!fs.existsSync(this.audioDir)) {
        fs.mkdirSync(this.audioDir, { recursive: true });
        logger.info('Created audio directory', { audioDir: this.audioDir });
      }
    } catch (error) {
      logger.error('Failed to create audio directory', { error: error.message });
      this.enabled = false;
      return;
    }

    logger.info('ElevenLabs service initialized', {
      voiceId: this.voiceId,
      modelId: this.modelId
    });
  }

  /**
   * Generate speech from text
   */
  async generateSpeech(text, options = {}) {
    if (!this.enabled) {
      throw new AppError('ElevenLabs service not available', 503);
    }

    try {
      const voiceId = options.voiceId || this.voiceId;
      const modelId = options.modelId || this.modelId;

      logger.info('Generating speech', {
        textLength: text.length,
        voiceId,
        modelId
      });

      const response = await axios.post(
        `${this.baseUrl}/text-to-speech/${voiceId}`,
        {
          text: text,
          model_id: modelId,
          voice_settings: {
            stability: options.stability || 0.5,
            similarity_boost: options.similarity_boost || 0.75,
            style: options.style || 0.0,
            use_speaker_boost: options.use_speaker_boost || true
          }
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          responseType: 'arraybuffer'
        }
      );

      const audioBuffer = Buffer.from(response.data);
      const filename = `speech_${Date.now()}_${Math.random().toString(36).substring(2, 11)}.mp3`;
      const filepath = path.join(this.audioDir, filename);

      // Save audio file
      fs.writeFileSync(filepath, audioBuffer);

      logger.info('Speech generated successfully', {
        filename,
        audioSize: audioBuffer.length,
        textLength: text.length
      });

      return {
        audioBuffer,
        filepath,
        filename,
        mimeType: 'audio/mpeg',
        size: audioBuffer.length
      };
    } catch (error) {
      logger.error('Speech generation failed', {
        error: error.message,
        textLength: text.length,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw new AppError(`Speech generation failed: ${error.message}`, 500);
    }
  }

  /**
   * Generate speech and return as stream URL for Twilio
   */
  async generateSpeechForTwilio(text, baseUrl, options = {}) {
    if (!this.enabled) {
      return null;
    }

    try {
      const result = await this.generateSpeech(text, options);
      
      // Return URL that Twilio can access
      const audioUrl = `${baseUrl}/audio/${result.filename}`;
      
      logger.info('Speech URL generated for Twilio', {
        audioUrl,
        filename: result.filename
      });

      return {
        audioUrl,
        filename: result.filename,
        filepath: result.filepath
      };
    } catch (error) {
      logger.error('Failed to generate speech for Twilio', {
        error: error.message,
        text: text.substring(0, 100)
      });
      return null;
    }
  }

  /**
   * Get available voices
   */
  async getVoices() {
    if (!this.enabled) {
      throw new AppError('ElevenLabs service not available', 503);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      const voices = response.data.voices.map(voice => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        preview_url: voice.preview_url,
        available_for_tiers: voice.available_for_tiers
      }));

      logger.info('Retrieved available voices', {
        voiceCount: voices.length
      });

      return voices;
    } catch (error) {
      logger.error('Failed to get voices', {
        error: error.message
      });
      throw new AppError(`Failed to get voices: ${error.message}`, 500);
    }
  }

  /**
   * Get voice details
   */
  async getVoiceDetails(voiceId) {
    if (!this.enabled) {
      throw new AppError('ElevenLabs service not available', 503);
    }

    try {
      const response = await axios.get(`${this.baseUrl}/voices/${voiceId}`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to get voice details', {
        error: error.message,
        voiceId
      });
      throw new AppError(`Failed to get voice details: ${error.message}`, 500);
    }
  }

  /**
   * Clean up old audio files
   */
  cleanupAudioFiles(maxAgeHours = 24) {
    try {
      const files = fs.readdirSync(this.audioDir);
      const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
      const now = Date.now();
      let deletedCount = 0;

      files.forEach(file => {
        const filepath = path.join(this.audioDir, file);
        const stats = fs.statSync(filepath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });

      if (deletedCount > 0) {
        logger.info('Cleaned up old audio files', {
          deletedCount,
          maxAgeHours
        });
      }
    } catch (error) {
      logger.error('Failed to cleanup audio files', {
        error: error.message
      });
    }
  }

  /**
   * Get usage statistics
   */
  async getUsageStats() {
    if (!this.enabled) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/user`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return {
        character_count: response.data.subscription.character_count,
        character_limit: response.data.subscription.character_limit,
        can_extend_character_limit: response.data.subscription.can_extend_character_limit,
        allowed_to_extend_character_limit: response.data.subscription.allowed_to_extend_character_limit,
        next_character_count_reset_unix: response.data.subscription.next_character_count_reset_unix
      };
    } catch (error) {
      logger.error('Failed to get usage stats', {
        error: error.message
      });
      return null;
    }
  }

  /**
   * Check service health
   */
  async healthCheck() {
    if (!this.enabled) {
      return {
        status: 'disabled',
        message: 'ElevenLabs API key not configured'
      };
    }

    try {
      const usage = await this.getUsageStats();
      
      return {
        status: 'healthy',
        message: 'ElevenLabs service operational',
        voiceId: this.voiceId,
        modelId: this.modelId,
        usage: usage ? {
          charactersUsed: usage.character_count,
          charactersLimit: usage.character_limit,
          charactersRemaining: usage.character_limit - usage.character_count
        } : null
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }
}

module.exports = new ElevenLabsService();
