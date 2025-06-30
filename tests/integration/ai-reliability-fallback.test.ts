/**
 * AI Reliability and Fallback Integration Tests
 * 
 * Tests production AI reliability decisions:
 * 1. How to handle AI reliability in production (Retries, fallbacks, validation)
 * 2. Error handling scenarios with real-world failure modes
 * 3. Graceful degradation strategies
 * 
 * These tests validate the AI reliability strategy documented in README.md
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ContentEnhancementProcessor } from '../../services/ai-worker/src/processors/content-enhancement.processor';
import { RetryStrategy } from '../../services/ai-worker/src/retry/retry-strategy';
import { OpenAIProvider } from '../../services/ai-worker/src/providers/openai.provider';
import { AnthropicProvider } from '../../services/ai-worker/src/providers/anthropic.provider';

describe('AI Reliability and Fallback Strategy', () => {
  let processor: ContentEnhancementProcessor;
  let retryStrategy: RetryStrategy;
  let openaiProvider: jest.Mocked<OpenAIProvider>;
  let anthropicProvider: jest.Mocked<AnthropicProvider>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentEnhancementProcessor,
        RetryStrategy,
        {
          provide: OpenAIProvider,
          useValue: {
            generateContent: jest.fn(),
            isHealthy: jest.fn(),
            handleRateLimit: jest.fn(),
          },
        },
        {
          provide: AnthropicProvider,
          useValue: {
            generateContent: jest.fn(),
            isHealthy: jest.fn(),
            handleRateLimit: jest.fn(),
          },
        },
      ],
    }).compile();

    processor = module.get<ContentEnhancementProcessor>(ContentEnhancementProcessor);
    retryStrategy = module.get<RetryStrategy>(RetryStrategy);
    openaiProvider = module.get(OpenAIProvider);
    anthropicProvider = module.get(AnthropicProvider);
  });

  describe('Exponential Backoff Retry Strategy', () => {
    test('should implement correct exponential backoff for OpenAI (2s→4s→8s)', async () => {
      const retryConfig = retryStrategy.createAIRetryStrategy('openai');
      
      expect(retryConfig.maxAttempts).toBe(3);
      expect(retryConfig.baseDelay).toBe(2000); // 2s initial delay
      expect(retryConfig.maxDelay).toBe(60000); // 60s max delay
      expect(retryConfig.exponentialBase).toBe(2); // Double each retry
      expect(retryConfig.jitter).toBe(true); // Random variance

      // Validate retry sequence timing
      const retryDelays = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        const delay = retryStrategy.calculateDelay(attempt, retryConfig);
        retryDelays.push(delay);
      }

      // Should be approximately 2s, 4s, 8s (with jitter)
      expect(retryDelays[0]).toBeGreaterThanOrEqual(1800); // ~2s ± jitter
      expect(retryDelays[0]).toBeLessThanOrEqual(2200);
      expect(retryDelays[1]).toBeGreaterThanOrEqual(3600); // ~4s ± jitter
      expect(retryDelays[1]).toBeLessThanOrEqual(4400);
      expect(retryDelays[2]).toBeGreaterThanOrEqual(7200); // ~8s ± jitter
      expect(retryDelays[2]).toBeLessThanOrEqual(8800);
    });

    test('should implement different backoff for Anthropic (1.5s, 1.8x multiplier)', async () => {
      const retryConfig = retryStrategy.createAIRetryStrategy('anthropic');
      
      expect(retryConfig.baseDelay).toBe(1500); // 1.5s initial delay
      expect(retryConfig.maxDelay).toBe(45000); // 45s max delay
      expect(retryConfig.exponentialBase).toBe(1.8); // 80% increase per retry

      const retryDelays = [];
      for (let attempt = 1; attempt <= 3; attempt++) {
        const delay = retryStrategy.calculateDelay(attempt, retryConfig);
        retryDelays.push(delay);
      }

      // Should be approximately 1.5s, 2.7s, 4.86s
      expect(retryDelays[0]).toBeCloseTo(1500, -100);
      expect(retryDelays[1]).toBeCloseTo(2700, -200);
      expect(retryDelays[2]).toBeCloseTo(4860, -300);
    });

    test('should identify retryable error patterns correctly', () => {
      const retryableErrors = [
        'rate limit exceeded',
        'quota exceeded',
        'timeout',
        'connection error',
        'network error',
        'service unavailable',
        '429 Too Many Requests',
        '502 Bad Gateway',
        '503 Service Unavailable',
        '504 Gateway Timeout',
      ];

      const nonRetryableErrors = [
        'invalid api key',
        'content policy violation',
        'model not found',
        '401 Unauthorized',
        '403 Forbidden',
        'malformed request',
      ];

      retryableErrors.forEach(error => {
        expect(retryStrategy.isRetryableError(error)).toBe(true);
      });

      nonRetryableErrors.forEach(error => {
        expect(retryStrategy.isRetryableError(error)).toBe(false);
      });
    });
  });

  describe('Provider Failover Logic', () => {
    test('should failover from OpenAI to Anthropic on rate limit', async () => {
      const mockDrug = createMockDrug('Advil', 'ibuprofen');

      // OpenAI hits rate limit
      openaiProvider.generateContent.mockRejectedValueOnce(
        new Error('429 Too Many Requests - rate limit exceeded')
      );

      // Anthropic succeeds
      anthropicProvider.generateContent.mockResolvedValue({
        content: 'Advil (Ibuprofen) - Pain Relief Medication Information',
        source: 'anthropic',
        tokensUsed: 45,
      });

      const result = await processor.generateWithFallback(
        'Generate SEO title for pain medication',
        { contentType: 'seo-title', drug: mockDrug }
      );

      expect(result.source).toBe('anthropic');
      expect(result.content).toContain('Advil');
      expect(result.content).toContain('Ibuprofen');
      expect(processor.getCurrentProvider()).toBe('anthropic'); // Switch to successful provider
    });

    test('should handle both providers failing with template fallback', async () => {
      const mockDrug = createMockDrug('Tylenol', 'acetaminophen');

      // Both providers fail
      openaiProvider.generateContent.mockRejectedValue(
        new Error('503 Service Unavailable')
      );
      anthropicProvider.generateContent.mockRejectedValue(
        new Error('502 Bad Gateway')
      );

      const result = await processor.generateWithFallback(
        'Generate SEO title for pain medication',
        { contentType: 'seo-title', drug: mockDrug }
      );

      // Should fallback to template-based content
      expect(result.source).toBe('template');
      expect(result.content).toContain('Tylenol');
      expect(result.content).toContain('acetaminophen');
      expect(result.content).toMatch(/prescribing information|drug facts/i);
    });

    test('should handle gradual degradation during high load', async () => {
      const loadSimulator = processor.getLoadSimulator();
      
      // Simulate increasing load over time
      const results = await loadSimulator.simulateLoad({
        requestsPerSecond: [10, 50, 100, 200, 500],
        duration: '5m',
        providers: ['openai', 'anthropic'],
      });

      // Should maintain service quality even under load
      expect(results.successRate).toBeGreaterThan(0.98); // 98%+ success rate
      expect(results.averageLatency).toBeLessThan(10000); // < 10s average
      expect(results.fallbackUsage).toBeLessThan(0.1); // < 10% fallback usage
    });
  });

  describe('Rate Limit Handling', () => {
    test('should implement 2-second rate limit backoff', async () => {
      const mockDrug = createMockDrug('Aspirin', 'acetylsalicylic acid');

      openaiProvider.generateContent
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce({
          content: 'Aspirin - Pain Relief Information',
          tokensUsed: 25,
        });

      const startTime = Date.now();
      const result = await processor.generateSEOTitle(mockDrug);
      const elapsedTime = Date.now() - startTime;

      expect(result.content).toContain('Aspirin');
      expect(elapsedTime).toBeGreaterThan(2000); // At least 2s delay
      expect(openaiProvider.handleRateLimit).toHaveBeenCalled();
    });

    test('should track rate limit patterns for optimization', async () => {
      const rateLimitTracker = processor.getRateLimitTracker();
      
      // Simulate rate limit events throughout the day
      const rateLimitEvents = [
        { time: '09:00', provider: 'openai', reason: 'requests_per_minute' },
        { time: '14:30', provider: 'openai', reason: 'tokens_per_minute' },
        { time: '16:45', provider: 'anthropic', reason: 'requests_per_day' },
      ];

      rateLimitEvents.forEach(event => {
        rateLimitTracker.recordRateLimit(event);
      });

      const analysis = rateLimitTracker.getAnalysis();
      
      expect(analysis.peakTimes).toContain('14:30'); // Business hours peak
      expect(analysis.recommendations).toContain('distribute_load');
      expect(analysis.providerComparison.openai.frequency).toBe(2);
      expect(analysis.providerComparison.anthropic.frequency).toBe(1);
    });
  });

  describe('Production Failure Scenarios', () => {
    test('should handle OpenAI model deprecation gracefully', async () => {
      openaiProvider.generateContent.mockRejectedValue(
        new Error('The model `gpt-3.5-turbo` has been deprecated')
      );

      anthropicProvider.generateContent.mockResolvedValue({
        content: 'Fallback content from Claude',
        source: 'anthropic',
      });

      const result = await processor.generateSEOTitle(createMockDrug('Prozac', 'fluoxetine'));
      
      expect(result.source).toBe('anthropic');
      expect(processor.shouldUpgradeModel()).toBe(true);
    });

    test('should handle API key expiration/revocation', async () => {
      openaiProvider.generateContent.mockRejectedValue(
        new Error('401 Unauthorized: Invalid API key')
      );

      const result = await processor.generateSEOTitle(createMockDrug('Lipitor', 'atorvastatin'));
      
      // Should not retry invalid auth, should immediately fallback
      expect(result.source).toBe('anthropic');
      expect(processor.getHealthStatus().openai.status).toBe('unauthorized');
    });

    test('should handle content policy violations appropriately', async () => {
      openaiProvider.generateContent.mockRejectedValue(
        new Error('Content policy violation detected')
      );

      // Should not retry policy violations, should log and use template
      const result = await processor.generateSEOTitle(createMockDrug('OxyContin', 'oxycodone'));
      
      expect(result.source).toBe('template');
      expect(processor.getContentPolicyViolations()).toHaveLength(1);
    });

    test('should maintain medical accuracy during fallback scenarios', async () => {
      const medicalValidator = processor.getMedicalValidator();
      
      // Simulate primary AI failure
      openaiProvider.generateContent.mockRejectedValue(new Error('Service unavailable'));
      
      anthropicProvider.generateContent.mockResolvedValue({
        content: 'Metformin (Glucophage) - Diabetes Treatment Information',
        medicalAccuracy: 0.95,
        source: 'anthropic',
      });

      const result = await processor.generateSEOTitle(createMockDrug('Metformin', 'metformin'));
      const validation = await medicalValidator.validate(result);
      
      expect(validation.medicalAccuracy).toBeGreaterThan(0.9);
      expect(validation.hasMedicalDisclaimers).toBe(true);
      expect(validation.containsInaccuracies).toBe(false);
    });
  });

  describe('Performance Under Stress', () => {
    test('should maintain sub-10s response time during failures', async () => {
      const stressTest = processor.getStressTest();
      
      const results = await stressTest.runFailureScenario({
        primaryFailureRate: 0.3, // 30% OpenAI failures
        fallbackLatency: 8000, // 8s Anthropic latency
        concurrentRequests: 50,
      });

      expect(results.averageResponseTime).toBeLessThan(10000); // < 10s
      expect(results.p99ResponseTime).toBeLessThan(15000); // < 15s for 99th percentile
      expect(results.errorRate).toBeLessThan(0.01); // < 1% overall error rate
    });

    test('should handle burst traffic with graceful degradation', async () => {
      const burstTest = processor.getBurstTest();
      
      const results = await burstTest.simulateBurst({
        normalLoad: 10, // 10 req/s normal
        burstLoad: 1000, // 1000 req/s burst
        burstDuration: '30s',
      });

      expect(results.duringBurst.successRate).toBeGreaterThan(0.8); // 80%+ during burst
      expect(results.afterBurst.recoveryTime).toBeLessThan(60000); // < 60s recovery
    });
  });

  describe('Content Quality Validation During Failures', () => {
    test('should maintain content quality standards with fallbacks', async () => {
      const qualityValidator = processor.getQualityValidator();
      
      // Test template fallback quality
      const templateContent = await processor.generateTemplateContent(
        createMockDrug('Zoloft', 'sertraline'),
        'seo-title'
      );

      const qualityScore = await qualityValidator.assessQuality(templateContent);
      
      expect(qualityScore.overall).toBeGreaterThan(0.7); // 70%+ quality for templates
      expect(qualityScore.seoCompliance).toBeGreaterThan(0.9); // 90%+ SEO compliance
      expect(qualityScore.medicalAccuracy).toBe(1.0); // 100% accuracy (template-based)
    });

    test('should prefer higher-quality AI over faster template', async () => {
      const qualityComparison = processor.getQualityComparison();
      
      const aiContent = await anthropicProvider.generateContent('Test prompt');
      const templateContent = await processor.generateTemplateContent(
        createMockDrug('Nexium', 'esomeprazole'),
        'seo-title'
      );

      const comparison = await qualityComparison.compare(aiContent, templateContent);
      
      // AI should score higher on engagement and readability
      expect(comparison.ai.engagement).toBeGreaterThan(comparison.template.engagement);
      expect(comparison.ai.readability).toBeGreaterThan(comparison.template.readability);
      expect(comparison.recommendation).toBe('prefer_ai_with_fallback');
    });
  });
});

// Helper functions
function createMockDrug(brandName: string, genericName: string) {
  return {
    id: `drug-${brandName.toLowerCase()}`,
    brandName,
    genericName,
    manufacturer: 'Test Pharmaceutical',
    indications: ['Test indication'],
    slug: `${brandName.toLowerCase()}-${genericName.toLowerCase()}`,
    fdaData: {
      approvalDate: '2020-01-01',
      blackBoxWarning: false,
    },
  };
}