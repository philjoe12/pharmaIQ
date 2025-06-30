export const CACHE_TAGS = {
  DRUGS: 'drugs',
  DRUG_DETAIL: 'drug-detail',
  SEARCH: 'search',
  CATEGORIES: 'categories',
  MANUFACTURERS: 'manufacturers',
  SITEMAP: 'sitemap',
  SEO: 'seo'
} as const

export const generateDrugCacheTag = (slug: string): string => `${CACHE_TAGS.DRUG_DETAIL}:${slug}`

export const generateSearchCacheTag = (query: string): string => `${CACHE_TAGS.SEARCH}:${encodeURIComponent(query)}`

export const generateCategoryCacheTag = (category: string): string => `${CACHE_TAGS.CATEGORIES}:${category}`

export const generateManufacturerCacheTag = (manufacturer: string): string => `${CACHE_TAGS.MANUFACTURERS}:${manufacturer}`

export const getAllCacheTags = (): string[] => Object.values(CACHE_TAGS)

export const invalidateDrugCache = (slug?: string): string[] => {
  const tags: string[] = [CACHE_TAGS.DRUGS, CACHE_TAGS.SEARCH, CACHE_TAGS.SITEMAP]
  if (slug) {
    tags.push(generateDrugCacheTag(slug))
  }
  return tags
}