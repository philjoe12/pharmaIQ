import { Injectable, Logger } from '@nestjs/common';

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  exponentialBase: number;
  jitter: boolean;
}

export interface RetryContext {
  attempt: number;
  lastError?: Error;
  totalElapsed: number;
  startTime: number;
}

@Injectable()
export class RetryStrategy {
  private readonly logger = new Logger(RetryStrategy.name);

  private readonly defaultConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    exponentialBase: 2,
    jitter: true,
  };

  /**
   * Execute a function with retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
    operationName = 'operation'
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const context: RetryContext = {
      attempt: 0,
      totalElapsed: 0,
      startTime: Date.now(),
    };

    this.logger.log(`Starting ${operationName} with retry strategy`, {
      maxAttempts: finalConfig.maxAttempts,
      baseDelay: finalConfig.baseDelay,
    });

    while (context.attempt < finalConfig.maxAttempts) {
      context.attempt++;
      context.totalElapsed = Date.now() - context.startTime;

      try {
        this.logger.debug(`Attempt ${context.attempt}/${finalConfig.maxAttempts} for ${operationName}`);
        
        const result = await operation();
        
        if (context.attempt > 1) {
          this.logger.log(`${operationName} succeeded on attempt ${context.attempt}`, {
            totalElapsed: context.totalElapsed,
          });
        }
        
        return result;
      } catch (error) {
        context.lastError = error as Error;
        
        this.logger.warn(`Attempt ${context.attempt} failed for ${operationName}`, {
          error: error.message,
          attempt: context.attempt,
          maxAttempts: finalConfig.maxAttempts,
        });

        // If this was the last attempt, throw the error
        if (context.attempt >= finalConfig.maxAttempts) {
          this.logger.error(`All ${finalConfig.maxAttempts} attempts failed for ${operationName}`, {
            totalElapsed: context.totalElapsed,
            lastError: error.message,
          });
          throw error;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error as Error)) {
          this.logger.error(`Non-retryable error for ${operationName}`, {
            error: error.message,
          });
          throw error;
        }

        // Calculate delay and wait
        const delay = this.calculateDelay(context.attempt, finalConfig);
        this.logger.debug(`Waiting ${delay}ms before retry ${context.attempt + 1}`);
        
        await this.sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw context.lastError || new Error('Maximum retry attempts exceeded');
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    
    // AI API specific retryable errors
    const retryablePatterns = [
      'rate limit',
      'rate_limit',
      'quota exceeded',
      'timeout',
      'connection',
      'network',
      'temporary',
      'service unavailable',
      'internal server error',
      'bad gateway',
      'gateway timeout',
      '429', // Too Many Requests
      '502', // Bad Gateway
      '503', // Service Unavailable
      '504', // Gateway Timeout
    ];

    return retryablePatterns.some(pattern => errorMessage.includes(pattern));
  }

  /**
   * Calculate delay for exponential backoff with jitter
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    // Exponential backoff: delay = baseDelay * (exponentialBase ^ (attempt - 1))
    let delay = config.baseDelay * Math.pow(config.exponentialBase, attempt - 1);
    
    // Cap at maxDelay
    delay = Math.min(delay, config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (config.jitter) {
      // Add random variance of ±25%
      const jitterRange = delay * 0.25;
      const jitter = (Math.random() - 0.5) * 2 * jitterRange;
      delay = Math.max(0, delay + jitter);
    }
    
    return Math.round(delay);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a specialized retry strategy for AI API calls
   */
  createAIRetryStrategy(provider: string): Partial<RetryConfig> {
    switch (provider.toLowerCase()) {
      case 'openai':
        return {
          maxAttempts: 3,
          baseDelay: 2000,
          maxDelay: 60000,
          exponentialBase: 2,
          jitter: true,
        };
      
      case 'anthropic':
        return {
          maxAttempts: 3,
          baseDelay: 1500,
          maxDelay: 45000,
          exponentialBase: 1.8,
          jitter: true,
        };
      
      default:
        return this.defaultConfig;
    }
  }

  /**
   * Wrap an AI provider method with retry logic
   */
  wrapWithRetry<T extends any[], R>(
    method: (...args: T) => Promise<R>,
    provider: string,
    operationName: string
  ): (...args: T) => Promise<R> {
    const retryConfig = this.createAIRetryStrategy(provider);
    
    return async (...args: T): Promise<R> => {
      return this.executeWithRetry(
        () => method(...args),
        retryConfig,
        `${provider}:${operationName}`
      );
    };
  }
}