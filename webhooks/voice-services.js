// Voice Services Integration
// Handles ElevenLabs TTS and Deepgram STT integration

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');

class VoiceServices {
  constructor() {
    this.elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    this.elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default Bella voice
    this.deepgramApiKey = process.env.DEEPGRAM_API_KEY;
    
    // ElevenLabs API endpoints
    this.elevenLabsBaseUrl = 'https://api.elevenlabs.io/v1';
    
    // Deepgram API endpoints
    this.deepgramBaseUrl = 'https://api.deepgram.com/v1';
  }

  /**
   * Convert text to speech using ElevenLabs
   * @param {string} text - Text to convert to speech
   * @param {object} options - Voice options
   * @returns {Promise<Buffer>} Audio buffer
   */
  async textToSpeech(text, options = {}) {
    try {
      const voiceSettings = {
        stability: options.stability || 0.75,
        similarity_boost: options.similarity_boost || 0.75,
        style: options.style || 0.0,
        use_speaker_boost: options.use_speaker_boost || true
      };

      const response = await axios.post(
        `${this.elevenLabsBaseUrl}/text-to-speech/${this.elevenLabsVoiceId}`,
        {
          text: text,
          model_id: options.model_id || 'eleven_monolingual_v1',
          voice_settings: voiceSettings
        },
        {
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.elevenLabsApiKey
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('ElevenLabs TTS Error:', error.response?.data || error.message);
      throw new Error('Failed to convert text to speech');
    }
  }

  /**
   * Convert speech to text using Deepgram
   * @param {Buffer|string} audioData - Audio buffer or file path
   * @param {object} options - Transcription options
   * @returns {Promise<string>} Transcribed text
   */
  async speechToText(audioData, options = {}) {
    try {
      let audioBuffer;
      
      if (typeof audioData === 'string') {
        // If it's a file path, read the file
        audioBuffer = fs.readFileSync(audioData);
      } else {
        // If it's already a buffer
        audioBuffer = audioData;
      }

      const params = new URLSearchParams({
        model: options.model || 'nova-2',
        language: options.language || 'en-US',
        smart_format: options.smart_format || 'true',
        punctuate: options.punctuate || 'true',
        diarize: options.diarize || 'false',
        filler_words: options.filler_words || 'false',
        utterances: options.utterances || 'true'
      });

      const response = await axios.post(
        `${this.deepgramBaseUrl}/listen?${params.toString()}`,
        audioBuffer,
        {
          headers: {
            'Authorization': `Token ${this.deepgramApiKey}`,
            'Content-Type': 'audio/wav'
          }
        }
      );

      const transcript = response.data.results?.channels?.[0]?.alternatives?.[0]?.transcript;
      
      if (!transcript) {
        throw new Error('No transcript found in response');
      }

      return transcript.trim();
    } catch (error) {
      console.error('Deepgram STT Error:', error.response?.data || error.message);
      throw new Error('Failed to convert speech to text');
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
   * Get voice service status
   * @returns {Promise<object>} Service status
   */
  async getServiceStatus() {
    const status = {
      elevenlabs: false,
      deepgram: false,
      timestamp: new Date().toISOString()
    };

    try {
      // Test ElevenLabs
      await axios.get(`${this.elevenLabsBaseUrl}/voices`, {
        headers: { 'xi-api-key': this.elevenLabsApiKey },
        timeout: 5000
      });
      status.elevenlabs = true;
    } catch (error) {
      console.error('ElevenLabs health check failed:', error.message);
    }

    try {
      // Test Deepgram (simple API call)
      await axios.get(`${this.deepgramBaseUrl}/projects`, {
        headers: { 'Authorization': `Token ${this.deepgramApiKey}` },
        timeout: 5000
      });
      status.deepgram = true;
    } catch (error) {
      console.error('Deepgram health check failed:', error.message);
    }

    return status;
  }
}

module.exports = VoiceServices;
