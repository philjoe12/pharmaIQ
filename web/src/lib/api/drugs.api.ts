import { apiClient, ApiResponse } from './client'

// Types matching the actual Labels.json structure
export interface DrugLabel {
  setId: string
  slug: string
  drugName: string
  labeler: string
  label: {
    genericName?: string
    title?: string
    description?: string
    indicationsAndUsage?: string
    dosageAndAdministration?: string
    warningsAndPrecautions?: string
    adverseReactions?: string
    contraindications?: string
    clinicalPharmacology?: string
    clinicalStudies?: string
  }
}

// Legacy interface for compatibility
export interface Drug {
  id: string
  name: string
  genericName?: string
  manufacturer: string
  description: string
  slug: string
  indications: string[]
  contraindications: string[]
  warnings: Warning[]
  dosage: DosageInfo[]
  adverseReactions: AdverseReaction[]
  createdAt: string
  updatedAt: string
}

export interface Warning {
  title: string
  content: string
  severity: 'high' | 'medium' | 'low'
}

export interface DosageInfo {
  condition: string
  dosage: string
  frequency: string
  route: string
}

export interface AdverseReaction {
  name: string
  frequency: string
  severity: 'mild' | 'moderate' | 'severe'
}

export interface DrugQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  manufacturer?: string
}

export interface DrugListResponse {
  success: boolean
  data: DrugLabel[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export class DrugsApi {
  static async getDrugs(query: DrugQuery = {}): Promise<ApiResponse<DrugListResponse>> {
    const params = new URLSearchParams()
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, String(value))
      }
    })
    
    const endpoint = `/api/drugs${params.toString() ? `?${params.toString()}` : ''}`
    return apiClient.get<DrugListResponse>(endpoint)
  }

  static async getDrugBySlug(slug: string): Promise<ApiResponse<DrugLabel>> {
    return apiClient.get<DrugLabel>(`/api/drugs/${slug}`)
  }

  static async getDrugById(id: string): Promise<ApiResponse<Drug>> {
    return apiClient.get<Drug>(`/drugs/${id}`)
  }

  static async getRelatedDrugs(drugId: string): Promise<ApiResponse<Drug[]>> {
    return apiClient.get<Drug[]>(`/drugs/${drugId}/related`)
  }

  static async searchDrugs(query: string): Promise<ApiResponse<Drug[]>> {
    return apiClient.get<Drug[]>(`/drugs/search?q=${encodeURIComponent(query)}`)
  }
}

export const drugsApi = DrugsApi
