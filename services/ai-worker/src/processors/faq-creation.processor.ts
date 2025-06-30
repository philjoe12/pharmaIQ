import { Injectable, Logger } from '@nestjs/common';
import { ContentEnhancementProcessor, ContentEnhancementRequest } from './content-enhancement.processor';
import { FAQGenerationPrompt } from '../prompts/templates/faq-generation.prompt';

export interface FAQCreationRequest {
  drugData: any;
  targetAudience: 'healthcare_provider' | 'patient' | 'general';
  numberOfQuestions?: number;
  categories?: FAQCategory[];
  customQuestions?: string[];
  options?: {
    includeDisclaimer?: boolean;
    includeSources?: boolean;
    focusAreas?: string[];
  };
}

export interface FAQCategory {
  name: string;
  priority: number;
  questionCount: number;
}

export interface FAQQuestion {
  question: string;
  answer: string;
  category: string;
  audience: string;
  sources?: string[];
  medicalDisclaimer: boolean;
}

export interface FAQCreationResult {
  drugName: string;
  questions: FAQQuestion[];
  structuredData: any;
  metadata: {
    totalQuestions: number;
    categoriesUsed: string[];
    targetAudience: string;
    generatedAt: Date;
    processingTime: number;
  };
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

@Injectable()
export class FAQCreationProcessor {
  private readonly logger = new Logger(FAQCreationProcessor.name);

  constructor(private readonly contentProcessor: ContentEnhancementProcessor) {}

  async createFAQ(request: FAQCreationRequest): Promise<FAQCreationResult> {
    const startTime = Date.now();
    const drugName = request.drugData.drugName || 'Unknown Drug';

    this.logger.log(`Creating FAQ for drug: ${drugName} (audience: ${request.targetAudience})`);

    try {
      const questions: FAQQuestion[] = [];
      const errors: string[] = [];
      const warnings: string[] = [];

      // Generate core FAQ content
      const enhancementRequest: ContentEnhancementRequest = {
        drugData: request.drugData,
        contentType: 'faq',
        targetAudience: request.targetAudience,
        options: {
          numberOfQuestions: request.numberOfQuestions || 8,
        },
      };

      const faqResult = await this.contentProcessor.enhanceContent(enhancementRequest);

      if (!faqResult.validation.valid) {
        errors.push(...faqResult.validation.errors);
      }

      // Extract and categorize questions
      const extractedQuestions = FAQGenerationPrompt.extractQAPairs(faqResult.content);
      
      for (const qa of extractedQuestions) {
        const category = this.categorizeQuestion(qa.question, request.drugData);
        const medicalDisclaimer = this.requiresMedicalDisclaimer(qa.answer);
        
        questions.push({
          question: qa.question,
          answer: this.enhanceAnswer(qa.answer, request.options),
          category,
          audience: request.targetAudience,
          sources: this.extractSources(qa.answer),
          medicalDisclaimer,
        });
      }

      // Add custom questions if provided
      if (request.customQuestions?.length) {
        for (const customQ of request.customQuestions) {
          try {
            const customAnswer = await this.generateCustomAnswer(customQ, request.drugData, request.targetAudience);
            questions.push({
              question: customQ,
              answer: customAnswer,
              category: 'Custom',
              audience: request.targetAudience,
              medicalDisclaimer: this.requiresMedicalDisclaimer(customAnswer),
            });
          } catch (error) {
            this.logger.warn(`Failed to generate answer for custom question: ${customQ}`);
            warnings.push(`Could not generate answer for custom question: ${customQ}`);
          }
        }
      }

      // Generate structured data
      const structuredData = this.generateFAQStructuredData(questions, drugName);

      // Validate final FAQ set
      const finalValidation = this.validateFAQSet(questions, request);
      if (!finalValidation.valid) {
        errors.push(...finalValidation.errors);
      }
      warnings.push(...finalValidation.warnings);

      const processingTime = Date.now() - startTime;
      const categoriesUsed = [...new Set(questions.map(q => q.category))];

      const result: FAQCreationResult = {
        drugName,
        questions,
        structuredData,
        metadata: {
          totalQuestions: questions.length,
          categoriesUsed,
          targetAudience: request.targetAudience,
          generatedAt: new Date(),
          processingTime,
        },
        validation: {
          valid: errors.length === 0,
          errors,
          warnings,
        },
      };

      this.logger.log(
        `Created FAQ for ${drugName}: ${questions.length} questions in ${processingTime}ms`
      );

      return result;
    } catch (error) {
      this.logger.error(`Failed to create FAQ for ${drugName}:`, error);
      throw new Error(`FAQ creation failed: ${error.message}`);
    }
  }

  private categorizeQuestion(question: string, drugData: any): string {
    const questionLower = question.toLowerCase();

    // Define category keywords
    const categories = {
      'Basic Information': ['what is', 'what does', 'brand name', 'generic name', 'manufacturer'],
      'Uses & Indications': ['used for', 'treats', 'indication', 'condition', 'disease'],
      'Dosage & Administration': ['dose', 'dosage', 'how much', 'how often', 'take', 'administration'],
      'Side Effects': ['side effect', 'adverse', 'reaction', 'symptoms', 'effects'],
      'Safety & Warnings': ['safe', 'warning', 'precaution', 'contraindication', 'avoid'],
      'Drug Interactions': ['interact', 'combination', 'other drugs', 'medication'],
      'Storage & Handling': ['store', 'storage', 'temperature', 'expire', 'handling'],
      'Monitoring': ['monitor', 'test', 'check', 'follow-up', 'lab'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => questionLower.includes(keyword))) {
        return category;
      }
    }

    return 'General';
  }

  private requiresMedicalDisclaimer(answer: string): boolean {
    const medicalTerms = [
      'dose', 'dosage', 'treatment', 'medication', 'prescription',
      'doctor', 'physician', 'healthcare', 'medical', 'therapy'
    ];

    const answerLower = answer.toLowerCase();
    return medicalTerms.some(term => answerLower.includes(term));
  }

  private enhanceAnswer(answer: string, options?: FAQCreationRequest['options']): string {
    let enhancedAnswer = answer;

    // Add medical disclaimer if needed and requested
    if (options?.includeDisclaimer && this.requiresMedicalDisclaimer(answer)) {
      if (!answer.toLowerCase().includes('healthcare provider') && 
          !answer.toLowerCase().includes('doctor') &&
          !answer.toLowerCase().includes('physician')) {
        enhancedAnswer += ' Always consult with your healthcare provider for personalized medical advice.';
      }
    }

    // Add source reference if requested
    if (options?.includeSources) {
      if (!answer.includes('prescribing information') && !answer.includes('FDA')) {
        enhancedAnswer += ' This information is based on FDA prescribing information.';
      }
    }

    return enhancedAnswer;
  }

  private extractSources(answer: string): string[] {
    const sources: string[] = [];
    
    if (answer.toLowerCase().includes('fda') || answer.toLowerCase().includes('prescribing information')) {
      sources.push('FDA Prescribing Information');
    }
    
    if (answer.toLowerCase().includes('clinical trial') || answer.toLowerCase().includes('study')) {
      sources.push('Clinical Studies');
    }

    return sources;
  }

  private async generateCustomAnswer(question: string, drugData: any, audience: string): Promise<string> {
    // Create a focused prompt for the custom question
    const prompt = `Answer this specific question about ${drugData.drugName}: "${question}"

Use the following drug information:
- Drug: ${drugData.drugName}
- Manufacturer: ${drugData.manufacturer || 'Not specified'}
- Indications: ${drugData.label?.indicationsAndUsage?.substring(0, 300) || 'Not specified'}

Guidelines:
- Target audience: ${audience}
- Keep answer 2-4 sentences
- Include appropriate medical disclaimers
- Reference FDA prescribing information when applicable
- Do not provide medical advice

Answer:`;

    const result = await this.contentProcessor.enhanceContent({
      drugData: { ...drugData, customPrompt: prompt },
      contentType: 'provider-explanation',
      targetAudience: audience as any,
      options: { maxLength: 300 },
    });

    return result.content;
  }

  private generateFAQStructuredData(questions: FAQQuestion[], drugName: string): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'about': {
        '@type': 'Drug',
        'name': drugName,
      },
      'mainEntity': questions.map(q => ({
        '@type': 'Question',
        'name': q.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': q.answer,
          'author': {
            '@type': 'Organization',
            'name': 'PharmaIQ'
          }
        }
      }))
    };
  }

  private validateFAQSet(questions: FAQQuestion[], request: FAQCreationRequest): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check minimum questions
    if (questions.length < 3) {
      errors.push('FAQ should have at least 3 questions');
    }

    // Check for duplicate questions
    const questionTexts = questions.map(q => q.question.toLowerCase());
    const duplicates = questionTexts.filter((q, index) => questionTexts.indexOf(q) !== index);
    if (duplicates.length > 0) {
      warnings.push('Some questions may be duplicates');
    }

    // Check category distribution
    const categories = questions.map(q => q.category);
    const uniqueCategories = new Set(categories);
    if (uniqueCategories.size === 1 && questions.length > 5) {
      warnings.push('Consider adding questions from different categories for better coverage');
    }

    // Check answer quality
    const shortAnswers = questions.filter(q => q.answer.length < 50);
    if (shortAnswers.length > questions.length * 0.3) {
      warnings.push('Some answers may be too brief');
    }

    // Check medical disclaimers for patient audience
    if (request.targetAudience === 'patient') {
      const questionsNeedingDisclaimers = questions.filter(q => 
        this.requiresMedicalDisclaimer(q.answer) && 
        !q.answer.toLowerCase().includes('healthcare provider')
      );
      
      if (questionsNeedingDisclaimers.length > 0) {
        warnings.push('Some patient-facing answers may need healthcare provider disclaimers');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async isHealthy(): Promise<boolean> {
    try {
      return await this.contentProcessor.isHealthy();
    } catch (error) {
      this.logger.error('FAQ processor health check failed:', error);
      return false;
    }
  }
}