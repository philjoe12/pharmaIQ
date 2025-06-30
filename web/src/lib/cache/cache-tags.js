export const CACHE_TAGS = {
    DRUGS: 'drugs',
    DRUG_DETAIL: 'drug-detail',
    SEARCH: 'search',
    CATEGORIES: 'categories',
    MANUFACTURERS: 'manufacturers',
    SITEMAP: 'sitemap',
    SEO: 'seo'
};
export const generateDrugCacheTag = (slug) => `${CACHE_TAGS.DRUG_DETAIL}:${slug}`;
export const generateSearchCacheTag = (query) => `${CACHE_TAGS.SEARCH}:${encodeURIComponent(query)}`;
export const generateCategoryCacheTag = (category) => `${CACHE_TAGS.CATEGORIES}:${category}`;
export const generateManufacturerCacheTag = (manufacturer) => `${CACHE_TAGS.MANUFACTURERS}:${manufacturer}`;
export const getAllCacheTags = () => Object.values(CACHE_TAGS);
export const invalidateDrugCache = (slug) => {
    const tags = [CACHE_TAGS.DRUGS, CACHE_TAGS.SEARCH, CACHE_TAGS.SITEMAP];
    if (slug) {
        tags.push(generateDrugCacheTag(slug));
    }
    return tags;
};
