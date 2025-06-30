// API contracts for search endpoints

export interface SearchRequest {
  query: string;
  type?: 'all' | 'drug' | 'indication' | 'manufacturer';
  filters?: {
    drugClass?: string[];
    manufacturer?: string[];
    indication?: string[];
    hasAiContent?: boolean;
  };
  page?: number;
  limit?: number;
  sortBy?: 'relevance' | 'name' | 'date';
}

export interface SearchResponse {
  results: SearchResult[];
  facets: {
    drugClasses: FacetItem[];
    manufacturers: FacetItem[];
    indications: FacetItem[];
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  query: {
    original: string;
    corrected?: string;
    suggestions?: string[];
  };
}

export interface SearchResult {
  id: string;
  type: 'drug' | 'indication' | 'content';
  title: string;
  description: string;
  url: string;
  highlights: {
    title?: string[];
    description?: string[];
    content?: string[];
  };
  score: number;
  drug?: {
    brandName: string;
    genericName: string;
    manufacturer: string;
    drugClass: string;
  };
}

export interface FacetItem {
  value: string;
  label: string;
  count: number;
}

export interface AutocompleteRequest {
  query: string;
  limit?: number;
  type?: 'drug' | 'generic' | 'indication' | 'all';
}

export interface AutocompleteResponse {
  suggestions: Array<{
    value: string;
    type: 'drug' | 'generic' | 'indication';
    metadata?: {
      drugId?: string;
      slug?: string;
      manufacturer?: string;
    };
  }>;
}