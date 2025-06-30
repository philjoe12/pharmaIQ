// Queue contracts for AI processing

export interface AiProcessingJob {
  id: string;
  type: 'content-enhancement' | 'faq-generation' | 'seo-generation';
  data: {
    drugId: string;
    drugName: string;
    genericName: string;
    content: {
      indications?: string;
      dosage?: string;
      warnings?: string;
      adverseReactions?: string;
    };
    processingOptions?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };
  };
  options?: {
    priority?: number;
    delay?: number;
    attempts?: number;
    backoff?: {
      type: 'exponential' | 'fixed';
      delay: number;
    };
  };
}

export interface AiProcessingResult {
  success: boolean;
  drugId: string;
  type: string;
  results: {
    enhancedTitle?: string;
    enhancedDescription?: string;
    faqs?: Array<{ question: string; answer: string }>;
    simplifiedContent?: Record<string, string>;
    seoContent?: {
      metaTitle: string;
      metaDescription: string;
      focusKeywords: string[];
    };
  };
  metadata: {
    model: string;
    tokensUsed: number;
    processingTime: number;
    cost?: number;
  };
  error?: string;
}