import { BaseEvent } from '@pharmaiq/types';

export interface AiProcessingRequestedEvent extends BaseEvent {
  type: 'ai.processing.requested';
  payload: {
    drugId: string;
    processingType: 'content_enhancement' | 'faq_generation' | 'seo_optimization';
    priority: 'high' | 'normal' | 'low';
    requestedFields?: string[];
  };
}

export interface AiProcessingCompletedEvent extends BaseEvent {
  type: 'ai.processing.completed';
  payload: {
    drugId: string;
    processingType: string;
    results: {
      enhancedTitle?: string;
      enhancedDescription?: string;
      faqs?: Array<{ question: string; answer: string }>;
      relatedDrugs?: string[];
      simplifiedContent?: Record<string, string>;
    };
    processingTime: number;
  };
}

export interface AiProcessingFailedEvent extends BaseEvent {
  type: 'ai.processing.failed';
  payload: {
    drugId: string;
    processingType: string;
    error: string;
    retryable: boolean;
    attemptNumber: number;
  };
}