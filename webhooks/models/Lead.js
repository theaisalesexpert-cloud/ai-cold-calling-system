// Lead Data Model
// MongoDB schema for storing lead information and tracking

const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  // Basic lead information
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
  
  // Vehicle interest
  carModel: {
    type: String,
    required: true,
    index: true
  },
  
  carYear: {
    type: Number,
    index: true
  },
  
  carMake: {
    type: String,
    index: true
  },
  
  priceRange: {
    min: Number,
    max: Number
  },
  
  // Lead source and tracking
  leadSource: {
    type: String,
    required: true,
    index: true
  },
  
  inquiryDate: {
    type: Date,
    required: true,
    index: true
  },
  
  lastContactDate: {
    type: Date,
    index: true
  },
  
  // Lead status and priority
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'appointment_set', 'converted', 'lost', 'do_not_call'],
    default: 'new',
    index: true
  },
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },
  
  // Call tracking
  callHistory: [{
    sessionId: String,
    callDate: Date,
    duration: Number,
    outcome: String,
    notes: String,
    nextAction: String
  }],
  
  callAttempts: {
    type: Number,
    default: 0,
    index: true
  },
  
  maxCallAttempts: {
    type: Number,
    default: 3
  },
  
  nextCallDate: {
    type: Date,
    index: true
  },
  
  // Lead scoring and qualification
  leadScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50,
    index: true
  },
  
  qualificationCriteria: {
    budget: {
      type: String,
      enum: ['unknown', 'low', 'medium', 'high']
    },
    timeline: {
      type: String,
      enum: ['unknown', 'immediate', 'within_month', 'within_quarter', 'future']
    },
    authority: {
      type: String,
      enum: ['unknown', 'decision_maker', 'influencer', 'researcher']
    },
    need: {
      type: String,
      enum: ['unknown', 'urgent', 'moderate', 'casual']
    }
  },
  
  // Customer preferences
  preferences: {
    contactMethod: {
      type: String,
      enum: ['phone', 'email', 'sms', 'any'],
      default: 'phone'
    },
    
    bestTimeToCall: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'any'],
      default: 'any'
    },
    
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Interest and behavior tracking
  interests: {
    vehicleTypes: [String],
    features: [String],
    brands: [String],
    similarModels: [String]
  },
  
  behavior: {
    websiteVisits: Number,
    emailOpens: Number,
    emailClicks: Number,
    brochureDownloads: Number,
    lastActivity: Date
  },
  
  // Appointment and follow-up
  appointments: [{
    date: Date,
    type: {
      type: String,
      enum: ['test_drive', 'viewing', 'consultation', 'delivery']
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  followUps: [{
    type: {
      type: String,
      enum: ['call', 'email', 'sms', 'letter']
    },
    scheduledDate: Date,
    completedDate: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled']
    },
    notes: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Dealership and assignment
  dealership: {
    name: String,
    location: String,
    salesRep: String,
    department: String
  },
  
  // Analytics and insights
  analytics: {
    conversionProbability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    
    estimatedValue: Number,
    
    customerLifetimeValue: Number,
    
    acquisitionCost: Number,
    
    touchpoints: Number,
    
    engagementScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  
  // Compliance and consent
  consent: {
    marketing: {
      type: Boolean,
      default: false
    },
    
    calls: {
      type: Boolean,
      default: true
    },
    
    sms: {
      type: Boolean,
      default: false
    },
    
    email: {
      type: Boolean,
      default: false
    },
    
    recording: {
      type: Boolean,
      default: false
    },
    
    dataProcessing: {
      type: Boolean,
      default: true
    },
    
    consentDate: Date,
    
    ipAddress: String
  },
  
  // Notes and tags
  notes: String,
  
  tags: [String],
  
  // Metadata
  metadata: {
    source: String,
    campaign: String,
    medium: String,
    referrer: String,
    utmParams: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String
    }
  }
}, {
  timestamps: true,
  collection: 'leads'
});

// Indexes for performance
LeadSchema.index({ status: 1, priority: 1, nextCallDate: 1 });
LeadSchema.index({ leadScore: -1, status: 1 });
LeadSchema.index({ dealership: 1, status: 1 });
LeadSchema.index({ inquiryDate: -1 });
LeadSchema.index({ customerName: 'text', carModel: 'text' });

// Virtual for lead age
LeadSchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.inquiryDate) / (1000 * 60 * 60 * 24));
});

// Virtual for next action
LeadSchema.virtual('nextAction').get(function() {
  if (this.status === 'do_not_call') return 'none';
  if (this.callAttempts >= this.maxCallAttempts) return 'email_follow_up';
  if (this.nextCallDate && this.nextCallDate <= new Date()) return 'call';
  if (this.followUps.some(f => f.status === 'pending' && f.scheduledDate <= new Date())) return 'follow_up';
  return 'monitor';
});

// Methods
LeadSchema.methods.updateLeadScore = function() {
  let score = 50; // Base score
  
  // Adjust based on qualification criteria
  if (this.qualificationCriteria.budget === 'high') score += 20;
  if (this.qualificationCriteria.timeline === 'immediate') score += 15;
  if (this.qualificationCriteria.authority === 'decision_maker') score += 15;
  if (this.qualificationCriteria.need === 'urgent') score += 10;
  
  // Adjust based on behavior
  score += Math.min(20, (this.behavior.websiteVisits || 0) * 2);
  score += Math.min(10, (this.behavior.emailOpens || 0));
  
  // Adjust based on engagement
  if (this.callHistory.length > 0) {
    const lastCall = this.callHistory[this.callHistory.length - 1];
    if (lastCall.outcome === 'appointment_scheduled') score += 25;
    if (lastCall.outcome === 'interested_similar') score += 15;
    if (lastCall.outcome === 'not_interested') score -= 20;
  }
  
  // Age penalty
  const ageInDays = this.ageInDays;
  if (ageInDays > 30) score -= Math.min(20, (ageInDays - 30) / 2);
  
  this.leadScore = Math.max(0, Math.min(100, score));
  return this.leadScore;
};

LeadSchema.methods.addCallRecord = function(sessionId, outcome, duration, notes) {
  this.callHistory.push({
    sessionId,
    callDate: new Date(),
    duration,
    outcome,
    notes,
    nextAction: this.determineNextAction(outcome)
  });
  
  this.callAttempts += 1;
  this.lastContactDate = new Date();
  
  // Update status based on outcome
  if (outcome === 'appointment_scheduled') {
    this.status = 'appointment_set';
  } else if (outcome === 'not_interested') {
    this.status = 'lost';
  } else if (this.callAttempts >= this.maxCallAttempts) {
    this.status = 'contacted';
  }
  
  // Update lead score
  this.updateLeadScore();
};

LeadSchema.methods.determineNextAction = function(outcome) {
  switch (outcome) {
    case 'appointment_scheduled':
      return 'appointment_reminder';
    case 'interested_similar':
      return 'send_similar_cars';
    case 'callback_requested':
      return 'schedule_callback';
    case 'not_interested':
      return 'none';
    case 'no_response':
      return this.callAttempts < this.maxCallAttempts ? 'retry_call' : 'email_follow_up';
    default:
      return 'follow_up';
  }
};

LeadSchema.methods.scheduleNextCall = function(delayHours = 24) {
  if (this.callAttempts < this.maxCallAttempts && this.status !== 'do_not_call') {
    this.nextCallDate = new Date(Date.now() + delayHours * 60 * 60 * 1000);
  }
};

LeadSchema.methods.scheduleAppointment = function(date, type, notes) {
  this.appointments.push({
    date,
    type,
    status: 'scheduled',
    notes
  });
  
  this.status = 'appointment_set';
  this.updateLeadScore();
};

LeadSchema.methods.addFollowUp = function(type, scheduledDate, notes) {
  this.followUps.push({
    type,
    scheduledDate,
    status: 'pending',
    notes
  });
};

// Static methods
LeadSchema.statics.getLeadsForCalling = async function(limit = 10) {
  return this.find({
    status: { $in: ['new', 'contacted'] },
    callAttempts: { $lt: 3 },
    $or: [
      { nextCallDate: { $lte: new Date() } },
      { nextCallDate: { $exists: false } }
    ],
    'consent.calls': true
  })
  .sort({ priority: -1, leadScore: -1, inquiryDate: 1 })
  .limit(limit);
};

LeadSchema.statics.getLeadAnalytics = async function(filters = {}) {
  const pipeline = [
    { $match: filters },
    {
      $group: {
        _id: null,
        totalLeads: { $sum: 1 },
        averageLeadScore: { $avg: '$leadScore' },
        newLeads: { $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] } },
        qualifiedLeads: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
        convertedLeads: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } },
        lostLeads: { $sum: { $cond: [{ $eq: ['$status', 'lost'] }, 1, 0] } },
        averageCallAttempts: { $avg: '$callAttempts' },
        totalAppointments: { $sum: { $size: '$appointments' } }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {};
};

module.exports = mongoose.model('Lead', LeadSchema);
