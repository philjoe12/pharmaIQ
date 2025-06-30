import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AiEnhancedContentEntity, SeoMetadataEntity, ProcessedDrugData } from '@pharmaiq/types';

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  keyPrefix: string;
  defaultTTL: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

@Injectable()
export class AICacheService {
  private readonly logger = new Logger(AICacheService.name);
  private readonly redis: Redis;
  private readonly config: CacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  // Cache key prefixes for different content types
  private readonly KEY_PREFIXES = {
    AI_CONTENT: 'ai_content',
    SEO_METADATA: 'seo_meta',
    PROCESSED_DRUG: 'proc_drug',
    AI_PROMPT_RESULT: 'ai_prompt',
    VALIDATION_RESULT: 'validation',
    FAQ_CONTENT: 'faq',
    SEARCH_RESULTS: 'search',
  } as const;

  // TTL values in seconds for different content types
  private readonly TTL_VALUES = {
    AI_CONTENT: 7 * 24 * 60 * 60, // 7 days - AI content is expensive to generate
    SEO_METADATA: 24 * 60 * 60, // 1 day - SEO data changes less frequently
    PROCESSED_DRUG: 24 * 60 * 60, // 1 day - Processed drug data is stable
    AI_PROMPT_RESULT: 60 * 60, // 1 hour - Prompt results for deduplication
    VALIDATION_RESULT: 12 * 60 * 60, // 12 hours - Validation results
    FAQ_CONTENT: 3 * 24 * 60 * 60, // 3 days - FAQ content
    SEARCH_RESULTS: 30 * 60, // 30 minutes - Search results
  } as const;

  constructor(private readonly configService: ConfigService) {
    this.config = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      keyPrefix: this.configService.get('REDIS_PREFIX', 'pharmaiq:ai:'),
      defaultTTL: this.configService.get('CACHE_DEFAULT_TTL', 3600),
    };

    this.redis = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      keyPrefix: this.config.keyPrefix,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      showFriendlyErrorStack: true,
    } as any);

    this.redis.on('connect', () => {
      this.logger.log('Connected to Redis for AI cache');
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
      this.stats.errors++;
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis AI cache ready');
    });
  }

  /**
   * Cache AI-enhanced content
   */
  async cacheAIContent(drugId: string, content: AiEnhancedContentEntity): Promise<void> {
    const key = this.buildKey(this.KEY_PREFIXES.AI_CONTENT, drugId);
    await this.set(key, content, this.TTL_VALUES.AI_CONTENT);
    this.logger.debug(`Cached AI content for drug: ${drugId}`);
  }

  /**
   * Get cached AI-enhanced content
   */
  async getAIContent(drugId: string): Promise<AiEnhancedContentEntity | null> {
    const key = this.buildKey(this.KEY_PREFIXES.AI_CONTENT, drugId);
    return await this.get<AiEnhancedContentEntity>(key);
  }

  /**
   * Cache SEO metadata
   */
  async cacheSEOMetadata(drugId: string, metadata: SeoMetadataEntity): Promise<void> {
    const key = this.buildKey(this.KEY_PREFIXES.SEO_METADATA, drugId);
    await this.set(key, metadata, this.TTL_VALUES.SEO_METADATA);
    this.logger.debug(`Cached SEO metadata for drug: ${drugId}`);
  }

  /**
   * Get cached SEO metadata
   */
  async getSEOMetadata(drugId: string): Promise<SeoMetadataEntity | null> {
    const key = this.buildKey(this.KEY_PREFIXES.SEO_METADATA, drugId);
    return await this.get<SeoMetadataEntity>(key);
  }

  /**
   * Cache processed drug data
   */
  async cacheProcessedDrug(drugId: string, data: ProcessedDrugData): Promise<void> {
    const key = this.buildKey(this.KEY_PREFIXES.PROCESSED_DRUG, drugId);
    await this.set(key, data, this.TTL_VALUES.PROCESSED_DRUG);
    this.logger.debug(`Cached processed drug data: ${drugId}`);
  }

  /**
   * Get cached processed drug data
   */
  async getProcessedDrug(drugId: string): Promise<ProcessedDrugData | null> {
    const key = this.buildKey(this.KEY_PREFIXES.PROCESSED_DRUG, drugId);
    return await this.get<ProcessedDrugData>(key);
  }

  /**
   * Cache AI prompt result to avoid duplicate requests
   */
  async cachePromptResult(promptHash: string, result: any): Promise<void> {
    const key = this.buildKey(this.KEY_PREFIXES.AI_PROMPT_RESULT, promptHash);
    await this.set(key, result, this.TTL_VALUES.AI_PROMPT_RESULT);
  }

  /**
   * Get cached AI prompt result
   */
  async getPromptResult<T = any>(promptHash: string): Promise<T | null> {
    const key = this.buildKey(this.KEY_PREFIXES.AI_PROMPT_RESULT, promptHash);
    return await this.get<T>(key);
  }

  /**
   * Cache FAQ content
   */
  async cacheFAQContent(drugId: string, faqs: any[]): Promise<void> {
    const key = this.buildKey(this.KEY_PREFIXES.FAQ_CONTENT, drugId);
    await this.set(key, faqs, this.TTL_VALUES.FAQ_CONTENT);
  }

  /**
   * Get cached FAQ content
   */
  async getFAQContent(drugId: string): Promise<any[] | null> {
    const key = this.buildKey(this.KEY_PREFIXES.FAQ_CONTENT, drugId);
    return await this.get<any[]>(key);
  }

  /**
   * Cache search results
   */
  async cacheSearchResults(queryHash: string, results: any): Promise<void> {
    const key = this.buildKey(this.KEY_PREFIXES.SEARCH_RESULTS, queryHash);
    await this.set(key, results, this.TTL_VALUES.SEARCH_RESULTS);
  }

  /**
   * Get cached search results
   */
  async getSearchResults<T = any>(queryHash: string): Promise<T | null> {
    const key = this.buildKey(this.KEY_PREFIXES.SEARCH_RESULTS, queryHash);
    return await this.get<T>(key);
  }

  /**
   * Invalidate all cache entries for a drug
   */
  async invalidateDrugCache(drugId: string): Promise<void> {
    const patterns = [
      this.buildKey(this.KEY_PREFIXES.AI_CONTENT, drugId),
      this.buildKey(this.KEY_PREFIXES.SEO_METADATA, drugId),
      this.buildKey(this.KEY_PREFIXES.PROCESSED_DRUG, drugId),
      this.buildKey(this.KEY_PREFIXES.FAQ_CONTENT, drugId),
    ];

    await Promise.all(patterns.map(pattern => this.delete(pattern)));
    this.logger.log(`Invalidated all cache entries for drug: ${drugId}`);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(`${this.config.keyPrefix}${pattern}`);
    if (keys.length === 0) return 0;

    // Remove prefix from keys since Redis.del expects keys without prefix
    const keysWithoutPrefix = keys.map(key => key.replace(this.config.keyPrefix, ''));
    const deleted = await this.redis.del(...keysWithoutPrefix);
    
    this.stats.deletes += deleted;
    this.logger.log(`Invalidated ${deleted} cache entries matching pattern: ${pattern}`);
    return deleted;
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats & { 
    hitRate: number; 
    totalOperations: number;
    redisInfo?: any;
  } {
    const totalOperations = this.stats.hits + this.stats.misses;
    const hitRate = totalOperations > 0 ? (this.stats.hits / totalOperations) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      totalOperations,
    };
  }

  /**
   * Get Redis memory usage info
   */
  async getMemoryInfo(): Promise<any> {
    try {
      const info = await this.redis.info('memory');
      return this.parseRedisInfo(info);
    } catch (error) {
      this.logger.error('Failed to get Redis memory info:', error);
      return null;
    }
  }

  /**
   * Clear all AI cache (use with caution)
   */
  async clearAllCache(): Promise<void> {
    const keys = await this.redis.keys('*');
    if (keys.length > 0) {
      const keysWithoutPrefix = keys.map(key => key.replace(this.config.keyPrefix, ''));
      await this.redis.del(...keysWithoutPrefix);
      this.logger.warn(`Cleared ${keys.length} cache entries`);
    }
  }

  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const start = Date.now();
      await this.redis.ping();
      const latency = Date.now() - start;
      
      return {
        status: 'healthy',
        latency,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
      };
    }
  }

  /**
   * Generic get method
   */
  private async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (value === null) {
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}:`, error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Generic set method
   */
  private async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const finalTTL = ttl || this.config.defaultTTL;
      
      await this.redis.setex(key, finalTTL, serialized);
      this.stats.sets++;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}:`, error);
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Generic delete method
   */
  private async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
      this.stats.deletes++;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Build cache key with prefix
   */
  private buildKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier}`;
  }

  /**
   * Parse Redis info string into object
   */
  private parseRedisInfo(info: string): any {
    const result: any = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }
    
    return result;
  }

  /**
   * Generate hash for prompt caching
   */
  generatePromptHash(prompt: string, context?: any): string {
    const crypto = require('crypto');
    const data = JSON.stringify({ prompt, context });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('AI Cache Redis connection closed');
  }
}