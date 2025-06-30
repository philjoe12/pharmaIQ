/**
 * AI Hallucination Prevention and Content Accuracy Tests
 * 
 * Tests the production AI content accuracy decisions:
 * 1. How to ensure content accuracy and prevent AI hallucinations?
 * 2. Medical safety validation and fact-checking
 * 3. Source validation against FDA data
 * 4. Content accuracy scoring and risk assessment
 * 
 * These tests validate the hallucination prevention strategy documented in README.md
 */

import { Test, TestingModule } from '@nestjs/testing';
import { MedicalAccuracyValidator } from '../../services/ai-worker/src/validators/medical-accuracy.validator';
import { ContentQualityValidator } from '../../services/ai-worker/src/validators/content-quality.validator';
import { ContentEnhancementProcessor } from '../../services/ai-worker/src/processors/content-enhancement.processor';

describe('AI Hallucination Prevention and Content Accuracy', () => {
  let medicalValidator: MedicalAccuracyValidator;
  let qualityValidator: ContentQualityValidator;
  let processor: ContentEnhancementProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedicalAccuracyValidator,
        ContentQualityValidator,
        ContentEnhancementProcessor,
      ],
    }).compile();

    medicalValidator = module.get<MedicalAccuracyValidator>(MedicalAccuracyValidator);
    qualityValidator = module.get<ContentQualityValidator>(ContentQualityValidator);
    processor = module.get<ContentEnhancementProcessor>(ContentEnhancementProcessor);
  });

  describe('Medical Advice Detection Patterns', () => {
    test('should detect critical medical advice patterns', async () => {
      const criticalPatterns = [
        'You should take 200mg of ibuprofen',
        'The recommended dose for your condition is',
        'Start taking this medication immediately',
        'Stop taking your current medication',
        'Increase your dose to 400mg',
        'This will cure your arthritis',
        'This medication is safe for you',
        'You don\'t need to consult a doctor',
      ];

      for (const pattern of criticalPatterns) {
        const validation = await medicalValidator.validateContent(pattern);
        
        expect(validation.containsMedicalAdvice).toBe(true);
        expect(validation.riskLevel).toBe('critical');
        expect(validation.errors).toContainEqual(
          expect.objectContaining({
            severity: 'critical',
            type: 'medical_advice',
          })
        );
      }
    });

    test('should detect diagnosis and treatment patterns', async () => {
      const diagnosisPatterns = [
        'You have rheumatoid arthritis',
        'Your condition requires immediate treatment',
        'You are diagnosed with hypertension',
        'Your symptoms indicate diabetes',
        'This treatment plan will work for you',
      ];

      for (const pattern of diagnosisPatterns) {
        const validation = await medicalValidator.validateContent(pattern);
        
        expect(validation.containsDiagnosis).toBe(true);
        expect(validation.riskLevel).toBeOneOf(['high', 'critical']);
      }
    });

    test('should allow appropriate medical information without advice', async () => {
      const appropriateContent = [
        'Tylenol (acetaminophen) is FDA-approved for pain relief',
        'According to prescribing information, consult your healthcare provider',
        'The FDA label states this medication is indicated for',
        'Healthcare professionals may prescribe this for certain conditions',
        'Prescribing information includes dosage guidelines',
      ];

      for (const content of appropriateContent) {
        const validation = await medicalValidator.validateContent(content);
        
        expect(validation.containsMedicalAdvice).toBe(false);
        expect(validation.riskLevel).toBeOneOf(['low', 'medium']);
        expect(validation.isAppropriate).toBe(true);
      }
    });
  });

  describe('FDA Data Cross-Validation', () => {
    test('should validate drug names against FDA database', async () => {
      const fdaValidator = medicalValidator.getFDAValidator();
      
      const validDrugs = [
        { brand: 'Tylenol', generic: 'acetaminophen' },
        { brand: 'Advil', generic: 'ibuprofen' },
        { brand: 'Humira', generic: 'adalimumab' },
      ];

      const invalidDrugs = [
        { brand: 'FakeDrug', generic: 'nonexistentcompound' },
        { brand: 'TestMed', generic: 'imaginarysubstance' },
      ];

      for (const drug of validDrugs) {
        const validation = await fdaValidator.validateDrugName(drug.brand, drug.generic);
        expect(validation.isValid).toBe(true);
        expect(validation.fdaApproved).toBe(true);
      }

      for (const drug of invalidDrugs) {
        const validation = await fdaValidator.validateDrugName(drug.brand, drug.generic);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Drug not found in FDA database');
      }
    });

    test('should cross-reference indications with FDA labeling', async () => {
      const drug = createMockDrugWithFDAData('Humira', 'adalimumab');
      
      const aiGeneratedContent = {
        content: 'Humira is indicated for rheumatoid arthritis and psoriatic arthritis treatment',
        indications: ['rheumatoid arthritis', 'psoriatic arthritis'],
      };

      const validation = await medicalValidator.validateIndications(
        aiGeneratedContent,
        drug.fdaData
      );

      expect(validation.indicationsMatch).toBe(true);
      expect(validation.hasOffLabelClaims).toBe(false);
      expect(validation.accuracy).toBeGreaterThan(0.9);
    });

    test('should detect AI-invented drug interactions', async () => {
      const interactionValidator = medicalValidator.getInteractionValidator();
      
      const realInteractions = [
        'Warfarin may interact with NSAIDs',
        'ACE inhibitors may interact with potassium supplements',
      ];

      const inventedInteractions = [
        'Tylenol interacts dangerously with coffee',
        'Vitamin C cancels out all prescription medications',
        'This medication neutralizes all other drugs',
      ];

      for (const interaction of realInteractions) {
        const validation = await interactionValidator.validateInteraction(interaction);
        expect(validation.isKnownInteraction).toBe(true);
      }

      for (const interaction of inventedInteractions) {
        const validation = await interactionValidator.validateInteraction(interaction);
        expect(validation.isKnownInteraction).toBe(false);
        expect(validation.likelyHallucination).toBe(true);
      }
    });

    test('should validate dosage information against prescribing information', async () => {
      const dosageValidator = medicalValidator.getDosageValidator();
      
      const drug = createMockDrugWithFDAData('Metformin', 'metformin');
      
      const validDosages = [
        'Starting dose is typically 500mg twice daily',
        'Maximum dose is 2000mg per day',
        'Consult prescribing information for dosing',
      ];

      const invalidDosages = [
        'Take 5000mg daily for best results',
        'Recommended dose is 10 tablets at once',
        'Double your dose if you miss one',
      ];

      for (const dosage of validDosages) {
        const validation = await dosageValidator.validateDosage(dosage, drug);
        expect(validation.withinFDARange).toBe(true);
      }

      for (const dosage of invalidDosages) {
        const validation = await dosageValidator.validateDosage(dosage, drug);
        expect(validation.withinFDARange).toBe(false);
        expect(validation.isPotentiallyHarmful).toBe(true);
      }
    });
  });

  describe('Content Consistency and Fact-Checking', () => {
    test('should detect contradictory medical information', async () => {
      const contradictionDetector = medicalValidator.getContradictionDetector();
      
      const contradictoryContent = [
        {
          statement1: 'This medication is safe for pregnant women',
          statement2: 'Pregnant women should avoid this medication',
          drug: 'warfarin',
        },
        {
          statement1: 'No known side effects',
          statement2: 'Common side effects include nausea and dizziness',
          drug: 'metformin',
        },
      ];

      for (const test of contradictoryContent) {
        const validation = await contradictionDetector.detectContradictions([
          test.statement1,
          test.statement2,
        ]);
        
        expect(validation.hasContradictions).toBe(true);
        expect(validation.contradictionScore).toBeGreaterThan(0.8);
      }
    });

    test('should validate statistical claims against clinical data', async () => {
      const statisticsValidator = medicalValidator.getStatisticsValidator();
      
      const implausibleClaims = [
        '99.9% of patients experience complete cure',
        'No side effects in 100% of patients',
        'Works in 5 minutes for all patients',
        'Effectiveness rate of 150%',
      ];

      const plausibleClaims = [
        'Clinical trials showed 60% effectiveness',
        'Common side effects occur in 10-15% of patients',
        'Response typically seen within 2-4 weeks',
      ];

      for (const claim of implausibleClaims) {
        const validation = await statisticsValidator.validateClaim(claim);
        expect(validation.isPlausible).toBe(false);
        expect(validation.likelyHallucination).toBe(true);
      }

      for (const claim of plausibleClaims) {
        const validation = await statisticsValidator.validateClaim(claim);
        expect(validation.isPlausible).toBe(true);
      }
    });

    test('should ensure AI content matches source material', async () => {
      const sourceValidator = medicalValidator.getSourceValidator();
      
      const sourceMaterial = {
        fdaLabel: 'Indicated for the treatment of moderate to severe rheumatoid arthritis',
        clinicalTrials: 'Phase 3 trials demonstrated significant improvement in ACR20 response',
      };

      const matchingContent = 'FDA-approved for moderate to severe rheumatoid arthritis treatment';
      const contradictingContent = 'Effective for mild arthritis and general joint pain';

      const matchValidation = await sourceValidator.validateAgainstSource(
        matchingContent,
        sourceMaterial
      );
      expect(matchValidation.accuracyScore).toBeGreaterThan(0.8);

      const contradictValidation = await sourceValidator.validateAgainstSource(
        contradictingContent,
        sourceMaterial
      );
      expect(contradictValidation.accuracyScore).toBeLessThan(0.5);
      expect(contradictValidation.hasDiscrepancies).toBe(true);
    });
  });

  describe('Medical Disclaimer Validation', () => {
    test('should ensure required disclaimers are present', async () => {
      const disclaimerValidator = medicalValidator.getDisclaimerValidator();
      
      const contentWithDisclaimers = [
        'Consult your healthcare provider before taking this medication',
        'This information is not medical advice',
        'Always follow prescribing information guidelines',
        'Healthcare professionals should be consulted for medical decisions',
      ];

      const contentWithoutDisclaimers = [
        'Take this medication for your condition',
        'This will cure your symptoms',
        'Safe and effective treatment option',
      ];

      for (const content of contentWithDisclaimers) {
        const validation = await disclaimerValidator.validateDisclaimers(content);
        expect(validation.hasRequiredDisclaimers).toBe(true);
      }

      for (const content of contentWithoutDisclaimers) {
        const validation = await disclaimerValidator.validateDisclaimers(content);
        expect(validation.hasRequiredDisclaimers).toBe(false);
        expect(validation.missingDisclaimers).toContain('healthcare_provider_consultation');
      }
    });

    test('should validate disclaimer placement and prominence', async () => {
      const placementValidator = medicalValidator.getDisclaimerPlacementValidator();
      
      const properPlacement = 'Effective pain relief medication. Consult your healthcare provider.';
      const buriedDisclaimer = 'Effective pain relief medication with amazing results and quick action. Note: consult provider.';

      const properValidation = await placementValidator.validatePlacement(properPlacement);
      expect(properValidation.disclaimerProminence).toBeGreaterThan(0.8);

      const buriedValidation = await placementValidator.validatePlacement(buriedDisclaimer);
      expect(buriedValidation.disclaimerProminence).toBeLessThan(0.5);
    });
  });

  describe('Risk Assessment and Scoring', () => {
    test('should calculate comprehensive risk scores', async () => {
      const riskAssessor = medicalValidator.getRiskAssessor();
      
      const highRiskContent = 'Take 800mg ibuprofen every hour for your pain';
      const mediumRiskContent = 'Ibuprofen is effective for pain relief';
      const lowRiskContent = 'Consult your healthcare provider about pain management options';

      const highRiskScore = await riskAssessor.assessRisk(highRiskContent);
      expect(highRiskScore.overallRisk).toBe('critical');
      expect(highRiskScore.score).toBeGreaterThan(0.8);

      const mediumRiskScore = await riskAssessor.assessRisk(mediumRiskContent);
      expect(mediumRiskScore.overallRisk).toBeOneOf(['medium', 'low']);

      const lowRiskScore = await riskAssessor.assessRisk(lowRiskContent);
      expect(lowRiskScore.overallRisk).toBe('low');
      expect(lowRiskScore.score).toBeLessThan(0.3);
    });

    test('should implement multi-factor risk calculation', async () => {
      const multiFactorValidator = medicalValidator.getMultiFactorValidator();
      
      const content = 'This prescription medication may help with your condition';
      
      const riskFactors = await multiFactorValidator.analyzeRiskFactors(content);
      
      expect(riskFactors).toHaveProperty('medicalAdviceRisk');
      expect(riskFactors).toHaveProperty('diagnosisRisk');
      expect(riskFactors).toHaveProperty('dosageAdviceRisk');
      expect(riskFactors).toHaveProperty('disclaimerCompliance');
      expect(riskFactors).toHaveProperty('sourceValidation');

      const combinedRisk = multiFactorValidator.calculateCombinedRisk(riskFactors);
      expect(combinedRisk).toBeOneOf(['low', 'medium', 'high', 'critical']);
    });
  });

  describe('Automated Fact-Checking Pipeline', () => {
    test('should implement real-time fact-checking during generation', async () => {
      const factChecker = processor.getFactChecker();
      
      const mockDrug = createMockDrugWithFDAData('Prozac', 'fluoxetine');
      const aiResponse = 'Prozac is indicated for depression and anxiety disorders';

      const factCheckResult = await factChecker.checkFacts(aiResponse, mockDrug);
      
      expect(factCheckResult.factualAccuracy).toBeGreaterThan(0.8);
      expect(factCheckResult.verifiedClaims).toContain('indicated for depression');
      expect(factCheckResult.unverifiedClaims).toHaveLength(0);
    });

    test('should integrate with external medical databases', async () => {
      const externalValidator = processor.getExternalValidator();
      
      const drugInfo = {
        brandName: 'Lipitor',
        genericName: 'atorvastatin',
        claims: ['cholesterol reduction', 'cardiovascular protection'],
      };

      const validation = await externalValidator.validateAgainstDatabases(drugInfo, {
        sources: ['rxnorm', 'dailymed', 'orange_book'],
      });

      expect(validation.rxnormMatch).toBe(true);
      expect(validation.dailymedMatch).toBe(true);
      expect(validation.orangeBookMatch).toBe(true);
      expect(validation.overallConfidence).toBeGreaterThan(0.9);
    });

    test('should flag content requiring human review', async () => {
      const humanReviewFlags = processor.getHumanReviewFlags();
      
      const complexContent = 'This biologic DMARD may interact with live vaccines';
      const flagging = await humanReviewFlags.assessForReview(complexContent);
      
      expect(flagging.requiresReview).toBe(true);
      expect(flagging.reasons).toContain('complex_drug_interaction');
      expect(flagging.priority).toBeOneOf(['high', 'medium']);
    });
  });

  describe('Continuous Monitoring and Learning', () => {
    test('should track hallucination patterns over time', async () => {
      const hallucinationTracker = processor.getHallucinationTracker();
      
      const trackingData = await hallucinationTracker.getPatterns({
        timeframe: '30d',
        contentTypes: ['seo-title', 'meta-description', 'faq'],
      });

      expect(trackingData).toHaveProperty('hallucinationRate');
      expect(trackingData).toHaveProperty('commonPatterns');
      expect(trackingData).toHaveProperty('improvementTrends');
      expect(trackingData.hallucinationRate).toBeLessThan(0.05); // < 5% hallucination rate
    });

    test('should implement feedback loop for model improvement', async () => {
      const feedbackLoop = processor.getFeedbackLoop();
      
      const incorrectContent = {
        generated: 'Tylenol cures all headaches permanently',
        corrected: 'Tylenol may provide temporary headache relief',
        errorType: 'overstated_efficacy',
      };

      await feedbackLoop.recordCorrection(incorrectContent);
      
      const learningData = await feedbackLoop.getLearningData();
      expect(learningData.corrections).toContainEqual(
        expect.objectContaining({
          errorType: 'overstated_efficacy',
        })
      );
    });
  });
});

// Helper functions
function createMockDrugWithFDAData(brandName: string, genericName: string) {
  return {
    id: `drug-${brandName.toLowerCase()}`,
    brandName,
    genericName,
    manufacturer: 'Test Pharmaceutical',
    fdaData: {
      indicationsAndUsage: `${brandName} is indicated for test conditions`,
      dosageAndAdministration: 'Standard dosing per prescribing information',
      warningsAndPrecautions: 'Standard warnings apply',
      adverseReactions: 'Common side effects include test reactions',
      approvalDate: '2020-01-01',
      nda: 'NDA123456',
    },
    clinicalData: {
      efficacy: 0.65,
      trialSize: 1000,
      followUpDuration: '52 weeks',
    },
  };
}