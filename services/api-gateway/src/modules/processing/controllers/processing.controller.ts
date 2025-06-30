import { Controller, Post, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ProcessingService, ProcessingResult } from '../services/processing.service';

export interface ProcessLabelDto {
  labelData: any;
  setId?: string;
}

export interface ProcessBatchDto {
  labelDataArray: any[];
}

@Controller('processing')
export class ProcessingController {
  private readonly logger = new Logger(ProcessingController.name);

  constructor(private readonly processingService: ProcessingService) {}

  @Post('label')
  async processLabel(@Body() dto: ProcessLabelDto): Promise<ProcessingResult> {
    try {
      if (!dto.labelData) {
        throw new HttpException('Label data is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log('Processing single FDA label');
      const result = await this.processingService.processFDALabel(dto.labelData);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to process label:', error);
      throw new HttpException(
        error.message || 'Label processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('process-label')
  async processLabelWorker(@Body() dto: ProcessLabelDto): Promise<ProcessingResult> {
    try {
      if (!dto.labelData) {
        throw new HttpException('Label data is required', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Processing FDA label from worker${dto.setId ? ` for setId: ${dto.setId}` : ''}`);
      const result = await this.processingService.processFDALabel(dto.labelData);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to process label for worker:', error);
      throw new HttpException(
        error.message || 'Label processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('batch')
  async processBatch(@Body() dto: ProcessBatchDto): Promise<{
    results: ProcessingResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    try {
      if (!dto.labelDataArray || !Array.isArray(dto.labelDataArray)) {
        throw new HttpException('Label data array is required', HttpStatus.BAD_REQUEST);
      }

      if (dto.labelDataArray.length === 0) {
        throw new HttpException('Label data array cannot be empty', HttpStatus.BAD_REQUEST);
      }

      if (dto.labelDataArray.length > 100) {
        throw new HttpException('Batch size cannot exceed 100 items', HttpStatus.BAD_REQUEST);
      }

      this.logger.log(`Processing batch of ${dto.labelDataArray.length} labels`);
      const results = await this.processingService.processBatch(dto.labelDataArray);
      
      return {
        results,
        summary: {
          total: dto.labelDataArray.length,
          successful: results.length,
          failed: dto.labelDataArray.length - results.length
        }
      };
    } catch (error) {
      this.logger.error('Failed to process batch:', error);
      throw new HttpException(
        error.message || 'Batch processing failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}