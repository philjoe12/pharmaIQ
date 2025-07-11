import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DrugQueryDto } from '../dto/drug-query.dto';
import { DrugStatus, PaginatedResponse, DrugLabel } from '../../../shared-types';
import { DrugRepository } from '../../../database/repositories/drug.repository';
import { DrugEntity } from '../../../database/entities/drug.entity';
import { SEOMetadataEntity } from '../../../database/entities/seo-metadata.entity';
import { SearchAggregatorService } from '../../search/services/search-aggregator.service';
import { ElasticsearchService } from '../../search/services/elasticsearch.service';
import { DrugEventsPublisher } from '../../events/publishers/drug-events.publisher';
import { AICacheService } from '../../../common/services/ai-cache.service';
import { EmbeddingService } from '../../ai/services/embedding.service';
import { AIService } from '../../ai/services/ai.service';
import * as fs from 'fs';
import * as path from 'path';

// Helper to convert DrugLabel to DrugDto format
export function convertDrugLabelToDto(drug: DrugLabel): any {
  return {
    id: drug.setId,
    brandName: drug.drugName,
    genericName: drug.label.genericName || '',
    manufacturer: drug.labeler,
    slug: drug.slug,
    status: DrugStatus.PUBLISHED, // Default status since it's not in the JSON
    therapeuticCategories: [], // Would need to extract from content
    conditions: [], // Would need to extract from indications
    createdAt: new Date(),
    updatedAt: new Date(),
    content: {
      title: drug.label.title,
      description: drug.label.description,
      indicationsAndUsage: drug.label.indicationsAndUsage,
      dosageAndAdministration: drug.label.dosageAndAdministration,
      warningsAndPrecautions: drug.label.warningsAndPrecautions,
      adverseReactions: drug.label.adverseReactions,
      contraindications: drug.label.contraindications
    },
    label: drug.label
  };
}

@Injectable()
export class DrugService {
  private drugs: DrugLabel[] = [];

  constructor(
    private readonly drugRepository: DrugRepository,
    private readonly searchAggregator: SearchAggregatorService,
    private readonly elasticsearchService: ElasticsearchService,
    private readonly drugEventsPublisher: DrugEventsPublisher,
    private readonly aiCacheService: AICacheService,
    private readonly embeddingService: EmbeddingService,
    @Inject(forwardRef(() => AIService)) private readonly aiService: AIService,
    @InjectQueue('ai-enhancement') private aiQueue: Queue,
    @InjectQueue('label-processing') private processingQueue: Queue,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.loadDrugData();
  }

  private loadDrugData() {
    try {
      // Use the single Labels.json file location
      const labelsPath = '/app/data/Labels.json';
      
      if (!fs.existsSync(labelsPath)) {
        console.warn(`Labels.json not found at ${labelsPath}`);
        this.drugs = [];
        return;
      }
      
      const data = fs.readFileSync(labelsPath, 'utf8');
      this.drugs = JSON.parse(data);
      console.log(`Loaded ${this.drugs.length} drugs from Labels.json at ${labelsPath}`);
    } catch (error) {
      console.error('Error loading drug data:', error);
      this.drugs = [];
    }
  }

  async findAll(query: DrugQueryDto): Promise<PaginatedResponse<any>> {
    const cacheKey = `drugs:${JSON.stringify(query)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as PaginatedResponse<any>;
    }

    const { page = 1, limit = 20, name, manufacturer } = query;
    
    // Build query using repository
    let queryBuilder = this.drugRepository.createQueryBuilder('drug')
      .leftJoinAndSelect('drug.aiContent', 'aiContent')
      .leftJoinAndSelect('drug.seoMetadata', 'seoMetadata')
      .where('drug.status = :status', { status: DrugStatus.PUBLISHED });

    if (name) {
      queryBuilder = queryBuilder.andWhere(
        '(drug.drugName ILIKE :name OR drug.genericName ILIKE :name)',
        { name: `%${name}%` }
      );
    }

    if (manufacturer) {
      queryBuilder = queryBuilder.andWhere(
        'drug.manufacturer ILIKE :manufacturer',
        { manufacturer: `%${manufacturer}%` }
      );
    }

    const total = await queryBuilder.getCount();
    const offset = (page - 1) * limit;
    const drugs = await queryBuilder
      .skip(offset)
      .take(limit)
      .getMany();

    const totalPages = Math.ceil(total / limit);

    // Convert to DrugLabel format for compatibility
    const data = drugs.map(drug => this.entityToLabel(drug));

    const result = {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, result, 300);
    return result;
  }

  private entityToLabel(drug: DrugEntity): DrugLabel {
    return {
      setId: drug.setId,
      drugName: drug.drugName,
      labeler: drug.manufacturer,
      slug: drug.slug,
      label: drug.labelData || {},
      ...drug.labelData
    };
  }

  async findById(id: string): Promise<DrugLabel> {
    const cacheKey = `drug:${id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as DrugLabel;
    }

    const drug = await this.drugRepository.findBySetId(id);
    if (!drug) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }

    const result = this.entityToLabel(drug);
    await this.cacheManager.set(cacheKey, result, 600); // Cache for 10 minutes
    return result;
  }

  async findBySlug(slug: string): Promise<DrugLabel> {
    const cacheKey = `drug:slug:${slug}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as DrugLabel;
    }

    const drug = await this.drugRepository.findBySlugWithRelations(slug);
    if (!drug) {
      throw new NotFoundException(`Drug with slug ${slug} not found`);
    }

    const result = this.entityToLabel(drug);
    await this.cacheManager.set(cacheKey, result, 600);
    return result;
  }

  async getStats(): Promise<Record<string, number>> {
    const cacheKey = 'drug:stats';
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as Record<string, number>;
    }

    const total = await this.drugRepository.count();
    const published = await this.drugRepository.count({
      where: { status: DrugStatus.PUBLISHED }
    });
    const processing = await this.drugRepository.count({
      where: { status: DrugStatus.PROCESSING }
    });

    const stats = { total, published, processing };
    await this.cacheManager.set(cacheKey, stats, 300);
    return stats;
  }

  async getRelatedDrugs(slug: string): Promise<DrugLabel[]> {
    const drug = await this.findBySlug(slug);
    const cacheKey = `related:${slug}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as DrugLabel[];
    }

    // Find drugs by same manufacturer
    const relatedDrugs = await this.drugRepository.findByManufacturer(drug.labeler);
    const filtered = relatedDrugs
      .filter(d => d.slug !== slug)
      .slice(0, 5)
      .map(d => this.entityToLabel(d));

    await this.cacheManager.set(cacheKey, filtered, 600);
    return filtered;
  }

  async compareDrugs(slugs: string[]): Promise<DrugLabel[]> {
    const cacheKey = `compare:${slugs.sort().join(',')}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as DrugLabel[];
    }

    const drugs = await Promise.all(slugs.map(slug => this.findBySlug(slug)));
    await this.cacheManager.set(cacheKey, drugs, 600);
    return drugs;
  }

  async compareDrugsByIds(ids: string[]): Promise<DrugLabel[]> {
    const cacheKey = `compare-ids:${ids.sort().join(',')}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as DrugLabel[];
    }

    const drugs = await Promise.all(ids.map(id => this.findById(id)));
    await this.cacheManager.set(cacheKey, drugs, 600);
    return drugs;
  }

  async cacheComparison(cacheKey: string, comparisonData: any): Promise<void> {
    // Cache for 1 hour (3600 seconds) to allow for session persistence
    await this.cacheManager.set(`comparison:${cacheKey}`, comparisonData, 3600);
    console.log(`Cached comparison for key: comparison:${cacheKey}`);
  }

  async getCachedComparison(cacheKey: string): Promise<any | null> {
    // First check Redis cache
    const cached = await this.cacheManager.get(`comparison:${cacheKey}`);
    if (cached) {
      console.log('Found comparison in Redis cache');
      return cached;
    }
    
    // Then check AI cache service
    const comparisonResult = await this.aiCacheService.getComparisonResult(cacheKey);
    if (comparisonResult) {
      // Track this as a popular comparison
      await this.aiCacheService.trackPopularComparison(cacheKey);
      return comparisonResult;
    }
    
    // Check if we have cached drug data at least
    const slugs = cacheKey.split(',');
    if (slugs.length >= 2) {
      const drugs = await this.compareDrugs(slugs);
      if (drugs && drugs.length >= 2) {
        // Return basic comparison data
        return {
          drugs,
          comparisonMatrix: this.generateBasicComparisonMatrix(drugs),
          aiAnalysis: null
        };
      }
    }
    
    return null;
  }

  private generateBasicComparisonMatrix(drugs: DrugLabel[]): any[] {
    return [
      {
        category: 'Basic Information',
        metrics: [
          {
            metric: 'Generic Name',
            values: drugs.map(drug => ({
              drug: drug.drugName,
              value: drug.label?.genericName || 'N/A'
            }))
          },
          {
            metric: 'Manufacturer',
            values: drugs.map(drug => ({
              drug: drug.drugName,
              value: drug.labeler || 'N/A'
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

  async searchDrugs(searchTerm: string): Promise<DrugLabel[]> {
    const cacheKey = `search:${searchTerm.toLowerCase()}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached as DrugLabel[];
    }

    try {
      // Try semantic search first for natural language queries
      if (searchTerm.split(' ').length > 1) {
        try {
          const semanticResults = await this.embeddingService.semanticSearch(searchTerm, {
            contentType: 'summary',
            limit: 20,
            threshold: 0.25
          });
          
          if (semanticResults.length > 0) {
            const results = semanticResults.map(result => this.entityToLabel(result.drug));
            await this.cacheManager.set(cacheKey, results, 300);
            return results;
          }
        } catch (error) {
          console.error('Semantic search failed, continuing with other methods:', error);
        }
      }

      // Use Elasticsearch for better search
      const esResults = await this.searchAggregator.performHybridSearch(searchTerm, { limit: 20 });
      
      if (esResults.results?.length > 0) {
        // Convert Elasticsearch results back to DrugLabel format
        const results = await Promise.all(
          esResults.results.map(async (result: any) => {
            const drug = await this.drugRepository.findBySlugWithRelations(result.slug);
            return drug ? this.entityToLabel(drug) : null;
          })
        );
        
        const filteredResults = results.filter(r => r !== null) as DrugLabel[];
        await this.cacheManager.set(cacheKey, filteredResults, 300);
        return filteredResults;
      }
    } catch (error) {
      console.error('Elasticsearch search failed, falling back to database:', error);
    }

    // Fallback to database search
    const drugs = await this.drugRepository.searchByName(searchTerm, 20);
    const results = drugs.map(d => this.entityToLabel(d));
    
    await this.cacheManager.set(cacheKey, results, 300);
    return results;
  }

  async findByCondition(condition: string, query: DrugQueryDto): Promise<PaginatedResponse<DrugLabel>> {
    const { page = 1, limit = 20 } = query;
    
    // Search for drugs that mention this condition in their indications
    const term = condition.toLowerCase();
    const filteredDrugs = this.drugs.filter(drug => {
      const indications = drug.label.indicationsAndUsage?.toLowerCase() || '';
      return indications.includes(term);
    });

    const total = filteredDrugs.length;
    const offset = (page - 1) * limit;
    const data = filteredDrugs.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  async updateStatus(id: string, status: DrugStatus): Promise<any> {
    const drug = await this.drugRepository.findBySetId(id);
    if (!drug) {
      throw new NotFoundException(`Drug with ID ${id} not found`);
    }
    
    const updated = await this.drugRepository.updateDrug(drug.id, { status });
    
    // Emit event for cache invalidation
    await this.drugEventsPublisher.publishDrugUpdated(id, { status, slug: drug.slug });
    
    // Clear traditional cache
    await this.cacheManager.del(`drug:${id}`);
    await this.cacheManager.del(`drug:slug:${drug.slug}`);
    await this.cacheManager.del('drug:stats');
    
    return this.entityToLabel(updated);
  }

  async enhanceDrugContent(drugId: string): Promise<void> {
    const drug = await this.drugRepository.findBySetId(drugId);
    if (!drug) {
      throw new NotFoundException(`Drug with ID ${drugId} not found`);
    }

    const drugData = this.entityToLabel(drug);

    // Queue AI enhancement jobs
    await Promise.all([
      this.aiQueue.add('enhance-content', { drugData, contentType: 'seo-title' }),
      this.aiQueue.add('enhance-content', { drugData, contentType: 'meta-description' }),
      this.aiQueue.add('enhance-content', { drugData, contentType: 'faq' }),
      this.aiQueue.add('enhance-content', { drugData, contentType: 'provider-explanation' }),
      this.aiQueue.add('generate-embeddings', { drugData }),
    ]);
  }

  async importDrug(importData: {
    setId: string;
    drugName: string;
    manufacturer: string;
    labelData: any;
    processedData?: any;
  }): Promise<DrugEntity> {
    const { setId, drugName, manufacturer, labelData, processedData } = importData;
    
    // Check if drug already exists
    const existing = await this.drugRepository.findBySetId(setId);
    if (existing) {
      console.log(`Drug ${drugName} already exists, updating...`);
      
      // Update existing drug with new data
      const updated = await this.drugRepository.updateDrug(existing.id, {
        labelData,
        processedData: processedData || null,
        updatedAt: new Date()
      });

      // Emit event for cache invalidation
      await this.drugEventsPublisher.publishDrugUpdated(setId, { 
        labelData, 
        processedData,
        slug: existing.slug 
      });

      // Clear traditional cache
      await this.cacheManager.del(`drug:${setId}`);
      await this.cacheManager.del(`drug:slug:${existing.slug}`);
      
      return updated;
    }

    // Create new drug entity
    const drugData = {
      setId,
      drugName,
      genericName: processedData?.genericName || labelData.label?.genericName || null,
      slug: this.generateSlug(drugName),
      manufacturer,
      status: DrugStatus.PROCESSING, // Start as processing, will be published after AI enhancement
      labelData,
      processedData: processedData || null,
    };

    const drug = await this.drugRepository.createDrug(drugData);
    console.log(`✅ Imported drug: ${drug.drugName} (${drug.setId})`);

    // Emit import event
    await this.drugEventsPublisher.publishDrugImported(drug.setId, labelData);

    // Index in Elasticsearch
    try {
      await this.elasticsearchService.indexDrug(drug);
      console.log(`📝 Indexed drug in Elasticsearch: ${drug.drugName}`);
    } catch (error) {
      console.error(`Failed to index drug in Elasticsearch: ${drug.drugName}`, error);
    }

    // Queue for AI enhancement
    await this.enhanceDrugContent(drug.setId);

    return drug;
  }

  async importLabelsFromFile(): Promise<void> {
    try {
      // Use the single Labels.json file location
      const labelsPath = '/app/data/Labels.json';
      
      if (!fs.existsSync(labelsPath)) {
        throw new Error(`Labels.json not found at ${labelsPath}`);
      }
      
      const data = fs.readFileSync(labelsPath, 'utf8');
      const labels: DrugLabel[] = JSON.parse(data);

      console.log(`Importing ${labels.length} drugs from Labels.json at ${labelsPath}...`);

      for (const label of labels) {
        await this.importDrug({
          setId: label.setId,
          drugName: label.drugName,
          manufacturer: label.labeler,
          labelData: label
        });
      }

      console.log('Import completed successfully');
    } catch (error) {
      console.error('Error importing labels:', error);
      throw error;
    }
  }

  private generateSlug(drugName: string): string {
    return drugName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // AI-Enhanced Discovery Methods

  async findDrugsByConditionWithAI(
    condition: string, 
    userType: 'patient' | 'provider' | 'general', 
    limit: number = 10
  ): Promise<any> {
    const cacheKey = `ai-condition:${condition}:${userType}:${limit}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Use Elasticsearch for better condition-based search
      let baseDrugs: DrugEntity[] = [];
      
      try {
        const esResults = await this.searchAggregator.performHybridSearch(condition, { limit: limit * 2 });
        if (esResults.results?.length > 0) {
          // Get full drug entities from Elasticsearch results
          baseDrugs = await Promise.all(
            esResults.results.map(async (result: any) => {
              const drug = await this.drugRepository
                .createQueryBuilder('drug')
                .leftJoinAndSelect('drug.aiContent', 'aiContent')
                .where('drug.slug = :slug', { slug: result.slug })
                .andWhere('drug.status = :status', { status: 'published' })
                .getOne();
              return drug;
            })
          ).then(drugs => drugs.filter(d => d !== null) as DrugEntity[]);
        }
      } catch (esError) {
        console.error('Elasticsearch condition search failed, falling back to database:', esError);
      }

      // Fallback to database search if Elasticsearch fails or returns no results
      if (baseDrugs.length === 0) {
        baseDrugs = await this.drugRepository
          .createQueryBuilder('drug')
          .leftJoinAndSelect('drug.aiContent', 'aiContent')
          .where('drug.labelData::text ILIKE :condition', { condition: `%${condition}%` })
          .orWhere('drug.drugName ILIKE :condition', { condition: `%${condition}%` })
          .andWhere('drug.status = :status', { status: 'published' })
          .limit(limit * 2) // Get more for AI filtering
          .getMany();
      }

      // Enhance with AI insights
      const enhancedResults = await Promise.all(
        baseDrugs.slice(0, limit).map(async (drug) => {
          const drugLabel = this.entityToLabel(drug);
          return {
            ...drugLabel,
            aiInsights: await this.generateConditionInsights(drugLabel, condition, userType),
            relevanceScore: this.calculateRelevanceScore(drugLabel, condition),
          };
        })
      );

      // Sort by relevance score
      enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      const result = {
        condition,
        userType,
        totalFound: baseDrugs.length,
        drugs: enhancedResults,
        aiSummary: await this.generateConditionSummary(condition, enhancedResults, userType),
      };

      await this.cacheManager.set(cacheKey, result, 600);
      return result;
    } catch (error) {
      console.error('Error in AI condition search:', error);
      // Fallback to basic search
      return this.findByCondition(condition, { page: 1, limit });
    }
  }

  async performSmartSearch(searchParams: {
    query: string;
    userType?: 'patient' | 'provider' | 'general';
    filters?: any;
    limit?: number;
  }): Promise<any> {
    const { query, userType = 'general', filters = {}, limit = 20 } = searchParams;
    
    const cacheKey = `smart-search:${JSON.stringify(searchParams)}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Parse natural language query using AI
      const searchIntent = await this.parseSearchIntent(query, userType);
      console.log('Parsed search intent:', searchIntent);
      
      // For natural language queries (especially condition searches), prioritize semantic search
      let results: DrugEntity[] = [];
      let semanticResults: any[] = [];
      
      // Always try semantic search first for natural language queries
      if (searchIntent.category === 'condition' || query.split(' ').length > 2) {
        try {
          console.log('Performing semantic search for query:', query);
          
          // Use embedding service for semantic search
          semanticResults = await this.embeddingService.semanticSearch(query, {
            contentType: 'summary',
            limit: limit,
            threshold: 0.2  // Lower threshold for better recall
          });
          
          console.log(`Semantic search returned ${semanticResults.length} results`);
          
          if (semanticResults.length > 0) {
            // Convert semantic search results to drug entities
            results = semanticResults.map(result => result.drug).filter(drug => drug !== null);
          }
        } catch (embeddingError) {
          console.error('Semantic search failed:', embeddingError);
        }
      }
      
      // If semantic search didn't return enough results, try Elasticsearch
      if (results.length < limit / 2) {
        try {
          const esResults = await this.searchAggregator.performHybridSearch(query, { 
            limit: limit * 2,
            filters 
          });
          
          if (esResults.results?.length > 0) {
            // Convert ES results to drug entities
            const esEntities = await Promise.all(
              esResults.results.map(async (result: any) => {
                const drug = await this.drugRepository
                  .createQueryBuilder('drug')
                  .leftJoinAndSelect('drug.aiContent', 'aiContent')
                  .where('drug.slug = :slug', { slug: result.slug })
                  .andWhere('drug.status = :status', { status: 'published' })
                  .getOne();
                return drug;
              })
            ).then(drugs => drugs.filter(d => d !== null) as DrugEntity[]);
            
            // Merge with semantic results, avoiding duplicates
            const existingIds = new Set(results.map(r => r.id));
            esEntities.forEach(drug => {
              if (!existingIds.has(drug.id)) {
                results.push(drug);
              }
            });
          }
        } catch (esError) {
          console.error('Elasticsearch smart search failed:', esError);
        }
      }

      // Fallback to database search if Elasticsearch fails
      if (results.length === 0) {
        let queryBuilder = this.drugRepository
          .createQueryBuilder('drug')
          .leftJoinAndSelect('drug.aiContent', 'aiContent')
          .where('drug.status = :status', { status: 'published' });

        // Apply AI-interpreted filters
        if (searchIntent.drugName) {
          queryBuilder = queryBuilder.andWhere('drug.drugName ILIKE :drugName', { 
            drugName: `%${searchIntent.drugName}%` 
          });
        }

        if (searchIntent.condition) {
          queryBuilder = queryBuilder.andWhere('drug.labelData::text ILIKE :condition', { 
            condition: `%${searchIntent.condition}%` 
          });
        }

        if (searchIntent.manufacturer) {
          queryBuilder = queryBuilder.andWhere('drug.manufacturer ILIKE :manufacturer', { 
            manufacturer: `%${searchIntent.manufacturer}%` 
          });
        }

        // Apply user filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value && key !== 'conditions') {
            queryBuilder = queryBuilder.andWhere(`drug.${key} ILIKE :${key}`, { 
              [key]: `%${value}%` 
            });
          }
        });

        results = await queryBuilder.limit(limit).getMany();
      }

      // Enhance results with AI scoring
      const enhancedResults = await Promise.all(
        results.map(async (drug) => {
          const drugLabel = this.entityToLabel(drug);
          return {
            ...drugLabel,
            relevanceScore: await this.calculateAIRelevanceScore(drugLabel, searchParams),
            aiHighlights: await this.generateSearchHighlights(drugLabel, query, userType),
          };
        })
      );

      // Sort by AI relevance score
      enhancedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      const result = {
        query,
        searchIntent,
        totalFound: results.length,
        drugs: enhancedResults,
        suggestions: await this.generateSearchSuggestions(query, results, userType),
      };

      await this.cacheManager.set(cacheKey, result, 300);
      return result;
    } catch (error) {
      console.error('Error in smart search:', error);
      // Fallback to regular search
      return this.searchDrugs(query);
    }
  }

  async getAIDrugSuggestions(params: {
    basedOn?: string;
    condition?: string;
    userType: 'patient' | 'provider' | 'general';
  }): Promise<any> {
    const { basedOn, condition, userType } = params;
    const cacheKey = `ai-suggestions:${basedOn || 'none'}:${condition || 'none'}:${userType}`;
    
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let suggestions = [];

      if (basedOn) {
        // Get suggestions based on a specific drug
        const baseDrug = await this.findById(basedOn);
        suggestions = await this.generateRelatedDrugSuggestions(baseDrug, userType);
      } else if (condition) {
        // Get suggestions for a condition
        const conditionResults = await this.findDrugsByConditionWithAI(condition, userType, 5);
        suggestions = conditionResults.drugs;
      } else {
        // Get general trending/popular suggestions
        suggestions = await this.getPopularDrugs(userType);
      }

      const result = {
        basedOn,
        condition,
        userType,
        suggestions,
        aiReasoning: await this.generateSuggestionReasoning(params, suggestions),
      };

      await this.cacheManager.set(cacheKey, result, 600);
      return result;
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      return {
        suggestions: [],
        error: 'Unable to generate suggestions at this time',
      };
    }
  }

  async findEnhancedBySlug(
    slug: string,
    userType: 'patient' | 'provider' | 'general',
    includeAI: boolean = true
  ): Promise<any> {
    const cacheKey = `enhanced:${slug}:${userType}:${includeAI}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Get base drug
      const drug = await this.findBySlug(slug);
      
      if (!includeAI) {
        return drug;
      }

      // Generate AI-enhanced content based on user type
      const enhancedContent = await this.generateEnhancedContent(drug, userType);
      
      const result = {
        ...drug,
        enhancedContent,
        userType,
        relatedDrugs: await this.getRelatedDrugs(slug),
        aiSuggestions: await this.getAIDrugSuggestions({ basedOn: drug.setId, userType }),
      };

      await this.cacheManager.set(cacheKey, result, 600);
      return result;
    } catch (error) {
      console.error('Error enhancing drug content:', error);
      // Fallback to basic drug info
      return this.findBySlug(slug);
    }
  }

  async getSEOMetadataBySlug(slug: string): Promise<SEOMetadataEntity | null> {
    try {
      const drug = await this.drugRepository.findBySlugWithRelations(slug);
      if (!drug) {
        return null;
      }
      const cached = await this.aiCacheService.getSEOMetadata(drug.id);
      if (cached) {
        return cached;
      }
      const seo = drug.seoMetadata || null;
      if (seo) {
        await this.aiCacheService.cacheSEOMetadata(drug.id, seo);
      }
      return seo;
    } catch (error) {
      console.error('Error fetching SEO metadata:', error);
      return null;
    }
  }

  // AI Helper Methods

  private async generateConditionInsights(drug: any, condition: string, userType: string): Promise<any> {
    // Mock AI insights - would integrate with content enhancement processor
    return {
      relevanceExplanation: `${drug.drugName} is commonly used for ${condition}`,
      keyBenefits: ['Effective treatment', 'Well-established safety profile'],
      considerations: userType === 'patient' ? 
        ['Consult your healthcare provider', 'Follow prescribed dosing'] :
        ['Monitor patient response', 'Consider contraindications'],
    };
  }

  private calculateRelevanceScore(drug: any, condition: string): number {
    let score = 0;
    const conditionLower = condition.toLowerCase();
    
    // Check indications
    if (drug.label?.indicationsAndUsage?.toLowerCase().includes(conditionLower)) {
      score += 50;
    }
    
    // Check drug name relevance
    if (drug.drugName.toLowerCase().includes(conditionLower)) {
      score += 30;
    }
    
    // Add base score
    score += 20;
    
    return Math.min(score, 100);
  }

  private async generateConditionSummary(condition: string, drugs: any[], userType: string): Promise<string> {
    return `Found ${drugs.length} medications for ${condition}. ${
      userType === 'patient' ? 
      'Please consult your healthcare provider to determine the best treatment option.' :
      'Consider patient-specific factors when selecting appropriate therapy.'
    }`;
  }

  private async parseSearchIntent(query: string, userType: string): Promise<any> {
    // Use AI for sophisticated intent parsing
    const intent = {
      drugName: null,
      condition: null,
      manufacturer: null,
      category: 'general',
    };

    try {
      // Use AI to parse the intent
      const prompt = `Analyze this medical search query and extract the intent:
Query: "${query}"

Identify if the user is searching for:
1. A specific drug name
2. A medical condition or symptom
3. A manufacturer
4. General information

Return a JSON object with exactly this structure:
{
  "category": "drug|condition|manufacturer|general",
  "drugName": "extracted drug name or null",
  "condition": "extracted condition/symptom or null",
  "manufacturer": "extracted manufacturer or null"
}

Examples:
- "What treats migraines effectively?" -> {"category": "condition", "condition": "migraines", "drugName": null, "manufacturer": null}
- "Taltz side effects" -> {"category": "drug", "drugName": "Taltz", "condition": null, "manufacturer": null}
- "drugs by Eli Lilly" -> {"category": "manufacturer", "manufacturer": "Eli Lilly", "drugName": null, "condition": null}`;

      const response = await (this.aiService as any).callOpenAI(prompt, 150);
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.error('AI intent parsing failed, using fallback:', error);
    }

    // Fallback to simple pattern matching if AI fails
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('for') || queryLower.includes('treat')) {
      intent.category = 'condition';
      intent.condition = query.split(/for|treat/i)[1]?.trim();
    } else if (queryLower.includes('by') && queryLower.includes('pharma')) {
      intent.category = 'manufacturer';
      intent.manufacturer = query.split('by')[1]?.trim();
    } else {
      intent.drugName = query.trim();
    }

    return intent;
  }

  private async calculateAIRelevanceScore(drug: any, searchParams: any): Promise<number> {
    // Mock AI scoring - would use proper AI analysis
    return Math.random() * 100;
  }

  private async generateSearchHighlights(drug: any, query: string, userType: string): Promise<string[]> {
    const highlights = [];
    const queryLower = query.toLowerCase();
    
    if (drug.drugName.toLowerCase().includes(queryLower)) {
      highlights.push(`Name: ${drug.drugName}`);
    }
    
    if (drug.label?.indicationsAndUsage?.toLowerCase().includes(queryLower)) {
      highlights.push('Used for matching condition');
    }
    
    return highlights;
  }

  private async generateSearchSuggestions(query: string, results: any[], userType: string): Promise<string[]> {
    return [
      `Similar to "${query}"`,
      'Alternative treatments',
      'Generic versions',
    ];
  }

  private async generateRelatedDrugSuggestions(drug: any, userType: string): Promise<any[]> {
    // Get similar drugs by manufacturer and indication
    const similar = await this.drugRepository
      .createQueryBuilder('drug')
      .where('drug.manufacturer = :manufacturer', { manufacturer: drug.labeler })
      .andWhere('drug.setId != :setId', { setId: drug.setId })
      .limit(5)
      .getMany();

    return similar.map(d => this.entityToLabel(d));
  }

  private async getPopularDrugs(userType: string): Promise<any[]> {
    // Mock popular drugs - would use real analytics
    const popular = await this.drugRepository
      .createQueryBuilder('drug')
      .where('drug.status = :status', { status: 'published' })
      .orderBy('drug.createdAt', 'DESC')
      .limit(10)
      .getMany();

    return popular.map(d => this.entityToLabel(d));
  }

  private async generateSuggestionReasoning(params: any, suggestions: any[]): Promise<string> {
    if (params.basedOn) {
      return 'Based on therapeutic similarity and common usage patterns';
    } else if (params.condition) {
      return `Recommended treatments for ${params.condition}`;
    } else {
      return 'Popular and frequently accessed medications';
    }
  }

  private async generateEnhancedContent(drug: any, userType: string): Promise<any> {
    // Mock enhanced content - would integrate with AI processors
    return {
      simplifiedDescription: userType === 'patient' ? 
        'Patient-friendly explanation of what this medication does' :
        'Clinical overview and prescribing considerations',
      keyPoints: [
        'Main therapeutic benefit',
        'Important safety information',
        'Administration guidance',
      ],
      faq: [
        {
          question: `What is ${drug.drugName} used for?`,
          answer: 'Detailed answer based on FDA labeling',
        },
      ],
    };
  }
}