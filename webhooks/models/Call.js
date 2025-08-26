// Call Data Model
// MongoDB schema for storing call records and analytics

const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  // Basic call information
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  callSid: {
    type: String,
    required: true,
    index: true
  },
  
  // Customer information
  customerName: {
    type: String,
    required: true,
    index: true
  },
  
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  
  email: {
    type: String,
    index: true
  },
  
  // Lead information
  carModel: {
    type: String,
    required: true,
    index: true
  },
  
  leadSource: {
    type: String,
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  
  // Call timing
  startTime: {
    type: Date,
    required: true,
    index: true
  },
  
  endTime: {
    type: Date,
    index: true
  },
  
  duration: {
    type: Number, // in seconds
    index: true
  },
  
  // Call status and outcome
  status: {
    type: String,
    enum: ['initiated', 'in_progress', 'completed', 'failed', 'no_answer', 'busy'],
    default: 'initiated',
    index: true
  },
  
  outcome: {
    type: String,
    enum: ['appointment_scheduled', 'interested_similar', 'not_interested', 'callback_requested', 'no_response'],
    index: true
  },
  
  // Conversation data
  conversationState: {
    type: String,
    index: true
  },
  
  turnCount: {
    type: Number,
    default: 0
  },
  
  transcript: [{
    speaker: {
      type: String,
      enum: ['customer', 'ai', 'system']
    },
    text: String,
    timestamp: Date,
    confidence: Number,
    sentiment: {
      score: Number,
      label: String
    },
    intent: {
      name: String,
      confidence: Number
    }
  }],
  
  // Extracted data
  extractedData: {
    stillInterested: String,
    wantsAppointment: String,
    interestedSimilar: String,
    emailAddress: String,
    preferredTime: [String],
    appointmentDate: Date,
    notes: String
  },
  
  // Analytics data
  analytics: {
    sentimentTrend: {
      type: String,
      enum: ['improving', 'declining', 'stable']
    },
    
    averageSentiment: Number,
    
    communicationStyle: {
      type: String,
      enum: ['brief', 'detailed', 'expressive', 'concise', 'conversational']
    },
    
    urgencyLevel: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    
    responseTime: Number, // Average response time in ms
    
    keyTopics: [String],
    
    concerns: [String],
    
    interests: [String]
  },
  
  // Performance metrics
  performance: {
    ttsLatency: Number,
    sttLatency: Number,
    aiResponseTime: Number,
    totalProcessingTime: Number,
    errorCount: Number,
    retryCount: Number
  },
  
  // Business metrics
  business: {
    dealershipName: String,
    botName: String,
    repName: String,
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date,
    followUpType: {
      type: String,
      enum: ['email', 'call', 'sms']
    },
    conversionProbability: Number, // 0-1 score
    estimatedValue: Number // Potential deal value
  },
  
  // Technical data
  technical: {
    audioQuality: Number, // 0-1 score
    connectionQuality: Number, // 0-1 score
    errors: [{
      type: String,
      message: String,
      timestamp: Date,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical']
      }
    }],
    apiCalls: [{
      service: String,
      endpoint: String,
      duration: Number,
      success: Boolean,
      timestamp: Date
    }]
  },
  
  // Metadata
  metadata: {
    version: {
      type: String,
      default: '1.0'
    },
    tags: [String],
    notes: String,
    flagged: {
      type: Boolean,
      default: false
    },
    flagReason: String
  }
}, {
  timestamps: true,
  collection: 'calls'
});

// Indexes for performance
CallSchema.index({ startTime: -1 });
CallSchema.index({ status: 1, startTime: -1 });
CallSchema.index({ outcome: 1, startTime: -1 });
CallSchema.index({ 'business.dealershipName': 1, startTime: -1 });
CallSchema.index({ customerName: 1, phoneNumber: 1 });
CallSchema.index({ carModel: 1, outcome: 1 });

// Virtual for call summary
CallSchema.virtual('summary').get(function() {
  return {
    sessionId: this.sessionId,
    customerName: this.customerName,
    carModel: this.carModel,
    duration: this.duration,
    outcome: this.outcome,
    sentiment: this.analytics?.averageSentiment,
    followUpRequired: this.business?.followUpRequired
  };
});

// Methods
CallSchema.methods.calculateDuration = function() {
  if (this.startTime && this.endTime) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  return this.duration;
};

CallSchema.methods.addTranscriptEntry = function(speaker, text, metadata = {}) {
  this.transcript.push({
    speaker,
    text,
    timestamp: new Date(),
    confidence: metadata.confidence || 0,
    sentiment: metadata.sentiment || { score: 0, label: 'neutral' },
    intent: metadata.intent || { name: 'unknown', confidence: 0 }
  });
  
  this.turnCount = this.transcript.length;
};

CallSchema.methods.updateAnalytics = function(analytics) {
  this.analytics = { ...this.analytics, ...analytics };
  
  // Calculate average sentiment
  if (this.transcript.length > 0) {
    const sentiments = this.transcript
      .filter(t => t.sentiment && typeof t.sentiment.score === 'number')
      .map(t => t.sentiment.score);
    
    if (sentiments.length > 0) {
      this.analytics.averageSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    }
  }
};

CallSchema.methods.addError = function(type, message, severity = 'medium') {
  if (!this.technical.errors) {
    this.technical.errors = [];
  }
  
  this.technical.errors.push({
    type,
    message,
    timestamp: new Date(),
    severity
  });
  
  this.performance.errorCount = (this.performance.errorCount || 0) + 1;
};

CallSchema.methods.addApiCall = function(service, endpoint, duration, success) {
  if (!this.technical.apiCalls) {
    this.technical.apiCalls = [];
  }
  
  this.technical.apiCalls.push({
    service,
    endpoint,
    duration,
    success,
    timestamp: new Date()
  });
};

// Static methods for analytics
CallSchema.statics.getCallAnalytics = async function(filters = {}, dateRange = {}) {
  const pipeline = [];
  
  // Match stage
  const matchStage = { ...filters };
  if (dateRange.start || dateRange.end) {
    matchStage.startTime = {};
    if (dateRange.start) matchStage.startTime.$gte = new Date(dateRange.start);
    if (dateRange.end) matchStage.startTime.$lte = new Date(dateRange.end);
  }
  pipeline.push({ $match: matchStage });
  
  // Group and calculate metrics
  pipeline.push({
    $group: {
      _id: null,
      totalCalls: { $sum: 1 },
      completedCalls: {
        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
      },
      averageDuration: { $avg: '$duration' },
      averageSentiment: { $avg: '$analytics.averageSentiment' },
      appointmentsScheduled: {
        $sum: { $cond: [{ $eq: ['$outcome', 'appointment_scheduled'] }, 1, 0] }
      },
      interestedInSimilar: {
        $sum: { $cond: [{ $eq: ['$outcome', 'interested_similar'] }, 1, 0] }
      },
      notInterested: {
        $sum: { $cond: [{ $eq: ['$outcome', 'not_interested'] }, 1, 0] }
      },
      totalTurnCount: { $sum: '$turnCount' },
      totalErrors: { $sum: '$performance.errorCount' }
    }
  });
  
  const result = await this.aggregate(pipeline);
  return result[0] || {};
};

CallSchema.statics.getPerformanceMetrics = async function(dateRange = {}) {
  const pipeline = [];
  
  // Match stage
  const matchStage = {};
  if (dateRange.start || dateRange.end) {
    matchStage.startTime = {};
    if (dateRange.start) matchStage.startTime.$gte = new Date(dateRange.start);
    if (dateRange.end) matchStage.startTime.$lte = new Date(dateRange.end);
  }
  pipeline.push({ $match: matchStage });
  
  // Calculate performance metrics
  pipeline.push({
    $group: {
      _id: null,
      averageTtsLatency: { $avg: '$performance.ttsLatency' },
      averageSttLatency: { $avg: '$performance.sttLatency' },
      averageAiResponseTime: { $avg: '$performance.aiResponseTime' },
      averageProcessingTime: { $avg: '$performance.totalProcessingTime' },
      totalErrors: { $sum: '$performance.errorCount' },
      averageAudioQuality: { $avg: '$technical.audioQuality' },
      averageConnectionQuality: { $avg: '$technical.connectionQuality' }
    }
  });
  
  const result = await this.aggregate(pipeline);
  return result[0] || {};
};

module.exports = mongoose.model('Call', CallSchema);
