import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './controllers/search.controller';
import { ElasticsearchService } from './services/elasticsearch.service';
import { SearchAggregatorService } from './services/search-aggregator.service';
import { DrugRepository } from '../../database/repositories/drug.repository';
import { DrugEntity } from '../../database/entities/drug.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DrugEntity]),
  ],
  controllers: [SearchController],
  providers: [
    ElasticsearchService,
    SearchAggregatorService,
    DrugRepository,
  ],
  exports: [
    ElasticsearchService,
    SearchAggregatorService,
  ],
})
export class SearchModule {}