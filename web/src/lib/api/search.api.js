import { apiClient } from './client';
export class SearchApi {
    static async search(query) {
        return apiClient.post('/api/search', query);
    }
    static async getSuggestions(query) {
        return apiClient.get(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
    }
    static async getPopularSearches() {
        return apiClient.get('/api/search/popular');
    }
    static async autocomplete(query) {
        return apiClient.get(`/api/search/autocomplete?q=${encodeURIComponent(query)}`);
    }
}
export const searchApi = SearchApi;
