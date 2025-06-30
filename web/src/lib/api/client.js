// Use internal Docker network URL for server-side calls, external URL for client-side
const API_BASE_URL = typeof window === 'undefined'
    ? 'http://api:3001' // Server-side: use Docker internal network
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'; // Client-side: use external URL
class ApiClient {
    baseUrl;
    constructor(baseUrl = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }
    async request(endpoint, options = {}) {
        return this.requestWithRetry(endpoint, options, 0);
    }
    async requestWithRetry(endpoint, options, attempt) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };
        try {
            const response = await fetch(url, config);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw {
                    message: errorData.error?.message || `HTTP error! status: ${response.status}`,
                    status: response.status,
                    details: errorData
                };
            }
            const data = await response.json();
            return data;
        }
        catch (error) {
            const apiError = error;
            // Retry for server errors or network issues
            if (attempt < 2 && (apiError.status >= 500 || !apiError.status)) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                return this.requestWithRetry(endpoint, options, attempt + 1);
            }
            throw apiError;
        }
    }
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}
export const apiClient = new ApiClient();
