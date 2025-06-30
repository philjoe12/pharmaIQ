export interface AIProviderConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

export interface AIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  timestamp: Date;
}

export interface AIProviderError {
  code: string;
  message: string;
  provider: string;
  retryable: boolean;
  rateLimited?: boolean;
}

export interface PromptContext {
  drugData: any;
  contentType: string;
  targetAudience?: 'healthcare_provider' | 'patient' | 'general';
  maxLength?: number;
  tone?: 'professional' | 'accessible' | 'technical';
  requirements?: string[];
}

export abstract class AIProvider {
  protected config: AIProviderConfig;
  protected rateLimitDelay: number = 0;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  abstract generateContent(prompt: string, context?: PromptContext): Promise<AIResponse>;
  abstract validateResponse(response: string, context?: PromptContext): boolean;
  abstract isHealthy(): Promise<boolean>;
  abstract getProviderName(): string;
  abstract getModelInfo(): { model: string; provider: string; capabilities: string[] };

  protected handleRateLimit(retryAfter?: number): void {
    this.rateLimitDelay = retryAfter ? retryAfter * 1000 : Math.min(this.rateLimitDelay * 2, 60000);
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`API key is required for ${this.getProviderName()}`);
    }
    if (!this.config.model) {
      throw new Error(`Model is required for ${this.getProviderName()}`);
    }
  }
}