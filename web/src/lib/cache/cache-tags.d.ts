export declare const CACHE_TAGS: {
    readonly DRUGS: "drugs";
    readonly DRUG_DETAIL: "drug-detail";
    readonly SEARCH: "search";
    readonly CATEGORIES: "categories";
    readonly MANUFACTURERS: "manufacturers";
    readonly SITEMAP: "sitemap";
    readonly SEO: "seo";
};
export declare const generateDrugCacheTag: (slug: string) => string;
export declare const generateSearchCacheTag: (query: string) => string;
export declare const generateCategoryCacheTag: (category: string) => string;
export declare const generateManufacturerCacheTag: (manufacturer: string) => string;
export declare const getAllCacheTags: () => string[];
export declare const invalidateDrugCache: (slug?: string) => string[];
