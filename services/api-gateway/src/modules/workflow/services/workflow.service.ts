import { Injectable, Logger } from '@nestjs/common';
import { ProcessingService, ProcessingResult } from '../../processing/services/processing.service';
import { AIService, EnhancedContent } from '../../ai/services/ai.service';
import { SeoOptimizationService, SeoContent } from '../../seo-optimization/services/seo-optimization.service';

export interface WorkflowResult {
  processed: ProcessingResult;
  enhanced: EnhancedContent;
  seo: SeoContent;
  completedAt: string;
  processingTimeMs: number;
}

export interface BatchWorkflowResult {
  results: WorkflowResult[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalProcessingTimeMs: number;
  };
}

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private readonly processingService: ProcessingService,
    private readonly aiService: AIService,
    private readonly seoService: SeoOptimizationService,
  ) {}

  /**
   * Complete end-to-end workflow: FDA Label → Processing → AI Enhancement → SEO
   */
  async processCompleteWorkflow(labelData: any): Promise<WorkflowResult> {
    const startTime = Date.now();
    this.logger.log(`Starting complete workflow for drug: ${labelData.drug_name || 'Unknown'}`);

    try {
      // Step 1: Process FDA Label
      this.logger.log('Step 1: Processing FDA label data');
      const processed = await this.processingService.processFDALabel(labelData);

      // Step 2: AI Enhancement
      this.logger.log('Step 2: Enhancing content with AI');
      const drugLabel = this.processingService.convertTodrugLabel(processed);
      const enhanced = await this.aiService.enhanceDrugContent(drugLabel as any);

      // Step 3: SEO Optimization
      this.logger.log('Step 3: Generating SEO content');
      const drugData = {
        name: processed.drugName,
        genericName: enhanced.patientFriendlyName || processed.drugName,
        manufacturer: processed.manufacturer,
        indications: processed.indications,
        category: 'Prescription Medication'
      };
      const seo = await this.seoService.generateSeoContent(drugData);

      const processingTimeMs = Date.now() - startTime;
      const result: WorkflowResult = {
        processed,
        enhanced,
        seo,
        completedAt: new Date().toISOString(),
        processingTimeMs
      };

      this.logger.log(`Complete workflow finished for ${processed.drugName} in ${processingTimeMs}ms`);
      return result;
    } catch (error) {
      this.logger.error(`Complete workflow failed:`, error);
      throw new Error(`Workflow processing failed: ${error.message}`);
    }
  }

  /**
   * Process multiple FDA labels through complete workflow
   */
  async processBatchWorkflow(labelDataArray: any[]): Promise<BatchWorkflowResult> {
    const startTime = Date.now();
    this.logger.log(`Starting batch workflow for ${labelDataArray.length} drugs`);

    const results = await Promise.allSettled(
      labelDataArray.map(labelData => this.processCompleteWorkflow(labelData))
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<WorkflowResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failed = results.filter(result => result.status === 'rejected').length;
    const totalProcessingTimeMs = Date.now() - startTime;

    this.logger.log(`Batch workflow complete: ${successful.length} successful, ${failed} failed in ${totalProcessingTimeMs}ms`);

    return {
      results: successful,
      summary: {
        total: labelDataArray.length,
        successful: successful.length,
        failed,
        totalProcessingTimeMs
      }
    };
  }

  /**
   * Generate complete sitemap from workflow results
   */
  async generateCompleteSitemap(workflowResults: WorkflowResult[]): Promise<{
    xml: string;
    entries: number;
    generatedAt: string;
  }> {
    this.logger.log(`Generating sitemap for ${workflowResults.length} workflow results`);

    const seoContents = workflowResults.map(result => result.seo);
    const entries = this.seoService.generateSitemapEntries(seoContents);
    const xml = this.seoService.generateSitemapXml(entries);

    return {
      xml,
      entries: entries.length,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStats(workflowResults: WorkflowResult[]): Promise<{
    totalDrugs: number;
    averageProcessingTime: number;
    manufacturers: string[];
    categories: string[];
    topIndications: string[];
  }> {
    const stats = {
      totalDrugs: workflowResults.length,
      averageProcessingTime: workflowResults.reduce((sum, r) => sum + r.processingTimeMs, 0) / workflowResults.length,
      manufacturers: [...new Set(workflowResults.map(r => r.processed.manufacturer))],
      categories: [...new Set(workflowResults.map(r => 'Prescription Medication'))],
      topIndications: this.getTopIndications(workflowResults)
    };

    return stats;
  }

  private getTopIndications(workflowResults: WorkflowResult[]): string[] {
    const indicationCounts = new Map<string, number>();

    workflowResults.forEach(result => {
      result.processed.indications.forEach(indication => {
        const current = indicationCounts.get(indication) || 0;
        indicationCounts.set(indication, current + 1);
      });
    });

    return Array.from(indicationCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([indication]) => indication);
  }

  /**
   * Demo workflow with sample data
   */
  async runDemoWorkflow(): Promise<WorkflowResult> {
    const sampleLabelData = {
      drug_name: 'Aspirin',
      manufacturer: 'Generic Pharma Inc.',
      indications_and_usage: 'For the relief of minor aches and pains, headaches, and reduction of fever.',
      contraindications: 'Hypersensitivity to aspirin or other salicylates.',
      warnings: 'Risk of bleeding, especially in patients taking anticoagulants.',
      dosage_and_administration: 'Adults: 325-650 mg every 4 hours as needed. Do not exceed 4 grams per day.',
      dosage_forms_and_strengths: 'Tablets: 325 mg, 500 mg'
    };

    this.logger.log('Running demo workflow with sample aspirin data');
    return this.processCompleteWorkflow(sampleLabelData);
  }
}