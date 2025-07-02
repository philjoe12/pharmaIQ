import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { FDALabel } from '../../../shared-types';
import { 
  generateSEOTitlePrompt,
  generateMetaDescriptionPrompt,
  generateFAQPrompt,
  generateProviderExplanationPrompt,
  generateRelatedContentPrompt
} from '../prompts';
import { EmbeddingService } from './embedding.service';

export interface EnhancedContent {
  seoTitle: string;
  metaDescription: string;
  providerExplanation: string;
  faqs: FAQ[];
  relatedConditions: string[];
  relatedDrugs: string[];
  keyBenefits: string[];
  patientFriendlyName?: string;
  dataCompleteness?: DataCompleteness;
  userSpecificContent?: UserSpecificContent;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface DataCompleteness {
  score: number; // 0-1
  missingFields: string[];
  enrichedFields: {
    field: string;
    confidence: number;
    source: 'original' | 'ai_generated' | 'inferred';
  }[];
}

export interface UserSpecificContent {
  patient?: {
    summary: string;
    keyPoints: string[];
    readabilityScore: number;
  };
  provider?: {
    clinicalSummary: string;
    prescribingHighlights: string[];
    contraindications: string[];
  };
  caregiver?: {
    administrationGuide: string;
    monitoringPoints: string[];
    emergencyInfo: string;
  };
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  constructor(
    private configService: ConfigService,
    private embeddingService: EmbeddingService
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.logger.log(`OpenAI API Key configured: ${apiKey ? 'Yes' : 'No'}`);
    
    if (!apiKey || apiKey === 'sk-test-key') {
      this.logger.warn('OpenAI API key not found or using test key. AI features will use fallback responses.');
    }
    
    this.openai = new OpenAI({ apiKey: apiKey || 'sk-test-key' });
  }

  async enhanceDrugContent(drug: FDALabel): Promise<EnhancedContent> {
    try {
      // First, analyze data completeness and enrich if needed
      const enrichedDrug = await this.enrichIncompleteData(drug);
      const dataCompleteness = this.analyzeDataCompleteness(enrichedDrug);

      const [
        seoTitle,
        metaDescription,
        providerExplanation,
        faqs,
        relatedContent,
        userSpecificContent
      ] = await Promise.all([
        this.generateSEOTitle(enrichedDrug),
        this.generateMetaDescription(enrichedDrug),
        this.generateProviderExplanation(enrichedDrug),
        this.generateFAQs(enrichedDrug),
        this.generateRelatedContent(enrichedDrug),
        this.generateUserSpecificContent(enrichedDrug)
      ]);

      // Embeddings will be generated through the queue processor
      // which will fetch the proper DrugEntity with the correct ID

      return {
        seoTitle,
        metaDescription,
        providerExplanation,
        faqs,
        ...relatedContent,
        dataCompleteness,
        userSpecificContent
      };
    } catch (error) {
      this.logger.error(`Failed to enhance content for ${drug.drugName}:`, error);
      return this.getFallbackContent(drug);
    }
  }

  private async generateSEOTitle(drug: FDALabel): Promise<string> {
    try {
      const prompt = generateSEOTitlePrompt(drug);
      const response = await this.callOpenAI(prompt, 60);
      return this.sanitizeTitle(response);
    } catch (error) {
      this.logger.error('Failed to generate SEO title:', error);
      return `${drug.drugName} (${drug.label.genericName}) - Uses, Dosage & Side Effects`;
    }
  }

  private async generateMetaDescription(drug: FDALabel): Promise<string> {
    try {
      const prompt = generateMetaDescriptionPrompt(drug);
      const response = await this.callOpenAI(prompt, 160);
      return this.sanitizeMetaDescription(response);
    } catch (error) {
      this.logger.error('Failed to generate meta description:', error);
      return `Learn about ${drug.drugName} (${drug.label.genericName}), its uses, dosage, side effects, and important safety information for healthcare providers.`;
    }
  }

  private async generateProviderExplanation(drug: FDALabel): Promise<string> {
    try {
      const prompt = generateProviderExplanationPrompt(drug);
      const response = await this.callOpenAI(prompt, 300);
      return this.sanitizeExplanation(response);
    } catch (error) {
      this.logger.error('Failed to generate provider explanation:', error);
      return this.extractCleanIndications(drug);
    }
  }

  private async generateFAQs(drug: FDALabel): Promise<FAQ[]> {
    try {
      const prompt = generateFAQPrompt(drug);
      const response = await this.callOpenAI(prompt, 500);
      return this.parseFAQs(response);
    } catch (error) {
      this.logger.error('Failed to generate FAQs:', error);
      return this.getDefaultFAQs(drug);
    }
  }

  private async generateRelatedContent(drug: FDALabel): Promise<{
    relatedConditions: string[];
    relatedDrugs: string[];
    keyBenefits: string[];
  }> {
    try {
      const prompt = generateRelatedContentPrompt(drug);
      const response = await this.callOpenAI(prompt, 300);
      return this.parseRelatedContent(response);
    } catch (error) {
      this.logger.error('Failed to generate related content:', error);
      return {
        relatedConditions: [],
        relatedDrugs: [],
        keyBenefits: []
      };
    }
  }

  async callOpenAI(prompt: string, maxTokens: number = 150): Promise<string> {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a medical content expert creating accurate, provider-focused drug information. Always maintain medical accuracy and never invent information not present in the source material.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: maxTokens,
        });

        return completion.choices[0]?.message?.content || '';
      } catch (error: any) {
        attempt++;
        this.logger.warn(`OpenAI API attempt ${attempt} failed:`, error.message);
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        } else {
          throw error;
        }
      }
    }

    throw new Error('Max retries exceeded for OpenAI API');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private sanitizeTitle(title: string): string {
    // Remove quotes, ensure proper length
    return title
      .replace(/['"]/g, '')
      .trim()
      .substring(0, 60);
  }

  private sanitizeMetaDescription(description: string): string {
    // Ensure under 160 characters
    return description
      .replace(/['"]/g, '')
      .trim()
      .substring(0, 155) + '...';
  }

  private sanitizeExplanation(explanation: string): string {
    // Remove any markdown or HTML
    return explanation
      .replace(/[#*_`]/g, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  async compareDrugs(drugs: any[]): Promise<any> {
    try {
      this.logger.log(`Comparing ${drugs.length} drugs: ${drugs.map(d => d.drugName).join(', ')}`);
      
      const drugNames = drugs.map(d => d.drugName).join(', ');
      const prompt = `Compare the following FDA-approved drugs for healthcare providers: ${drugNames}

Analyze these drugs and provide:
1. Overall recommendation based on efficacy and safety
2. Key differences between the drugs
3. Effectiveness comparison with scores (0-100)
4. Safety profile comparison (risk levels: low, medium, high)
5. Cost-effectiveness analysis
6. Patient preference considerations

Focus on FDA-approved information only. Do not provide treatment recommendations.

Format the response as JSON with the following structure:
{
  "overallRecommendation": "string",
  "keyDifferences": ["string"],
  "effectivenessComparison": [{"drug": "string", "score": number, "reasoning": "string"}],
  "safetyProfile": [{"drug": "string", "riskLevel": "low|medium|high", "keyRisks": ["string"]}],
  "costEffectiveness": [{"drug": "string", "costTier": "low|medium|high", "valueRating": number}],
  "patientPreferences": [{"bestFor": "string", "drugs": ["string"], "reasoning": "string"}]
}`;

      const response = await this.callOpenAI(prompt, 1500);
      this.logger.log('AI response received, attempting to parse...');
      
      try {
        const parsed = JSON.parse(response);
        this.logger.log('Successfully parsed AI comparison response');
        return parsed;
      } catch (parseError) {
        this.logger.warn('Failed to parse AI comparison response as JSON:', parseError);
        this.logger.warn('Raw response:', response);
        return this.generateFallbackComparison(drugs);
      }
    } catch (error) {
      this.logger.error('Failed to generate drug comparison:', error);
      this.logger.error('Error details:', error.message);
      return this.generateFallbackComparison(drugs);
    }
  }

  private generateFallbackComparison(drugs: any[]): any {
    return {
      overallRecommendation: 'AI analysis unavailable. Please consult the detailed drug information below for comparison.',
      keyDifferences: drugs.map(d => `${d.drugName}: ${d.label?.indicationsAndUsage?.substring(0, 100) || 'See full prescribing information'}`),
      effectivenessComparison: drugs.map(d => ({
        drug: d.drugName,
        score: 0,
        reasoning: 'Effectiveness data requires AI analysis'
      })),
      safetyProfile: drugs.map(d => ({
        drug: d.drugName,
        riskLevel: 'medium' as const,
        keyRisks: ['See warnings and precautions in prescribing information']
      })),
      costEffectiveness: drugs.map(d => ({
        drug: d.drugName,
        costTier: 'medium' as const,
        valueRating: 0
      })),
      patientPreferences: []
    };
  }

  private parseFAQs(response: string): FAQ[] {
    const faqs: FAQ[] = [];
    const lines = response.split('\n').filter(line => line.trim());
    
    let currentQuestion = '';
    let currentAnswer = '';
    
    for (const line of lines) {
      if (line.startsWith('Q:') || line.startsWith('Question:')) {
        if (currentQuestion && currentAnswer) {
          faqs.push({ question: currentQuestion, answer: currentAnswer });
        }
        currentQuestion = line.replace(/^(Q:|Question:)\s*/, '').trim();
        currentAnswer = '';
      } else if (line.startsWith('A:') || line.startsWith('Answer:')) {
        currentAnswer = line.replace(/^(A:|Answer:)\s*/, '').trim();
      } else if (currentAnswer) {
        currentAnswer += ' ' + line.trim();
      }
    }
    
    if (currentQuestion && currentAnswer) {
      faqs.push({ question: currentQuestion, answer: currentAnswer });
    }
    
    return faqs.slice(0, 5); // Limit to 5 FAQs
  }

  private parseRelatedContent(response: string): {
    relatedConditions: string[];
    relatedDrugs: string[];
    keyBenefits: string[];
  } {
    const result = {
      relatedConditions: [] as string[],
      relatedDrugs: [] as string[],
      keyBenefits: [] as string[]
    };

    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(response);
      return {
        relatedConditions: parsed.conditions || [],
        relatedDrugs: parsed.drugs || [],
        keyBenefits: parsed.benefits || []
      };
    } catch {
      // Fallback to line parsing
      const lines = response.split('\n').filter(line => line.trim());
      let currentSection = '';
      
      for (const line of lines) {
        if (line.toLowerCase().includes('condition')) {
          currentSection = 'conditions';
        } else if (line.toLowerCase().includes('drug')) {
          currentSection = 'drugs';
        } else if (line.toLowerCase().includes('benefit')) {
          currentSection = 'benefits';
        } else if (line.startsWith('-') || line.startsWith('•')) {
          const item = line.replace(/^[-•]\s*/, '').trim();
          if (currentSection === 'conditions') {
            result.relatedConditions.push(item);
          } else if (currentSection === 'drugs') {
            result.relatedDrugs.push(item);
          } else if (currentSection === 'benefits') {
            result.keyBenefits.push(item);
          }
        }
      }
    }

    return result;
  }

  private extractCleanIndications(drug: FDALabel): string {
    const indications = drug.label.indicationsAndUsage || '';
    return indications
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 300);
  }

  private getDefaultFAQs(drug: FDALabel): FAQ[] {
    return [
      {
        question: `What is ${drug.drugName} used for?`,
        answer: this.extractCleanIndications(drug).substring(0, 150)
      },
      {
        question: `What are the common side effects of ${drug.drugName}?`,
        answer: 'Please refer to the adverse reactions section for detailed information about side effects.'
      },
      {
        question: `How is ${drug.drugName} administered?`,
        answer: 'Please refer to the dosage and administration section for detailed dosing information.'
      }
    ];
  }

  private getFallbackContent(drug: FDALabel): EnhancedContent {
    return {
      seoTitle: `${drug.drugName} (${drug.label.genericName}) - Prescribing Information`,
      metaDescription: `${drug.drugName} (${drug.label.genericName}) prescribing information for healthcare providers. Learn about uses, dosing, and safety.`,
      providerExplanation: this.extractCleanIndications(drug),
      faqs: this.getDefaultFAQs(drug),
      relatedConditions: [],
      relatedDrugs: [],
      keyBenefits: [],
      patientFriendlyName: drug.drugName
    };
  }

  private async enrichIncompleteData(drug: FDALabel): Promise<FDALabel> {
    const enrichedDrug = { ...drug };
    const missingFields: string[] = [];

    // Check and enrich missing fields
    if (!drug.label.genericName || drug.label.genericName.trim() === '') {
      missingFields.push('genericName');
      try {
        const genericName = await this.extractGenericName(drug);
        if (genericName) {
          enrichedDrug.label.genericName = genericName;
        }
      } catch (error) {
        this.logger.warn('Failed to extract generic name:', error);
      }
    }

    if (!drug.label.indicationsAndUsage || drug.label.indicationsAndUsage.trim() === '') {
      missingFields.push('indicationsAndUsage');
      try {
        const indications = await this.generateIndications(drug);
        if (indications) {
          enrichedDrug.label.indicationsAndUsage = indications;
        }
      } catch (error) {
        this.logger.warn('Failed to generate indications:', error);
      }
    }

    if (!drug.label.dosageAndAdministration || drug.label.dosageAndAdministration.trim() === '') {
      missingFields.push('dosageAndAdministration');
      try {
        const dosage = await this.generateDosageInfo(drug);
        if (dosage) {
          enrichedDrug.label.dosageAndAdministration = dosage;
        }
      } catch (error) {
        this.logger.warn('Failed to generate dosage info:', error);
      }
    }

    return enrichedDrug;
  }

  private analyzeDataCompleteness(drug: FDALabel): DataCompleteness {
    const requiredFields = [
      'drugName', 'genericName', 'indicationsAndUsage', 
      'dosageAndAdministration', 'contraindications', 
      'warningsAndPrecautions', 'adverseReactions'
    ];

    const missingFields: string[] = [];
    const enrichedFields: DataCompleteness['enrichedFields'] = [];
    let completeFields = 0;

    for (const field of requiredFields) {
      const value = field === 'drugName' ? drug.drugName : drug.label[field];
      if (!value || value.trim() === '') {
        missingFields.push(field);
      } else {
        completeFields++;
        // Track if this was AI-enriched (simplified check)
        if (value.includes('AI-generated') || value.includes('Extracted from')) {
          enrichedFields.push({
            field,
            confidence: 0.85,
            source: 'ai_generated'
          });
        }
      }
    }

    return {
      score: completeFields / requiredFields.length,
      missingFields,
      enrichedFields
    };
  }

  private async extractGenericName(drug: FDALabel): Promise<string | null> {
    const prompt = `Extract the generic name from this drug information:
Drug Name: ${drug.drugName}
Label Text: ${JSON.stringify(drug.label).substring(0, 1000)}

Return only the generic name, or null if not found.`;

    try {
      const response = await this.callOpenAI(prompt, 50);
      return response.trim() !== 'null' ? response.trim() : null;
    } catch (error) {
      return null;
    }
  }

  private async generateIndications(drug: FDALabel): Promise<string> {
    const prompt = `Based on the drug name "${drug.drugName}" and available information, provide a brief summary of its FDA-approved indications. If no clear indications can be determined, return "Indications data not available."`;

    try {
      const response = await this.callOpenAI(prompt, 200);
      return `AI-generated summary: ${response}`;
    } catch (error) {
      return 'Indications data not available.';
    }
  }

  private async generateDosageInfo(drug: FDALabel): Promise<string> {
    const prompt = `Based on the drug "${drug.drugName}", provide general dosage and administration guidelines. If specific dosing cannot be determined, return "See full prescribing information for dosage details."`;

    try {
      const response = await this.callOpenAI(prompt, 200);
      return `AI-generated summary: ${response}`;
    } catch (error) {
      return 'See full prescribing information for dosage details.';
    }
  }

  private async generateUserSpecificContent(drug: FDALabel): Promise<UserSpecificContent> {
    try {
      const [patient, provider, caregiver] = await Promise.all([
        this.generatePatientContent(drug),
        this.generateProviderContent(drug),
        this.generateCaregiverContent(drug)
      ]);

      return { patient, provider, caregiver };
    } catch (error) {
      this.logger.error('Failed to generate user-specific content:', error);
      return {};
    }
  }

  private async generatePatientContent(drug: FDALabel): Promise<UserSpecificContent['patient']> {
    const prompt = `Create a patient-friendly summary for ${drug.drugName}:
1. Simple explanation of what the drug does
2. Key points to remember (3-5 bullet points)
3. Important safety information in plain language

Use 8th-grade reading level. Avoid medical jargon.`;

    try {
      const response = await this.callOpenAI(prompt, 300);
      // Parse response and calculate readability
      return {
        summary: response,
        keyPoints: this.extractBulletPoints(response),
        readabilityScore: 0.85 // Placeholder - would use actual readability calculation
      };
    } catch (error) {
      return {
        summary: `${drug.drugName} is a prescription medication. Talk to your doctor about how it works and what to expect.`,
        keyPoints: ['Take as directed by your doctor', 'Report any side effects', 'Do not stop without consulting your doctor'],
        readabilityScore: 0.9
      };
    }
  }

  private async generateProviderContent(drug: FDALabel): Promise<UserSpecificContent['provider']> {
    const existingContent = drug.label.clinicalPharmacology || drug.label.indicationsAndUsage || '';
    
    const prompt = `Create a clinical summary for healthcare providers about ${drug.drugName}:
1. Brief mechanism of action
2. Key prescribing considerations
3. Major contraindications

Based on: ${existingContent.substring(0, 500)}`;

    try {
      const response = await this.callOpenAI(prompt, 400);
      return {
        clinicalSummary: response,
        prescribingHighlights: this.extractBulletPoints(response).slice(0, 5),
        contraindications: this.extractContraindications(drug)
      };
    } catch (error) {
      return {
        clinicalSummary: this.extractCleanIndications(drug),
        prescribingHighlights: ['See full prescribing information'],
        contraindications: this.extractContraindications(drug)
      };
    }
  }

  private async generateCaregiverContent(drug: FDALabel): Promise<UserSpecificContent['caregiver']> {
    const prompt = `Create caregiver guidance for ${drug.drugName}:
1. How to help administer the medication safely
2. What to monitor for
3. When to seek emergency help

Focus on practical, actionable information.`;

    try {
      const response = await this.callOpenAI(prompt, 300);
      return {
        administrationGuide: response,
        monitoringPoints: this.extractBulletPoints(response).slice(0, 4),
        emergencyInfo: 'Call 911 or poison control if severe symptoms occur.'
      };
    } catch (error) {
      return {
        administrationGuide: 'Follow the prescribed dosing schedule and administration instructions.',
        monitoringPoints: ['Watch for allergic reactions', 'Monitor for side effects', 'Ensure doses are not missed'],
        emergencyInfo: 'Seek immediate medical attention for severe reactions.'
      };
    }
  }

  private extractBulletPoints(text: string): string[] {
    const lines = text.split('\n');
    const bulletPoints: string[] = [];
    
    for (const line of lines) {
      if (line.match(/^[-•*]\s+/) || line.match(/^\d+\.\s+/)) {
        bulletPoints.push(line.replace(/^[-•*\d.]\s+/, '').trim());
      }
    }
    
    return bulletPoints.length > 0 ? bulletPoints : ['See full information for details'];
  }

  private extractContraindications(drug: FDALabel): string[] {
    const contraindicationsText = drug.label.contraindications || '';
    if (!contraindicationsText) {
      return ['See full prescribing information for contraindications'];
    }

    // Simple extraction - in production would use more sophisticated parsing
    const bullets = this.extractBulletPoints(contraindicationsText);
    return bullets.length > 0 ? bullets.slice(0, 3) : [contraindicationsText.substring(0, 100) + '...'];
  }
}