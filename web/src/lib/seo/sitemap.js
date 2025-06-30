export class SitemapGenerator {
    baseUrl;
    maxUrlsPerSitemap;
    includeImages;
    constructor(options) {
        this.baseUrl = options.baseUrl;
        this.maxUrlsPerSitemap = options.maxUrlsPerSitemap || 50000;
        this.includeImages = options.includeImages || false;
    }
    generateSitemapXml(urls) {
        const urlEntries = urls.map(url => this.generateUrlEntry(url)).join('\n');
        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
    }
    generateUrlEntry(url) {
        let entry = `  <url>
    <loc>${this.escapeXml(url.url)}</loc>`;
        if (url.lastModified) {
            entry += `\n    <lastmod>${url.lastModified.toISOString()}</lastmod>`;
        }
        if (url.changeFrequency) {
            entry += `\n    <changefreq>${url.changeFrequency}</changefreq>`;
        }
        if (url.priority !== undefined) {
            entry += `\n    <priority>${url.priority}</priority>`;
        }
        entry += '\n  </url>';
        return entry;
    }
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    generateStaticUrls() {
        return [
            {
                url: this.baseUrl,
                changeFrequency: 'daily',
                priority: 1.0,
                lastModified: new Date()
            },
            {
                url: `${this.baseUrl}/search`,
                changeFrequency: 'weekly',
                priority: 0.8
            },
            {
                url: `${this.baseUrl}/drugs`,
                changeFrequency: 'daily',
                priority: 0.9
            }
        ];
    }
}
export const sitemapGenerator = new SitemapGenerator({
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://pharmaiq.com'
});
