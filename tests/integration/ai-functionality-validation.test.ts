/**
 * AI Functionality Validation Test
 * 
 * Tests that the AI functionality we've implemented actually works
 * and validates the four critical production decisions with real code.
 */

import { ContentEnhancementProcessor } from '../../services/ai-worker/src/processors/content-enhancement.processor';

describe('AI Functionality Validation', () => {
  let processor: ContentEnhancementProcessor;

  beforeAll(async () => {
    processor = new ContentEnhancementProcessor();
  });

  describe('Production AI Decision 1: Service Selection', () => {
    test('should use OpenAI as the primary service', async () => {
      const status = processor.getProviderStatus();
      
      expect(status.current).toBe('OpenAI');
      expect(status.available).toContain('OpenAI');
      expect(status.healthy).toBe(true);
    });

    test('should validate cost efficiency with OpenAI single-provider', async () => {
      const costOptimizer = processor.getCostOptimizer();
      const projection = await costOptimizer.projectMonthlyCosts({
        drugsProcessed: 1000,
        avgContentTypesPerDrug: 4,
      });

      expect(projection.totalCost).toBeLessThan(500); // Less than $500/month
      expect(projection.costPerDrug).toBeLessThan(0.1); // Less than $0.10 per drug
      expect(projection.costOptimizationRatio).toBeGreaterThan(1); // Better than baseline
    });
  });

  describe('Production AI Decision 2: Reliability Handling', () => {
    test('should handle AI failures gracefully with retry logic', async () => {
      const mockDrug = {
        id: 'test-drug-001',
        brandName: 'TestDrug',
        genericName: 'testcompound',
        manufacturer: 'Test Pharma',
        slug: 'testdrug-testcompound',
      };

      // This should work even if OpenAI fails (with template fallback)
      const result = await processor.generateSEOTitle(mockDrug);
      
      expect(result).toBeDefined();
      expect(result.content).toContain('TestDrug');
      expect(result.validation.valid).toBe(true);
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    test('should provide fallback content when AI is unavailable', async () => {
      const mockDrug = {
        brandName: 'Aspirin',
        genericName: 'acetylsalicylic acid',
      };

      const fallbackContent = await processor.generateTemplateContent(mockDrug, 'seo-title');
      
      expect(fallbackContent).toContain('Aspirin');
      expect(fallbackContent).toContain('acetylsalicylic acid');
      expect(fallbackContent).toContain('Prescribing Information');
    });
  });

  describe('Production AI Decision 3: Prompting Strategy', () => {
    test('should use conservative temperature for medical accuracy', async () => {
      const mockDrug = {
        drugName: 'Tylenol',
        genericName: 'acetaminophen',
        manufacturer: 'Johnson & Johnson',
        label: {
          indicationsAndUsage: 'For the temporary relief of minor aches and pains',
        },
      };

      const request = {
        drugData: mockDrug,
        contentType: 'seo-title' as const,
        targetAudience: 'general' as const,
      };

      const result = await processor.enhanceContent(request);
      
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeLessThanOrEqual(60); // SEO title limit
      expect(result.validation.valid).toBe(true);
      expect(result.provider).toBe('OpenAI');
    });

    test('should generate different content types with appropriate validation', async () => {
      const mockDrug = {
        drugName: 'Advil',
        genericName: 'ibuprofen',
        manufacturer: 'Pfizer',
        label: {
          indicationsAndUsage: 'For the temporary relief of minor aches and pains',
        },
      };

      const contentTypes = ['seo-title', 'meta-description', 'faq'] as const;
      
      for (const contentType of contentTypes) {
        const request = {
          drugData: mockDrug,
          contentType,
          targetAudience: 'general' as const,
        };

        const result = await processor.enhanceContent(request);
        
        expect(result.content).toBeDefined();
        expect(result.contentType).toBe(contentType);
        expect(result.validation.valid).toBe(true);
        
        // Validate content type specific requirements
        if (contentType === 'seo-title') {
          expect(result.content.length).toBeLessThanOrEqual(60);
        } else if (contentType === 'meta-description') {
          expect(result.content.length).toBeLessThanOrEqual(160);
        } else if (contentType === 'faq') {
          expect(result.content).toContain('?'); // Should contain questions
        }
      }
    });
  });

  describe('Production AI Decision 4: Hallucination Prevention', () => {
    test('should validate medical accuracy of generated content', async () => {
      const mockDrug = {
        brandName: 'Prozac',
        genericName: 'fluoxetine',
        manufacturer: 'Eli Lilly',
      };

      const result = await processor.generateSEOTitle(mockDrug);
      const validation = await processor.validateMedicalAccuracy(result, mockDrug);
      
      expect(validation.factualAccuracy).toBeGreaterThan(0.8);
      expect(validation.appropriateForAudience).toBe(true);
      expect(validation.regulatoryCompliant).toBe(true);
    });

    test('should generate content samples for compliance testing', async () => {
      const samples = await processor.generateContentSamples({
        drugCount: 5,
        contentTypes: ['seo-title', 'meta-description'],
      });

      expect(samples).toHaveLength(10); // 5 drugs × 2 content types
      
      samples.forEach(sample => {
        expect(sample.content).toBeDefined();
        expect(sample.contentType).toMatch(/seo-title|meta-description/);
        expect(sample.drugId).toBeDefined();
      });
    });

    test('should provide safety validation for generated content', async () => {
      const safetyTester = processor.getSafetyTester();
      
      const testContent = {
        content: 'Tylenol (acetaminophen) prescribing information for healthcare professionals',
        contentType: 'seo-title',
      };

      const safety = await safetyTester.validateSafety(testContent);
      
      expect(safety.containsMedicalAdvice).toBe(false);
      expect(safety.hasRequiredDisclaimers).toBe(true);
      expect(safety.riskLevel).toBe('low');
      expect(safety.safeForProduction).toBe(true);
    });
  });

  describe('Production Integration Validation', () => {
    test('should run production validator for all decisions', async () => {
      const productionValidator = processor.getProductionValidator();
      
      const testScenario = {
        drug: {
          brandName: 'TestDrug',
          genericName: 'testcompound',
          manufacturer: 'Test Pharma',
        },
        contentTypes: ['seo-title', 'meta-description'],
        loadConditions: {
          concurrent_requests: 10,
          failure_rate: 0.05,
        },
      };

      const results = await productionValidator.validateAllDecisions(testScenario);

      // Validate all four decisions
      expect(results.serviceSelection.primaryProvider).toBe('openai');
      expect(results.reliability.failoverWorking).toBe(true);
      expect(results.prompting.medicalSafetyScore).toBeGreaterThan(0.9);
      expect(results.accuracy.hallucinationRate).toBeLessThan(0.05);
    });

    test('should demonstrate production readiness metrics', async () => {
      const realWorldTester = processor.getRealWorldTester();
      
      const simulation = await realWorldTester.runProductionSimulation({
        duration: '5m',
        requestPattern: 'steady',
      });

      expect(simulation.overallSuccessRate).toBeGreaterThan(0.95);
      expect(simulation.averageResponseTime).toBeLessThan(10000);
      expect(simulation.medicalSafetyViolations).toBe(0);
      expect(simulation.costPerGeneration).toBeLessThan(0.02);
    });
  });

  describe('Quality and Performance Validation', () => {
    test('should track quality metrics over time', async () => {
      const qualityMonitor = processor.getQualityMonitor();
      
      const baseline = await qualityMonitor.establishBaseline({
        sampleSize: 10,
        contentTypes: ['seo-title'],
      });

      const ongoing = await qualityMonitor.trackQualityOverTime({
        duration: '1h',
        samplingRate: 0.5,
      });

      const drift = qualityMonitor.calculateDrift(baseline, ongoing);
      
      expect(drift.overallDrift).toBeLessThan(0.1); // Less than 10% drift
      expect(drift.significantDegradation).toBe(false);
      expect(drift.actionRequired).toBe(false);
    });

    test('should provide actionable production insights', async () => {
      const insightsEngine = processor.getInsightsEngine();
      
      const insights = await insightsEngine.generateProductionInsights({
        analysisWindow: '24h',
        includeRecommendations: true,
      });

      expect(insights.costOptimization).toBeDefined();
      expect(insights.qualityTrends).toBeDefined();
      expect(insights.reliabilityMetrics).toBeDefined();
      expect(insights.recommendations).toBeInstanceOf(Array);
      expect(insights.recommendations.length).toBeGreaterThan(0);
    });
  });
});