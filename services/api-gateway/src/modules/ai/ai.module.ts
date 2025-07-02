import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AIService } from './services/ai.service';
import { AIController } from './controllers/ai.controller';
import { AIEnhancementService } from './services/ai-enhancement.service';
import { ContentEnhancementProcessor } from './services/content-enhancement.processor';
import { DrugComparisonService } from './services/drug-comparison.service';
import { EmbeddingService } from './services/embedding.service';
import { DrugsModule } from '../drugs/drug.module';
import { EventsModule } from '../events/events.module';
import { AICacheService } from '../../common/services/ai-cache.service';
import { DrugEmbeddingEntity } from '../../database/entities/drug-embedding.entity';
import { DrugEntity } from '../../database/entities/drug.entity';
import { DrugEmbeddingRepository } from '../../database/repositories/drug-embedding.repository';
import { DrugRepository } from '../../database/repositories/drug.repository';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([DrugEmbeddingEntity, DrugEntity]),
    BullModule.registerQueue({
      name: 'ai-enhancement',
    }),
    forwardRef(() => DrugsModule),
    EventsModule
  ],
  controllers: [AIController],
  providers: [
    AIService,
    AIEnhancementService,
    ContentEnhancementProcessor,
    DrugComparisonService,
    EmbeddingService,
    DrugEmbeddingRepository,
    DrugRepository,
    AICacheService
  ],
  exports: [AIService, AIEnhancementService, DrugComparisonService, EmbeddingService],
})
export class AIModule {}