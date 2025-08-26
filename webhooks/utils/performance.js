// Performance Monitoring and Optimization Utilities
// Comprehensive performance tracking, optimization, and monitoring

const logger = require('./logger');
const config = require('./config');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      },
      calls: {
        total: 0,
        completed: 0,
        failed: 0,
        averageDuration: 0,
        averageProcessingTime: 0
      },
      ai: {
        ttsRequests: 0,
        sttRequests: 0,
        openaiRequests: 0,
        averageTtsTime: 0,
        averageSttTime: 0,
        averageOpenaiTime: 0
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0,
        activeConnections: 0
      }
    };

    this.responseTimes = [];
    this.maxResponseTimeHistory = 1000;
    
    // Start system monitoring
    this.startSystemMonitoring();
  }

  /**
   * Track HTTP request performance
   */
  trackRequest(req, res, next) {
    const startTime = process.hrtime.bigint();
    
    res.on('finish', () => {
      const endTime = process.hrtime.bigint();
      const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      this.recordRequestMetrics(responseTime, res.statusCode);
      
      // Log slow requests
      if (responseTime > 5000) { // 5 seconds
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          responseTime,
          statusCode: res.statusCode,
          userAgent: req.get('User-Agent'),
          ip: req.ip
        });
      }
    });

    next();
  }

  /**
   * Record request metrics
   */
  recordRequestMetrics(responseTime, statusCode) {
    this.metrics.requests.total++;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Update response time metrics
    this.responseTimes.push(responseTime);
    
    // Keep only recent response times
    if (this.responseTimes.length > this.maxResponseTimeHistory) {
      this.responseTimes.shift();
    }

    // Calculate average response time
    this.metrics.requests.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;

    // Calculate percentiles
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    this.metrics.requests.p95ResponseTime = this.calculatePercentile(sorted, 95);
    this.metrics.requests.p99ResponseTime = this.calculatePercentile(sorted, 99);
  }

  /**
   * Track call performance
   */
  trackCall(sessionId, startTime, endTime, status) {
    const duration = endTime - startTime;
    
    this.metrics.calls.total++;
    
    if (status === 'completed') {
      this.metrics.calls.completed++;
    } else {
      this.metrics.calls.failed++;
    }

    // Update average duration
    this.metrics.calls.averageDuration = 
      (this.metrics.calls.averageDuration * (this.metrics.calls.total - 1) + duration) / 
      this.metrics.calls.total;

    logger.performance('Call completed', duration, {
      sessionId,
      status,
      duration
    });
  }

  /**
   * Track AI service performance
   */
  trackAIService(service, duration, success = true) {
    switch (service) {
      case 'tts':
        this.metrics.ai.ttsRequests++;
        if (success) {
          this.metrics.ai.averageTtsTime = 
            (this.metrics.ai.averageTtsTime * (this.metrics.ai.ttsRequests - 1) + duration) / 
            this.metrics.ai.ttsRequests;
        }
        break;
      
      case 'stt':
        this.metrics.ai.sttRequests++;
        if (success) {
          this.metrics.ai.averageSttTime = 
            (this.metrics.ai.averageSttTime * (this.metrics.ai.sttRequests - 1) + duration) / 
            this.metrics.ai.sttRequests;
        }
        break;
      
      case 'openai':
        this.metrics.ai.openaiRequests++;
        if (success) {
          this.metrics.ai.averageOpenaiTime = 
            (this.metrics.ai.averageOpenaiTime * (this.metrics.ai.openaiRequests - 1) + duration) / 
            this.metrics.ai.openaiRequests;
        }
        break;
    }

    // Alert on slow AI services
    if (duration > 10000) { // 10 seconds
      logger.warn('Slow AI service response', {
        service,
        duration,
        success
      });
    }
  }

  /**
   * Start system monitoring
   */
  startSystemMonitoring() {
    setInterval(() => {
      this.updateSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Update system metrics
   */
  updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.system.memoryUsage = {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
    };

    this.metrics.system.cpuUsage = {
      user: cpuUsage.user,
      system: cpuUsage.system
    };

    this.metrics.system.uptime = process.uptime();

    // Alert on high resource usage
    if (this.metrics.system.memoryUsage.percentage > 90) {
      logger.warn('High memory usage detected', {
        percentage: this.metrics.system.memoryUsage.percentage,
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal
      });
    }
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(sortedArray, percentile) {
    if (sortedArray.length === 0) return 0;
    
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      healthScore: this.calculateHealthScore()
    };
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore() {
    let score = 100;

    // Deduct for high error rates
    const errorRate = this.metrics.requests.total > 0 ? 
      (this.metrics.requests.failed / this.metrics.requests.total) * 100 : 0;
    score -= Math.min(30, errorRate * 3);

    // Deduct for slow response times
    if (this.metrics.requests.averageResponseTime > 2000) {
      score -= Math.min(20, (this.metrics.requests.averageResponseTime - 2000) / 100);
    }

    // Deduct for high memory usage
    if (this.metrics.system.memoryUsage.percentage > 80) {
      score -= Math.min(20, (this.metrics.system.memoryUsage.percentage - 80) * 2);
    }

    // Deduct for slow AI services
    if (this.metrics.ai.averageOpenaiTime > 5000) {
      score -= Math.min(15, (this.metrics.ai.averageOpenaiTime - 5000) / 200);
    }

    return Math.max(0, Math.round(score));
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    
    return {
      summary: {
        healthScore: metrics.healthScore,
        totalRequests: metrics.requests.total,
        successRate: metrics.requests.total > 0 ? 
          (metrics.requests.successful / metrics.requests.total) * 100 : 0,
        averageResponseTime: metrics.requests.averageResponseTime,
        uptime: metrics.system.uptime
      },
      performance: {
        requests: metrics.requests,
        calls: metrics.calls,
        ai: metrics.ai
      },
      system: metrics.system,
      recommendations: this.generateRecommendations(metrics)
    };
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(metrics) {
    const recommendations = [];

    // Response time recommendations
    if (metrics.requests.averageResponseTime > 2000) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'High Response Times',
        description: `Average response time is ${metrics.requests.averageResponseTime.toFixed(0)}ms`,
        suggestion: 'Consider implementing caching, optimizing database queries, or scaling resources'
      });
    }

    // Error rate recommendations
    const errorRate = metrics.requests.total > 0 ? 
      (metrics.requests.failed / metrics.requests.total) * 100 : 0;
    
    if (errorRate > 5) {
      recommendations.push({
        type: 'reliability',
        priority: 'high',
        title: 'High Error Rate',
        description: `Error rate is ${errorRate.toFixed(1)}%`,
        suggestion: 'Review error logs and implement better error handling'
      });
    }

    // Memory usage recommendations
    if (metrics.system.memoryUsage.percentage > 80) {
      recommendations.push({
        type: 'resource',
        priority: 'medium',
        title: 'High Memory Usage',
        description: `Memory usage is ${metrics.system.memoryUsage.percentage.toFixed(1)}%`,
        suggestion: 'Consider increasing memory allocation or optimizing memory usage'
      });
    }

    // AI service recommendations
    if (metrics.ai.averageOpenaiTime > 5000) {
      recommendations.push({
        type: 'ai',
        priority: 'medium',
        title: 'Slow AI Responses',
        description: `OpenAI average response time is ${metrics.ai.averageOpenaiTime.toFixed(0)}ms`,
        suggestion: 'Consider implementing response caching or using faster models'
      });
    }

    return recommendations;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      },
      calls: {
        total: 0,
        completed: 0,
        failed: 0,
        averageDuration: 0,
        averageProcessingTime: 0
      },
      ai: {
        ttsRequests: 0,
        sttRequests: 0,
        openaiRequests: 0,
        averageTtsTime: 0,
        averageSttTime: 0,
        averageOpenaiTime: 0
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0,
        activeConnections: 0
      }
    };

    this.responseTimes = [];
    logger.info('Performance metrics reset');
  }
}

/**
 * Performance optimization utilities
 */
class PerformanceOptimizer {
  /**
   * Optimize database queries
   */
  static optimizeQuery(query, options = {}) {
    // Add lean() for read-only operations
    if (options.lean !== false) {
      query = query.lean();
    }

    // Add select() to limit fields
    if (options.select) {
      query = query.select(options.select);
    }

    // Add limit for large datasets
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Add indexes hint
    if (options.hint) {
      query = query.hint(options.hint);
    }

    return query;
  }

  /**
   * Batch process operations
   */
  static async batchProcess(items, processor, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Implement circuit breaker pattern
   */
  static createCircuitBreaker(fn, options = {}) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000,
      monitoringPeriod = 60000
    } = options;

    let failures = 0;
    let lastFailureTime = null;
    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

    return async (...args) => {
      if (state === 'OPEN') {
        if (Date.now() - lastFailureTime > resetTimeout) {
          state = 'HALF_OPEN';
        } else {
          throw new Error('Circuit breaker is OPEN');
        }
      }

      try {
        const result = await fn(...args);
        
        if (state === 'HALF_OPEN') {
          state = 'CLOSED';
          failures = 0;
        }

        return result;
      } catch (error) {
        failures++;
        lastFailureTime = Date.now();

        if (failures >= failureThreshold) {
          state = 'OPEN';
        }

        throw error;
      }
    };
  }

  /**
   * Implement retry with exponential backoff
   */
  static async retryWithBackoff(fn, options = {}) {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt),
          maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = {
  performanceMonitor,
  PerformanceOptimizer
};
