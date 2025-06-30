import { Controller, Post, Get, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { WorkflowService, WorkflowResult, BatchWorkflowResult } from '../services/workflow.service';

export interface CompleteWorkflowDto {
  labelData: any;
}

export interface BatchWorkflowDto {
  labelDataArray: any[];
}

@Controller('workflow')
export class WorkflowController {
  private readonly logger = new Logger(WorkflowController.name);

  constructor(private readonly workflowService: WorkflowService) {}

  @Post('complete')
  async processCompleteWorkflow(@Body() dto: CompleteWorkflowDto): Promise<WorkflowResult> {
    try {
      if (!dto.labelData) {
        throw new HttpException('Label data is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log('Processing complete workflow');
      const result = await this.workflowService.processCompleteWorkflow(dto.labelData);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to process complete workflow:', error);
      throw new HttpException(
        error.message || 'Complete workflow processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('batch')
  async processBatchWorkflow(@Body() dto: BatchWorkflowDto): Promise<BatchWorkflowResult> {
    try {
      if (!dto.labelDataArray || !Array.isArray(dto.labelDataArray)) {
        throw new HttpException('Label data array is required', HttpStatus.BAD_REQUEST);
      }

      if (dto.labelDataArray.length === 0) {
        throw new HttpException('Label data array cannot be empty', HttpStatus.BAD_REQUEST);
      }

      if (dto.labelDataArray.length > 10) {
        throw new HttpException('Batch size cannot exceed 10 items for complete workflow', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Processing batch workflow for ${dto.labelDataArray.length} items`);
      const result = await this.workflowService.processBatchWorkflow(dto.labelDataArray);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to process batch workflow:', error);
      throw new HttpException(
        error.message || 'Batch workflow processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sitemap')
  async generateSitemap(@Body() dto: { workflowResults: WorkflowResult[] }): Promise<{
    xml: string;
    entries: number;
    generatedAt: string;
  }> {
    try {
      if (!dto.workflowResults || !Array.isArray(dto.workflowResults)) {
        throw new HttpException('Workflow results array is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Generating sitemap from ${dto.workflowResults.length} workflow results`);
      const result = await this.workflowService.generateCompleteSitemap(dto.workflowResults);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to generate sitemap:', error);
      throw new HttpException(
        error.message || 'Sitemap generation failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('stats')
  async getWorkflowStats(@Body() dto: { workflowResults: WorkflowResult[] }): Promise<{
    totalDrugs: number;
    averageProcessingTime: number;
    manufacturers: string[];
    categories: string[];
    topIndications: string[];
  }> {
    try {
      if (!dto.workflowResults || !Array.isArray(dto.workflowResults)) {
        throw new HttpException('Workflow results array is required', HttpStatus.BAD_REQUEST);
      }

      const stats = await this.workflowService.getWorkflowStats(dto.workflowResults);
      return stats;
    } catch (error) {
      this.logger.error('Failed to get workflow stats:', error);
      throw new HttpException(
        error.message || 'Failed to generate stats',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('demo')
  async runDemoWorkflow(): Promise<WorkflowResult> {
    try {
      this.logger.log('Running demo workflow');
      const result = await this.workflowService.runDemoWorkflow();
      
      return result;
    } catch (error) {
      this.logger.error('Failed to run demo workflow:', error);
      throw new HttpException(
        error.message || 'Demo workflow failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}