import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { AppService } from './app.service';
import { FDALabel } from '@pharmaiq/types';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Get('health')
  getHealth(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('status')
  getStatus() {
    return this.appService.getServiceStatus();
  }

  @Post('process-label')
  async processLabel(@Body() labelData: FDALabel) {
    this.logger.log(`Received label processing request for: ${labelData.drugName}`);
    return this.appService.processLabel(labelData);
  }

  @Post('process-labels-batch')
  async processBatchLabels(@Body() labels: FDALabel[]) {
    this.logger.log(`Received batch processing request for ${labels.length} labels`);
    return this.appService.processBatch(labels);
  }
}