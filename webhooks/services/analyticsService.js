// Analytics Service
// Provides comprehensive analytics and business intelligence for the AI calling system

const Call = require('../models/Call');
const Lead = require('../models/Lead');
const logger = require('../utils/logger');
const config = require('../utils/config');

class AnalyticsService {
  constructor() {
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.cache = new Map();
  }

  /**
   * Get comprehensive dashboard analytics
   * @param {object} filters - Date range and other filters
   * @returns {Promise<object>} Dashboard analytics
   */
  async getDashboardAnalytics(filters = {}) {
    const cacheKey = `dashboard_${JSON.stringify(filters)}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const [callMetrics, leadMetrics, performanceMetrics, conversionMetrics] = await Promise.all([
        this.getCallMetrics(filters),
        this.getLeadMetrics(filters),
        this.getPerformanceMetrics(filters),
        this.getConversionMetrics(filters)
      ]);

      const analytics = {
        overview: {
          totalCalls: callMetrics.totalCalls || 0,
          totalLeads: leadMetrics.totalLeads || 0,
          conversionRate: conversionMetrics.conversionRate || 0,
          averageCallDuration: callMetrics.averageDuration || 0,
          successRate: callMetrics.successRate || 0
        },
        calls: callMetrics,
        leads: leadMetrics,
        performance: performanceMetrics,
        conversions: conversionMetrics,
        trends: await this.getTrendAnalytics(filters),
        insights: await this.generateInsights(callMetrics, leadMetrics, conversionMetrics)
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: analytics,
        timestamp: Date.now()
      });

      return analytics;
    } catch (error) {
      logger.error('Error generating dashboard analytics', { error: error.message });
      throw error;
    }
  }

  /**
   * Get call-specific metrics
   * @param {object} filters - Filters to apply
   * @returns {Promise<object>} Call metrics
   */
  async getCallMetrics(filters = {}) {
    try {
      const dateRange = this.buildDateRange(filters);
      
      const callAnalytics = await Call.getCallAnalytics(filters, dateRange);
      
      // Additional call metrics
      const callsByOutcome = await Call.aggregate([
        { $match: { ...filters, ...this.buildDateFilter(dateRange) } },
        { $group: { _id: '$outcome', count: { $sum: 1 } } }
      ]);

      const callsByHour = await Call.aggregate([
        { $match: { ...filters, ...this.buildDateFilter(dateRange) } },
        {
          $group: {
            _id: { $hour: '$startTime' },
            count: { $sum: 1 },
            averageDuration: { $avg: '$duration' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);

      const sentimentDistribution = await Call.aggregate([
        { $match: { ...filters, ...this.buildDateFilter(dateRange) } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $gte: ['$analytics.averageSentiment', 0.1] }, then: 'positive' },
                  { case: { $lte: ['$analytics.averageSentiment', -0.1] }, then: 'negative' }
                ],
                default: 'neutral'
              }
            },
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        ...callAnalytics,
        successRate: callAnalytics.totalCalls > 0 ? 
          (callAnalytics.completedCalls / callAnalytics.totalCalls) * 100 : 0,
        appointmentRate: callAnalytics.totalCalls > 0 ? 
          (callAnalytics.appointmentsScheduled / callAnalytics.totalCalls) * 100 : 0,
        interestRate: callAnalytics.totalCalls > 0 ? 
          (callAnalytics.interestedInSimilar / callAnalytics.totalCalls) * 100 : 0,
        averageTurns: callAnalytics.totalCalls > 0 ? 
          callAnalytics.totalTurnCount / callAnalytics.totalCalls : 0,
        errorRate: callAnalytics.totalCalls > 0 ? 
          (callAnalytics.totalErrors / callAnalytics.totalCalls) * 100 : 0,
        outcomeDistribution: this.formatDistribution(callsByOutcome),
        hourlyDistribution: callsByHour,
        sentimentDistribution: this.formatDistribution(sentimentDistribution)
      };
    } catch (error) {
      logger.error('Error getting call metrics', { error: error.message });
      return {};
    }
  }

  /**
   * Get lead-specific metrics
   * @param {object} filters - Filters to apply
   * @returns {Promise<object>} Lead metrics
   */
  async getLeadMetrics(filters = {}) {
    try {
      const dateRange = this.buildDateRange(filters);
      
      const leadAnalytics = await Lead.getLeadAnalytics({
        ...filters,
        ...this.buildDateFilter(dateRange, 'inquiryDate')
      });

      const leadsBySource = await Lead.aggregate([
        { $match: { ...filters, ...this.buildDateFilter(dateRange, 'inquiryDate') } },
        { $group: { _id: '$leadSource', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const leadsByScore = await Lead.aggregate([
        { $match: { ...filters, ...this.buildDateFilter(dateRange, 'inquiryDate') } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $gte: ['$leadScore', 80] }, then: 'high' },
                  { case: { $gte: ['$leadScore', 60] }, then: 'medium' },
                  { case: { $gte: ['$leadScore', 40] }, then: 'low' }
                ],
                default: 'very_low'
              }
            },
            count: { $sum: 1 },
            averageScore: { $avg: '$leadScore' }
          }
        }
      ]);

      return {
        ...leadAnalytics,
        conversionRate: leadAnalytics.totalLeads > 0 ? 
          (leadAnalytics.convertedLeads / leadAnalytics.totalLeads) * 100 : 0,
        qualificationRate: leadAnalytics.totalLeads > 0 ? 
          (leadAnalytics.qualifiedLeads / leadAnalytics.totalLeads) * 100 : 0,
        lossRate: leadAnalytics.totalLeads > 0 ? 
          (leadAnalytics.lostLeads / leadAnalytics.totalLeads) * 100 : 0,
        sourceDistribution: this.formatDistribution(leadsBySource),
        scoreDistribution: this.formatDistribution(leadsByScore)
      };
    } catch (error) {
      logger.error('Error getting lead metrics', { error: error.message });
      return {};
    }
  }

  /**
   * Get performance metrics
   * @param {object} filters - Filters to apply
   * @returns {Promise<object>} Performance metrics
   */
  async getPerformanceMetrics(filters = {}) {
    try {
      const dateRange = this.buildDateRange(filters);
      
      const performanceData = await Call.getPerformanceMetrics(dateRange);
      
      // System performance metrics
      const systemMetrics = {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      };

      return {
        ...performanceData,
        system: systemMetrics,
        responseTimeGrade: this.gradeResponseTime(performanceData.averageAiResponseTime),
        audioQualityGrade: this.gradeQuality(performanceData.averageAudioQuality),
        overallPerformanceScore: this.calculatePerformanceScore(performanceData)
      };
    } catch (error) {
      logger.error('Error getting performance metrics', { error: error.message });
      return {};
    }
  }

  /**
   * Get conversion metrics and funnel analysis
   * @param {object} filters - Filters to apply
   * @returns {Promise<object>} Conversion metrics
   */
  async getConversionMetrics(filters = {}) {
    try {
      const dateRange = this.buildDateRange(filters);
      
      const funnelData = await Lead.aggregate([
        { $match: { ...filters, ...this.buildDateFilter(dateRange, 'inquiryDate') } },
        {
          $group: {
            _id: null,
            totalLeads: { $sum: 1 },
            contacted: { $sum: { $cond: [{ $gte: ['$callAttempts', 1] }, 1, 0] } },
            qualified: { $sum: { $cond: [{ $eq: ['$status', 'qualified'] }, 1, 0] } },
            appointmentSet: { $sum: { $cond: [{ $eq: ['$status', 'appointment_set'] }, 1, 0] } },
            converted: { $sum: { $cond: [{ $eq: ['$status', 'converted'] }, 1, 0] } }
          }
        }
      ]);

      const funnel = funnelData[0] || {};
      
      return {
        funnel: {
          leads: funnel.totalLeads || 0,
          contacted: funnel.contacted || 0,
          qualified: funnel.qualified || 0,
          appointmentSet: funnel.appointmentSet || 0,
          converted: funnel.converted || 0
        },
        conversionRates: {
          leadToContact: funnel.totalLeads > 0 ? (funnel.contacted / funnel.totalLeads) * 100 : 0,
          contactToQualified: funnel.contacted > 0 ? (funnel.qualified / funnel.contacted) * 100 : 0,
          qualifiedToAppointment: funnel.qualified > 0 ? (funnel.appointmentSet / funnel.qualified) * 100 : 0,
          appointmentToConversion: funnel.appointmentSet > 0 ? (funnel.converted / funnel.appointmentSet) * 100 : 0,
          overallConversion: funnel.totalLeads > 0 ? (funnel.converted / funnel.totalLeads) * 100 : 0
        }
      };
    } catch (error) {
      logger.error('Error getting conversion metrics', { error: error.message });
      return {};
    }
  }

  /**
   * Get trend analytics over time
   * @param {object} filters - Filters to apply
   * @returns {Promise<object>} Trend data
   */
  async getTrendAnalytics(filters = {}) {
    try {
      const dateRange = this.buildDateRange(filters);
      
      const dailyTrends = await Call.aggregate([
        { $match: { ...filters, ...this.buildDateFilter(dateRange) } },
        {
          $group: {
            _id: {
              year: { $year: '$startTime' },
              month: { $month: '$startTime' },
              day: { $dayOfMonth: '$startTime' }
            },
            calls: { $sum: 1 },
            completedCalls: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
            appointments: { $sum: { $cond: [{ $eq: ['$outcome', 'appointment_scheduled'] }, 1, 0] } },
            averageDuration: { $avg: '$duration' },
            averageSentiment: { $avg: '$analytics.averageSentiment' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]);

      return {
        daily: dailyTrends.map(trend => ({
          date: new Date(trend._id.year, trend._id.month - 1, trend._id.day),
          calls: trend.calls,
          completedCalls: trend.completedCalls,
          appointments: trend.appointments,
          successRate: trend.calls > 0 ? (trend.completedCalls / trend.calls) * 100 : 0,
          appointmentRate: trend.calls > 0 ? (trend.appointments / trend.calls) * 100 : 0,
          averageDuration: trend.averageDuration,
          averageSentiment: trend.averageSentiment
        }))
      };
    } catch (error) {
      logger.error('Error getting trend analytics', { error: error.message });
      return {};
    }
  }

  /**
   * Generate actionable insights
   * @param {object} callMetrics - Call metrics
   * @param {object} leadMetrics - Lead metrics
   * @param {object} conversionMetrics - Conversion metrics
   * @returns {Promise<Array>} Array of insights
   */
  async generateInsights(callMetrics, leadMetrics, conversionMetrics) {
    const insights = [];

    // Call performance insights
    if (callMetrics.successRate < 70) {
      insights.push({
        type: 'warning',
        category: 'performance',
        title: 'Low Call Success Rate',
        description: `Call success rate is ${callMetrics.successRate?.toFixed(1)}%, below the recommended 70%`,
        recommendation: 'Review call timing and customer data quality',
        priority: 'high'
      });
    }

    if (callMetrics.averageSentiment < -0.1) {
      insights.push({
        type: 'alert',
        category: 'sentiment',
        title: 'Negative Customer Sentiment',
        description: 'Average customer sentiment is negative',
        recommendation: 'Review conversation scripts and agent training',
        priority: 'high'
      });
    }

    // Conversion insights
    if (conversionMetrics.conversionRates?.overallConversion < 5) {
      insights.push({
        type: 'warning',
        category: 'conversion',
        title: 'Low Conversion Rate',
        description: `Overall conversion rate is ${conversionMetrics.conversionRates?.overallConversion?.toFixed(1)}%`,
        recommendation: 'Improve lead qualification and follow-up processes',
        priority: 'medium'
      });
    }

    // Lead quality insights
    if (leadMetrics.averageLeadScore < 50) {
      insights.push({
        type: 'info',
        category: 'leads',
        title: 'Lead Quality Opportunity',
        description: 'Average lead score is below 50',
        recommendation: 'Focus on higher-quality lead sources',
        priority: 'medium'
      });
    }

    return insights;
  }

  // Helper methods
  buildDateRange(filters) {
    const now = new Date();
    const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    return {
      start: filters.startDate ? new Date(filters.startDate) : defaultStart,
      end: filters.endDate ? new Date(filters.endDate) : now
    };
  }

  buildDateFilter(dateRange, field = 'startTime') {
    const filter = {};
    if (dateRange.start || dateRange.end) {
      filter[field] = {};
      if (dateRange.start) filter[field].$gte = dateRange.start;
      if (dateRange.end) filter[field].$lte = dateRange.end;
    }
    return filter;
  }

  formatDistribution(data) {
    return data.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }

  gradeResponseTime(responseTime) {
    if (!responseTime) return 'N/A';
    if (responseTime < 1000) return 'A';
    if (responseTime < 2000) return 'B';
    if (responseTime < 3000) return 'C';
    return 'D';
  }

  gradeQuality(quality) {
    if (!quality) return 'N/A';
    if (quality > 0.9) return 'A';
    if (quality > 0.8) return 'B';
    if (quality > 0.7) return 'C';
    return 'D';
  }

  calculatePerformanceScore(metrics) {
    let score = 100;
    
    if (metrics.averageAiResponseTime > 2000) score -= 20;
    if (metrics.averageTtsLatency > 1000) score -= 15;
    if (metrics.averageSttLatency > 1000) score -= 15;
    if (metrics.totalErrors > 0) score -= Math.min(30, metrics.totalErrors * 5);
    if (metrics.averageAudioQuality < 0.8) score -= 20;
    
    return Math.max(0, score);
  }

  /**
   * Clear analytics cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Analytics cache cleared');
  }

  /**
   * Get real-time metrics
   * @returns {Promise<object>} Real-time metrics
   */
  async getRealTimeMetrics() {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      const [activeCalls, recentCalls, systemHealth] = await Promise.all([
        Call.countDocuments({ status: 'in_progress' }),
        Call.countDocuments({ startTime: { $gte: hourAgo } }),
        this.getSystemHealth()
      ]);

      return {
        activeCalls,
        recentCalls,
        systemHealth,
        timestamp: now
      };
    } catch (error) {
      logger.error('Error getting real-time metrics', { error: error.message });
      return {};
    }
  }

  async getSystemHealth() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    return {
      uptime: uptime,
      memory: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      status: memUsage.heapUsed / memUsage.heapTotal < 0.9 ? 'healthy' : 'warning'
    };
  }
}

module.exports = new AnalyticsService();
