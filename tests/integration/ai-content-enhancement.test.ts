import { ContentEnhancementProcessor } from '../../services/ai-worker/src/processors/content-enhancement.processor';
import { SEOTitlePrompt } from '../../services/ai-worker/src/prompts/templates/seo-title.prompt';
import { MetaDescriptionPrompt } from '../../services/ai-worker/src/prompts/templates/meta-description.prompt';
import { FAQGenerationPrompt } from '../../services/ai-worker/src/prompts/templates/faq-generation.prompt';
import { RelatedDrugsPrompt } from '../../services/ai-worker/src/prompts/templates/related-drugs.prompt';
import { ContentQualityValidator } from '../../services/ai-worker/src/validators/content-quality.validator';
import { MedicalAccuracyValidator } from '../../services/ai-worker/src/validators/medical-accuracy.validator';

describe('AI-Powered Content Enhancement', () => {
  const mockDrugData = {
    drugName: 'Taltz',
    genericName: 'ixekizumab',
    manufacturer: 'Eli Lilly and Company',
    label: {
      indicationsAndUsage: 'Taltz is indicated for the treatment of adults with moderate-to-severe plaque psoriasis who are candidates for systemic therapy or phototherapy.',
      dosageAndAdministration: 'The recommended dose is 160 mg (two 80 mg injections) administered by subcutaneous injection at Weeks 0, 2, 4, 6, 8, 10, and 12, followed by 80 mg every 4 weeks.',
      warningsAndPrecautions: 'Increased risk of serious infections that may lead to hospitalization or death. Most patients who developed these infections were taking concomitant immunosuppressants.',
      contraindications: 'Taltz is contraindicated in patients with a previous serious hypersensitivity reaction to ixekizumab or to any of the excipients.',
      adverseReactions: 'The most commonly reported adverse reactions (≥1%) in psoriasis clinical trials were injection site reactions (17%), upper respiratory tract infections (13%), nausea (1%), and tinea infections (1%).'
    }
  };

  describe('SEO-Optimized Title Generation', () => {
    test('should generate title under 60 characters', () => {
      const prompt = SEOTitlePrompt.generate(mockDrugData);
      expect(prompt).toContain('Taltz');
      expect(prompt).toContain('60 characters');
      
      // Mock AI response
      const generatedTitle = 'Taltz (ixekizumab) - Psoriasis Treatment | PharmaIQ';
      const validation = SEOTitlePrompt.validate(generatedTitle);
      
      expect(validation.valid).toBe(true);
      expect(generatedTitle.length).toBeLessThanOrEqual(60);
    });

    test('should include drug name prominently', () => {
      const title = 'Taltz Prescribing Information - Drug Facts';
      const validation = SEOTitlePrompt.validate(title);
      
      expect(validation.valid).toBe(true);
      expect(title).toContain('Taltz');
    });

    test('should reject titles with medical advice language', () => {
      const badTitle = 'Taltz - Best Treatment for Psoriasis, Should Take Daily';
      const validation = SEOTitlePrompt.validate(badTitle);
      
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Title contains medical advice language');
    });

    test('should optimize titles that are too long', () => {
      const longTitle = 'Taltz (ixekizumab) Complete Treatment Guide for Moderate to Severe Plaque Psoriasis Patients';
      const optimized = SEOTitlePrompt.optimize(longTitle, 'Taltz');
      
      expect(optimized.length).toBeLessThanOrEqual(60);
      expect(optimized).toContain('Taltz');
    });
  });

  describe('Meta Description Generation', () => {
    test('should generate description under 160 characters', () => {
      const prompt = MetaDescriptionPrompt.generate(mockDrugData);
      expect(prompt).toContain('150-160 characters');
      
      // Mock AI response
      const description = 'Learn about Taltz (ixekizumab) for moderate-to-severe plaque psoriasis. Find prescribing information, dosage, side effects from Eli Lilly.';
      const validation = MetaDescriptionPrompt.validate(description);
      
      expect(validation.valid).toBe(true);
      expect(description.length).toBeLessThanOrEqual(160);
      expect(description.length).toBeGreaterThanOrEqual(120);
    });

    test('should include action words', () => {
      const description = 'Discover comprehensive Taltz prescribing information including dosage, contraindications, and safety data for healthcare professionals.';
      const validation = MetaDescriptionPrompt.validate(description);
      
      expect(validation.valid).toBe(true);
      expect(description).toMatch(/\b(learn|discover|find|explore)\b/i);
    });

    test('should optimize descriptions with drug names', () => {
      const description = 'Complete prescribing information for psoriasis treatment.';
      const optimized = MetaDescriptionPrompt.optimize(description, 'Taltz', 'ixekizumab');
      
      expect(optimized).toContain('Taltz');
      expect(optimized.length).toBeLessThanOrEqual(160);
    });
  });

  describe('FAQ Generation', () => {
    test('should generate proper FAQ format', () => {
      const prompt = FAQGenerationPrompt.generate(mockDrugData, { numberOfQuestions: 5 });
      expect(prompt).toContain('5 frequently asked questions');
      
      // Mock AI response
      const faqContent = `Q: What is Taltz used for?
A: According to FDA prescribing information, Taltz is approved for moderate-to-severe plaque psoriasis. Consult your healthcare provider for proper evaluation.

Q: How is Taltz administered?
A: The prescribing information states Taltz is given by subcutaneous injection. Your healthcare provider will determine the appropriate dosing schedule.`;

      const validation = FAQGenerationPrompt.validate(faqContent);
      expect(validation.valid).toBe(true);
      expect(validation.questions).toBe(2);
    });

    test('should extract Q&A pairs correctly', () => {
      const faqContent = `Q: What is Taltz?
A: Taltz is a prescription medication for psoriasis. Consult your doctor.

Q: How does it work?
A: According to prescribing information, it targets specific immune pathways.`;

      const pairs = FAQGenerationPrompt.extractQAPairs(faqContent);
      expect(pairs).toHaveLength(2);
      expect(pairs[0].question).toContain('What is Taltz');
      expect(pairs[0].answer).toContain('prescription medication');
    });

    test('should reject FAQ with medical advice', () => {
      const badFAQ = `Q: Should I take Taltz?
A: Yes, you should take Taltz for your psoriasis. It's the best treatment.`;

      const validation = FAQGenerationPrompt.validate(badFAQ);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('FAQ contains medical advice language');
    });

    test('should format FAQ for SEO schema', () => {
      const pairs = [
        { question: 'What is Taltz?', answer: 'Taltz is a prescription medication.' },
        { question: 'How is it given?', answer: 'By injection as prescribed by doctor.' }
      ];

      const schema = FAQGenerationPrompt.formatForSEO(pairs);
      expect(schema['@type']).toBe('FAQPage');
      expect(schema.mainEntity).toHaveLength(2);
      expect(schema.mainEntity[0]['@type']).toBe('Question');
    });
  });

  describe('Related Content Suggestions', () => {
    test('should suggest related drugs with proper format', () => {
      const prompt = RelatedDrugsPrompt.generate(mockDrugData, { maxSuggestions: 3 });
      expect(prompt).toContain('3 related prescription drugs');
      
      // Mock AI response
      const suggestions = `Adalimumab (Humira) - Same therapeutic class as TNF inhibitor for autoimmune conditions. Different injection schedule and mechanism. Consult healthcare provider for appropriate treatment decisions.

Etanercept (Enbrel) - Alternative biologic therapy for psoriasis. Works through different pathway than Taltz. Healthcare providers can determine best option based on patient factors.

Ustekinumab (Stelara) - Different mechanism targeting IL-12/23 pathways. Less frequent dosing schedule. Medical professional evaluation needed for treatment selection.`;

      const validation = RelatedDrugsPrompt.validate(suggestions, { maxSuggestions: 3 });
      expect(validation.valid).toBe(true);
      expect(validation.drugCount).toBe(3);
    });

    test('should extract drug suggestions properly', () => {
      const suggestions = `Adalimumab (Humira) - Same therapeutic class. Different dosing.
Etanercept (Enbrel) - Alternative therapy. Different mechanism.`;

      const extracted = RelatedDrugsPrompt.extractDrugSuggestions(suggestions);
      expect(extracted).toHaveLength(2);
      expect(extracted[0].brandName).toBe('Adalimumab');
      expect(extracted[0].genericName).toBe('Humira');
    });

    test('should categorize relationship types', () => {
      const drugs = [
        { relationship: 'Same therapeutic class as TNF inhibitor' },
        { relationship: 'Alternative treatment for same indication' },
        { relationship: 'Different mechanism of action' }
      ];

      const categories = RelatedDrugsPrompt.categorizeRelationships(drugs);
      expect(categories.same_class).toBe(1);
      expect(categories.alternative_treatment).toBe(1);
      expect(categories.different_mechanism).toBe(1);
    });
  });

  describe('Content Quality Validation', () => {
    let validator: ContentQualityValidator;

    beforeEach(() => {
      validator = new ContentQualityValidator();
    });

    test('should analyze readability correctly', async () => {
      const content = 'Taltz is a prescription medication. It treats psoriasis. Your doctor will determine if this medication is right for you.';
      
      const result = await validator.validateContentQuality(content, {
        contentType: 'provider-explanation',
        targetAudience: 'patient',
        drugName: 'Taltz'
      });

      expect(result.score).toBeGreaterThan(70);
      expect(result.readabilityAnalysis.readingLevel).toBe('high_school');
      expect(result.metrics.clarity).toBeGreaterThan(80);
    });

    test('should detect medical jargon for patient content', async () => {
      const jargonContent = 'Taltz has excellent pharmacokinetics and bioavailability with minimal cytochrome P450 interactions.';
      
      const result = await validator.validateContentQuality(jargonContent, {
        contentType: 'provider-explanation',
        targetAudience: 'patient',
        drugName: 'Taltz'
      });

      const clarityIssues = result.issues.filter(i => i.type === 'clarity');
      expect(clarityIssues.length).toBeGreaterThan(0);
    });

    test('should validate content completeness', async () => {
      const shortContent = 'Taltz.';
      
      const result = await validator.validateContentQuality(shortContent, {
        contentType: 'provider-explanation',
        targetAudience: 'general',
        drugName: 'Taltz',
        expectedLength: { min: 100, max: 500 }
      });

      expect(result.valid).toBe(false);
      const completenessIssues = result.issues.filter(i => i.type === 'completeness');
      expect(completenessIssues.length).toBeGreaterThan(0);
    });
  });

  describe('Medical Accuracy Validation', () => {
    let validator: MedicalAccuracyValidator;

    beforeEach(() => {
      validator = new MedicalAccuracyValidator();
    });

    test('should detect medical advice patterns', async () => {
      const medicalAdviceContent = 'You should take Taltz daily to treat your psoriasis. It will cure your condition.';
      
      const result = await validator.validateMedicalAccuracy(medicalAdviceContent, {
        contentType: 'provider-explanation',
        targetAudience: 'patient',
        drugData: mockDrugData
      });

      expect(result.valid).toBe(false);
      expect(result.riskLevel).toBe('high');
      
      const medicalAdviceErrors = result.errors.filter(e => e.type === 'medical_advice');
      expect(medicalAdviceErrors.length).toBeGreaterThan(0);
    });

    test('should validate appropriate disclaimers', async () => {
      const goodContent = 'Taltz is indicated for psoriasis according to prescribing information. Consult your healthcare provider for proper evaluation and treatment decisions.';
      
      const result = await validator.validateMedicalAccuracy(goodContent, {
        contentType: 'provider-explanation',
        targetAudience: 'patient',
        drugData: mockDrugData
      });

      expect(result.valid).toBe(true);
      expect(result.riskLevel).toBe('low');
    });

    test('should flag dosage instructions', async () => {
      const dosageContent = 'Take 80mg twice daily with meals. If you miss a dose, double the next dose.';
      
      const result = await validator.validateMedicalAccuracy(dosageContent, {
        contentType: 'provider-explanation',
        targetAudience: 'patient',
        drugData: mockDrugData
      });

      expect(result.valid).toBe(false);
      const dosageErrors = result.errors.filter(e => e.type === 'dosage_instruction');
      expect(dosageErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Content Enhancement Integration', () => {
    let processor: ContentEnhancementProcessor;

    beforeEach(() => {
      processor = new ContentEnhancementProcessor();
    });

    test('should enhance content with AI while maintaining accuracy', async () => {
      const request = {
        drugData: mockDrugData,
        contentType: 'provider-explanation' as const,
        targetAudience: 'healthcare_provider' as const,
        options: {
          maxLength: 300,
          tone: 'professional' as const
        }
      };

      // Mock the AI service response
      const mockAIResponse = 'Taltz (ixekizumab) is a humanized monoclonal antibody indicated for moderate-to-severe plaque psoriasis in adults. Healthcare providers should evaluate patients for infections before treatment initiation.';

      const result = await processor.enhanceContent(request);
      
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeLessThanOrEqual(300);
      expect(result.qualityScore).toBeGreaterThan(70);
      expect(result.medicalAccuracyScore).toBeGreaterThan(80);
    });

    test('should handle AI service failures gracefully', async () => {
      const request = {
        drugData: mockDrugData,
        contentType: 'seo-title' as const,
        targetAudience: 'general' as const
      };

      // Mock AI service failure
      const result = await processor.enhanceContent(request);
      
      // Should fall back to template-based generation
      expect(result.content).toBeDefined();
      expect(result.content).toContain('Taltz');
      expect(result.fallbackUsed).toBe(true);
    });
  });
});