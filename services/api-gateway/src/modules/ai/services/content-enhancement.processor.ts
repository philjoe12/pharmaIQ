import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface ContentEnhancementRequest {
  drugData: any;
  contentType: 'seo-title' | 'meta-description' | 'faq' | 'provider-explanation' | 'related-drugs';
  targetAudience?: 'healthcare_provider' | 'patient' | 'general';
  options?: {
    maxLength?: number;
    tone?: 'professional' | 'accessible' | 'technical';
    numberOfQuestions?: number;
    maxSuggestions?: number;
  };
}

export interface ContentEnhancementResult {
  content: string;
  contentType: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  validation: {
    valid: boolean;
    errors: string[];
    warnings?: string[];
  };
  metadata: {
    drugName: string;
    generatedAt: Date;
    processingTime: number;
  };
}

@Injectable()
export class ContentEnhancementProcessor {
  private readonly logger = new Logger(ContentEnhancementProcessor.name);
  private readonly aiWorkerUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.aiWorkerUrl = this.configService.get('AI_WORKER_URL', 'http://localhost:3003');
  }

  async enhanceContent(request: ContentEnhancementRequest): Promise<ContentEnhancementResult> {
    const startTime = Date.now();
    const drugName = request.drugData.drugName || 'Unknown Drug';

    this.logger.log(`Enhancing ${request.contentType} content for drug: ${drugName}`);

    try {
      // Call AI worker service
      const response = await axios.post(`${this.aiWorkerUrl}/enhance`, request, {
        timeout: 30000, // 30 seconds timeout
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      const result = response.data;
      const processingTime = Date.now() - startTime;

      // Add our own metadata
      result.metadata = {
        ...result.metadata,
        processingTime,
        generatedAt: new Date(),
      };

      this.logger.log(
        `Enhanced ${request.contentType} for ${drugName} in ${processingTime}ms via AI worker`
      );

      return result;

    } catch (error) {
      this.logger.error(`Failed to enhance content for ${drugName}:`, error);
      
      // Fallback to mock content if AI worker is unavailable
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        this.logger.warn(`AI worker unavailable, generating fallback content for ${drugName}`);
        return this.generateFallbackContent(request, startTime);
      }
      
      throw new Error(`Content enhancement failed: ${error.message}`);
    }
  }

  private generateFallbackContent(request: ContentEnhancementRequest, startTime: number): ContentEnhancementResult {
    const drugName = request.drugData.drugName || 'Unknown Drug';
    const processingTime = Date.now() - startTime;

    let content: string;
    
    switch (request.contentType) {
      case 'seo-title':
        content = `${drugName} - FDA Prescribing Information & Drug Facts`;
        break;
      
      case 'meta-description':
        content = `Complete prescribing information for ${drugName}. Find dosage, side effects, warnings, and FDA-approved uses for healthcare professionals.`;
        break;
      
      case 'faq':
        content = JSON.stringify([
          {
            question: `What is ${drugName} used for?`,
            answer: `${drugName} is prescribed for specific medical conditions as determined by your healthcare provider. Please consult the prescribing information for complete details.`
          },
          {
            question: `What are the side effects of ${drugName}?`,
            answer: `Like all medications, ${drugName} may cause side effects. Please review the complete prescribing information and consult your healthcare provider.`
          },
          {
            question: `How should ${drugName} be taken?`,
            answer: `Follow your healthcare provider's instructions for taking ${drugName}. Do not adjust the dose without consulting your provider.`
          }
        ]);
        break;
      
      case 'provider-explanation':
        content = `${drugName} is a prescription medication with specific indications, contraindications, and dosing considerations. Healthcare providers should review the complete prescribing information before prescribing.`;
        break;
      
      case 'related-drugs':
        content = JSON.stringify([
          { drugName: 'Similar medication 1', relationship: 'Same therapeutic class' },
          { drugName: 'Similar medication 2', relationship: 'Alternative treatment' }
        ]);
        break;
      
      default:
        content = `Information about ${drugName} is available in the prescribing information.`;
    }

    return {
      content,
      contentType: request.contentType,
      provider: 'fallback',
      model: 'static-content',
      validation: {
        valid: true,
        errors: [],
        warnings: ['Generated using fallback content due to AI service unavailability']
      },
      metadata: {
        drugName,
        generatedAt: new Date(),
        processingTime,
      },
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.aiWorkerUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      this.logger.warn('AI worker health check failed:', error.message);
      return false;
    }
  }

  getProviderStatus(): { aiWorkerUrl: string; healthy: boolean } {
    return {
      aiWorkerUrl: this.aiWorkerUrl,
      healthy: false, // Will be determined by health check
    };
  }
}