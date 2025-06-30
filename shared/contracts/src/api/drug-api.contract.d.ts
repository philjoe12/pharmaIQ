export interface DrugListRequest {
    page?: number;
    limit?: number;
    search?: string;
    drugClass?: string;
    manufacturer?: string;
    sortBy?: 'name' | 'dateAdded' | 'popularity';
    sortOrder?: 'asc' | 'desc';
}
export interface DrugListResponse {
    data: DrugSummary[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface DrugSummary {
    id: string;
    brandName: string;
    genericName: string;
    manufacturer: string;
    drugClass: string;
    slug: string;
    hasAiContent: boolean;
    lastUpdated: string;
}
export interface DrugDetailRequest {
    slug: string;
    includeAiContent?: boolean;
    includeSeoMetadata?: boolean;
    includeRelatedDrugs?: boolean;
}
export interface DrugDetailResponse {
    drug: {
        id: string;
        brandName: string;
        genericName: string;
        manufacturer: string;
        activeIngredient: string;
        drugClass: string;
        routeOfAdministration: string;
        strength: string;
        dosageForm: string;
        fdaApplicationNumber: string;
        slug: string;
        status: string;
    };
    content: {
        indications: ContentSection;
        dosageAndAdministration: ContentSection;
        warnings: ContentSection;
        adverseReactions: ContentSection;
        clinicalPharmacology?: ContentSection;
        clinicalStudies?: ContentSection;
    };
    aiContent?: {
        enhancedTitle: string;
        enhancedDescription: string;
        faqs: Array<{
            question: string;
            answer: string;
        }>;
        simplifiedExplanations: Record<string, string>;
    };
    seoMetadata?: {
        pageTitle: string;
        metaDescription: string;
        canonicalUrl: string;
        schemaMarkup: any;
    };
    relatedDrugs?: DrugSummary[];
}
export interface ContentSection {
    title: string;
    originalContent: string;
    simplifiedContent?: string;
    displayOrder: number;
}
