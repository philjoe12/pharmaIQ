import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DrugRepository } from '../../../database/repositories/drug.repository';
import { ElasticsearchService } from './elasticsearch.service';

@Injectable()
export class SearchAggregatorService {
  constructor(
    private readonly drugRepository: DrugRepository,
    private readonly elasticsearchService: ElasticsearchService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAvailableFilters(): Promise<any> {
    const cacheKey = 'search:filters';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try to get aggregations from Elasticsearch first
      const esResponse = await this.elasticsearchService.search('', {
        size: 0,
        filters: {}
      });

      if (esResponse.aggregations) {
        const filters = {
          manufacturers: esResponse.aggregations.manufacturers?.buckets?.map((bucket: any) => ({
            name: bucket.key,
            count: bucket.doc_count
          })) || [],
          therapeuticCategories: esResponse.aggregations.therapeutic_categories?.buckets?.map((bucket: any) => ({
            name: bucket.key,
            count: bucket.doc_count
          })) || [],
          status: esResponse.aggregations.status_distribution?.buckets?.map((bucket: any) => ({
            name: bucket.key,
            count: bucket.doc_count
          })) || []
        };

        await this.cacheManager.set(cacheKey, filters, 600);
        return filters;
      }
    } catch (error) {
      console.log('Elasticsearch aggregation failed, falling back to database');
    }

    // Fallback to database aggregation
    const manufacturers = await this.drugRepository
      .createQueryBuilder('drug')
      .select('drug.manufacturer', 'manufacturer')
      .addSelect('COUNT(*)', 'count')
      .groupBy('drug.manufacturer')
      .orderBy('count', 'DESC')
      .getRawMany();

    const filters = {
      manufacturers: manufacturers.map(m => ({ name: m.manufacturer, count: parseInt(m.count) })),
      therapeuticCategories: [],
      status: []
    };

    await this.cacheManager.set(cacheKey, filters, 600);
    return filters;
  }

  async getSearchAnalytics(): Promise<any> {
    const cacheKey = 'search:analytics';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // TODO: Implement real analytics from a search logs table
    const analytics = {
      totalSearches: 15420,
      uniqueQueries: 3245,
      topQueries: [
        { query: 'aspirin', count: 234 },
        { query: 'blood pressure', count: 198 },
        { query: 'diabetes medication', count: 176 }
      ],
      noResultsQueries: [
        { query: 'xyz drug', count: 12 },
        { query: 'miracle cure', count: 8 }
      ],
      averageResultsPerQuery: 8.5,
      clickThroughRate: 0.65,
      timestamp: new Date().toISOString()
    };

    await this.cacheManager.set(cacheKey, analytics, 3600); // Cache for 1 hour
    return analytics;
  }

  async aggregateSearchResults(results: any[]): Promise<any> {
    if (!results || results.length === 0) {
      return {
        total: 0,
        aggregated: true,
        categories: { byManufacturer: {}, byCategory: {}, byType: {} },
        topResults: []
      };
    }

    const categories = this.categorizeResults(results);
    
    return {
      total: results.length,
      aggregated: true,
      categories,
      topResults: results.slice(0, 10),
      summary: {
        manufacturerCount: Object.keys(categories.byManufacturer).length,
        categoryCount: Object.keys(categories.byCategory).length,
        averageScore: results.reduce((sum, r) => sum + (r._score || 0), 0) / results.length
      }
    };
  }

  private categorizeResults(results: any[]): any {
    const byManufacturer: { [key: string]: number } = {};
    const byCategory: { [key: string]: number } = {};
    const byType: { [key: string]: number } = {};

    results.forEach(result => {
      const source = result._source || result;
      
      if (source.manufacturer) {
        byManufacturer[source.manufacturer] = (byManufacturer[source.manufacturer] || 0) + 1;
      }

      if (source.therapeuticCategories) {
        source.therapeuticCategories.forEach((category: string) => {
          byCategory[category] = (byCategory[category] || 0) + 1;
        });
      }

      if (source.genericName) {
        const type = source.genericName ? 'Generic' : 'Brand';
        byType[type] = (byType[type] || 0) + 1;
      }
    });

    return { byManufacturer, byCategory, byType };
  }

  async getPopularSearches(limit: number = 10): Promise<any> {
    const cacheKey = `search:popular:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    // TODO: Implement real popular searches from search logs
    const popularSearches = {
      searches: [
        'aspirin',
        'ibuprofen',
        'acetaminophen',
        'blood pressure medication',
        'diabetes drugs',
        'antibiotics',
        'pain relief',
        'heart medication',
        'cholesterol',
        'allergy medicine'
      ].slice(0, limit),
      timestamp: new Date().toISOString()
    };

    await this.cacheManager.set(cacheKey, popularSearches, 1800); // Cache for 30 minutes
    return popularSearches;
  }

  async performHybridSearch(query: string, options: any = {}): Promise<any> {
    const { page = 1, limit = 20, filters = {} } = options;

    try {
      // Try Elasticsearch first
      const esResults = await this.elasticsearchService.searchDrugs(query, limit);
      if (esResults.total > 0) {
        return {
          source: 'elasticsearch',
          ...esResults,
          aggregations: await this.aggregateSearchResults(esResults.results)
        };
      }
    } catch (error) {
      console.log('Elasticsearch search failed, falling back to database');
    }

    // Fallback to database search
    const dbResults = await this.drugRepository.searchByName(query, limit);
    const formattedResults = dbResults.map(drug => ({
      id: drug.setId,
      name: drug.drugName,
      manufacturer: drug.manufacturer,
      slug: drug.slug,
      score: 1.0 // Default score for database results
    }));

    return {
      source: 'database',
      query,
      total: formattedResults.length,
      results: formattedResults,
      facets: { manufacturers: [], categories: [] },
      aggregations: await this.aggregateSearchResults(formattedResults)
    };
  }
}