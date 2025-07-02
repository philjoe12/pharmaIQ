import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DrugEntity } from '../../../database/entities/drug.entity';
import { DrugEmbeddingEntity } from '../../../database/entities/drug-embedding.entity';
import { DrugEmbeddingRepository } from '../../../database/repositories/drug-embedding.repository';
import { FDALabel } from '../../../shared-types';

export interface EmbeddingResult {
  embedding: number[];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private embeddingRepository: DrugEmbeddingRepository,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.logger.log(`OpenAI API Key configured for embeddings: ${apiKey ? 'Yes' : 'No'}`);
    
    if (!apiKey || apiKey === 'sk-test-key') {
      this.logger.warn('OpenAI API key not found or using test key. Embedding features will be limited.');
    }
    
    this.openai = new OpenAI({ apiKey: apiKey || 'sk-test-key' });
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string, model = 'text-embedding-3-small'): Promise<EmbeddingResult> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized. Check API key configuration.');
    }

    try {
      // Clean the text - remove HTML tags and normalize whitespace
      const cleanText = this.cleanText(text);
      
      const response = await this.openai.embeddings.create({
        model,
        input: cleanText,
        encoding_format: 'float',
      });

      return {
        embedding: response.data[0].embedding,
        model: response.model,
        usage: response.usage,
      };
    } catch (error) {
      this.logger.error('Failed to generate embedding:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for a drug and store them
   */
  async generateDrugEmbeddings(drug: DrugEntity | FDALabel): Promise<DrugEmbeddingEntity[]> {
    const embeddings: DrugEmbeddingEntity[] = [];

    try {
      // Generate summary embedding
      const summaryText = this.extractDrugSummary(drug);
      if (summaryText) {
        const summaryEmbedding = await this.generateEmbedding(summaryText);
        const drugId = this.getDrugId(drug);
        const summaryEntity = await this.embeddingRepository.upsert({
          drugId,
          contentType: 'summary',
          contentText: summaryText,
          embedding: summaryEmbedding.embedding,
          modelName: summaryEmbedding.model,
        });
        embeddings.push(summaryEntity);
      }

      // Generate indications embedding
      const indicationsText = this.extractIndications(drug);
      if (indicationsText) {
        const indicationsEmbedding = await this.generateEmbedding(indicationsText);
        const indicationsEntity = await this.embeddingRepository.upsert({
          drugId: this.getDrugId(drug),
          contentType: 'indications',
          contentText: indicationsText,
          embedding: indicationsEmbedding.embedding,
          modelName: indicationsEmbedding.model,
        });
        embeddings.push(indicationsEntity);
      }

      // Generate full label embedding (truncated if too long)
      const fullLabelText = this.extractFullLabel(drug);
      if (fullLabelText) {
        const fullLabelEmbedding = await this.generateEmbedding(fullLabelText);
        const fullLabelEntity = await this.embeddingRepository.upsert({
          drugId: this.getDrugId(drug),
          contentType: 'full_label',
          contentText: fullLabelText,
          embedding: fullLabelEmbedding.embedding,
          modelName: fullLabelEmbedding.model,
        });
        embeddings.push(fullLabelEntity);
      }

      const drugName = this.getDrugName(drug);
      this.logger.log(`Generated ${embeddings.length} embeddings for drug: ${drugName}`);
      return embeddings;
    } catch (error) {
      const drugName = this.getDrugName(drug);
      this.logger.error(`Failed to generate embeddings for drug ${drugName}:`, error);
      throw error;
    }
  }

  /**
   * Perform semantic search across drug embeddings
   */
  async semanticSearch(
    query: string,
    options: {
      contentType?: 'summary' | 'indications' | 'full_label';
      limit?: number;
      threshold?: number;
    } = {}
  ): Promise<{ drug: DrugEntity; similarity: number; contentType: string }[]> {
    const {
      contentType = 'summary',
      limit = 10,
      threshold = 0.25  // Optimized threshold based on testing
    } = options;

    try {
      // Generate embedding for the search query
      const queryEmbeddingResult = await this.generateEmbedding(query);
      
      // Perform semantic search
      const results = await this.embeddingRepository.semanticSearch(
        queryEmbeddingResult.embedding,
        contentType,
        limit,
        threshold
      );

      return results.map(result => ({
        drug: result.embedding.drug as DrugEntity,
        similarity: result.similarity,
        contentType: result.embedding.contentType
      }));
    } catch (error) {
      this.logger.error('Semantic search failed:', error);
      throw error;
    }
  }

  /**
   * Helper methods for handling different drug types
   */
  private getDrugId(drug: any): string {
    // Handle both DrugEntity and FDALabel formats
    // For DrugEntity: use drug.id (the actual database ID)
    // For FDALabel: first try to find the actual drug.id, then fallback to setId
    if (drug.id && typeof drug.id === 'string' && drug.id.includes('-')) {
      // This looks like a UUID (database ID)
      return drug.id;
    }
    // If we have a setId but no proper id, this is likely an FDALabel
    // In this case, we should not proceed as we need the actual database ID
    if (drug.setId && !drug.id) {
      throw new Error(`Cannot generate embeddings: drug has setId (${drug.setId}) but no database ID. Please ensure the drug is saved to database first.`);
    }
    return drug.id || drug._id;
  }

  private getDrugName(drug: DrugEntity | FDALabel): string {
    return drug.drugName;
  }

  private getDrugGenericName(drug: DrugEntity | FDALabel): string {
    if ('genericName' in drug && drug.genericName) {
      return drug.genericName;
    }
    const labelData = this.getLabelData(drug);
    return labelData?.genericName || '';
  }

  private getDrugManufacturer(drug: DrugEntity | FDALabel): string {
    if ('manufacturer' in drug && drug.manufacturer) {
      return drug.manufacturer;
    }
    return ('labeler' in drug) ? drug.labeler : '';
  }

  private getLabelData(drug: DrugEntity | FDALabel): any {
    return 'labelData' in drug ? drug.labelData : drug.label;
  }

  /**
   * Extract drug summary for embedding
   */
  private extractDrugSummary(drug: DrugEntity | FDALabel): string {
    const parts = [];
    
    // Basic info
    parts.push(`${this.getDrugName(drug)} (${this.getDrugGenericName(drug) || 'generic name not available'})`);
    parts.push(`Manufactured by ${this.getDrugManufacturer(drug)}`);
    
    // Indications (truncated)
    const labelData = this.getLabelData(drug);
    const indications = labelData?.indicationsAndUsage;
    if (indications) {
      const cleanIndications = this.cleanText(indications);
      parts.push(`Used for: ${cleanIndications.substring(0, 500)}`);
    }

    // Key safety info
    const contraindications = labelData?.contraindications;
    if (contraindications) {
      const cleanContraindications = this.cleanText(contraindications);
      parts.push(`Contraindications: ${cleanContraindications.substring(0, 300)}`);
    }

    return parts.join('. ').substring(0, 8000); // Limit for embedding API
  }

  /**
   * Extract indications text for embedding
   */
  private extractIndications(drug: DrugEntity | FDALabel): string {
    const labelData = this.getLabelData(drug);
    const indications = labelData?.indicationsAndUsage;
    if (!indications) return null;

    return this.cleanText(indications).substring(0, 8000);
  }

  /**
   * Extract full label text for embedding (truncated)
   */
  private extractFullLabel(drug: DrugEntity | FDALabel): string {
    const parts = [];
    const label = this.getLabelData(drug);

    if (!label) return null;

    // Combine key sections
    if (label.indicationsAndUsage) parts.push(this.cleanText(label.indicationsAndUsage));
    if (label.dosageAndAdministration) parts.push(this.cleanText(label.dosageAndAdministration));
    if (label.contraindications) parts.push(this.cleanText(label.contraindications));
    if (label.warningsAndPrecautions) parts.push(this.cleanText(label.warningsAndPrecautions));
    if (label.adverseReactions) parts.push(this.cleanText(label.adverseReactions));
    if (label.description) parts.push(this.cleanText(label.description));

    const fullText = parts.join(' ');
    return fullText.substring(0, 8000); // Limit for embedding API
  }

  /**
   * Clean text by removing HTML tags and normalizing whitespace
   */
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/&[a-zA-Z0-9#]+;/g, ' ') // Remove HTML entities
      .trim();
  }

  /**
   * Get embedding statistics
   */
  async getEmbeddingStats(): Promise<{
    total: number;
    byContentType: Record<string, number>;
  }> {
    const total = await this.embeddingRepository.count();
    
    const summaryCount = (await this.embeddingRepository.findByContentType('summary')).length;
    const indicationsCount = (await this.embeddingRepository.findByContentType('indications')).length;
    const fullLabelCount = (await this.embeddingRepository.findByContentType('full_label')).length;

    return {
      total,
      byContentType: {
        summary: summaryCount,
        indications: indicationsCount,
        full_label: fullLabelCount,
      }
    };
  }
}