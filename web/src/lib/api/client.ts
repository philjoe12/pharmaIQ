// Use Next.js API routes for all calls (they will proxy to API Gateway)
const API_BASE_URL = typeof window === 'undefined' 
  ? process.env.NEXT_PUBLIC_BASE_URL || ''  // Server-side: use relative URLs
  : ''  // Client-side: use relative URLs for Next.js API routes

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface ApiError {
  message: string
  status: number
  details?: any
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.requestWithRetry<T>(endpoint, options, 0);
  }

  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit,
    attempt: number
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          message: errorData.error?.message || `HTTP error! status: ${response.status}`,
          status: response.status,
          details: errorData
        } as ApiError
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      const apiError = error as ApiError
      
      // Retry for server errors or network issues
      if (attempt < 2 && (apiError.status >= 500 || !apiError.status)) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        return this.requestWithRetry<T>(endpoint, options, attempt + 1)
      }
      
      throw apiError
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient()