import { Injectable, Logger } from '@nestjs/common';
import { ContentEnhancementProcessor, ContentEnhancementRequest } from './content-enhancement.processor';

export interface SEOGenerationRequest {
  drugData: any;
  generateAll?: boolean;
  components?: ('title' | 'description' | 'faq' | 'related')[];
  options?: {
    targetKeywords?: string[];
    competitorAnalysis?: boolean;
    maxFAQs?: number;
    maxRelated?: number;
  };
}

export interface SEOContent {
  title?: string;
  metaDescription?: string;
  faqContent?: string;
  relatedDrugs?: string;
  structuredData?: any;
}

export interface SEOGenerationResult {
  drugName: string;
  content: SEOContent;
  seoScore: {
    overall: number;
    title: number;
    description: number;
    contentQuality: number;
  };
  recommendations: string[];
  generatedAt: Date;
  processingTime: number;
}

@Injectable()
export class SEOGenerationProcessor {
  private readonly logger = new Logger(SEOGenerationProcessor.name);

  constructor(private readonly contentProcessor: ContentEnhancementProcessor) {}

  async generateSEOContent(request: SEOGenerationRequest): Promise<SEOGenerationResult> {
    const startTime = Date.now();
    const drugName = request.drugData.drugName || 'Unknown Drug';

    this.logger.log(`Generating SEO content for drug: ${drugName}`);

    try {
      const componentsToGenerate = request.components || ['title', 'description', 'faq', 'related'];
      const seoContent: SEOContent = {};
      const recommendations: string[] = [];

      // Generate title if requested
      if (componentsToGenerate.includes('title')) {
        try {
          const titleRequest: ContentEnhancementRequest = {
            drugData: request.drugData,
            contentType: 'seo-title',
            options: { maxLength: 60 },
          };
          
          const titleResult = await this.contentProcessor.enhanceContent(titleRequest);
          seoContent.title = titleResult.content;
          
          if (!titleResult.validation.valid) {
            recommendations.push(`Title issues: ${titleResult.validation.errors.join(', ')}`);
          }
        } catch (error) {
          this.logger.error(`Failed to generate SEO title for ${drugName}:`, error);
          recommendations.push('Failed to generate SEO title - consider manual optimization');
        }
      }

      // Generate meta description if requested
      if (componentsToGenerate.includes('description')) {
        try {
          const descRequest: ContentEnhancementRequest = {
            drugData: request.drugData,
            contentType: 'meta-description',
            options: { maxLength: 160 },
          };
          
          const descResult = await this.contentProcessor.enhanceContent(descRequest);
          seoContent.metaDescription = descResult.content;
          
          if (!descResult.validation.valid) {
            recommendations.push(`Meta description issues: ${descResult.validation.errors.join(', ')}`);
          }
        } catch (error) {
          this.logger.error(`Failed to generate meta description for ${drugName}:`, error);
          recommendations.push('Failed to generate meta description - consider manual optimization');
        }
      }

      // Generate FAQ content if requested
      if (componentsToGenerate.includes('faq')) {
        try {
          const faqRequest: ContentEnhancementRequest = {
            drugData: request.drugData,
            contentType: 'faq',
            targetAudience: 'general',
            options: { numberOfQuestions: request.options?.maxFAQs || 5 },
          };
          
          const faqResult = await this.contentProcessor.enhanceContent(faqRequest);
          seoContent.faqContent = faqResult.content;
          
          if (!faqResult.validation.valid) {
            recommendations.push(`FAQ issues: ${faqResult.validation.errors.join(', ')}`);
          }
        } catch (error) {
          this.logger.error(`Failed to generate FAQ content for ${drugName}:`, error);
          recommendations.push('Failed to generate FAQ content - consider manual creation');
        }
      }

      // Generate related drugs if requested
      if (componentsToGenerate.includes('related')) {
        try {
          const relatedRequest: ContentEnhancementRequest = {
            drugData: request.drugData,
            contentType: 'related-drugs',
            options: { maxSuggestions: request.options?.maxRelated || 5 },
          };
          
          const relatedResult = await this.contentProcessor.enhanceContent(relatedRequest);
          seoContent.relatedDrugs = relatedResult.content;
          
          if (!relatedResult.validation.valid) {
            recommendations.push(`Related drugs issues: ${relatedResult.validation.errors.join(', ')}`);
          }
        } catch (error) {
          this.logger.error(`Failed to generate related drugs for ${drugName}:`, error);
          recommendations.push('Failed to generate related drugs - consider manual curation');
        }
      }

      // Generate structured data for FAQ if FAQ content was created
      if (seoContent.faqContent) {
        try {
          seoContent.structuredData = this.generateFAQStructuredData(seoContent.faqContent, drugName);
        } catch (error) {
          this.logger.warn(`Failed to generate structured data for ${drugName}:`, error);
          recommendations.push('Consider adding FAQ structured data manually');
        }
      }

      // Calculate SEO scores
      const seoScore = this.calculateSEOScore(seoContent, request.drugData);

      // Add performance recommendations
      recommendations.push(...this.generateSEORecommendations(seoContent, seoScore));

      const processingTime = Date.now() - startTime;

      const result: SEOGenerationResult = {
        drugName,
        content: seoContent,
        seoScore,
        recommendations,
        generatedAt: new Date(),
        processingTime,
      };

      this.logger.log(
        `Generated SEO content for ${drugName} in ${processingTime}ms (score: ${seoScore.overall}/100)`
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to generate SEO content for ${drugName}:`, error);
      throw new Error(`SEO generation failed: ${error.message}`);
    }
  }

  private generateFAQStructuredData(faqContent: string, drugName: string): any {
    // Simple extraction of Q&A pairs for structured data
    const lines = faqContent.split('\n').filter(line => line.trim());
    const faqItems: any[] = [];
    
    let currentQuestion = '';
    let currentAnswer = '';
    
    for (const line of lines) {
      if (line.startsWith('Q:')) {
        // Save previous Q&A if exists
        if (currentQuestion && currentAnswer) {
          faqItems.push({
            '@type': 'Question',
            'name': currentQuestion,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': currentAnswer.trim()
            }
          });
        }
        currentQuestion = line.substring(2).trim();
        currentAnswer = '';
      } else if (line.startsWith('A:')) {
        currentAnswer = line.substring(2).trim();
      } else if (currentAnswer) {
        currentAnswer += ' ' + line.trim();
      }
    }
    
    // Add the last Q&A pair
    if (currentQuestion && currentAnswer) {
      faqItems.push({
        '@type': 'Question',
        'name': currentQuestion,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': currentAnswer.trim()
        }
      });
    }

    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'about': {
        '@type': 'Drug',
        'name': drugName
      },
      'mainEntity': faqItems
    };
  }

  private calculateSEOScore(content: SEOContent, drugData: any): { overall: number; title: number; description: number; contentQuality: number } {
    let titleScore = 0;
    let descriptionScore = 0;
    let contentScore = 0;

    // Title scoring
    if (content.title) {
      titleScore = 70; // Base score for having a title
      if (content.title.length >= 30 && content.title.length <= 60) titleScore += 20;
      if (content.title.toLowerCase().includes(drugData.drugName?.toLowerCase() || '')) titleScore += 10;
    }

    // Description scoring
    if (content.metaDescription) {
      descriptionScore = 70; // Base score for having a description
      if (content.metaDescription.length >= 120 && content.metaDescription.length <= 160) descriptionScore += 20;
      if (content.metaDescription.toLowerCase().includes(drugData.drugName?.toLowerCase() || '')) descriptionScore += 10;
    }

    // Content quality scoring
    if (content.faqContent) contentScore += 30;
    if (content.relatedDrugs) contentScore += 20;
    if (content.structuredData) contentScore += 30;
    if (drugData.label?.indicationsAndUsage) contentScore += 20;

    const overall = Math.round((titleScore + descriptionScore + contentScore) / 3);

    return {
      overall: Math.min(overall, 100),
      title: Math.min(titleScore, 100),
      description: Math.min(descriptionScore, 100),
      contentQuality: Math.min(contentScore, 100),
    };
  }

  private generateSEORecommendations(content: SEOContent, scores: any): string[] {
    const recommendations: string[] = [];

    if (scores.title < 80) {
      if (!content.title) {
        recommendations.push('Add an SEO-optimized title');
      } else if (content.title.length < 30) {
        recommendations.push('Consider lengthening the title for better SEO (30-60 characters recommended)');
      } else if (content.title.length > 60) {
        recommendations.push('Consider shortening the title to under 60 characters');
      }
    }

    if (scores.description < 80) {
      if (!content.metaDescription) {
        recommendations.push('Add a meta description');
      } else if (content.metaDescription.length < 120) {
        recommendations.push('Consider lengthening meta description (120-160 characters recommended)');
      } else if (content.metaDescription.length > 160) {
        recommendations.push('Consider shortening meta description to under 160 characters');
      }
    }

    if (scores.contentQuality < 80) {
      if (!content.faqContent) {
        recommendations.push('Add FAQ content to improve user engagement');
      }
      if (!content.relatedDrugs) {
        recommendations.push('Add related drugs section for better internal linking');
      }
      if (!content.structuredData) {
        recommendations.push('Add structured data markup for better search visibility');
      }
    }

    if (scores.overall >= 90) {
      recommendations.push('Excellent SEO optimization! Consider monitoring performance and making adjustments based on analytics');
    } else if (scores.overall >= 70) {
      recommendations.push('Good SEO foundation. Focus on the recommendations above for improvement');
    } else {
      recommendations.push('SEO needs significant improvement. Prioritize title and meta description optimization');
    }

    return recommendations;
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await this.contentProcessor.isHealthy();
    } catch (error) {
      this.logger.error('SEO processor health check failed:', error);
      return false;
    }
  }
}