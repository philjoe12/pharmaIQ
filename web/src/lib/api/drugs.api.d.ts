import { ApiResponse } from './client';
export interface DrugLabel {
    setId: string;
    slug: string;
    drugName: string;
    labeler: string;
    label: {
        genericName?: string;
        title?: string;
        description?: string;
        indicationsAndUsage?: string;
        dosageAndAdministration?: string;
        warningsAndPrecautions?: string;
        adverseReactions?: string;
        contraindications?: string;
        clinicalPharmacology?: string;
        clinicalStudies?: string;
    };
}
export interface Drug {
    id: string;
    name: string;
    genericName?: string;
    manufacturer: string;
    description: string;
    slug: string;
    indications: string[];
    contraindications: string[];
    warnings: Warning[];
    dosage: DosageInfo[];
    adverseReactions: AdverseReaction[];
    createdAt: string;
    updatedAt: string;
}
export interface Warning {
    title: string;
    content: string;
    severity: 'high' | 'medium' | 'low';
}
export interface DosageInfo {
    condition: string;
    dosage: string;
    frequency: string;
    route: string;
}
export interface AdverseReaction {
    name: string;
    frequency: string;
    severity: 'mild' | 'moderate' | 'severe';
}
export interface DrugQuery {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    manufacturer?: string;
}
export interface DrugListResponse {
    success: boolean;
    data: DrugLabel[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export declare class DrugsApi {
    static getDrugs(query?: DrugQuery): Promise<ApiResponse<DrugListResponse>>;
    static getDrugBySlug(slug: string): Promise<ApiResponse<DrugLabel>>;
    static getDrugById(id: string): Promise<ApiResponse<Drug>>;
    static getRelatedDrugs(drugId: string): Promise<ApiResponse<Drug[]>>;
    static searchDrugs(query: string): Promise<ApiResponse<Drug[]>>;
}
export declare const drugsApi: typeof DrugsApi;
