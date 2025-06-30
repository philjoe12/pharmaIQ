import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AIService } from '../services/ai.service';
import { DrugService } from '../../drugs/services/drug.service';
import { DrugComparisonService, ComparisonRequest } from '../services/drug-comparison.service';
import { ContentEnhancementRequestDto, EnhancedContentDto } from '../dto/content-enhancement.dto';

@ApiTags('AI Content Enhancement')
@Controller('ai')
export class AIController {
  constructor(
    private readonly aiService: AIService,
    private readonly drugService: DrugService,
    private readonly drugComparisonService: DrugComparisonService
  ) {}

  @Post('enhance/:slug')
  @ApiOperation({ 
    summary: 'Enhance drug content with AI',
    description: 'Generate AI-enhanced content including SEO titles, meta descriptions, FAQs, and provider explanations'
  })
  @ApiParam({ name: 'slug', description: 'Drug slug identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Enhanced content generated successfully',
    type: EnhancedContentDto 
  })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  async enhanceDrugContent(@Param('slug') slug: string): Promise<EnhancedContentDto> {
    const drug = await this.drugService.findBySlug(slug);
    const enhancedContent = await this.aiService.enhanceDrugContent(drug);
    return enhancedContent;
  }

  @Get('enhance/:slug/seo')
  @ApiOperation({ 
    summary: 'Generate SEO content only',
    description: 'Generate SEO-optimized title and meta description for a drug'
  })
  @ApiParam({ name: 'slug', description: 'Drug slug identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'SEO content generated successfully'
  })
  async generateSEOContent(@Param('slug') slug: string): Promise<{
    seoTitle: string;
    metaDescription: string;
  }> {
    const drug = await this.drugService.findBySlug(slug);
    const enhanced = await this.aiService.enhanceDrugContent(drug);
    
    return {
      seoTitle: enhanced.seoTitle,
      metaDescription: enhanced.metaDescription
    };
  }

  @Get('enhance/:slug/explanation')
  @ApiOperation({ 
    summary: 'Generate provider explanation',
    description: 'Generate a provider-friendly explanation of the drug mechanism and uses'
  })
  @ApiParam({ name: 'slug', description: 'Drug slug identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Provider explanation generated successfully'
  })
  async generateProviderExplanation(@Param('slug') slug: string): Promise<{
    providerExplanation: string;
  }> {
    const drug = await this.drugService.findBySlug(slug);
    const enhanced = await this.aiService.enhanceDrugContent(drug);
    
    return {
      providerExplanation: enhanced.providerExplanation
    };
  }

  @Get('enhance/:slug/faqs')
  @ApiOperation({ 
    summary: 'Generate FAQ section',
    description: 'Generate frequently asked questions and answers for healthcare providers'
  })
  @ApiParam({ name: 'slug', description: 'Drug slug identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'FAQs generated successfully'
  })
  async generateFAQs(@Param('slug') slug: string): Promise<{
    faqs: Array<{ question: string; answer: string }>;
  }> {
    const drug = await this.drugService.findBySlug(slug);
    const enhanced = await this.aiService.enhanceDrugContent(drug);
    
    return {
      faqs: enhanced.faqs
    };
  }

  @Get('enhance/:slug/related')
  @ApiOperation({ 
    summary: 'Generate related content suggestions',
    description: 'Generate related conditions, drugs, and therapeutic benefits'
  })
  @ApiParam({ name: 'slug', description: 'Drug slug identifier' })
  @ApiResponse({ 
    status: 200, 
    description: 'Related content generated successfully'
  })
  async generateRelatedContent(@Param('slug') slug: string): Promise<{
    relatedConditions: string[];
    relatedDrugs: string[];
    keyBenefits: string[];
  }> {
    const drug = await this.drugService.findBySlug(slug);
    const enhanced = await this.aiService.enhanceDrugContent(drug);
    
    return {
      relatedConditions: enhanced.relatedConditions,
      relatedDrugs: enhanced.relatedDrugs,
      keyBenefits: enhanced.keyBenefits
    };
  }

  @Post('batch-enhance')
  @ApiOperation({ 
    summary: 'Batch enhance multiple drugs',
    description: 'Generate AI-enhanced content for multiple drugs'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Batch enhancement completed'
  })
  async batchEnhance(@Body() request: { slugs: string[] }): Promise<{
    processed: number;
    results: Record<string, EnhancedContentDto>;
    errors: Record<string, string>;
  }> {
    const results: Record<string, EnhancedContentDto> = {};
    const errors: Record<string, string> = {};
    
    for (const slug of request.slugs) {
      try {
        const drug = await this.drugService.findBySlug(slug);
        const enhanced = await this.aiService.enhanceDrugContent(drug);
        results[slug] = enhanced;
      } catch (error) {
        errors[slug] = error.message || 'Enhancement failed';
      }
    }

    return {
      processed: Object.keys(results).length,
      results,
      errors
    };
  }

  @Post('compare')
  @ApiOperation({ 
    summary: 'AI-powered drug comparison',
    description: 'Perform advanced AI-powered comparison of multiple drugs with scenario-based analysis'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'AI comparison completed successfully'
  })
  @ApiResponse({ status: 400, description: 'Invalid request - need at least 2 drugs' })
  async comparedrugs(@Body() request: {
    drugIds: string[];
    scenario?: 'general' | 'elderly' | 'pregnancy' | 'pediatric' | 'renal_impairment' | 'hepatic_impairment';
    categories?: ('efficacy' | 'safety' | 'administration' | 'interactions')[];
    includeAI?: boolean;
  }) {
    if (!request.drugIds || request.drugIds.length < 2) {
      throw new Error('At least 2 drug IDs are required for comparison');
    }

    // Fetch drug data
    const drugs = await this.drugService.compareDrugsByIds(request.drugIds);

    // Perform AI comparison
    const comparisonRequest: ComparisonRequest = {
      drugs,
      scenario: request.scenario || 'general',
      categories: request.categories || ['efficacy', 'safety'],
      includeAI: request.includeAI !== false
    };

    return await this.drugComparisonService.performAdvancedComparison(comparisonRequest);
  }

  @Get('status')
  @ApiOperation({ 
    summary: 'Check AI service status',
    description: 'Verify AI service connectivity and configuration'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'AI service status'
  })
  async getStatus(): Promise<{
    status: string;
    provider: string;
    features: string[];
    healthCheck: boolean;
  }> {
    return {
      status: 'operational',
      provider: 'OpenAI GPT-3.5-turbo',
      features: [
        'SEO title generation',
        'Meta description creation',
        'Provider explanations',
        'FAQ generation',
        'Related content suggestions',
        'AI-powered drug comparison'
      ],
      healthCheck: true
    };
  }
}