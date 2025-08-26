// Unit Tests for Voice Services
// Tests for ElevenLabs TTS and Deepgram STT functionality

const VoiceServices = require('../../voice-services');
const nock = require('nock');
const fs = require('fs');
const path = require('path');

// Mock configuration
jest.mock('../../utils/config', () => ({
  getAIConfig: () => ({
    elevenlabs: {
      apiKey: 'test-elevenlabs-key',
      voiceId: 'test-voice-id',
      model: 'eleven_monolingual_v1',
      stability: 0.75,
      similarityBoost: 0.75
    },
    deepgram: {
      apiKey: 'test-deepgram-key',
      model: 'nova-2',
      language: 'en-US'
    }
  })
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  performance: jest.fn()
}));

describe('VoiceServices', () => {
  let voiceServices;

  beforeEach(() => {
    voiceServices = new VoiceServices();
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('Text-to-Speech (TTS)', () => {
    test('should convert text to speech successfully', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      nock('https://api.elevenlabs.io')
        .post('/v1/text-to-speech/test-voice-id')
        .reply(200, mockAudioBuffer, {
          'Content-Type': 'audio/mpeg'
        });

      const result = await voiceServices.textToSpeech('Hello, this is a test');
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle TTS API errors gracefully', async () => {
      nock('https://api.elevenlabs.io')
        .post('/v1/text-to-speech/test-voice-id')
        .reply(500, { error: 'Internal server error' });

      await expect(voiceServices.textToSpeech('Hello, this is a test'))
        .rejects
        .toThrow('Failed to convert text to speech');
    });

    test('should validate input text', async () => {
      await expect(voiceServices.textToSpeech(''))
        .rejects
        .toThrow('Text is required and must be a string');

      await expect(voiceServices.textToSpeech(null))
        .rejects
        .toThrow('Text is required and must be a string');
    });

    test('should use cache for repeated requests', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      nock('https://api.elevenlabs.io')
        .post('/v1/text-to-speech/test-voice-id')
        .once()
        .reply(200, mockAudioBuffer);

      // First request
      const result1 = await voiceServices.textToSpeech('Hello, test');
      
      // Second request (should use cache)
      const result2 = await voiceServices.textToSpeech('Hello, test');
      
      expect(result1).toEqual(result2);
      expect(nock.isDone()).toBe(true); // Ensures only one API call was made
    });

    test('should handle rate limiting', async () => {
      nock('https://api.elevenlabs.io')
        .post('/v1/text-to-speech/test-voice-id')
        .reply(429, { error: 'Rate limit exceeded' });

      await expect(voiceServices.textToSpeech('Hello, test'))
        .rejects
        .toThrow('Rate limit exceeded');
    });
  });

  describe('Speech-to-Text (STT)', () => {
    test('should convert speech to text successfully', async () => {
      const mockResponse = {
        results: {
          channels: [{
            alternatives: [{
              transcript: 'Hello, this is a test transcript',
              confidence: 0.95,
              words: [
                { word: 'Hello', start: 0.0, end: 0.5, confidence: 0.98 },
                { word: 'this', start: 0.6, end: 0.8, confidence: 0.95 }
              ]
            }]
          }],
          sentiment: { score: 0.2, label: 'positive' },
          topics: ['greeting'],
          metadata: { duration: 2.5, channels: 1 }
        }
      };

      nock('https://api.deepgram.com')
        .post('/v1/listen')
        .query(true)
        .reply(200, mockResponse);

      const audioBuffer = Buffer.from('mock audio data');
      const result = await voiceServices.speechToText(audioBuffer);
      
      expect(result.transcript).toBe('Hello, this is a test transcript');
      expect(result.confidence).toBe(0.95);
      expect(result.sentiment).toEqual({ score: 0.2, label: 'positive' });
      expect(result.words).toHaveLength(2);
    });

    test('should handle file input', async () => {
      const mockResponse = {
        results: {
          channels: [{
            alternatives: [{
              transcript: 'File-based transcript',
              confidence: 0.90
            }]
          }]
        }
      };

      nock('https://api.deepgram.com')
        .post('/v1/listen')
        .query(true)
        .reply(200, mockResponse);

      // Create a temporary test file
      const testFilePath = path.join(__dirname, 'test-audio.wav');
      fs.writeFileSync(testFilePath, Buffer.from('mock audio data'));

      try {
        const result = await voiceServices.speechToText(testFilePath);
        expect(result.transcript).toBe('File-based transcript');
      } finally {
        // Clean up test file
        if (fs.existsSync(testFilePath)) {
          fs.unlinkSync(testFilePath);
        }
      }
    });

    test('should validate audio input', async () => {
      await expect(voiceServices.speechToText('nonexistent-file.wav'))
        .rejects
        .toThrow('Audio file not found');

      await expect(voiceServices.speechToText(Buffer.alloc(0)))
        .rejects
        .toThrow('Audio buffer is empty');

      await expect(voiceServices.speechToText(Buffer.alloc(30 * 1024 * 1024))) // 30MB
        .rejects
        .toThrow('Audio file too large');
    });

    test('should handle STT API errors', async () => {
      nock('https://api.deepgram.com')
        .post('/v1/listen')
        .query(true)
        .reply(500, { error: 'Internal server error' });

      const audioBuffer = Buffer.from('mock audio data');
      
      await expect(voiceServices.speechToText(audioBuffer))
        .rejects
        .toThrow('Failed to convert speech to text');
    });

    test('should handle empty transcript response', async () => {
      const mockResponse = {
        results: {
          channels: [{
            alternatives: [{}] // No transcript
          }]
        }
      };

      nock('https://api.deepgram.com')
        .post('/v1/listen')
        .query(true)
        .reply(200, mockResponse);

      const audioBuffer = Buffer.from('mock audio data');
      
      await expect(voiceServices.speechToText(audioBuffer))
        .rejects
        .toThrow('No transcript found in response');
    });
  });

  describe('Service Status', () => {
    test('should check service status successfully', async () => {
      nock('https://api.elevenlabs.io')
        .get('/v1/voices')
        .reply(200, { voices: [] });

      nock('https://api.deepgram.com')
        .get('/v1/projects')
        .reply(200, { projects: [] });

      const status = await voiceServices.getServiceStatus();
      
      expect(status.elevenlabs).toBe(true);
      expect(status.deepgram).toBe(true);
      expect(status.timestamp).toBeDefined();
      expect(status.performance).toBeDefined();
    });

    test('should handle service failures', async () => {
      nock('https://api.elevenlabs.io')
        .get('/v1/voices')
        .reply(500, { error: 'Service unavailable' });

      nock('https://api.deepgram.com')
        .get('/v1/projects')
        .reply(500, { error: 'Service unavailable' });

      const status = await voiceServices.getServiceStatus();
      
      expect(status.elevenlabs).toBe(false);
      expect(status.deepgram).toBe(false);
      expect(status.elevenLabsError).toBeDefined();
      expect(status.deepgramError).toBeDefined();
    });
  });

  describe('Audio Processing', () => {
    test('should detect audio content type correctly', () => {
      const wavHeader = Buffer.from('RIFF....WAVE');
      const mp3Header = Buffer.from([0xFF, 0xFB, 0x90, 0x00]);
      const oggHeader = Buffer.from('OggS');
      
      expect(voiceServices.detectAudioContentType(wavHeader)).toBe('audio/wav');
      expect(voiceServices.detectAudioContentType(mp3Header)).toBe('audio/mpeg');
      expect(voiceServices.detectAudioContentType(oggHeader)).toBe('audio/ogg');
    });

    test('should validate audio quality', () => {
      const smallBuffer = Buffer.alloc(1024); // 1KB
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB
      
      const smallValidation = voiceServices.validateAudio(smallBuffer);
      const largeValidation = voiceServices.validateAudio(largeBuffer);
      
      expect(smallValidation.isValid).toBe(true);
      expect(largeValidation.isValid).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    test('should track TTS performance metrics', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      nock('https://api.elevenlabs.io')
        .post('/v1/text-to-speech/test-voice-id')
        .reply(200, mockAudioBuffer);

      await voiceServices.textToSpeech('Hello, test');
      
      const metrics = voiceServices.getPerformanceMetrics();
      
      expect(metrics.ttsRequests).toBe(1);
      expect(metrics.averageTtsTime).toBeGreaterThan(0);
    });

    test('should track STT performance metrics', async () => {
      const mockResponse = {
        results: {
          channels: [{
            alternatives: [{
              transcript: 'Test transcript',
              confidence: 0.95
            }]
          }]
        }
      };

      nock('https://api.deepgram.com')
        .post('/v1/listen')
        .query(true)
        .reply(200, mockResponse);

      const audioBuffer = Buffer.from('mock audio data');
      await voiceServices.speechToText(audioBuffer);
      
      const metrics = voiceServices.getPerformanceMetrics();
      
      expect(metrics.sttRequests).toBe(1);
      expect(metrics.averageSttTime).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    test('should clear cache successfully', () => {
      voiceServices.clearCache();
      
      const status = voiceServices.getServiceStatus();
      expect(status.cache.size).toBe(0);
    });

    test('should respect cache size limits', async () => {
      const mockAudioBuffer = Buffer.from('mock audio data');
      
      // Mock multiple TTS requests
      for (let i = 0; i < 150; i++) {
        nock('https://api.elevenlabs.io')
          .post('/v1/text-to-speech/test-voice-id')
          .reply(200, mockAudioBuffer);
      }

      // Make requests that exceed cache size
      for (let i = 0; i < 150; i++) {
        await voiceServices.textToSpeech(`Test message ${i}`);
      }
      
      const status = voiceServices.getServiceStatus();
      expect(status.cache.size).toBeLessThanOrEqual(voiceServices.maxCacheSize);
    });
  });
});
