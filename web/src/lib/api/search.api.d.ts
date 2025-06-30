import { ApiResponse } from './client';
import { Drug } from './drugs.api';
export interface SearchFilters {
    category?: string;
    manufacturer?: string;
    prescription?: boolean;
    minPrice?: number;
    maxPrice?: number;
}
export interface SearchQuery {
    q: string;
    filters?: SearchFilters;
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'name' | 'manufacturer' | 'created';
    sortOrder?: 'asc' | 'desc';
}
export interface SearchResult {
    drugs: Drug[];
    total: number;
    page: number;
    totalPages: number;
    facets: SearchFacets;
}
export interface SearchFacets {
    categories: Array<{
        name: string;
        count: number;
    }>;
    manufacturers: Array<{
        name: string;
        count: number;
    }>;
    priceRanges: Array<{
        range: string;
        count: number;
    }>;
}
export interface SearchSuggestion {
    text: string;
    type: 'drug' | 'category' | 'manufacturer';
    count: number;
}
export declare class SearchApi {
    static search(query: SearchQuery): Promise<ApiResponse<SearchResult>>;
    static getSuggestions(query: string): Promise<ApiResponse<SearchSuggestion[]>>;
    static getPopularSearches(): Promise<ApiResponse<string[]>>;
    static autocomplete(query: string): Promise<ApiResponse<Drug[]>>;
}
export declare const searchApi: typeof SearchApi;
