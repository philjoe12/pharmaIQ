export declare enum DrugStatus {
    PENDING = "pending",
    PROCESSING = "processing",
    PROCESSED = "processed",
    PUBLISHED = "published",
    ARCHIVED = "archived",
    FAILED = "failed"
}
export interface FDALabel {
    drugName: string;
    setId: string;
    slug: string;
    labeler: string;
    label: LabelContent;
}
export interface LabelContent {
    genericName?: string;
    labelerName?: string;
    productType?: string;
    effectiveTime?: string;
    title?: string;
    indicationsAndUsage?: string;
    dosageAndAdministration?: string;
    dosageFormsAndStrengths?: string;
    warningsAndPrecautions?: string;
    adverseReactions?: string;
    clinicalPharmacology?: string;
    clinicalStudies?: string;
    howSupplied?: string;
    useInSpecificPopulations?: string;
    description?: string;
    nonclinicalToxicology?: string;
    instructionsForUse?: string;
    mechanismOfAction?: string;
    contraindications?: string;
    boxedWarning?: string;
    drugInteractions?: string;
    highlights?: {
        dosageAndAdministration?: string;
    };
}
export interface ProcessedDrugData {
    drugInfo: DrugInfo;
    indications: string[];
    contraindications: string[];
    dosageAndAdministration: string[];
    warnings: string[];
    adverseReactions: string[];
    manufacturerInfo: ManufacturerInfo;
    slug?: string;
    completenessScore?: number;
    validationWarnings?: string[];
    metadata?: ProcessingMetadata;
    processedAt: Date;
    rawData?: FDALabel;
}
export interface DrugInfo {
    brandName: string;
    genericName: string;
    activeIngredient: string;
    strength: string;
    dosageForm: string;
    routeOfAdministration: string;
}
export interface ManufacturerInfo {
    manufacturerName: string;
    labelerName: string;
}
export interface ProcessingMetadata {
    source: string;
    importId: string;
    processedAt: Date;
    processingVersion: string;
    dataQuality: string;
}
export interface DrugEntity {
    id: string;
    drugName: string;
    setId: string;
    slug: string;
    labeler: string;
    genericName?: string;
    activeIngredient?: string;
    strength?: string;
    dosageForm?: string;
    routeOfAdministration?: string;
    indications: string[];
    contraindications: string[];
    dosageAndAdministration: string[];
    warnings: string[];
    adverseReactions: string[];
    status: DrugStatus;
    processedAt: Date;
    createdAt: Date;
    lastUpdated: Date;
    dataQuality: string;
    completenessScore: number;
    validationWarnings?: string[];
    rawLabelData: FDALabel;
    isPublished: boolean;
    publishedAt?: Date;
}
export interface AiEnhancedContentEntity {
    id: string;
    drugId: string;
    enhancedTitle?: string;
    metaDescription?: string;
    simplifiedDescription?: string;
    patientFriendlyExplanation?: string;
    faqs: FaqItem[];
    relatedDrugs: string[];
    relatedConditions: string[];
    aiProvider: string;
    promptVersion: string;
    generatedAt: Date;
    validationScore: number;
}
export interface FaqItem {
    question: string;
    answer: string;
    category: string;
}
export interface SeoMetadataEntity {
    id: string;
    drugId: string;
    title: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl: string;
    structuredData: any;
    internalLinks: InternalLink[];
    seoScore: number;
    lastOptimized: Date;
}
export interface InternalLink {
    url: string;
    anchorText: string;
    relevanceScore: number;
}
export interface ProcessingLogEntity {
    id: string;
    drugId: string;
    stage: string;
    status: string;
    startedAt: Date;
    completedAt?: Date;
    errorMessage?: string;
    processingDetails: any;
}
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    score: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: string[];
}
export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface SearchFilters {
    name?: string;
    manufacturer?: string;
    status?: DrugStatus;
    page?: number;
    limit?: number;
}
export type Drug = DrugEntity;
