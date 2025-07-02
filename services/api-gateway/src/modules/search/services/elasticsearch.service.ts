import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

interface SearchOptions {
  from?: number;
  size?: number;
  filters?: {
    manufacturer?: string;
    therapeutic_categories?: string[];
    status?: string;
  };
  sort?: Array<{ [key: string]: 'asc' | 'desc' }>;
}

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client;
  private readonly indexName = 'pharmaiq_drugs';

  constructor(private configService: ConfigService) {
    const elasticsearchNode = this.configService.get('ELASTICSEARCH_NODE') || 'http://localhost:9200';
    
    this.client = new Client({
      node: elasticsearchNode,
      auth: this.configService.get('ELASTICSEARCH_USERNAME') ? {
        username: this.configService.get('ELASTICSEARCH_USERNAME'),
        password: this.configService.get('ELASTICSEARCH_PASSWORD'),
      } : undefined,
    });
  }

  async onModuleInit() {
    try {
      await this.client.ping();
      this.logger.log('Connected to Elasticsearch');
      await this.ensureIndex();
    } catch (error) {
      this.logger.warn('Elasticsearch not available, falling back to database search', error.message);
    }
  }

  async searchDrugs(query: string, limit: number = 20): Promise<any> {
    try {
      const searchOptions: SearchOptions = {
        from: 0,
        size: limit
      };

      const response = await this.search(query, searchOptions);
      
      // Check if response has the expected structure
      if (!response || !response.hits || !response.hits.hits) {
        this.logger.warn('Elasticsearch response missing expected structure');
        return {
          query,
          total: 0,
          results: [],
          facets: { manufacturers: [], categories: [] }
        };
      }
      
      return {
        query,
        total: (response.hits.total as any)?.value || response.hits.total || 0,
        results: response.hits.hits.map((hit: any) => ({
          id: hit._id,
          name: hit._source.drugName,
          manufacturer: hit._source.manufacturer,
          score: hit._score,
          highlight: hit.highlight ? Object.values(hit.highlight).flat().join('...') : '',
          slug: hit._source.slug
        })),
        facets: {
          manufacturers: response.aggregations?.manufacturers?.buckets?.map((b: any) => b.key) || [],
          categories: response.aggregations?.therapeutic_categories?.buckets?.map((b: any) => b.key) || []
        }
      };
    } catch (error) {
      this.logger.error('Search failed, falling back to simple response:', error);
      return {
        query,
        total: 0,
        results: [],
        facets: { manufacturers: [], categories: [] }
      };
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<any> {
    const { from = 0, size = 20, filters = {}, sort } = options;
    
    const searchQuery: any = {
      index: this.indexName,
      body: {
        from,
        size,
        query: {
          bool: {
            must: [],
            filter: []
          }
        },
        highlight: {
          fields: {
            drugName: {},
            genericName: {},
            'label.indicationsAndUsage': {},
            'label.description': {}
          }
        }
      }
    };

    // Add text search
    if (query && query.trim()) {
      searchQuery.body.query.bool.must.push({
        multi_match: {
          query: query,
          fields: [
            'drugName^3',
            'genericName^2',
            'manufacturer',
            'label.indicationsAndUsage',
            'label.description'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      });
    } else {
      searchQuery.body.query.bool.must.push({
        match_all: {}
      });
    }

    // Add filters
    if (filters.manufacturer) {
      searchQuery.body.query.bool.filter.push({
        term: { 'manufacturer.keyword': filters.manufacturer }
      });
    }

    if (filters.status) {
      searchQuery.body.query.bool.filter.push({
        term: { status: filters.status }
      });
    }

    // Add sorting
    if (sort && sort.length > 0) {
      searchQuery.body.sort = sort;
    } else {
      searchQuery.body.sort = [
        { _score: { order: 'desc' } },
        { 'drugName.keyword': { order: 'asc' } }
      ];
    }

    // Add aggregations
    searchQuery.body.aggs = {
      manufacturers: {
        terms: { 
          field: 'manufacturer.keyword',
          size: 50
        }
      },
      therapeutic_categories: {
        terms: { 
          field: 'therapeuticCategories.keyword',
          size: 100
        }
      }
    };

    const response = await this.client.search(searchQuery);
    return this.formatSearchResponse(response);
  }

  async getSuggestions(query: string): Promise<any> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          size: 0,
          suggest: {
            drug_suggestions: {
              text: query,
              completion: {
                field: 'drugName.suggest',
                size: 10
              }
            }
          }
        }
      });

      const suggestions = (response as any).body.suggest?.drug_suggestions?.[0]?.options?.map(
        (option: any) => option.text
      ) || [];

      return { suggestions };
    } catch (error) {
      this.logger.error('Suggestions failed:', error);
      return {
        suggestions: [
          'aspirin',
          'atorvastatin', 
          'amoxicillin'
        ].filter(term => term.toLowerCase().includes(query.toLowerCase()))
      };
    }
  }

  async indexDrug(drugData: any): Promise<any> {
    try {
      const document = {
        setId: drugData.setId,
        drugName: drugData.drugName,
        genericName: drugData.genericName,
        slug: drugData.slug,
        manufacturer: drugData.manufacturer,
        status: drugData.status,
        therapeuticCategories: drugData.therapeuticCategories || [],
        label: drugData.labelData || {},
        createdAt: drugData.createdAt,
        updatedAt: drugData.updatedAt
      };

      await this.client.index({
        index: this.indexName,
        id: drugData.setId,
        body: document
      });

      this.logger.log(`Indexed drug: ${drugData.drugName}`);
      
      return {
        indexed: true,
        id: drugData.setId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to index drug ${drugData.drugName}:`, error);
      return {
        indexed: false,
        id: drugData.setId,
        error: error.message
      };
    }
  }

  async deleteDrug(drugId: string): Promise<any> {
    try {
      await this.client.delete({
        index: this.indexName,
        id: drugId
      });

      this.logger.log(`Deleted drug from index: ${drugId}`);
      
      return {
        deleted: true,
        id: drugId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to delete drug ${drugId}:`, error);
      return {
        deleted: false,
        id: drugId,
        error: error.message
      };
    }
  }

  async updateIndex(): Promise<any> {
    try {
      this.logger.log('Updating search index...');
      
      // This would typically involve reindexing all drugs
      // For now, just refresh the index
      await this.client.indices.refresh({
        index: this.indexName
      });

      return {
        updated: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Failed to update index:', error);
      return {
        updated: false,
        error: error.message
      };
    }
  }

  private async ensureIndex(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({
        index: this.indexName
      });

      if (!(indexExists as any).body) {
        await this.createIndex();
      }
    } catch (error) {
      this.logger.error('Failed to ensure index:', error);
    }
  }

  private async createIndex(): Promise<void> {
    const mapping = {
      mappings: {
        properties: {
          setId: { type: 'keyword' as const },
          drugName: {
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' },
              suggest: {
                type: 'completion',
                analyzer: 'simple'
              }
            }
          },
          genericName: {
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          slug: { type: 'keyword' },
          manufacturer: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          status: { type: 'keyword' },
          therapeuticCategories: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          label: {
            properties: {
              description: { type: 'text' },
              indicationsAndUsage: { type: 'text' },
              adverseReactions: { type: 'text' },
              contraindications: { type: 'text' },
              warningsAndPrecautions: { type: 'text' },
              dosageAndAdministration: { type: 'text' }
            }
          },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' }
        }
      }
    };

    await this.client.indices.create({
      index: this.indexName,
      body: mapping as any
    });

    this.logger.log(`Created Elasticsearch index: ${this.indexName}`);
  }

  async searchDrugsAdvanced(searchParams: {
    query: string;
    page: number;
    limit: number;
    filters: any;
    sort: string;
  }): Promise<any> {
    const { query, page, limit, filters, sort } = searchParams;
    const from = (page - 1) * limit;

    try {
      const searchQuery: any = {
        index: this.indexName,
        body: {
          from,
          size: limit,
          query: {
            bool: {
              must: [],
              filter: []
            }
          },
          highlight: {
            fields: {
              drugName: {},
              genericName: {},
              'label.indicationsAndUsage': {},
              'label.description': {}
            }
          },
          aggregations: {
            manufacturers: {
              terms: { field: 'manufacturer.keyword', size: 20 }
            },
            therapeutic_categories: {
              terms: { field: 'therapeuticCategories.keyword', size: 20 }
            },
            status_distribution: {
              terms: { field: 'status', size: 10 }
            }
          }
        }
      };

      // Add text search
      if (query) {
        searchQuery.body.query.bool.must.push({
          multi_match: {
            query,
            fields: [
              'drugName^3',
              'genericName^2',
              'manufacturer',
              'label.indicationsAndUsage',
              'label.description'
            ],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchQuery.body.query.bool.must.push({ match_all: {} });
      }

      // Apply filters
      if (filters.manufacturer) {
        searchQuery.body.query.bool.filter.push({
          term: { 'manufacturer.keyword': filters.manufacturer }
        });
      }

      if (filters.indication) {
        searchQuery.body.query.bool.filter.push({
          match: { 'label.indicationsAndUsage': filters.indication }
        });
      }

      if (filters.hasAI !== undefined) {
        // This would need to be implemented based on your AI content structure
        searchQuery.body.query.bool.filter.push({
          exists: { field: 'aiContent' }
        });
      }

      // Add sorting
      if (sort === 'name') {
        searchQuery.body.sort = [{ 'drugName.keyword': 'asc' }];
      } else if (sort === 'date') {
        searchQuery.body.sort = [{ updatedAt: 'desc' }];
      }
      // Default is relevance (score)

      const response = await this.client.search(searchQuery);
      return this.formatAdvancedSearchResponse(response, searchParams);

    } catch (error) {
      this.logger.error('Advanced search failed:', error);
      return {
        query: searchParams.query,
        page,
        limit,
        total: 0,
        results: [],
        filters: {},
        error: error.message
      };
    }
  }

  async performAdvancedSearch(searchParams: {
    query: string;
    page: number;
    limit: number;
    filters: any;
  }): Promise<any> {
    const { query, page, limit, filters } = searchParams;
    const from = (page - 1) * limit;

    try {
      const searchQuery: any = {
        index: this.indexName,
        body: {
          from,
          size: limit,
          query: {
            bool: {
              must: [],
              filter: []
            }
          },
          highlight: {
            fields: {
              drugName: {},
              genericName: {},
              'label.indicationsAndUsage': {}
            }
          }
        }
      };

      // Text search
      if (query) {
        searchQuery.body.query.bool.must.push({
          multi_match: {
            query,
            fields: ['drugName^3', 'genericName^2', 'label.indicationsAndUsage'],
            type: 'best_fields'
          }
        });
      } else {
        searchQuery.body.query.bool.must.push({ match_all: {} });
      }

      // Apply advanced filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          switch (key) {
            case 'drugClass':
              searchQuery.body.query.bool.filter.push({
                term: { 'therapeuticCategories.keyword': value }
              });
              break;
            case 'activeIngredient':
              searchQuery.body.query.bool.filter.push({
                match: { genericName: value }
              });
              break;
            case 'fdaApproved':
              searchQuery.body.query.bool.filter.push({
                term: { status: value ? 'published' : 'draft' }
              });
              break;
            case 'strengthRange':
              const rangeValue = value as any;
              if (rangeValue.min || rangeValue.max) {
                const rangeQuery: any = {};
                if (rangeValue.min) rangeQuery.gte = rangeValue.min;
                if (rangeValue.max) rangeQuery.lte = rangeValue.max;
                searchQuery.body.query.bool.filter.push({
                  range: { strength: rangeQuery }
                });
              }
              break;
          }
        }
      });

      const response = await this.client.search(searchQuery);
      return this.formatAdvancedSearchResponse(response, searchParams);

    } catch (error) {
      this.logger.error('Advanced search failed:', error);
      return {
        query: searchParams.query,
        total: 0,
        results: [],
        error: error.message
      };
    }
  }

  async findSimilarDrugs(drugId: string, limit: number = 10): Promise<any> {
    try {
      // First get the drug to find similar ones
      const drugResponse = await this.client.get({
        index: this.indexName,
        id: drugId
      });

      if (!(drugResponse as any).body.found) {
        return { similar: [], error: 'Drug not found' };
      }

      const drug = (drugResponse as any).body._source;
      
      const similarQuery = {
        index: this.indexName,
        body: {
          size: limit,
          query: {
            bool: {
              must_not: [
                { term: { _id: drugId } }
              ],
              should: [
                {
                  match: {
                    manufacturer: {
                      query: drug.manufacturer,
                      boost: 2
                    }
                  }
                },
                {
                  match: {
                    therapeuticCategories: {
                      query: drug.therapeuticCategories?.join(' ') || '',
                      boost: 3
                    }
                  }
                },
                {
                  match: {
                    'label.indicationsAndUsage': {
                      query: drug.label?.indicationsAndUsage || '',
                      boost: 1.5
                    }
                  }
                }
              ],
              minimum_should_match: 1
            }
          }
        }
      };

      const response = await this.client.search(similarQuery);
      
      return {
        originalDrug: drug,
        similar: (response as any).body.hits.hits.map((hit: any) => ({
          id: hit._id,
          name: hit._source.drugName,
          manufacturer: hit._source.manufacturer,
          similarity_score: hit._score,
          slug: hit._source.slug
        }))
      };

    } catch (error) {
      this.logger.error(`Failed to find similar drugs for ${drugId}:`, error);
      return { similar: [], error: error.message };
    }
  }

  async searchByCondition(condition: string, options: { page: number; limit: number }): Promise<any> {
    const { page, limit } = options;
    const from = (page - 1) * limit;

    try {
      const searchQuery = {
        index: this.indexName,
        body: {
          from,
          size: limit,
          query: {
            bool: {
              should: [
                {
                  match: {
                    'label.indicationsAndUsage': {
                      query: condition,
                      boost: 3
                    }
                  }
                },
                {
                  match: {
                    drugName: {
                      query: condition,
                      boost: 2
                    }
                  }
                },
                {
                  match: {
                    'label.description': {
                      query: condition,
                      boost: 1
                    }
                  }
                }
              ],
              minimum_should_match: 1
            }
          },
          highlight: {
            fields: {
              'label.indicationsAndUsage': {},
              drugName: {},
              'label.description': {}
            }
          },
          sort: [{ _score: 'desc' }]
        }
      };

      const response = await this.client.search(searchQuery);
      
      return {
        condition,
        page,
        limit,
        total: (response as any).body.hits.total.value || 0,
        drugs: (response as any).body.hits.hits.map((hit: any) => ({
          id: hit._id,
          name: hit._source.drugName,
          manufacturer: hit._source.manufacturer,
          slug: hit._source.slug,
          relevance_score: hit._score,
          highlights: hit.highlight,
          indication_summary: this.extractIndicationSummary(hit._source.label?.indicationsAndUsage, condition)
        }))
      };

    } catch (error) {
      this.logger.error(`Failed to search by condition ${condition}:`, error);
      return {
        condition,
        total: 0,
        drugs: [],
        error: error.message
      };
    }
  }

  private formatAdvancedSearchResponse(response: any, searchParams: any): any {
    return {
      query: searchParams.query,
      page: searchParams.page,
      limit: searchParams.limit,
      total: (response as any).body.hits.total.value || 0,
      results: (response as any).body.hits.hits.map((hit: any) => ({
        id: hit._id,
        name: hit._source.drugName,
        genericName: hit._source.genericName,
        manufacturer: hit._source.manufacturer,
        slug: hit._source.slug,
        score: hit._score,
        highlights: hit.highlight
      })),
      facets: {
        manufacturers: (response as any).body.aggregations?.manufacturers?.buckets?.map((b: any) => ({
          name: b.key,
          count: b.doc_count
        })) || [],
        categories: (response as any).body.aggregations?.therapeutic_categories?.buckets?.map((b: any) => ({
          name: b.key,
          count: b.doc_count
        })) || [],
        status: (response as any).body.aggregations?.status_distribution?.buckets?.map((b: any) => ({
          name: b.key,
          count: b.doc_count
        })) || []
      },
      appliedFilters: searchParams.filters
    };
  }

  private extractIndicationSummary(indicationsText: string, condition: string): string {
    if (!indicationsText) return '';
    
    const sentences = indicationsText.split(/[.!?]+/);
    const relevantSentences = sentences.filter(sentence => 
      sentence.toLowerCase().includes(condition.toLowerCase())
    );
    
    return relevantSentences.slice(0, 2).join('. ').trim();
  }

  private formatSearchResponse(response: any): any {
    // Handle both old and new Elasticsearch response formats
    const responseBody = response.body || response;
    
    if (!responseBody || !responseBody.hits) {
      return {
        hits: {
          total: 0,
          hits: []
        },
        aggregations: {}
      };
    }
    
    return {
      hits: {
        total: responseBody.hits.total,
        hits: responseBody.hits.hits.map((hit: any) => ({
          _id: hit._id,
          _score: hit._score,
          _source: hit._source,
          highlight: hit.highlight
        }))
      },
      aggregations: responseBody.aggregations || {}
    };
  }
}