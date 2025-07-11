import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './controllers/search.controller';
import { ElasticsearchService } from './services/elasticsearch.service';
import { SearchAggregatorService } from './services/search-aggregator.service';
import { DrugRepository } from '../../database/repositories/drug.repository';
import { DrugEntity } from '../../database/entities/drug.entity';
import { SearchLogEntity } from '../../database/entities/search-log.entity';
import { SearchLogRepository } from '../../database/repositories/search-log.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([DrugEntity, SearchLogEntity]),
  ],
  controllers: [SearchController],
  providers: [
    ElasticsearchService,
    SearchAggregatorService,
    DrugRepository,
    SearchLogRepository,
  ],
  exports: [
    ElasticsearchService,
    SearchAggregatorService,
    DrugRepository,
    SearchLogRepository,
  ],
})
export class SearchModule {}
