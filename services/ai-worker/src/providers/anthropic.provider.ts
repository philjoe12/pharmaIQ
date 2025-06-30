import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, AIProviderConfig, AIResponse, PromptContext, AIProviderError } from './ai-provider.interface';

export class AnthropicProvider extends AIProvider {
  private client: Anthropic;

  constructor(config: AIProviderConfig) {
    super(config);
    this.validateConfig();
    
    this.client = new Anthropic({
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
    });
  }

  async generateContent(prompt: string, context?: PromptContext): Promise<AIResponse> {
    if (this.rateLimitDelay > 0) {
      await this.delay(this.rateLimitDelay);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);

      const response = await this.client.completions.create({
        model: this.config.model,
        max_tokens_to_sample: context?.maxLength || this.config.maxTokens || 1000,
        temperature: this.config.temperature || 0.3,
        prompt: `${systemPrompt}\n\nHuman: ${prompt}\n\nAssistant:`,
      });

      const content = response.completion || '';
      if (!content) {
        throw new Error('No content generated from Anthropic');
      }

      if (!this.validateResponse(content, context)) {
        throw new Error('Generated content failed validation');
      }

      // Reset rate limit delay on success
      this.rateLimitDelay = 0;

      return {
        content,
        usage: undefined, // Anthropic completions API doesn't return detailed usage
        model: response.model || this.config.model,
        provider: this.getProviderName(),
        timestamp: new Date(),
      };

    } catch (error: any) {
      if (error.status === 429) {
        const retryAfter = error.headers?.['retry-after'];
        this.handleRateLimit(retryAfter);
        throw this.createProviderError('RATE_LIMITED', error.message, true);
      }

      if (error.status >= 500) {
        throw this.createProviderError('SERVER_ERROR', error.message, true);
      }

      if (error.status === 400) {
        throw this.createProviderError('INVALID_REQUEST', error.message, false);
      }

      throw this.createProviderError('UNKNOWN_ERROR', error.message, false);
    }
  }

  validateResponse(response: string, context?: PromptContext): boolean {
    if (!response || response.trim().length === 0) {
      return false;
    }

    // Basic validation based on content type
    if (context?.contentType) {
      switch (context.contentType) {
        case 'seo-title':
          return response.length <= 60 && response.length >= 10;
        case 'meta-description':
          return response.length <= 160 && response.length >= 50;
        case 'faq':
          return response.includes('?') && response.length >= 50;
        case 'provider-explanation':
          return response.length >= 100;
      }
    }

    // Check for medical disclaimers (should not generate medical advice)
    const medicalAdvicePatterns = [
      /\b(diagnose|treat|cure|prescribe)\b/i,
      /\b(medical advice|medical treatment)\b/i,
      /\b(should take|recommended dose)\b/i,
    ];

    for (const pattern of medicalAdvicePatterns) {
      if (pattern.test(response)) {
        console.warn('Generated content contains potential medical advice:', response.substring(0, 100));
        return false;
      }
    }

    return true;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.completions.create({
        model: this.config.model,
        max_tokens_to_sample: 5,
        prompt: 'Human: Test\n\nAssistant:',
      });
      return !!response.completion;
    } catch (error) {
      return false;
    }
  }

  getProviderName(): string {
    return 'Anthropic';
  }

  getModelInfo(): { model: string; provider: string; capabilities: string[] } {
    return {
      model: this.config.model,
      provider: 'Anthropic',
      capabilities: [
        'text-generation',
        'medical-content',
        'seo-optimization',
        'content-enhancement',
        'faq-generation',
        'reasoning',
      ],
    };
  }

  private buildSystemPrompt(context?: PromptContext): string {
    let systemPrompt = `You are an expert medical content writer creating ${context?.contentType || 'content'} for healthcare professionals and patients. 

CRITICAL GUIDELINES:
- Never provide medical advice, diagnosis, or treatment recommendations
- Always include appropriate disclaimers when discussing medical conditions
- Focus on factual, FDA-approved information only
- Use clear, accessible language while maintaining accuracy
- Maintain professional medical tone
- Always defer to healthcare professionals for medical decisions`;

    if (context?.targetAudience) {
      systemPrompt += `\n\nTarget Audience: ${context.targetAudience}`;
    }

    if (context?.tone) {
      systemPrompt += `\n\nTone: ${context.tone}`;
    }

    if (context?.requirements?.length) {
      systemPrompt += `\n\nSpecific Requirements:\n${context.requirements.map(req => `- ${req}`).join('\n')}`;
    }

    return systemPrompt;
  }

  private createProviderError(code: string, message: string, retryable: boolean): AIProviderError {
    return {
      code,
      message,
      provider: this.getProviderName(),
      retryable,
      rateLimited: code === 'RATE_LIMITED',
    };
  }
}