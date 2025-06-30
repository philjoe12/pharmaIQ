export interface BaseEvent {
  id: string;
  timestamp: Date;
  correlationId: string;
  metadata?: Record<string, any>;
}

// Drug Import Events
export interface DrugImportStartedEvent extends BaseEvent {
  type: 'drug.import.started';
  payload: {
    fileName: string;
    totalDrugs: number;
    jobId: string;
  };
}

export interface DrugImportCompletedEvent extends BaseEvent {
  type: 'drug.import.completed';
  payload: {
    jobId: string;
    drugsProcessed: number;
    duration: number;
  };
}

export interface DrugImportFailedEvent extends BaseEvent {
  type: 'drug.import.failed';
  payload: {
    jobId: string;
    error: string;
    failedDrugs: string[];
  };
}

// Processing Events
export interface DrugProcessingStartedEvent extends BaseEvent {
  type: 'drug.processing.started';
  payload: {
    drugId: string;
    drugName: string;
  };
}

export interface DrugProcessingCompletedEvent extends BaseEvent {
  type: 'drug.processing.completed';
  payload: {
    drugId: string;
    drugName: string;
    sectionsProcessed: string[];
  };
}

// AI Enhancement Events
export interface AIEnhancementStartedEvent extends BaseEvent {
  type: 'ai.enhancement.started';
  payload: {
    drugId: string;
    enhancementTypes: AIEnhancementType[];
  };
}

export interface AIEnhancementCompletedEvent extends BaseEvent {
  type: 'ai.enhancement.completed';
  payload: {
    drugId: string;
    enhancements: {
      type: AIEnhancementType;
      success: boolean;
      tokensUsed?: number;
    }[];
  };
}

export interface AIEnhancementFailedEvent extends BaseEvent {
  type: 'ai.enhancement.failed';
  payload: {
    drugId: string;
    error: string;
    provider: string;
    fallbackUsed: boolean;
  };
}

// SEO Events
export interface SEOGenerationStartedEvent extends BaseEvent {
  type: 'seo.generation.started';
  payload: {
    drugId: string;
    tasks: SEOTask[];
  };
}

export interface SEOGenerationCompletedEvent extends BaseEvent {
  type: 'seo.generation.completed';
  payload: {
    drugId: string;
    metadataGenerated: boolean;
    sitemapUpdated: boolean;
    structuredDataCreated: boolean;
  };
}

// Search Index Events
export interface SearchIndexUpdateStartedEvent extends BaseEvent {
  type: 'search.index.update.started';
  payload: {
    drugId: string;
    indexName: string;
  };
}

export interface SearchIndexUpdateCompletedEvent extends BaseEvent {
  type: 'search.index.update.completed';
  payload: {
    drugId: string;
    indexName: string;
    documentSize: number;
  };
}

// Cache Events
export interface CacheInvalidationEvent extends BaseEvent {
  type: 'cache.invalidation';
  payload: {
    keys: string[];
    reason: string;
  };
}

// Type Unions
export type DrugEvent = 
  | DrugImportStartedEvent
  | DrugImportCompletedEvent
  | DrugImportFailedEvent
  | DrugProcessingStartedEvent
  | DrugProcessingCompletedEvent;

export type AIEvent =
  | AIEnhancementStartedEvent
  | AIEnhancementCompletedEvent
  | AIEnhancementFailedEvent;

export type SEOEvent =
  | SEOGenerationStartedEvent
  | SEOGenerationCompletedEvent;

export type SystemEvent =
  | SearchIndexUpdateStartedEvent
  | SearchIndexUpdateCompletedEvent
  | CacheInvalidationEvent;

export type PlatformEvent = DrugEvent | AIEvent | SEOEvent | SystemEvent;

// Enums
export enum AIEnhancementType {
  SEO_TITLE = 'seo_title',
  META_DESCRIPTION = 'meta_description',
  CONTENT_SIMPLIFICATION = 'content_simplification',
  FAQ_GENERATION = 'faq_generation',
  RELATED_DRUGS = 'related_drugs',
  KNOWLEDGE_GRAPH = 'knowledge_graph'
}

export enum SEOTask {
  GENERATE_METADATA = 'generate_metadata',
  CREATE_STRUCTURED_DATA = 'create_structured_data',
  UPDATE_SITEMAP = 'update_sitemap',
  BUILD_KNOWLEDGE_GRAPH = 'build_knowledge_graph',
  GENERATE_INTERNAL_LINKS = 'generate_internal_links'
}