import { apiClient } from './client';
export class DrugsApi {
    static async getDrugs(query = {}) {
        const params = new URLSearchParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined) {
                params.append(key, String(value));
            }
        });
        const endpoint = `/drugs${params.toString() ? `?${params.toString()}` : ''}`;
        return apiClient.get(endpoint);
    }
    static async getDrugBySlug(slug) {
        return apiClient.get(`/drugs/${slug}`);
    }
    static async getDrugById(id) {
        return apiClient.get(`/drugs/${id}`);
    }
    static async getRelatedDrugs(drugId) {
        return apiClient.get(`/drugs/${drugId}/related`);
    }
    static async searchDrugs(query) {
        return apiClient.get(`/drugs/search?q=${encodeURIComponent(query)}`);
    }
}
export const drugsApi = DrugsApi;
