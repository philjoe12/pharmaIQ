import { Process, Processor } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { FdaLabelParser } from '../parsers/fda-label.parser';
import { DataValidatorProcessor } from './data-validator.processor';
import { FDALabel, ProcessedDrugData } from '@pharmaiq/types';

export interface LabelImportJob {
  labelData: FDALabel;
  source: string;
  importId: string;
}

@Processor('label-processing')
@Injectable()
export class LabelImportProcessor {
  private readonly logger = new Logger(LabelImportProcessor.name);

  constructor(
    private readonly fdaLabelParser: FdaLabelParser,
    private readonly dataValidator: DataValidatorProcessor,
  ) {}

  @Process('import-label')
  async processLabelImport(job: Job<LabelImportJob>): Promise<ProcessedDrugData> {
    const { labelData, source, importId } = job.data;
    
    this.logger.log(`Processing label import job ${importId} from ${source}`);

    try {
      // Step 1: Validate raw label data
      const isValid = this.fdaLabelParser.validateLabelData(labelData);
      if (!isValid) {
        throw new Error('Invalid FDA label data structure');
      }

      // Step 2: Parse the label data
      const processedData = await this.fdaLabelParser.parseLabelData(labelData);

      // Step 3: Validate processed data
      const validationResult = await this.dataValidator.validateProcessedData(processedData);
      if (!validationResult.isValid) {
        this.logger.warn(`Data validation issues: ${validationResult.errors.join(', ')}`);
        
        // Continue processing but log warnings
        processedData.validationWarnings = validationResult.errors;
      }

      // Step 4: Enrich data with additional metadata
      const enrichedData = await this.enrichProcessedData(processedData, source, importId);

      this.logger.log(`Successfully processed label for: ${enrichedData.drugInfo.brandName || enrichedData.drugInfo.genericName}`);

      return enrichedData;

    } catch (error) {
      this.logger.error(`Failed to process label import ${importId}: ${error.message}`, error.stack);
      
      // Re-throw with more context
      throw new Error(`Label processing failed: ${error.message}`);
    }
  }

  @Process('batch-import-labels')
  async processBatchLabelImport(job: Job<{ labels: FDALabel[], source: string }>): Promise<ProcessedDrugData[]> {
    const { labels, source } = job.data;
    const results: ProcessedDrugData[] = [];
    
    this.logger.log(`Processing batch import of ${labels.length} labels from ${source}`);

    for (let i = 0; i < labels.length; i++) {
      const labelData = labels[i];
      const importId = `batch-${Date.now()}-${i}`;

      try {
        const processedData = await this.processLabelImport({
          data: { labelData, source, importId },
        } as Job<LabelImportJob>);

        results.push(processedData);
        
        // Update job progress
        const progress = Math.round(((i + 1) / labels.length) * 100);
        await job.progress(progress);

      } catch (error) {
        this.logger.error(`Failed to process label ${i} in batch: ${error.message}`);
        
        // Continue with other labels but track failures
        // Log error and continue with other labels
        this.logger.error(`Skipping failed label ${i}: ${error.message}`);
      }
    }

    this.logger.log(`Batch processing completed: ${results.length} results`);
    return results;
  }

  private async enrichProcessedData(
    processedData: ProcessedDrugData,
    source: string,
    importId: string
  ): Promise<ProcessedDrugData> {
    // Add processing metadata
    const enrichedData = {
      ...processedData,
      metadata: {
        source,
        importId,
        processedAt: new Date(),
        processingVersion: '1.0.0',
        dataQuality: this.assessDataQuality(processedData),
      },
    };

    // Generate slug for URL-friendly identifier
    const slug = this.generateSlug(enrichedData.drugInfo);
    enrichedData.slug = slug;

    // Calculate content completeness score
    enrichedData.completenessScore = this.calculateCompletenessScore(enrichedData);

    return enrichedData;
  }

  private generateSlug(drugInfo: any): string {
    const name = drugInfo.brandName || drugInfo.genericName || 'unknown-drug';
    const ingredient = drugInfo.activeIngredient || '';
    
    const baseSlug = `${name}-${ingredient}`
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

    return baseSlug.substring(0, 100); // Limit length
  }

  private assessDataQuality(data: ProcessedDrugData): string {
    let score = 0;
    const maxScore = 7;

    if (data.drugInfo.brandName) score++;
    if (data.drugInfo.genericName) score++;
    if (data.indications.length > 0) score++;
    if (data.dosageAndAdministration.length > 0) score++;
    if (data.warnings.length > 0) score++;
    if (data.adverseReactions.length > 0) score++;
    if (data.manufacturerInfo?.manufacturerName) score++;

    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'fair';
    return 'poor';
  }

  private calculateCompletenessScore(data: ProcessedDrugData): number {
    let score = 0;
    let totalFields = 0;

    // Check drug info completeness
    const drugInfoFields = Object.values(data.drugInfo).filter(v => v && (typeof v === 'string' ? v.length > 0 : true));
    score += drugInfoFields.length;
    totalFields += 6; // Total expected drug info fields

    // Check content sections
    if (data.indications.length > 0) score += 2;
    if (data.contraindications.length > 0) score += 1;
    if (data.dosageAndAdministration.length > 0) score += 2;
    if (data.warnings.length > 0) score += 2;
    if (data.adverseReactions.length > 0) score += 1;
    totalFields += 8;

    return Math.round((score / totalFields) * 100);
  }
}