import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { AICacheService } from '../../../common/services/ai-cache.service';
import { DrugEventsPublisher } from '../../events/publishers/drug-events.publisher';
import { ContentEnhancementProcessor } from './content-enhancement.processor';

export interface AIEnhancementJob {
  drugData: any;
  contentType: 'seo-title' | 'meta-description' | 'faq' | 'provider-explanation' | 'related-drugs';
  targetAudience?: 'healthcare_provider' | 'patient' | 'general';
  options?: any;
}

@Injectable()
@Processor('ai-enhancement')
export class AIEnhancementService {
  private readonly logger = new Logger(AIEnhancementService.name);

  constructor(
    private readonly contentProcessor: ContentEnhancementProcessor,
    private readonly aiCacheService: AICacheService,
    private readonly drugEventsPublisher: DrugEventsPublisher,
  ) {}

  @Process('enhance-content')
  async processContentEnhancement(job: Job<AIEnhancementJob>): Promise<any> {
    const { drugData, contentType, targetAudience, options } = job.data;
    const drugId = drugData.setId || drugData.id;

    this.logger.log(`Processing AI enhancement for drug ${drugId}: ${contentType}`);

    try {
      // Emit processing started event
      await this.drugEventsPublisher.publishProcessingStarted(drugId);

      // Generate enhanced content
      const result = await this.contentProcessor.enhanceContent({
        drugData,
        contentType,
        targetAudience,
        options,
      });

      if (!result.validation.valid) {
        this.logger.warn(`Content validation failed for ${drugId}:`, result.validation.errors);
        throw new Error(`Content validation failed: ${result.validation.errors.join(', ')}`);
      }

      // Cache the result based on content type
      await this.cacheEnhancedContent(drugId, contentType, result);

      // Emit processing completed event
      await this.drugEventsPublisher.publishProcessingCompleted(drugId, result);

      this.logger.log(`Successfully enhanced ${contentType} for drug ${drugId}`);
      return result;

    } catch (error) {
      this.logger.error(`Failed to enhance ${contentType} for drug ${drugId}:`, error);
      
      // Emit processing failed event
      await this.drugEventsPublisher.publishProcessingCompleted(drugId, {
        error: error.message,
        contentType,
        failed: true,
      });
      
      throw error;
    }
  }

  private async cacheEnhancedContent(drugId: string, contentType: string, result: any): Promise<void> {
    try {
      switch (contentType) {
        case 'seo-title':
        case 'meta-description':
          // Cache as SEO metadata
          const seoData = {
            drugId,
            title: contentType === 'seo-title' ? result.content : undefined,
            metaDescription: contentType === 'meta-description' ? result.content : undefined,
            generatedAt: result.metadata.generatedAt,
            provider: result.provider,
            model: result.model,
          };
          await this.aiCacheService.cacheSEOMetadata(drugId, seoData as any);
          break;

        case 'faq':
          // Parse FAQ content and cache
          const faqData = this.parseFAQContent(result.content);
          await this.aiCacheService.cacheFAQContent(drugId, faqData);
          break;

        case 'provider-explanation':
        case 'related-drugs':
          // Cache as general AI content
          const aiContent = {
            drugId,
            contentType,
            content: result.content,
            generatedAt: result.metadata.generatedAt,
            provider: result.provider,
            model: result.model,
            usage: result.usage,
          };
          await this.aiCacheService.cacheAIContent(drugId, aiContent as any);
          break;

        default:
          this.logger.warn(`Unknown content type for caching: ${contentType}`);
      }
    } catch (error) {
      this.logger.error(`Failed to cache enhanced content for ${drugId}:`, error);
      // Don't throw here - caching failure shouldn't fail the enhancement
    }
  }

  private parseFAQContent(content: string): any[] {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
      
      // If not JSON array, try to extract Q&A pairs
      const lines = content.split('\n').filter(line => line.trim());
      const faqs = [];
      let currentFaq: any = {};

      for (const line of lines) {
        if (line.toLowerCase().startsWith('q:') || line.toLowerCase().startsWith('question:')) {
          if (currentFaq.question) {
            faqs.push(currentFaq);
          }
          currentFaq = { question: line.replace(/^(q:|question:)/i, '').trim() };
        } else if (line.toLowerCase().startsWith('a:') || line.toLowerCase().startsWith('answer:')) {
          if (currentFaq.question) {
            currentFaq.answer = line.replace(/^(a:|answer:)/i, '').trim();
          }
        }
      }

      if (currentFaq.question && currentFaq.answer) {
        faqs.push(currentFaq);
      }

      return faqs.length > 0 ? faqs : [{ question: 'General Information', answer: content }];
    } catch (error) {
      this.logger.warn('Failed to parse FAQ content, storing as single entry');
      return [{ question: 'General Information', answer: content }];
    }
  }

  async getEnhancementStatus(drugId: string): Promise<any> {
    try {
      // Check what's cached for this drug
      const [aiContent, seoMetadata, faqContent] = await Promise.all([
        this.aiCacheService.getAIContent(drugId),
        this.aiCacheService.getSEOMetadata(drugId),
        this.aiCacheService.getFAQContent(drugId),
      ]);

      return {
        drugId,
        cached: {
          aiContent: !!aiContent,
          seoMetadata: !!seoMetadata,
          faqContent: !!faqContent,
        },
        lastUpdated: {
          aiContent: (aiContent as any)?.createdAt || null,
          seoMetadata: (seoMetadata as any)?.createdAt || null,
          faqContent: (faqContent as any)?.[0]?.createdAt || null,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get enhancement status for ${drugId}:`, error);
      return {
        drugId,
        error: error.message,
      };
    }
  }

  async invalidateCache(drugId: string): Promise<void> {
    try {
      await this.aiCacheService.invalidateDrugCache(drugId);
      this.logger.log(`Invalidated AI cache for drug: ${drugId}`);
    } catch (error) {
      this.logger.error(`Failed to invalidate cache for ${drugId}:`, error);
      throw error;
    }
  }
}