// Queue contracts for SEO processing

export interface SeoProcessingJob {
  id: string;
  type: 'generate-metadata' | 'update-sitemap' | 'generate-structured-data';
  data: {
    drugId?: string;
    drugSlug?: string;
    drugData?: {
      brandName: string;
      genericName: string;
      manufacturer: string;
      indications: string;
      dosage: string;
    };
    batchUpdate?: boolean;
  };
  options?: {
    priority?: number;
    delay?: number;
    attempts?: number;
  };
}

export interface SeoProcessingResult {
  success: boolean;
  type: string;
  drugId?: string;
  results: {
    metadata?: {
      pageTitle: string;
      metaDescription: string;
      canonicalUrl: string;
      ogTags: Record<string, string>;
      twitterCard: Record<string, string>;
    };
    structuredData?: any;
    sitemapEntry?: {
      url: string;
      lastmod: string;
      changefreq: 'daily' | 'weekly' | 'monthly';
      priority: number;
    };
  };
  processingTime: number;
  error?: string;
}