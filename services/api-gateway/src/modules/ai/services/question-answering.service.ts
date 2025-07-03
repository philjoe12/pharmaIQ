import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import OpenAI from 'openai';
import { EmbeddingService } from './embedding.service';
import { DrugEntity } from '../../../database/entities/drug.entity';
import { AIService } from './ai.service';

export interface QuestionAnswerResponse {
  question: string;
  answer: string;
  relevantDrugs: DrugInfo[];
  seoFriendlyUrl?: string;
  structuredData?: any;
  confidence: number;
  cached: boolean;
  suggestedQuestions?: string[];
}

export interface DrugInfo {
  setId: string;
  drugName: string;
  genericName?: string;
  slug: string;
  relevanceScore: number;
  keyPoints: string[];
}

@Injectable()
export class QuestionAnsweringService {
  private readonly logger = new Logger(QuestionAnsweringService.name);
  private openai: OpenAI;

  constructor(
    private configService: ConfigService,
    private embeddingService: EmbeddingService,
    private aiService: AIService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectRepository(DrugEntity)
    private drugRepository: Repository<DrugEntity>,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.openai = new OpenAI({ apiKey: apiKey || 'sk-test-key' });
  }

  async answerQuestion(
    question: string,
    userType: 'patient' | 'provider' | 'general' = 'general',
    limit: number = 5
  ): Promise<QuestionAnswerResponse> {
    const normalizedQuestion = question.trim().toLowerCase();
    const cacheKey = `qa:${normalizedQuestion}:${userType}`;
    
    // Check cache first
    const cached = await this.cacheManager.get<QuestionAnswerResponse>(cacheKey);
    if (cached) {
      this.logger.log(`Returning cached answer for: ${question}`);
      return { ...cached, cached: true };
    }

    try {
      // Find relevant drugs using embeddings
      const relevantDrugs = await this.findRelevantDrugs(question, limit);
      
      // Generate AI answer with drug context
      const answer = await this.generateAnswer(question, relevantDrugs, userType);
      
      // Create SEO-friendly URL
      const seoFriendlyUrl = this.generateSeoUrl(question);
      
      // Generate structured data for SEO
      const structuredData = this.generateStructuredData(question, answer, relevantDrugs);
      
      // Generate suggested follow-up questions
      const suggestedQuestions = await this.generateSuggestedQuestions(question, relevantDrugs);
      
      const response: QuestionAnswerResponse = {
        question,
        answer,
        relevantDrugs: relevantDrugs.map(drug => ({
          setId: drug.setId,
          drugName: drug.drugName,
          genericName: drug.genericName,
          slug: drug.slug,
          relevanceScore: drug.relevanceScore || 0,
          keyPoints: this.extractKeyPoints(drug, question)
        })),
        seoFriendlyUrl,
        structuredData,
        confidence: this.calculateConfidence(relevantDrugs),
        cached: false,
        suggestedQuestions
      };
      
      // Cache for 1 hour
      await this.cacheManager.set(cacheKey, response, 3600);
      
      // Store popular questions for SEO
      await this.trackQuestion(question);
      
      return response;
    } catch (error) {
      this.logger.error(`Failed to answer question: ${question}`, error);
      return this.getFallbackAnswer(question);
    }
  }

  private async findRelevantDrugs(question: string, limit: number): Promise<any[]> {
    try {
      // Use semantic search to find relevant drugs
      const results = await this.embeddingService.semanticSearch(question, {
        contentType: 'summary',
        limit: limit * 2, // Get more to filter
        threshold: 0.2 // Lower threshold for questions
      });
      
      // If semantic search fails or returns no results, try keyword search
      if (!results || results.length === 0) {
        return this.fallbackKeywordSearch(question, limit);
      }
      
      // Sort by relevance and take top results
      return results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, limit)
        .map(result => ({
          ...result.drug,
          relevanceScore: result.similarity
        }));
    } catch (error) {
      this.logger.error('Semantic search failed:', error);
      return this.fallbackKeywordSearch(question, limit);
    }
  }

  private async fallbackKeywordSearch(question: string, limit: number): Promise<any[]> {
    // Extract keywords from question
    const keywords = this.extractKeywords(question);
    
    const queryBuilder = this.drugRepository
      .createQueryBuilder('drug')
      .where('drug.status = :status', { status: 'published' });
    
    // Add keyword conditions
    if (keywords.length > 0) {
      const conditions = keywords.map((_, index) => 
        `(drug.drug_name ILIKE :keyword${index} OR drug.label_data::text ILIKE :keyword${index})`
      ).join(' OR ');
      
      queryBuilder.andWhere(`(${conditions})`);
      
      keywords.forEach((keyword, index) => {
        queryBuilder.setParameter(`keyword${index}`, `%${keyword}%`);
      });
    }
    
    const drugs = await queryBuilder.limit(limit).getMany();
    
    return drugs.map(drug => ({
      ...drug,
      relevanceScore: 0.5 // Default relevance for keyword matches
    }));
  }

  private async generateAnswer(
    question: string,
    relevantDrugs: any[],
    userType: string
  ): Promise<string> {
    const drugContext = relevantDrugs
      .map(drug => `${drug.drugName} (${drug.genericName || 'N/A'}): ${this.extractDrugSummary(drug)}`)
      .join('\n\n');
    
    const prompt = `As a medical information expert, answer this ${userType} question based on FDA-approved drug information:

Question: ${question}

Relevant FDA-approved drugs:
${drugContext}

Guidelines:
- Provide accurate, evidence-based information
- Reference specific drugs when relevant
- Include appropriate medical disclaimers
- Keep the answer concise (2-3 paragraphs)
- Use ${userType === 'patient' ? 'simple, clear language' : 'professional medical terminology'}
- Never provide personal medical advice
- Always recommend consulting healthcare professionals

Answer:`;

    try {
      const response = await this.aiService.callOpenAI(prompt, 500);
      return this.sanitizeAnswer(response);
    } catch (error) {
      this.logger.error('Failed to generate AI answer:', error);
      return this.getGenericAnswer(question, relevantDrugs);
    }
  }

  private extractDrugSummary(drug: any): string {
    const indications = drug.labelData?.indicationsAndUsage || drug.label?.indicationsAndUsage || '';
    return indications
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200) + '...';
  }

  private extractKeyPoints(drug: any, question: string): string[] {
    const points: string[] = [];
    const questionLower = question.toLowerCase();
    
    // Extract relevant points based on question keywords
    if (questionLower.includes('side effect') || questionLower.includes('adverse')) {
      const adverseReactions = drug.labelData?.adverseReactions || drug.label?.adverseReactions || '';
      if (adverseReactions) {
        points.push(`Common side effects: ${this.extractFirstSentence(adverseReactions)}`);
      }
    }
    
    if (questionLower.includes('dosage') || questionLower.includes('dose')) {
      const dosage = drug.labelData?.dosageAndAdministration || drug.label?.dosageAndAdministration || '';
      if (dosage) {
        points.push(`Dosing: ${this.extractFirstSentence(dosage)}`);
      }
    }
    
    if (questionLower.includes('use') || questionLower.includes('treat')) {
      const indications = drug.labelData?.indicationsAndUsage || drug.label?.indicationsAndUsage || '';
      if (indications) {
        points.push(`Used for: ${this.extractFirstSentence(indications)}`);
      }
    }
    
    return points.slice(0, 3);
  }

  private extractFirstSentence(text: string): string {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/[.!?]/)[0]
      .trim()
      .substring(0, 150);
  }

  private generateSeoUrl(question: string): string {
    const slug = question
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .substring(0, 60);
    
    return `/questions/${slug}`;
  }

  private generateStructuredData(question: string, answer: string, drugs: any[]): any {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': {
        '@type': 'Question',
        'name': question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': answer,
          'mentions': drugs.map(drug => ({
            '@type': 'Drug',
            'name': drug.drugName,
            'nonProprietaryName': drug.genericName,
            'url': `/drugs/${drug.slug}`
          }))
        }
      }
    };
  }

  private async generateSuggestedQuestions(question: string, drugs: any[]): Promise<string[]> {
    const drugNames = drugs.slice(0, 3).map(d => d.drugName).join(', ');
    
    const prompt = `Based on the question "${question}" about ${drugNames}, suggest 3 related follow-up questions that users might ask. Keep them concise and relevant.

Format as a simple list:
1. Question 1
2. Question 2
3. Question 3`;

    try {
      const response = await this.aiService.callOpenAI(prompt, 150);
      return this.parseSuggestedQuestions(response);
    } catch (error) {
      return this.getDefaultSuggestedQuestions(drugs);
    }
  }

  private parseSuggestedQuestions(response: string): string[] {
    const lines = response.split('\n');
    const questions: string[] = [];
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s+(.+)$/);
      if (match) {
        questions.push(match[1].trim());
      }
    }
    
    return questions.slice(0, 3);
  }

  private getDefaultSuggestedQuestions(drugs: any[]): string[] {
    if (drugs.length === 0) return [];
    
    const drugName = drugs[0].drugName;
    return [
      `What are the side effects of ${drugName}?`,
      `How does ${drugName} compare to similar medications?`,
      `What is the recommended dosage for ${drugName}?`
    ];
  }

  private calculateConfidence(drugs: any[]): number {
    if (drugs.length === 0) return 0.2;
    
    // Calculate based on relevance scores and number of relevant drugs
    const avgRelevance = drugs.reduce((sum, drug) => sum + (drug.relevanceScore || 0), 0) / drugs.length;
    const countFactor = Math.min(drugs.length / 5, 1); // Max out at 5 drugs
    
    return Math.min(avgRelevance * 0.7 + countFactor * 0.3, 0.95);
  }

  private sanitizeAnswer(answer: string): string {
    return answer
      .replace(/\*\*/g, '') // Remove markdown bold
      .replace(/\n{3,}/g, '\n\n') // Limit multiple newlines
      .trim();
  }

  private getGenericAnswer(question: string, drugs: any[]): string {
    if (drugs.length === 0) {
      return `I couldn't find specific drug information related to your question: "${question}". Please consult with a healthcare professional for personalized medical advice.`;
    }
    
    const drugList = drugs.slice(0, 3).map(d => d.drugName).join(', ');
    return `Based on FDA-approved information, here are some relevant medications: ${drugList}. For detailed information about these medications and how they might relate to your question, please consult with a healthcare provider.`;
  }

  private getFallbackAnswer(question: string): QuestionAnswerResponse {
    return {
      question,
      answer: 'I apologize, but I cannot provide a detailed answer at this moment. Please try again later or consult with a healthcare professional.',
      relevantDrugs: [],
      confidence: 0,
      cached: false
    };
  }

  private extractKeywords(question: string): string[] {
    // Remove common words and extract meaningful keywords
    const stopWords = new Set(['what', 'is', 'are', 'the', 'for', 'how', 'does', 'do', 'can', 'to', 'a', 'an']);
    
    return question
      .toLowerCase()
      .replace(/[?.,!]/g, '')
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5);
  }

  private async trackQuestion(question: string): Promise<void> {
    try {
      const trackingKey = 'popular-questions';
      const existing = await this.cacheManager.get<Record<string, number>>(trackingKey) || {};
      
      const normalizedQuestion = question.trim().toLowerCase();
      existing[normalizedQuestion] = (existing[normalizedQuestion] || 0) + 1;
      
      // Keep only top 100 questions
      const sorted = Object.entries(existing)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 100);
      
      await this.cacheManager.set(
        trackingKey, 
        Object.fromEntries(sorted),
        86400 * 7 // 7 days
      );
    } catch (error) {
      this.logger.error('Failed to track question:', error);
    }
  }

  async getPopularQuestions(limit: number = 10): Promise<string[]> {
    try {
      const trackingKey = 'popular-questions';
      const questions = await this.cacheManager.get<Record<string, number>>(trackingKey) || {};
      
      return Object.entries(questions)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit)
        .map(([question]) => question);
    } catch (error) {
      this.logger.error('Failed to get popular questions:', error);
      return [];
    }
  }
}