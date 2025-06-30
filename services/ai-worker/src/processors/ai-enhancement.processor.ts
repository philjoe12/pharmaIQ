import { Process, Processor } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ContentEnhancementProcessor, ContentEnhancementRequest } from './content-enhancement.processor';

export interface AIEnhancementJob {
  drugData: any;
  contentType: 'seo-title' | 'meta-description' | 'faq' | 'provider-explanation' | 'related-drugs';
  options?: {
    targetAudience?: 'healthcare_provider' | 'patient' | 'general';
    maxLength?: number;
    tone?: 'professional' | 'accessible' | 'technical';
    numberOfQuestions?: number;
    maxSuggestions?: number;
  };
}

@Processor('ai-enhancement')
@Injectable()
export class AIEnhancementQueueProcessor {
  private readonly logger = new Logger(AIEnhancementQueueProcessor.name);

  constructor(
    private readonly contentEnhancementProcessor: ContentEnhancementProcessor,
  ) {}

  @Process('enhance-content')
  async processContentEnhancement(job: Job<AIEnhancementJob>): Promise<any> {
    const { drugData, contentType, options } = job.data;
    const drugName = drugData.drugName || 'Unknown Drug';

    this.logger.log(`Processing AI enhancement job for ${drugName} - ${contentType}`);

    try {
      // Update job progress
      await job.progress(10);

      // Prepare enhancement request
      const request: ContentEnhancementRequest = {
        drugData,
        contentType,
        targetAudience: options?.targetAudience || 'general',
        options: {
          maxLength: options?.maxLength,
          tone: options?.tone || 'professional',
          numberOfQuestions: options?.numberOfQuestions || 5,
          maxSuggestions: options?.maxSuggestions || 5,
        },
      };

      await job.progress(30);

      // Generate enhanced content
      const result = await this.contentEnhancementProcessor.enhanceContent(request);

      await job.progress(90);

      // Validate result
      if (!result.validation.valid) {
        this.logger.warn(
          `Content validation failed for ${drugName} (${contentType}): ${result.validation.errors.join(', ')}`
        );
        throw new Error(`Content validation failed: ${result.validation.errors.join(', ')}`);
      }

      await job.progress(100);

      this.logger.log(
        `Successfully enhanced ${contentType} for ${drugName} using ${result.provider} (${result.metadata.processingTime}ms)`
      );

      // Return enhanced content with metadata
      return {
        success: true,
        drugId: drugData.setId || drugData.id,
        contentType,
        content: result.content,
        provider: result.provider,
        model: result.model,
        usage: result.usage,
        metadata: {
          ...result.metadata,
          jobId: job.id,
          queueProcessingTime: Date.now() - job.timestamp,
        },
        validation: result.validation,
      };

    } catch (error) {
      this.logger.error(`Failed to enhance ${contentType} for ${drugName}:`, error);
      
      // Update job progress to failed
      await job.progress(0);
      
      throw new Error(`AI enhancement failed: ${error.message}`);
    }
  }

  @Process('batch-enhance-content')
  async processBatchContentEnhancement(job: Job<{ drugs: any[], contentTypes: string[] }>): Promise<any> {
    const { drugs, contentTypes } = job.data;
    
    this.logger.log(`Processing batch AI enhancement for ${drugs.length} drugs, ${contentTypes.length} content types`);

    const results = [];
    const total = drugs.length * contentTypes.length;
    let processed = 0;

    try {
      for (const drug of drugs) {
        for (const contentType of contentTypes) {
          try {
            const enhancementJob: AIEnhancementJob = {
              drugData: drug,
              contentType: contentType as any,
              options: {
                targetAudience: 'general',
                tone: 'professional',
              },
            };

            const result = await this.processContentEnhancement({
              data: enhancementJob,
              progress: async () => {},
              id: `batch-${Date.now()}-${processed}`,
              timestamp: Date.now(),
            } as Job<AIEnhancementJob>);

            results.push(result);
            processed++;
            
            // Update batch job progress
            const progress = Math.round((processed / total) * 100);
            await job.progress(progress);

            this.logger.debug(`Batch progress: ${processed}/${total} (${progress}%)`);

          } catch (error) {
            this.logger.error(`Batch enhancement failed for ${drug.drugName} - ${contentType}:`, error);
            results.push({
              success: false,
              drugId: drug.setId || drug.id,
              contentType,
              error: error.message,
            });
            processed++;
          }
        }
      }

      this.logger.log(`Completed batch AI enhancement: ${results.length} results`);
      return {
        success: true,
        totalProcessed: processed,
        results,
        summary: {
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
        },
      };

    } catch (error) {
      this.logger.error('Batch AI enhancement failed:', error);
      throw new Error(`Batch enhancement failed: ${error.message}`);
    }
  }

  @Process('generate-seo-content')
  async processSEOGeneration(job: Job<{ drugData: any }>): Promise<any> {
    const { drugData } = job.data;
    const drugName = drugData.drugName || 'Unknown Drug';

    this.logger.log(`Generating SEO content for ${drugName}`);

    try {
      const seoJobs = [
        { contentType: 'seo-title' as const, progress: 25 },
        { contentType: 'meta-description' as const, progress: 50 },
        { contentType: 'faq' as const, progress: 75 },
        { contentType: 'provider-explanation' as const, progress: 100 },
      ];

      const seoResults = {};

      for (const { contentType, progress } of seoJobs) {
        await job.progress(progress - 20);

        const request: ContentEnhancementRequest = {
          drugData,
          contentType,
          targetAudience: 'general',
          options: {
            tone: 'professional',
            maxLength: contentType === 'seo-title' ? 60 : contentType === 'meta-description' ? 160 : 500,
          },
        };

        const result = await this.contentEnhancementProcessor.enhanceContent(request);
        
        if (result.validation.valid) {
          seoResults[contentType] = {
            content: result.content,
            provider: result.provider,
            usage: result.usage,
          };
        } else {
          this.logger.warn(`SEO ${contentType} validation failed for ${drugName}`);
        }

        await job.progress(progress);
      }

      this.logger.log(`Generated SEO content for ${drugName}`);
      return {
        success: true,
        drugId: drugData.setId || drugData.id,
        seoContent: seoResults,
        generatedAt: new Date(),
      };

    } catch (error) {
      this.logger.error(`SEO generation failed for ${drugName}:`, error);
      throw new Error(`SEO generation failed: ${error.message}`);
    }
  }
}