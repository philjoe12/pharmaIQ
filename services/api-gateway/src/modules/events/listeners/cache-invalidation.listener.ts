import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AICacheService } from '../../../common/services/ai-cache.service';
import { DrugCacheService } from '../../drugs/services/drug-cache.service';

@Injectable()
export class CacheInvalidationListener {
  private readonly logger = new Logger(CacheInvalidationListener.name);

  constructor(
    private readonly aiCacheService: AICacheService,
    private readonly drugCacheService: DrugCacheService,
  ) {}

  @OnEvent('drug.updated')
  async handleDrugUpdated(payload: { drugId: string; slug?: string }) {
    this.logger.log(`Invalidating cache for drug: ${payload.drugId}`);
    
    try {
      // Invalidate AI-specific cache
      await this.aiCacheService.invalidateDrugCache(payload.drugId);
      
      // Invalidate general drug cache if slug provided
      if (payload.slug) {
        // Find drug entity first to invalidate properly
        // This would need to be implemented based on your drug repository
        this.logger.log(`Invalidating general drug cache for slug: ${payload.slug}`);
      }
      
      // Invalidate search cache since drug data changed
      await this.aiCacheService.invalidateByPattern('search:*');
      
      this.logger.log(`Successfully invalidated cache for drug: ${payload.drugId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate cache for drug ${payload.drugId}:`, error);
    }
  }

  @OnEvent('content.enhanced')
  async handleContentEnhanced(payload: { drugId: string; contentType?: string }) {
    this.logger.log(`Invalidating cache for enhanced content: ${payload.drugId}`);
    
    try {
      // Invalidate AI content cache
      await this.aiCacheService.invalidateDrugCache(payload.drugId);
      
      // If specific content type provided, can be more selective
      if (payload.contentType === 'faq') {
        // Only invalidate FAQ cache
        const key = `faq:${payload.drugId}`;
        await this.aiCacheService.invalidateByPattern(key);
      }
      
      this.logger.log(`Successfully invalidated enhanced content cache for: ${payload.drugId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate enhanced content cache for ${payload.drugId}:`, error);
    }
  }

  @OnEvent('seo.generated')
  async handleSEOGenerated(payload: { drugId: string }) {
    this.logger.log(`Invalidating cache for SEO data: ${payload.drugId}`);
    
    try {
      // Invalidate SEO-specific cache
      await this.aiCacheService.invalidateByPattern(`seo_meta:${payload.drugId}`);
      
      // Invalidate processed drug cache as SEO data is part of it
      await this.aiCacheService.invalidateByPattern(`proc_drug:${payload.drugId}`);
      
      this.logger.log(`Successfully invalidated SEO cache for: ${payload.drugId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate SEO cache for ${payload.drugId}:`, error);
    }
  }

  @OnEvent('ai.processing.started')
  async handleAIProcessingStarted(payload: { drugId: string; processingType: string }) {
    // Optional: Pre-warm cache or log processing start
    this.logger.debug(`AI processing started for ${payload.drugId}: ${payload.processingType}`);
  }

  @OnEvent('ai.processing.completed')
  async handleAIProcessingCompleted(payload: { drugId: string; processingType: string; result: any }) {
    this.logger.log(`AI processing completed for ${payload.drugId}: ${payload.processingType}`);
    
    try {
      // Cache the new result
      switch (payload.processingType) {
        case 'content-enhancement':
          await this.aiCacheService.cacheAIContent(payload.drugId, payload.result);
          break;
        case 'seo-generation':
          await this.aiCacheService.cacheSEOMetadata(payload.drugId, payload.result);
          break;
        case 'faq-generation':
          await this.aiCacheService.cacheFAQContent(payload.drugId, payload.result);
          break;
      }
      
      this.logger.log(`Cached AI processing result for ${payload.drugId}: ${payload.processingType}`);
    } catch (error) {
      this.logger.error(`Failed to cache AI processing result for ${payload.drugId}:`, error);
    }
  }

  @OnEvent('cache.clear.request')
  async handleCacheClearRequest(payload: { pattern?: string; drugId?: string }) {
    this.logger.warn(`Cache clear request received:`, payload);
    
    try {
      if (payload.drugId) {
        await this.aiCacheService.invalidateDrugCache(payload.drugId);
      } else if (payload.pattern) {
        await this.aiCacheService.invalidateByPattern(payload.pattern);
      } else {
        // Clear all cache - use with extreme caution
        await this.aiCacheService.clearAllCache();
      }
      
      this.logger.warn(`Cache cleared successfully`);
    } catch (error) {
      this.logger.error(`Failed to clear cache:`, error);
    }
  }
}