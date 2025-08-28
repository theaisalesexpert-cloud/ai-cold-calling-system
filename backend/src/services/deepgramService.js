const { createClient } = require('@deepgram/sdk');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');

class DeepgramService {
  constructor() {
    if (!process.env.DEEPGRAM_API_KEY) {
      logger.warn('Deepgram API key not configured - service disabled');
      this.enabled = false;
      return;
    }

    try {
      this.client = createClient(process.env.DEEPGRAM_API_KEY);
      this.model = process.env.DEEPGRAM_MODEL || 'nova-2';
      this.language = process.env.DEEPGRAM_LANGUAGE || 'en-US';
      this.enabled = true;

      logger.info('Deepgram service initialized', {
        model: this.model,
        language: this.language
      });
    } catch (error) {
      logger.error('Failed to initialize Deepgram client', { error: error.message });
      this.enabled = false;
    }
  }

  /**
   * Transcribe audio from URL (Twilio recording)
   */
  async transcribeFromUrl(audioUrl) {
    if (!this.enabled) {
      throw new AppError('Deepgram service not available', 503);
    }

    try {
      logger.info('Starting transcription from URL', { audioUrl });

      const { result, error } = await this.client.listen.prerecorded.transcribeUrl(
        { url: audioUrl },
        {
          model: this.model,
          language: this.language,
          smart_format: true,
          punctuate: true,
          diarize: true,
          utterances: true,
          sentiment: true,
          topics: true,
          intents: true
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      const transcript = result.results.channels[0].alternatives[0].transcript;
      const confidence = result.results.channels[0].alternatives[0].confidence;
      const sentiment = result.results.sentiment?.segments?.[0]?.sentiment;
      const topics = result.results.topics?.segments?.[0]?.topics || [];

      logger.info('Transcription completed', {
        transcriptLength: transcript.length,
        confidence,
        sentiment,
        topicsCount: topics.length
      });

      return {
        transcript,
        confidence,
        sentiment,
        topics,
        metadata: {
          duration: result.metadata.duration,
          channels: result.metadata.channels,
          model: this.model
        }
      };
    } catch (error) {
      logger.error('Transcription failed', {
        error: error.message,
        audioUrl
      });
      throw new AppError(`Transcription failed: ${error.message}`, 500);
    }
  }

  /**
   * Transcribe audio buffer/file
   */
  async transcribeFromBuffer(audioBuffer, mimeType = 'audio/wav') {
    if (!this.enabled) {
      throw new AppError('Deepgram service not available', 503);
    }

    try {
      logger.info('Starting transcription from buffer', {
        bufferSize: audioBuffer.length,
        mimeType
      });

      const { result, error } = await this.client.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model: this.model,
          language: this.language,
          smart_format: true,
          punctuate: true,
          sentiment: true,
          mimetype: mimeType
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      const transcript = result.results.channels[0].alternatives[0].transcript;
      const confidence = result.results.channels[0].alternatives[0].confidence;

      logger.info('Buffer transcription completed', {
        transcriptLength: transcript.length,
        confidence
      });

      return {
        transcript,
        confidence,
        metadata: {
          duration: result.metadata.duration,
          model: this.model
        }
      };
    } catch (error) {
      logger.error('Buffer transcription failed', {
        error: error.message,
        bufferSize: audioBuffer.length
      });
      throw new AppError(`Buffer transcription failed: ${error.message}`, 500);
    }
  }

  /**
   * Real-time transcription setup (for future use)
   */
  async setupRealTimeTranscription(onTranscript, onError) {
    if (!this.enabled) {
      throw new AppError('Deepgram service not available', 503);
    }

    try {
      const connection = this.client.listen.live({
        model: this.model,
        language: this.language,
        smart_format: true,
        interim_results: true,
        endpointing: 300,
        vad_events: true
      });

      connection.on('open', () => {
        logger.info('Real-time transcription connection opened');
      });

      connection.on('transcript', (data) => {
        const transcript = data.channel.alternatives[0].transcript;
        if (transcript && transcript.trim() !== '') {
          onTranscript({
            transcript,
            confidence: data.channel.alternatives[0].confidence,
            is_final: data.is_final,
            speech_final: data.speech_final
          });
        }
      });

      connection.on('error', (error) => {
        logger.error('Real-time transcription error', { error });
        onError(error);
      });

      connection.on('close', () => {
        logger.info('Real-time transcription connection closed');
      });

      return connection;
    } catch (error) {
      logger.error('Failed to setup real-time transcription', {
        error: error.message
      });
      throw new AppError(`Real-time transcription setup failed: ${error.message}`, 500);
    }
  }

  /**
   * Analyze conversation sentiment and topics
   */
  async analyzeConversation(audioUrl) {
    if (!this.enabled) {
      return null;
    }

    try {
      const result = await this.transcribeFromUrl(audioUrl);
      
      return {
        sentiment: result.sentiment,
        topics: result.topics,
        transcript: result.transcript,
        confidence: result.confidence
      };
    } catch (error) {
      logger.error('Conversation analysis failed', {
        error: error.message,
        audioUrl
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
        message: 'Deepgram API key not configured'
      };
    }

    try {
      // Simple test with a short audio URL or buffer
      return {
        status: 'healthy',
        message: 'Deepgram service operational',
        model: this.model,
        language: this.language
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message
      };
    }
  }
}

module.exports = new DeepgramService();
