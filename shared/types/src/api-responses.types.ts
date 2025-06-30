// Generic API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface ResponseMetadata {
  timestamp: Date;
  version: string;
  requestId: string;
  processingTime?: number;
}

// Pagination
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// Drug-specific responses
export interface DrugListResponse extends PaginatedResponse<DrugSummary> {}

export interface DrugSummary {
  id: string;
  slug: string;
  brandName: string;
  genericName: string;
  manufacturer: string;
  status: string;
  lastUpdated: Date;
}

export interface DrugDetailResponse extends ApiResponse<Drug> {}

// Search responses
export interface SearchResponse extends ApiResponse<SearchResults> {}

export interface SearchResults {
  query: string;
  totalResults: number;
  drugs: SearchResult[];
  facets: SearchFacets;
  suggestions?: string[];
  executionTime: number;
}

export interface SearchResult {
  id: string;
  slug: string;
  brandName: string;
  genericName: string;
  manufacturer: string;
  score: number;
  highlights: {
    [field: string]: string[];
  };
}

export interface SearchFacets {
  manufacturers: FacetBucket[];
  therapeuticCategories: FacetBucket[];
  dosageForms: FacetBucket[];
}

export interface FacetBucket {
  key: string;
  count: number;
}

// Import responses
export interface ImportResponse extends ApiResponse<ImportResult> {}

export interface ImportResult {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalDrugs: number;
  processedDrugs: number;
  failedDrugs: number;
  startedAt: Date;
  completedAt?: Date;
  errors?: ImportError[];
}

export interface ImportError {
  drugName: string;
  error: string;
  timestamp: Date;
}

// Comparison responses
export interface ComparisonResponse extends ApiResponse<DrugComparison> {}

export interface DrugComparison {
  drugs: Drug[];
  comparisonAspects: ComparisonAspect[];
}

export interface ComparisonAspect {
  aspect: string;
  drugData: {
    drugId: string;
    value: any;
  }[];
}

// Health check response
export interface HealthCheckResponse extends ApiResponse<HealthStatus> {}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: ServiceHealth[];
  timestamp: Date;
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

// Import the Drug type from drug.types.ts
import { Drug } from './drug.types';