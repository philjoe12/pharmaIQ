import { Module } from '@nestjs/common';
import { WorkflowService } from './services/workflow.service';
import { WorkflowController } from './controllers/workflow.controller';
import { ProcessingModule } from '../processing/processing.module';
import { AIModule } from '../ai/ai.module';
import { SeoOptimizationModule } from '../seo-optimization/seo-optimization.module';

@Module({
  imports: [ProcessingModule, AIModule, SeoOptimizationModule],
  controllers: [WorkflowController],
  providers: [WorkflowService],
  exports: [WorkflowService],
})
export class WorkflowModule {}