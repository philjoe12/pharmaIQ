import { Controller, Post, Get, Body, Logger, HttpException, HttpStatus, Query } from '@nestjs/common';
import { SeoOptimizationService, DrugData, SeoContent, SitemapEntry } from '../services/seo-optimization.service';

export interface GenerateSeoDto {
  drugData: DrugData;
}

export interface GenerateBatchSeoDto {
  drugsData: DrugData[];
}

@Controller('seo')
export class SeoOptimizationController {
  private readonly logger = new Logger(SeoOptimizationController.name);

  constructor(private readonly seoService: SeoOptimizationService) {}

  @Post('generate')
  async generateSeoContent(@Body() dto: GenerateSeoDto): Promise<SeoContent> {
    try {
      if (!dto.drugData || !dto.drugData.name) {
        throw new HttpException('Drug data with name is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Generating SEO content for: ${dto.drugData.name}`);
      const result = await this.seoService.generateSeoContent(dto.drugData);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to generate SEO content:', error);
      throw new HttpException(
        error.message || 'SEO content generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('generate-batch')
  async generateBatchSeoContent(@Body() dto: GenerateBatchSeoDto): Promise<{
    results: SeoContent[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    try {
      if (!dto.drugsData || !Array.isArray(dto.drugsData)) {
        throw new HttpException('Drugs data array is required', HttpStatus.BAD_REQUEST);
      }

      if (dto.drugsData.length === 0) {
        throw new HttpException('Drugs data array cannot be empty', HttpStatus.BAD_REQUEST);
      }

      if (dto.drugsData.length > 50) {
        throw new HttpException('Batch size cannot exceed 50 items', HttpStatus.BAD_REQUEST);
      }

      // Validate each drug has a name
      const invalidDrugs = dto.drugsData.filter(drug => !drug.name);
      if (invalidDrugs.length > 0) {
        throw new HttpException('All drugs must have a name', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Generating SEO content for batch of ${dto.drugsData.length} drugs`);
      const results = await this.seoService.generateBatchSeoContent(dto.drugsData);
      
      return {
        results,
        summary: {
          total: dto.drugsData.length,
          successful: results.length,
          failed: dto.drugsData.length - results.length
        }
      };
    } catch (error) {
      this.logger.error('Failed to generate batch SEO content:', error);
      throw new HttpException(
        error.message || 'Batch SEO generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sitemap/generate')
  async generateSitemap(@Body() dto: { seoContents: SeoContent[] }): Promise<{
    entries: SitemapEntry[];
    xml: string;
  }> {
    try {
      if (!dto.seoContents || !Array.isArray(dto.seoContents)) {
        throw new HttpException('SEO contents array is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Generating sitemap for ${dto.seoContents.length} entries`);
      
      const entries = this.seoService.generateSitemapEntries(dto.seoContents);
      const xml = this.seoService.generateSitemapXml(entries);
      
      return { entries, xml };
    } catch (error) {
      this.logger.error('Failed to generate sitemap:', error);
      throw new HttpException(
        error.message || 'Sitemap generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('robots.txt')
  async getRobotsTxt(@Query('baseUrl') baseUrl?: string): Promise<{ content: string }> {
    try {
      const content = this.seoService.generateRobotsTxt(baseUrl);
      return { content };
    } catch (error) {
      this.logger.error('Failed to generate robots.txt:', error);
      throw new HttpException(
        'Failed to generate robots.txt',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('meta-tags')
  async generateMetaTags(@Body() dto: { seoContent: SeoContent }): Promise<{
    metaTags: string;
  }> {
    try {
      if (!dto.seoContent) {
        throw new HttpException('SEO content is required', HttpStatus.BAD_REQUEST);
      }

      const metaTags = this.seoService.generateMetaTags(dto.seoContent);
      return { metaTags };
    } catch (error) {
      this.logger.error('Failed to generate meta tags:', error);
      throw new HttpException(
        error.message || 'Meta tags generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}