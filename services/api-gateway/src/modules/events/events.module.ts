import { Module } from '@nestjs/common';
import { CacheInvalidationListener } from './listeners/cache-invalidation.listener';
import { SearchIndexListener } from './listeners/search-index.listener';
import { BasePublisher } from './publishers/base-publisher';
import { DrugEventsPublisher } from './publishers/drug-events.publisher';
import { SeoEventsPublisher } from './publishers/seo-events.publisher';
import { AICacheService } from '../../common/services/ai-cache.service';
import { DrugCacheService } from '../drugs/services/drug-cache.service';

@Module({
  providers: [
    CacheInvalidationListener,
    SearchIndexListener,
    BasePublisher,
    DrugEventsPublisher,
    SeoEventsPublisher,
    AICacheService,
    DrugCacheService,
  ],
  exports: [
    DrugEventsPublisher,
    SeoEventsPublisher,
  ],
})
export class EventsModule {}