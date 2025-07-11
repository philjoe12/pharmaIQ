import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchLogEntity } from '../entities/search-log.entity';

@Injectable()
export class SearchLogRepository {
  constructor(
    @InjectRepository(SearchLogEntity)
    private readonly repository: Repository<SearchLogEntity>,
  ) {}

  async createLog(query: string, resultCount: number): Promise<SearchLogEntity> {
    const log = this.repository.create({ query, resultCount });
    return this.repository.save(log);
  }

  count(): Promise<number> {
    return this.repository.count();
  }

  async countDistinctQueries(): Promise<number> {
    return this.repository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.query)', 'count')
      .getRawOne()
      .then((r) => parseInt(r.count, 10));
  }

  async getTopQueries(limit: number): Promise<{ query: string; count: number }[]> {
    return this.repository
      .createQueryBuilder('log')
      .select('log.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.query')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getNoResultsQueries(limit: number): Promise<{ query: string; count: number }[]> {
    return this.repository
      .createQueryBuilder('log')
      .where('log.result_count = 0')
      .select('log.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .groupBy('log.query')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getAverageResults(): Promise<number> {
    const res = await this.repository
      .createQueryBuilder('log')
      .select('AVG(log.result_count)', 'avg')
      .getRawOne();
    return parseFloat(res.avg) || 0;
  }
}
