import { BaseEvent } from '@pharmaiq/types';
export interface SeoGenerationRequestedEvent extends BaseEvent {
    type: 'seo.generation.requested';
    payload: {
        drugId: string;
        drugSlug: string;
        generateSitemap: boolean;
        generateStructuredData: boolean;
        priority: 'high' | 'normal' | 'low';
    };
}
export interface SeoGenerationCompletedEvent extends BaseEvent {
    type: 'seo.generation.completed';
    payload: {
        drugId: string;
        drugSlug: string;
        seoMetadata: {
            pageTitle: string;
            metaDescription: string;
            canonicalUrl: string;
            ogTags: Record<string, string>;
            structuredData?: any;
        };
        sitemapUpdated: boolean;
    };
}
export interface SitemapUpdatedEvent extends BaseEvent {
    type: 'seo.sitemap.updated';
    payload: {
        totalUrls: number;
        lastModified: Date;
        newUrls: string[];
    };
}
