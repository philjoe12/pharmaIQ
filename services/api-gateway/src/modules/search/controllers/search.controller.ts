import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ElasticsearchService } from '../services/elasticsearch.service';
import { SearchAggregatorService } from '../services/search-aggregator.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly searchAggregatorService: SearchAggregatorService,
  ) {}

  @Get('drugs')
  @ApiOperation({ summary: 'Search drugs with advanced filtering' })
  @ApiResponse({ status: 200, description: 'Search results returned successfully' })
  @ApiQuery({ name: 'q', description: 'Search query', required: false })
  @ApiQuery({ name: 'page', description: 'Page number', required: false })
  @ApiQuery({ name: 'limit', description: 'Number of results per page', required: false })
  @ApiQuery({ name: 'manufacturer', description: 'Filter by manufacturer', required: false })
  @ApiQuery({ name: 'indication', description: 'Filter by indication', required: false })
  @ApiQuery({ name: 'sort', description: 'Sort by: relevance, name, date', required: false })
  @ApiQuery({ name: 'hasAI', description: 'Filter drugs with AI-enhanced content', required: false })
  async searchDrugs(
    @Query('q') query?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('manufacturer') manufacturer?: string,
    @Query('indication') indication?: string,
    @Query('sort') sort: string = 'relevance',
    @Query('hasAI') hasAI?: boolean
  ) {
    const searchParams = {
      query: query || '',
      page,
      limit,
      filters: {
        manufacturer,
        indication,
        hasAI
      },
      sort
    };
    
    return await this.elasticsearchService.searchDrugsAdvanced(searchParams);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiResponse({ status: 200, description: 'Suggestions returned successfully' })
  @ApiQuery({ name: 'q', description: 'Partial search term' })
  async getSuggestions(@Query('q') query: string) {
    return await this.elasticsearchService.getSuggestions(query);
  }

  @Get('filters')
  @ApiOperation({ summary: 'Get search filters and facets' })
  @ApiResponse({ status: 200, description: 'Filters returned successfully' })
  async getFilters() {
    return await this.searchAggregatorService.getAvailableFilters();
  }

  @Post('index')
  @ApiOperation({ summary: 'Index drug data for search' })
  @ApiResponse({ status: 201, description: 'Drug indexed successfully' })
  async indexDrug(@Body() drugData: any) {
    return await this.elasticsearchService.indexDrug(drugData);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get search analytics' })
  @ApiResponse({ status: 200, description: 'Analytics data returned successfully' })
  async getAnalytics() {
    return await this.searchAggregatorService.getSearchAnalytics();
  }

  @Get('advanced')
  @ApiOperation({ summary: 'Advanced multi-criteria search' })
  @ApiResponse({ status: 200, description: 'Advanced search results returned successfully' })
  @ApiQuery({ name: 'query', description: 'Text search query', required: false })
  @ApiQuery({ name: 'drugClass', description: 'Filter by drug class', required: false })
  @ApiQuery({ name: 'activeIngredient', description: 'Filter by active ingredient', required: false })
  @ApiQuery({ name: 'routeOfAdmin', description: 'Route of administration', required: false })
  @ApiQuery({ name: 'strengthMin', description: 'Minimum strength', required: false })
  @ApiQuery({ name: 'strengthMax', description: 'Maximum strength', required: false })
  @ApiQuery({ name: 'fdaApproved', description: 'FDA approval status', required: false })
  async advancedSearch(
    @Query('query') query?: string,
    @Query('drugClass') drugClass?: string,
    @Query('activeIngredient') activeIngredient?: string,
    @Query('routeOfAdmin') routeOfAdmin?: string,
    @Query('strengthMin') strengthMin?: number,
    @Query('strengthMax') strengthMax?: number,
    @Query('fdaApproved') fdaApproved?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    const searchParams = {
      query: query || '',
      page,
      limit,
      filters: {
        drugClass,
        activeIngredient,
        routeOfAdmin,
        strengthRange: { min: strengthMin, max: strengthMax },
        fdaApproved
      }
    };
    
    return await this.elasticsearchService.performAdvancedSearch(searchParams);
  }

  @Get('similar/:drugId')
  @ApiOperation({ summary: 'Find similar drugs' })
  @ApiResponse({ status: 200, description: 'Similar drugs found successfully' })
  async findSimilarDrugs(
    @Query('drugId') drugId: string,
    @Query('limit') limit: number = 10
  ) {
    return await this.elasticsearchService.findSimilarDrugs(drugId, limit);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular search queries' })
  @ApiResponse({ status: 200, description: 'Popular searches returned successfully' })
  @ApiQuery({ name: 'limit', description: 'Number of popular searches to return', required: false })
  async getPopularSearches(@Query('limit') limit: number = 10) {
    return await this.searchAggregatorService.getPopularSearches(limit);
  }

  @Get('conditions/:condition')
  @ApiOperation({ summary: 'Search drugs by medical condition' })
  @ApiResponse({ status: 200, description: 'Drugs for condition returned successfully' })
  async searchByCondition(
    @Query('condition') condition: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    return await this.elasticsearchService.searchByCondition(condition, { page, limit });
  }
}