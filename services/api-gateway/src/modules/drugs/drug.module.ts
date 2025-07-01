import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { DrugController } from './controllers/drug.controller';
import { DrugService } from './services/drug.service';
import { DrugCacheService } from './services/drug-cache.service';
import { DrugRepository } from '../../database/repositories/drug.repository';
import { AICacheService } from '../../common/services/ai-cache.service';
import { DrugEventsPublisher } from '../events/publishers/drug-events.publisher';
import { BasePublisher } from '../events/publishers/base-publisher';
import { SearchAggregatorService } from '../search/services/search-aggregator.service';
import { ElasticsearchService } from '../search/services/elasticsearch.service';

import { DrugEntity } from '../../database/entities/drug.entity';
import { DrugContentEntity } from '../../database/entities/drug-content.entity';
import { SEOMetadataEntity } from '../../database/entities/seo-metadata.entity';
import { ProcessingLogEntity } from '../../database/entities/processing-log.entity';
import { AIModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DrugEntity,
      DrugContentEntity,
      SEOMetadataEntity,
      ProcessingLogEntity,
    ]),
    BullModule.registerQueue({
      name: 'ai-enhancement',
    }),
    BullModule.registerQueue({
      name: 'label-processing',
    }),
    forwardRef(() => AIModule),
  ],
  controllers: [DrugController],
  providers: [
    DrugService, 
    DrugCacheService, 
    DrugRepository, 
    AICacheService,
    DrugEventsPublisher,
    BasePublisher,
    SearchAggregatorService,
    ElasticsearchService
  ],
  exports: [DrugService, DrugRepository, AICacheService],
})
export class DrugsModule {}