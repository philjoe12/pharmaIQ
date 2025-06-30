import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AICacheService } from '../services/ai-cache.service';

export const AI_CACHE_KEY = 'ai-cache-key';
export const AI_CACHE_TTL = 'ai-cache-ttl';

export interface AICacheOptions {
  key: string;
  ttl?: number;
  condition?: (context: ExecutionContext) => boolean;
  keyGenerator?: (context: ExecutionContext) => string;
}

/**
 * Decorator to enable AI caching on methods
 */
export const AICache = (options: AICacheOptions) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata(AI_CACHE_KEY, options, descriptor.value);
    return descriptor;
  };
};

@Injectable()
export class AICacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AICacheInterceptor.name);

  constructor(
    private readonly cacheService: AICacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cacheOptions = this.reflector.get<AICacheOptions>(
      AI_CACHE_KEY,
      context.getHandler(),
    );

    // If no cache options defined, proceed without caching
    if (!cacheOptions) {
      return next.handle();
    }

    // Check cache condition if provided
    if (cacheOptions.condition && !cacheOptions.condition(context)) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(context, cacheOptions);
    
    try {
      // Try to get from cache first
      const cachedResult = await this.cacheService.getPromptResult(cacheKey);
      
      if (cachedResult !== null) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return of(cachedResult);
      }

      this.logger.debug(`Cache miss for key: ${cacheKey}`);
      
      // Execute the original method and cache the result
      return next.handle().pipe(
        tap(async (result) => {
          if (result !== null && result !== undefined) {
            const ttl = cacheOptions.ttl || 3600; // Default 1 hour
            await this.cacheService.cachePromptResult(cacheKey, result);
            this.logger.debug(`Cached result for key: ${cacheKey} with TTL: ${ttl}`);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache operation failed for key ${cacheKey}:`, error);
      // Continue with normal execution if cache fails
      return next.handle();
    }
  }

  private generateCacheKey(context: ExecutionContext, options: AICacheOptions): string {
    if (options.keyGenerator) {
      return options.keyGenerator(context);
    }

    const request = context.switchToHttp().getRequest();
    const method = context.getHandler().name;
    const className = context.getClass().name;
    
    // Create a base key
    let key = `${className}:${method}:${options.key}`;
    
    // Add request parameters to make key unique
    if (request.params) {
      const paramString = Object.entries(request.params)
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      key += `:${paramString}`;
    }
    
    // Add query parameters
    if (request.query && Object.keys(request.query).length > 0) {
      const queryString = Object.entries(request.query)
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      key += `:${queryString}`;
    }

    // Hash the key if it's too long
    if (key.length > 250) {
      const crypto = require('crypto');
      return crypto.createHash('md5').update(key).digest('hex');
    }

    return key;
  }
}

/**
 * Specific cache decorator for AI prompt results
 */
export const CachePromptResult = (ttl: number = 3600) => {
  return AICache({
    key: 'prompt-result',
    ttl,
    keyGenerator: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      const body = request.body;
      
      // Generate cache key based on prompt content
      if (body && body.prompt) {
        const crypto = require('crypto');
        const promptData = JSON.stringify({
          prompt: body.prompt,
          context: body.context,
          options: body.options,
        });
        return crypto.createHash('sha256').update(promptData).digest('hex');
      }
      
      return 'default';
    },
  });
};

/**
 * Cache decorator for drug-specific AI operations
 */
export const CacheDrugAI = (contentType: string, ttl: number = 7200) => {
  return AICache({
    key: contentType,
    ttl,
    keyGenerator: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      const drugId = request.params?.drugId || request.params?.id;
      
      if (!drugId) {
        throw new Error('Drug ID not found in request for caching');
      }
      
      return `${contentType}:${drugId}`;
    },
  });
};

/**
 * Cache decorator for search operations
 */
export const CacheSearchResult = (ttl: number = 1800) => {
  return AICache({
    key: 'search',
    ttl,
    keyGenerator: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest();
      const query = request.query;
      
      // Create deterministic cache key from search parameters
      const searchParams = {
        q: query.q || '',
        filters: query.filters || {},
        sort: query.sort || 'relevance',
        page: query.page || 1,
        limit: query.limit || 20,
      };
      
      const crypto = require('crypto');
      const searchKey = JSON.stringify(searchParams);
      return crypto.createHash('md5').update(searchKey).digest('hex');
    },
  });
};