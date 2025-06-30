import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { FDALabel, ProcessedDrugData } from '@pharmaiq/types';
import { FdaLabelParser } from './parsers/fda-label.parser';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectQueue('label-processing') private labelQueue: Queue,
    private readonly fdaLabelParser: FdaLabelParser,
  ) {}

  getServiceStatus() {
    return {
      service: 'processing-worker',
      status: 'running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      queue: {
        waiting: 0, // Will be populated from queue stats
        active: 0,
        completed: 0,
        failed: 0,
      },
    };
  }

  async processLabel(labelData: FDALabel): Promise<ProcessedDrugData> {
    try {
      // For single label processing, we can process directly
      // or add to queue based on configuration
      const isDirect = process.env.DIRECT_PROCESSING === 'true';
      
      if (isDirect) {
        this.logger.log('Processing label directly');
        return await this.fdaLabelParser.parseLabelData(labelData);
      } else {
        this.logger.log('Adding label to processing queue');
        const job = await this.labelQueue.add('import-label', {
          labelData,
          source: 'api',
          importId: `direct-${Date.now()}`,
        });
        
        // Wait for job completion (simplified for demo)
        return new Promise((resolve, reject) => {
          job.finished().then(resolve).catch(reject);
        });
      }
    } catch (error) {
      this.logger.error(`Failed to process label: ${error.message}`, error.stack);
      throw error;
    }
  }

  async processBatch(labels: FDALabel[]): Promise<{ jobId: string; message: string }> {
    try {
      const job = await this.labelQueue.add('batch-import-labels', {
        labels,
        source: 'batch-api',
      });

      this.logger.log(`Added batch job ${job.id} for ${labels.length} labels`);
      
      return {
        jobId: job.id.toString(),
        message: `Batch processing started for ${labels.length} labels`,
      };
    } catch (error) {
      this.logger.error(`Failed to start batch processing: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getQueueStats() {
    try {
      const waiting = await this.labelQueue.getWaiting();
      const active = await this.labelQueue.getActive();
      const completed = await this.labelQueue.getCompleted();
      const failed = await this.labelQueue.getFailed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats: ${error.message}`);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      };
    }
  }
}