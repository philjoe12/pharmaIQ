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

export interface EnhancedContent {
  seoTitle: string;
  metaDescription: string;
  providerExplanation: string;
  faqs: FAQ[];
  relatedConditions: string[];
  relatedDrugs: string[];
  keyBenefits: string[];
  patientFriendlyName?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private openai: OpenAI;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY') || 'sk-test-key';
    this.openai = new OpenAI({ apiKey });
  }

  async enhanceDrugContent(drug: FDALabel): Promise<EnhancedContent> {
    try {
      const [
        seoTitle,
        metaDescription,
        providerExplanation,
        faqs,
        relatedContent
      ] = await Promise.all([
        this.generateSEOTitle(drug),
        this.generateMetaDescription(drug),
        this.generateProviderExplanation(drug),
        this.generateFAQs(drug),
        this.generateRelatedContent(drug)
      ]);

      return {
        seoTitle,
        metaDescription,
        providerExplanation,
        faqs,
        ...relatedContent
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

  private async callOpenAI(prompt: string, maxTokens: number = 150): Promise<string> {
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
}