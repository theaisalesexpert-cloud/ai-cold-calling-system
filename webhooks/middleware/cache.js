// Advanced Caching Middleware
// Multi-layer caching with Redis, memory cache, and CDN integration

const redis = require('redis');
const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('../utils/config');

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.maxMemoryCacheSize = 1000;
    this.defaultTTL = 3600; // 1 hour
    
    // Initialize Redis client
    this.initializeRedis();
    
    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    // Cleanup interval for memory cache
    setInterval(() => this.cleanupMemoryCache(), 5 * 60 * 1000); // Every 5 minutes
  }

  async initializeRedis() {
    try {
      const redisConfig = config.getDatabaseConfig().redis;
      
      this.redisClient = redis.createClient({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis connection error', { error: err.message });
        this.stats.errors++;
      });

      this.redisClient.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      await this.redisClient.connect();
    } catch (error) {
      logger.error('Failed to initialize Redis', { error: error.message });
    }
  }

  /**
   * Generate cache key
   */
  generateKey(prefix, identifier, params = {}) {
    const paramString = Object.keys(params).length > 0 ? 
      JSON.stringify(params) : '';
    const keyString = `${prefix}:${identifier}:${paramString}`;
    
    // Hash long keys to avoid Redis key length limits
    if (keyString.length > 250) {
      return `${prefix}:${crypto.createHash('md5').update(keyString).digest('hex')}`;
    }
    
    return keyString;
  }

  /**
   * Get from cache (checks memory first, then Redis)
   */
  async get(key) {
    try {
      // Check memory cache first
      const memoryResult = this.getFromMemory(key);
      if (memoryResult !== null) {
        this.stats.hits++;
        logger.debug('Cache hit (memory)', { key });
        return memoryResult;
      }

      // Check Redis cache
      if (this.redisClient && this.redisClient.isReady) {
        const redisResult = await this.redisClient.get(key);
        if (redisResult !== null) {
          const parsed = JSON.parse(redisResult);
          
          // Store in memory cache for faster access
          this.setInMemory(key, parsed.data, parsed.ttl);
          
          this.stats.hits++;
          logger.debug('Cache hit (Redis)', { key });
          return parsed.data;
        }
      }

      this.stats.misses++;
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set cache value (stores in both memory and Redis)
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      // Store in memory cache
      this.setInMemory(key, value, ttl);

      // Store in Redis cache
      if (this.redisClient && this.redisClient.isReady) {
        const cacheData = {
          data: value,
          ttl: ttl,
          timestamp: Date.now()
        };
        
        await this.redisClient.setEx(key, ttl, JSON.stringify(cacheData));
      }

      this.stats.sets++;
      logger.debug('Cache set', { key, ttl });
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      this.stats.errors++;
    }
  }

  /**
   * Delete from cache
   */
  async delete(key) {
    try {
      // Delete from memory cache
      this.memoryCache.delete(key);

      // Delete from Redis cache
      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.del(key);
      }

      this.stats.deletes++;
      logger.debug('Cache delete', { key });
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      this.stats.errors++;
    }
  }

  /**
   * Clear all cache
   */
  async clear() {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      // Clear Redis cache
      if (this.redisClient && this.redisClient.isReady) {
        await this.redisClient.flushDb();
      }

      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Cache clear error', { error: error.message });
      this.stats.errors++;
    }
  }

  /**
   * Memory cache operations
   */
  getFromMemory(key) {
    const item = this.memoryCache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    return item.data;
  }

  setInMemory(key, value, ttl) {
    // Enforce memory cache size limit
    if (this.memoryCache.size >= this.maxMemoryCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.memoryCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = Math.floor(this.maxMemoryCacheSize * 0.1); // Remove 10%
      for (let i = 0; i < toRemove; i++) {
        this.memoryCache.delete(entries[i][0]);
      }
    }

    this.memoryCache.set(key, {
      data: value,
      expiry: Date.now() + (ttl * 1000),
      timestamp: Date.now()
    });
  }

  cleanupMemoryCache() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, item] of this.memoryCache.entries()) {
      if (now > item.expiry) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug('Memory cache cleanup', { cleaned, remaining: this.memoryCache.size });
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0 ? 
      (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 : 0;

    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2),
      memoryCacheSize: this.memoryCache.size,
      redisConnected: this.redisClient?.isReady || false
    };
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

/**
 * Express middleware for caching responses
 */
const cacheMiddleware = (ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator ? 
        keyGenerator(req) : 
        cacheManager.generateKey('api', req.originalUrl, req.query);

      // Try to get from cache
      const cachedData = await cacheManager.get(cacheKey);
      
      if (cachedData) {
        // Set cache headers
        res.set({
          'X-Cache': 'HIT',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });
        
        return res.json(cachedData);
      }

      // Store original res.json method
      const originalJson = res.json;
      
      // Override res.json to cache the response
      res.json = function(data) {
        // Cache the response
        cacheManager.set(cacheKey, data, ttl);
        
        // Set cache headers
        res.set({
          'X-Cache': 'MISS',
          'X-Cache-Key': cacheKey,
          'Cache-Control': `public, max-age=${ttl}`
        });
        
        // Call original json method
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
};

/**
 * Cache invalidation middleware
 */
const invalidateCache = (patterns = []) => {
  return async (req, res, next) => {
    // Store original methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override response methods to invalidate cache on successful operations
    const invalidateOnSuccess = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate cache patterns
        patterns.forEach(async (pattern) => {
          try {
            if (typeof pattern === 'function') {
              const keys = pattern(req, data);
              if (Array.isArray(keys)) {
                for (const key of keys) {
                  await cacheManager.delete(key);
                }
              } else {
                await cacheManager.delete(keys);
              }
            } else {
              await cacheManager.delete(pattern);
            }
          } catch (error) {
            logger.error('Cache invalidation error', { pattern, error: error.message });
          }
        });
      }
    };

    res.json = function(data) {
      invalidateOnSuccess(data);
      return originalJson.call(this, data);
    };

    res.send = function(data) {
      invalidateOnSuccess(data);
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Warm up cache with frequently accessed data
 */
const warmupCache = async () => {
  try {
    logger.info('Starting cache warmup');

    // Warm up analytics data
    const analyticsKey = cacheManager.generateKey('analytics', 'dashboard', {
      period: '30d'
    });
    
    // This would typically fetch from your analytics service
    // await cacheManager.set(analyticsKey, analyticsData, 1800); // 30 minutes

    // Warm up voice service status
    const voiceStatusKey = cacheManager.generateKey('voice', 'status');
    // await cacheManager.set(voiceStatusKey, voiceStatus, 300); // 5 minutes

    logger.info('Cache warmup completed');
  } catch (error) {
    logger.error('Cache warmup failed', { error: error.message });
  }
};

/**
 * Cache health check
 */
const getCacheHealth = async () => {
  const stats = cacheManager.getStats();
  
  return {
    status: stats.redisConnected ? 'healthy' : 'degraded',
    redis: {
      connected: stats.redisConnected,
      errors: stats.errors
    },
    memory: {
      size: stats.memoryCacheSize,
      maxSize: cacheManager.maxMemoryCacheSize
    },
    performance: {
      hitRate: stats.hitRate,
      totalHits: stats.hits,
      totalMisses: stats.misses
    }
  };
};

module.exports = {
  cacheManager,
  cacheMiddleware,
  invalidateCache,
  warmupCache,
  getCacheHealth
};
