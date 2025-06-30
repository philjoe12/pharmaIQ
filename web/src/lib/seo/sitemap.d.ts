export interface SitemapUrl {
    url: string;
    lastModified?: Date;
    changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
}
export interface SitemapOptions {
    baseUrl: string;
    maxUrlsPerSitemap?: number;
    includeImages?: boolean;
}
export declare class SitemapGenerator {
    private baseUrl;
    private maxUrlsPerSitemap;
    private includeImages;
    constructor(options: SitemapOptions);
    generateSitemapXml(urls: SitemapUrl[]): string;
    private generateUrlEntry;
    private escapeXml;
    generateStaticUrls(): SitemapUrl[];
}
export declare const sitemapGenerator: SitemapGenerator;
