import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { AIService } from './services/ai.service';
import { AIController } from './controllers/ai.controller';
import { AIEnhancementService } from './services/ai-enhancement.service';
import { ContentEnhancementProcessor } from './services/content-enhancement.processor';
import { DrugComparisonService } from './services/drug-comparison.service';
import { DrugsModule } from '../drugs/drug.module';
import { EventsModule } from '../events/events.module';
import { AICacheService } from '../../common/services/ai-cache.service';

@Module({
  imports: [
    ConfigModule,
    BullModule.registerQueue({
      name: 'ai-enhancement',
    }),
    DrugsModule,
    EventsModule
  ],
  controllers: [AIController],
  providers: [
    AIService,
    AIEnhancementService,
    ContentEnhancementProcessor,
    DrugComparisonService,
    AICacheService
  ],
  exports: [AIService, AIEnhancementService, DrugComparisonService],
})
export class AIModule {}