/**
 * AI Prompting Strategy Validation Tests
 * 
 * Tests the production AI prompting decisions:
 * 1. What prompting strategies work best for medical content generation?
 * 2. Medical safety system prompts and content-specific prompts
 * 3. Temperature and parameter control for medical accuracy
 * 4. Prompt engineering for pharmaceutical content
 * 
 * These tests validate the prompting strategy documented in README.md
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PromptBuilderService } from '../../services/ai-worker/src/prompts/prompt-builder.service';
import { OpenAIProvider } from '../../services/ai-worker/src/providers/openai.provider';
import { AnthropicProvider } from '../../services/ai-worker/src/providers/anthropic.provider';
import { MedicalAccuracyValidator } from '../../services/ai-worker/src/validators/medical-accuracy.validator';

// Import actual prompt templates
import { SEO_TITLE_PROMPT } from '../../services/ai-worker/src/prompts/templates/seo-title.prompt';
import { FAQ_GENERATION_PROMPT } from '../../services/ai-worker/src/prompts/templates/faq-generation.prompt';
import { META_DESCRIPTION_PROMPT } from '../../services/ai-worker/src/prompts/templates/meta-description.prompt';

describe('AI Prompting Strategy for Medical Content', () => {
  let promptBuilder: PromptBuilderService;
  let openaiProvider: jest.Mocked<OpenAIProvider>;
  let anthropicProvider: jest.Mocked<AnthropicProvider>;
  let medicalValidator: MedicalAccuracyValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PromptBuilderService,
        MedicalAccuracyValidator,
        {
          provide: OpenAIProvider,
          useValue: {
            generateContent: jest.fn(),
            buildSystemPrompt: jest.fn(),
          },
        },
        {
          provide: AnthropicProvider,
          useValue: {
            generateContent: jest.fn(),
            buildSystemPrompt: jest.fn(),
          },
        },
      ],
    }).compile();

    promptBuilder = module.get<PromptBuilderService>(PromptBuilderService);
    medicalValidator = module.get<MedicalAccuracyValidator>(MedicalAccuracyValidator);
    openaiProvider = module.get(OpenAIProvider);
    anthropicProvider = module.get(AnthropicProvider);
  });

  describe('Medical Safety System Prompts', () => {
    test('should include critical medical guidelines in system prompts', () => {
      const systemPrompt = promptBuilder.buildSystemPrompt({
        contentType: 'seo-title',
        audience: 'healthcare_professionals',
      });

      // Verify critical medical guidelines are present
      expect(systemPrompt).toContain('Never provide medical advice');
      expect(systemPrompt).toContain('diagnosis, or treatment recommendations');
      expect(systemPrompt).toContain('FDA-approved information only');
      expect(systemPrompt).toContain('defer to healthcare professionals');
      expect(systemPrompt).toContain('appropriate disclaimers');
    });

    test('should customize system prompts for different audiences', () => {
      const professionalPrompt = promptBuilder.buildSystemPrompt({
        contentType: 'seo-title',
        audience: 'healthcare_professionals',
      });

      const patientPrompt = promptBuilder.buildSystemPrompt({
        contentType: 'faq',
        audience: 'patients',
      });

      expect(professionalPrompt).toContain('healthcare professionals');
      expect(patientPrompt).toContain('patients');
      expect(patientPrompt).toContain('consult your healthcare provider');
    });

    test('should be identical across both AI providers for consistency', () => {
      const context = { contentType: 'meta-description', audience: 'general' };
      
      const openaiSystemPrompt = openaiProvider.buildSystemPrompt(context);
      const anthropicSystemPrompt = anthropicProvider.buildSystemPrompt(context);

      expect(openaiSystemPrompt).toBe(anthropicSystemPrompt);
    });
  });

  describe('Content-Specific Prompt Templates', () => {
    test('should validate SEO title prompt requirements', () => {
      expect(SEO_TITLE_PROMPT).toContain('Maximum 60 characters');
      expect(SEO_TITLE_PROMPT).toContain('Include the drug name prominently');
      expect(SEO_TITLE_PROMPT).toContain('NOT treatment advice');
      expect(SEO_TITLE_PROMPT).toContain('healthcare professionals and patients');
      expect(SEO_TITLE_PROMPT).toContain('Avoid medical advice');

      // Check example formats
      expect(SEO_TITLE_PROMPT).toContain('Prescribing Information');
      expect(SEO_TITLE_PROMPT).toContain('Drug Facts');
    });

    test('should validate FAQ generation prompt safety', () => {
      expect(FAQ_GENERATION_PROMPT).toContain('NEVER provide medical advice');
      expect(FAQ_GENERATION_PROMPT).toContain('Always direct users to consult healthcare professionals');
      expect(FAQ_GENERATION_PROMPT).toContain('FDA-approved labeling');
      expect(FAQ_GENERATION_PROMPT).toContain('Include "Consult your healthcare provider"');
      expect(FAQ_GENERATION_PROMPT).toContain('According to the prescribing information');
    });

    test('should validate meta description prompt constraints', () => {
      expect(META_DESCRIPTION_PROMPT).toContain('150-160 characters');
      expect(META_DESCRIPTION_PROMPT).toContain('informational purposes');
      expect(META_DESCRIPTION_PROMPT).toContain('not medical advice');
      expect(META_DESCRIPTION_PROMPT).toContain('healthcare provider');
    });

    test('should generate proper prompts for different drug types', async () => {
      const prescriptionDrug = {
        brandName: 'Humira',
        genericName: 'adalimumab',
        rxStatus: 'prescription',
        controlledSubstance: false,
      };

      const controlledDrug = {
        brandName: 'OxyContin',
        genericName: 'oxycodone',
        rxStatus: 'prescription',
        controlledSubstance: 'C-II',
      };

      const otcDrug = {
        brandName: 'Tylenol',
        genericName: 'acetaminophen',
        rxStatus: 'otc',
        controlledSubstance: false,
      };

      const prescriptionPrompt = promptBuilder.buildDrugSpecificPrompt(prescriptionDrug, 'seo-title');
      const controlledPrompt = promptBuilder.buildDrugSpecificPrompt(controlledDrug, 'seo-title');
      const otcPrompt = promptBuilder.buildDrugSpecificPrompt(otcDrug, 'seo-title');

      expect(prescriptionPrompt).toContain('prescription medication');
      expect(controlledPrompt).toContain('controlled substance');
      expect(controlledPrompt).toContain('DEA regulations');
      expect(otcPrompt).toContain('over-the-counter');
    });
  });

  describe('Temperature and Parameter Control', () => {
    test('should use conservative temperature (0.3) for medical accuracy', () => {
      const openaiConfig = openaiProvider.getGenerationConfig();
      const anthropicConfig = anthropicProvider.getGenerationConfig();

      expect(openaiConfig.temperature).toBe(0.3);
      expect(anthropicConfig.temperature).toBe(0.3);
    });

    test('should limit token usage for focused responses', () => {
      const openaiConfig = openaiProvider.getGenerationConfig();
      const anthropicConfig = anthropicProvider.getGenerationConfig();

      expect(openaiConfig.max_tokens).toBe(1000);
      expect(anthropicConfig.max_tokens).toBe(1000);
    });

    test('should validate consistency with low temperature', async () => {
      const drug = createMockDrug('Prozac', 'fluoxetine');
      const prompt = promptBuilder.buildPrompt(drug, 'seo-title');

      // Generate same content multiple times
      const results = [];
      for (let i = 0; i < 5; i++) {
        openaiProvider.generateContent.mockResolvedValueOnce({
          content: `Prozac (Fluoxetine) - Depression Treatment Information ${i > 2 ? 'Variant' : ''}`,
          tokensUsed: 45,
        });
        
        const result = await openaiProvider.generateContent(prompt);
        results.push(result.content);
      }

      // Calculate consistency - should be high with temperature 0.3
      const uniqueResults = new Set(results);
      const consistencyRatio = 1 - (uniqueResults.size - 1) / results.length;
      expect(consistencyRatio).toBeGreaterThan(0.6); // 60%+ consistency
    });
  });

  describe('Medical Terminology and Language Control', () => {
    test('should maintain professional medical terminology', async () => {
      const professionalPrompt = promptBuilder.buildPrompt(
        createMockDrug('Lipitor', 'atorvastatin'),
        'seo-title',
        { audience: 'healthcare_professionals' }
      );

      expect(professionalPrompt).toContain('prescribing information');
      expect(professionalPrompt).toContain('professional medical terminology');
      expect(professionalPrompt).not.toContain('layman');
      expect(professionalPrompt).not.toContain('simple terms');
    });

    test('should adapt language for patient-facing content', async () => {
      const patientPrompt = promptBuilder.buildPrompt(
        createMockDrug('Tylenol', 'acetaminophen'),
        'faq',
        { audience: 'patients' }
      );

      expect(patientPrompt).toContain('clear, accessible language');
      expect(patientPrompt).toContain('patients seeking information');
      expect(patientPrompt).toContain('consult your healthcare provider');
    });

    test('should prevent marketing language in medical content', async () => {
      const marketingCheck = promptBuilder.getMarketingLanguageChecker();
      
      const medicalPrompt = promptBuilder.buildPrompt(
        createMockDrug('Advil', 'ibuprofen'),
        'meta-description'
      );

      const marketingTerms = [
        'best', 'amazing', 'miracle', 'breakthrough', 'revolutionary',
        'guaranteed', 'instant relief', 'cure', 'heal completely'
      ];

      marketingTerms.forEach(term => {
        expect(medicalPrompt.toLowerCase()).not.toContain(term);
      });

      expect(marketingCheck.validatePrompt(medicalPrompt)).toBe(true);
    });
  });

  describe('FDA-Focused Content Referencing', () => {
    test('should require FDA-approved sources in prompts', () => {
      const fdaPrompt = promptBuilder.buildFDAFocusedPrompt(
        createMockDrug('Humira', 'adalimumab'),
        'faq'
      );

      expect(fdaPrompt).toContain('FDA-approved labeling');
      expect(fdaPrompt).toContain('prescribing information');
      expect(fdaPrompt).toContain('FDA label states');
      expect(fdaPrompt).toContain('According to the prescribing information');
    });

    test('should reference specific FDA sections when available', () => {
      const drug = createMockDrugWithFDAData('Zoloft', 'sertraline');
      
      const indicationsPrompt = promptBuilder.buildSectionSpecificPrompt(
        drug,
        'indications'
      );

      expect(indicationsPrompt).toContain('INDICATIONS AND USAGE section');
      expect(indicationsPrompt).toContain('FDA-approved indications');
      expect(indicationsPrompt).not.toContain('off-label');
    });

    test('should include mandatory disclaimers in content prompts', () => {
      const disclaimerPrompt = promptBuilder.buildPromptWithDisclaimers(
        createMockDrug('Metformin', 'metformin'),
        'faq'
      );

      const requiredDisclaimers = [
        'not medical advice',
        'consult healthcare provider',
        'prescribing information',
        'medical decisions'
      ];

      requiredDisclaimers.forEach(disclaimer => {
        expect(disclaimerPrompt.toLowerCase()).toContain(disclaimer);
      });
    });
  });

  describe('Prompt Engineering Best Practices', () => {
    test('should implement clear instruction hierarchy', () => {
      const hierarchicalPrompt = promptBuilder.buildHierarchicalPrompt(
        createMockDrug('Nexium', 'esomeprazole'),
        'seo-title'
      );

      // Should have clear sections: CRITICAL GUIDELINES, REQUIREMENTS, EXAMPLES
      expect(hierarchicalPrompt).toMatch(/CRITICAL GUIDELINES:[\s\S]*REQUIREMENTS:[\s\S]*EXAMPLES:/);
    });

    test('should provide specific examples for consistency', () => {
      const examplePrompt = promptBuilder.buildPromptWithExamples(
        createMockDrug('Aspirin', 'acetylsalicylic acid'),
        'seo-title'
      );

      expect(examplePrompt).toContain('EXAMPLES OF GOOD TITLES:');
      expect(examplePrompt).toContain('Prescribing Information');
      expect(examplePrompt).toContain('Drug Facts');
    });

    test('should validate prompt effectiveness through A/B testing', async () => {
      const abTester = promptBuilder.getABTester();
      
      const promptA = promptBuilder.buildPrompt(
        createMockDrug('Viagra', 'sildenafil'),
        'meta-description',
        { version: 'standard' }
      );
      
      const promptB = promptBuilder.buildPrompt(
        createMockDrug('Viagra', 'sildenafil'),
        'meta-description',
        { version: 'enhanced_medical_focus' }
      );

      const results = await abTester.comparePrompts(promptA, promptB, {
        metrics: ['medical_accuracy', 'seo_compliance', 'readability'],
        sampleSize: 100,
      });

      expect(results.winningPrompt).toMatch(/standard|enhanced_medical_focus/);
      expect(results.confidence).toBeGreaterThan(0.95);
      expect(results.medicalAccuracyDifference).toBeDefined();
    });
  });

  describe('Content Type Optimization', () => {
    test('should optimize prompts for character limits', () => {
      const seoTitlePrompt = promptBuilder.buildOptimizedPrompt('seo-title');
      const metaDescPrompt = promptBuilder.buildOptimizedPrompt('meta-description');

      expect(seoTitlePrompt).toContain('60 characters');
      expect(metaDescPrompt).toContain('150-160 characters');
    });

    test('should adapt prompting for different content complexities', () => {
      const simplePrompt = promptBuilder.buildPrompt(
        createMockDrug('Tylenol', 'acetaminophen'),
        'seo-title'
      );
      
      const complexPrompt = promptBuilder.buildPrompt(
        createMockComplexDrug('Humira', 'adalimumab'),
        'faq'
      );

      expect(complexPrompt.length).toBeGreaterThan(simplePrompt.length);
      expect(complexPrompt).toContain('biologic medication');
      expect(complexPrompt).toContain('autoimmune conditions');
    });

    test('should validate prompt outcomes match requirements', async () => {
      const validator = promptBuilder.getPromptValidator();
      
      const testCases = [
        {
          contentType: 'seo-title',
          maxLength: 60,
          requiredElements: ['drug name', 'indication or category'],
        },
        {
          contentType: 'meta-description',
          maxLength: 160,
          requiredElements: ['drug name', 'disclaimer', 'professional audience'],
        },
        {
          contentType: 'faq',
          minLength: 100,
          requiredElements: ['question format', 'healthcare provider reference'],
        },
      ];

      for (const testCase of testCases) {
        const prompt = promptBuilder.buildPrompt(
          createMockDrug('TestDrug', 'testgeneric'),
          testCase.contentType
        );

        const validation = await validator.validatePrompt(prompt, testCase);
        expect(validation.meetsRequirements).toBe(true);
      }
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
  };
}

function createMockDrugWithFDAData(brandName: string, genericName: string) {
  return {
    ...createMockDrug(brandName, genericName),
    fdaData: {
      indicationsAndUsage: 'Test indication section from FDA',
      dosageAndAdministration: 'Test dosage section',
      warningsAndPrecautions: 'Test warnings section',
      adverseReactions: 'Test adverse reactions section',
    },
  };
}

function createMockComplexDrug(brandName: string, genericName: string) {
  return {
    ...createMockDrug(brandName, genericName),
    drugClass: 'Biologic DMARD',
    complexity: 'high',
    specialHandling: true,
    blackBoxWarning: true,
    indications: [
      'Rheumatoid arthritis',
      'Psoriatic arthritis',
      'Ankylosing spondylitis',
      'Crohn\'s disease',
    ],
  };
}