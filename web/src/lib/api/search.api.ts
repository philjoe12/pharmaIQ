import { apiClient, ApiResponse } from './client'
import { Drug } from './drugs.api'

export interface SearchFilters {
  category?: string
  manufacturer?: string
  prescription?: boolean
  minPrice?: number
  maxPrice?: number
}

export interface SearchQuery {
  q: string
  filters?: SearchFilters
  page?: number
  limit?: number
  sortBy?: 'relevance' | 'name' | 'manufacturer' | 'created'
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  drugs: Drug[]
  total: number
  page: number
  totalPages: number
  facets: SearchFacets
}

export interface SearchFacets {
  categories: Array<{ name: string; count: number }>
  manufacturers: Array<{ name: string; count: number }>
  priceRanges: Array<{ range: string; count: number }>
}

export interface SearchSuggestion {
  text: string
  type: 'drug' | 'category' | 'manufacturer'
  count: number
}

export class SearchApi {
  static async search(query: SearchQuery): Promise<ApiResponse<SearchResult>> {
    return apiClient.post<SearchResult>('/api/search', query)
  }

  static async getSuggestions(query: string): Promise<ApiResponse<SearchSuggestion[]>> {
    return apiClient.get<SearchSuggestion[]>(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
  }

  static async getPopularSearches(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>('/api/search/popular')
  }

  static async autocomplete(query: string): Promise<ApiResponse<Drug[]>> {
    return apiClient.get<Drug[]>(`/api/search/autocomplete?q=${encodeURIComponent(query)}`)
  }
}

export const searchApi = SearchApi