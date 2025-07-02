import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  NotFoundException,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { DrugService } from '../services/drug.service';
import { DrugQueryDto } from '../dto/drug-query.dto';
import { DrugDto } from '../dto/drug.dto';
import { CompareDrugsDto } from '../dto/compare-drugs.dto';
import { AIService } from '../../ai/services/ai.service';

@ApiTags('drugs')
@Controller('drugs')
@UseInterceptors(ClassSerializerInterceptor)
export class DrugController {
  constructor(
    private readonly drugService: DrugService,
    private readonly aiService: AIService,
  ) {}

  @Get('search')
  @ApiOperation({ summary: 'Search drugs by name, generic name, or manufacturer' })
  @ApiQuery({ name: 'q', description: 'Search query', required: true })
  @ApiResponse({ status: 200, description: 'Return search results' })
  async searchDrugs(@Query('q') searchTerm: string) {
    console.log('Search endpoint called with term:', searchTerm);
    if (!searchTerm || searchTerm.trim().length < 2) {
      return { success: true, data: [] };
    }
    const results = await this.drugService.searchDrugs(searchTerm.trim());
    console.log(`Found ${results.length} results for search term: ${searchTerm}`);
    return { success: true, data: results };
  }

  @Get()
  @ApiOperation({ summary: 'Get all drugs with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Return all drugs' })
  async findAll(@Query() query: DrugQueryDto & { search?: string }) {
    // Handle search parameter if provided
    if (query.search) {
      console.log('Search via query param:', query.search);
      const results = await this.drugService.searchDrugs(query.search);
      return { success: true, data: results };
    }
    return this.drugService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get drug by slug' })
  @ApiParam({ name: 'slug', description: 'Drug slug identifier' })
  @ApiResponse({ status: 200, description: 'Return drug details', type: DrugDto })
  @ApiResponse({ status: 404, description: 'Drug not found' })
  async findBySlug(@Param('slug') slug: string) {
    const drug = await this.drugService.findBySlug(slug);
    
    if (!drug) {
      throw new NotFoundException(`Drug with slug '${slug}' not found`);
    }

    return drug;
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'Get related drugs' })
  @ApiParam({ name: 'slug', description: 'Drug slug identifier' })
  @ApiResponse({ status: 200, description: 'Return related drugs' })
  async getRelatedDrugs(@Param('slug') slug: string) {
    return this.drugService.getRelatedDrugs(slug);
  }

  @Get('by-condition/:condition')
  @ApiOperation({ summary: 'Get drugs by condition' })
  @ApiParam({ name: 'condition', description: 'Medical condition' })
  @ApiResponse({ status: 200, description: 'Return drugs for condition' })
  async findByCondition(
    @Param('condition') condition: string,
    @Query() query: DrugQueryDto,
  ) {
    return this.drugService.findByCondition(condition, query);
  }

  @Get('compare/cached')
  @ApiOperation({ summary: 'Get cached drug comparison' })
  @ApiQuery({ name: 'key', description: 'Comparison cache key (sorted drug slugs)', required: true })
  @ApiResponse({ status: 200, description: 'Return cached comparison if available' })
  async getCachedComparison(@Query('key') cacheKey: string) {
    const result = await this.drugService.getCachedComparison(cacheKey);
    return {
      success: !!result,
      data: result,
      cached: !!result
    };
  }

  @Get('compare/:slugs')
  @ApiOperation({ summary: 'Compare multiple drugs' })
  @ApiParam({ name: 'slugs', description: 'Comma-separated drug slugs' })
  @ApiResponse({ status: 200, description: 'Return drug comparison' })
  async compareDrugs(@Param('slugs') slugs: string) {
    const slugArray = slugs.split(',').filter(s => s.trim());
    
    if (slugArray.length < 2) {
      throw new NotFoundException('At least 2 drugs required for comparison');
    }

    return this.drugService.compareDrugs(slugArray);
  }

  @Post('compare/ai')
  @ApiOperation({ summary: 'Compare drugs with AI analysis' })
  @ApiBody({ type: CompareDrugsDto })
  @ApiResponse({ status: 200, description: 'Return AI-powered drug comparison' })
  async compareDrugsWithAI(@Body() compareDto: CompareDrugsDto) {
    try {
      console.log('Compare drugs request:', compareDto);
      
      // Fetch the drugs first
      const drugs = await this.drugService.compareDrugsByIds(compareDto.drugIds);
      console.log(`Found ${drugs.length} drugs for comparison`);
      
      if (drugs.length < 2) {
        throw new NotFoundException('At least 2 valid drugs required for comparison');
      }

      // Generate AI comparison
      console.log('Generating AI analysis...');
      const aiAnalysis = await this.aiService.compareDrugs(drugs);
      console.log('AI analysis generated:', aiAnalysis ? 'success' : 'failed');
      
      // Generate comparison matrix
      const comparisonMatrix = this.generateComparisonMatrix(drugs);
      
      return {
        success: true,
        data: {
          drugs,
          aiAnalysis,
          comparisonMatrix
        }
      };
    } catch (error) {
      console.error('Error in compareDrugsWithAI:', error);
      throw error;
    }
  }

  private generateComparisonMatrix(drugs: any[]) {
    return [
      {
        category: 'Basic Information',
        metrics: [
          {
            metric: 'Generic Name',
            values: drugs.map(drug => ({
              drug: drug.drugName,
              value: drug.genericName || drug.label?.genericName || 'N/A'
            }))
          },
          {
            metric: 'Manufacturer',
            values: drugs.map(drug => ({
              drug: drug.drugName,
              value: drug.manufacturer || drug.labeler || 'N/A'
            }))
          },
          {
            metric: 'Drug Class',
            values: drugs.map(drug => ({
              drug: drug.drugName,
              value: drug.label?.pharmacologicClass || 'N/A'
            }))
          }
        ]
      },
      {
        category: 'Administration',
        metrics: [
          {
            metric: 'Route',
            values: drugs.map(drug => ({
              drug: drug.drugName,
              value: drug.label?.routeOfAdministration || 'N/A'
            }))
          },
          {
            metric: 'Dosage Forms',
            values: drugs.map(drug => ({
              drug: drug.drugName,
              value: drug.label?.dosageFormsAndStrengths || 'N/A'
            }))
          }
        ]
      },
      {
        category: 'Clinical Use',
        metrics: [
          {
            metric: 'Primary Indications',
            values: drugs.map(drug => ({
              drug: drug.drugName,
              value: this.extractFirstSentence(drug.label?.indicationsAndUsage) || 'N/A'
            }))
          },
          {
            metric: 'Key Contraindications',
            values: drugs.map(drug => ({
              drug: drug.drugName,
              value: this.extractFirstSentence(drug.label?.contraindications) || 'N/A'
            }))
          }
        ]
      }
    ];
  }

  private extractFirstSentence(text: string | undefined): string {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/[.!?]/)[0] || '';
  }

  @Post('import')
  @ApiOperation({ summary: 'Import processed drug from worker' })
  @ApiBody({ 
    description: 'Drug import data',
    schema: {
      type: 'object',
      properties: {
        setId: { type: 'string', description: 'Unique drug identifier' },
        drugName: { type: 'string', description: 'Drug name' },
        manufacturer: { type: 'string', description: 'Drug manufacturer' },
        labelData: { type: 'object', description: 'Original FDA label data' },
        processedData: { type: 'object', description: 'Processed drug data' }
      },
      required: ['setId', 'drugName', 'manufacturer', 'labelData']
    }
  })
  @ApiResponse({ status: 201, description: 'Drug imported successfully' })
  @ApiResponse({ status: 400, description: 'Invalid import data' })
  async importDrug(@Body() importData: {
    setId: string;
    drugName: string;
    manufacturer: string;
    labelData: any;
    processedData?: any;
  }) {
    return this.drugService.importDrug(importData);
  }

  @Get('discovery/conditions')
  @ApiOperation({ summary: 'Get drugs by medical condition with AI insights' })
  @ApiQuery({ name: 'condition', required: true, description: 'Medical condition or symptom' })
  @ApiQuery({ name: 'userType', required: false, enum: ['patient', 'provider', 'general'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'AI-enhanced drug suggestions for condition' })
  async findByConditionWithAI(
    @Query('condition') condition: string,
    @Query('userType') userType: 'patient' | 'provider' | 'general' = 'general',
    @Query('limit') limit?: number
  ) {
    if (!condition || condition.length < 2) {
      throw new NotFoundException('Condition must be at least 2 characters');
    }
    return this.drugService.findDrugsByConditionWithAI(condition, userType, limit || 10);
  }

  @Post('discovery/smart-search')
  @ApiOperation({ summary: 'AI-powered intelligent drug search' })
  @ApiBody({
    description: 'Smart search parameters',
    schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Natural language query' },
        userType: { type: 'string', enum: ['patient', 'provider', 'general'] },
        filters: {
          type: 'object',
          properties: {
            therapeuticClass: { type: 'string' },
            manufacturer: { type: 'string' },
            administrationRoute: { type: 'string' },
            patientAge: { type: 'string' },
            conditions: { type: 'array', items: { type: 'string' } }
          }
        },
        limit: { type: 'number' }
      },
      required: ['query']
    }
  })
  @ApiResponse({ status: 200, description: 'AI-enhanced search results' })
  async smartSearch(@Body() searchParams: {
    query: string;
    userType?: 'patient' | 'provider' | 'general';
    filters?: {
      therapeuticClass?: string;
      manufacturer?: string;
      administrationRoute?: string;
      patientAge?: string;
      conditions?: string[];
    };
    limit?: number;
  }) {
    return this.drugService.performSmartSearch(searchParams);
  }

  @Get('discovery/suggestions')
  @ApiOperation({ summary: 'Get AI-powered drug suggestions' })
  @ApiQuery({ name: 'basedOn', required: false, description: 'Drug ID to base suggestions on' })
  @ApiQuery({ name: 'condition', required: false, description: 'Medical condition' })
  @ApiQuery({ name: 'userType', required: false, enum: ['patient', 'provider', 'general'] })
  @ApiResponse({ status: 200, description: 'AI-generated drug suggestions' })
  async getAISuggestions(
    @Query('basedOn') basedOn?: string,
    @Query('condition') condition?: string,
    @Query('userType') userType: 'patient' | 'provider' | 'general' = 'general'
  ) {
    return this.drugService.getAIDrugSuggestions({ basedOn, condition, userType });
  }

  @Get('enhanced/:slug')
  @ApiOperation({ summary: 'Get drug with AI-enhanced content' })
  @ApiParam({ name: 'slug', description: 'Drug slug identifier' })
  @ApiQuery({ name: 'userType', required: false, enum: ['patient', 'provider', 'general'] })
  @ApiQuery({ name: 'includeAI', required: false, type: Boolean, description: 'Include AI-generated content' })
  @ApiResponse({ status: 200, description: 'Drug with AI-enhanced content' })
  async findEnhancedBySlug(
    @Param('slug') slug: string,
    @Query('userType') userType: 'patient' | 'provider' | 'general' = 'general',
    @Query('includeAI') includeAI: boolean = true
  ) {
    return this.drugService.findEnhancedBySlug(slug, userType, includeAI);
  }

  @Post(':id/enhance')
  @ApiOperation({ summary: 'Trigger AI enhancement for a drug' })
  @ApiParam({ name: 'id', description: 'Drug set ID' })
  @ApiResponse({ status: 200, description: 'Enhancement triggered successfully' })
  async triggerEnhancement(@Param('id') id: string) {
    await this.drugService.enhanceDrugContent(id);
    return { success: true, message: `Enhancement triggered for drug ${id}` };
  }
}