import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { DrugEntity } from '../../../database/entities/drug.entity';

@Injectable()
export class DrugCacheService {
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'drug:';

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  private getCacheKey(identifier: string, type: 'id' | 'slug' = 'id'): string {
    return `${this.CACHE_PREFIX}${type}:${identifier}`;
  }

  async get(identifier: string, type: 'id' | 'slug' = 'id'): Promise<DrugEntity | null> {
    const key = this.getCacheKey(identifier, type);
    return await this.cacheManager.get<DrugEntity>(key);
  }

  async set(drug: DrugEntity): Promise<void> {
    const idKey = this.getCacheKey(drug.id, 'id');
    const slugKey = this.getCacheKey(drug.slug, 'slug');
    
    await Promise.all([
      this.cacheManager.set(idKey, drug, this.CACHE_TTL),
      this.cacheManager.set(slugKey, drug, this.CACHE_TTL)
    ]);
  }

  async invalidate(drug: DrugEntity): Promise<void> {
    const idKey = this.getCacheKey(drug.id, 'id');
    const slugKey = this.getCacheKey(drug.slug, 'slug');
    
    await Promise.all([
      this.cacheManager.del(idKey),
      this.cacheManager.del(slugKey)
    ]);
  }

  async invalidateAll(): Promise<void> {
    // Note: This is a simple implementation
    // In production, you might want to use Redis pattern matching
    const keys = await this.cacheManager.store.keys(`${this.CACHE_PREFIX}*`);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
    }
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    const searchPattern = `${this.CACHE_PREFIX}${pattern}`;
    const keys = await this.cacheManager.store.keys(searchPattern);
    if (keys && keys.length > 0) {
      await Promise.all(keys.map(key => this.cacheManager.del(key)));
    }
  }
}