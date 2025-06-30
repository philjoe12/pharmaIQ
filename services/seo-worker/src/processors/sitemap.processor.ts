import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ProcessedDrugData } from '@pharmaiq/types';

export interface SitemapJob {
  drugsData: ProcessedDrugData[];
  baseUrl?: string;
  maxUrls?: number;
}

export interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface SitemapIndex {
  sitemaps: Array<{
    loc: string;
    lastmod: string;
  }>;
}

@Processor('seo-optimization')
@Injectable()
export class SitemapProcessor {
  private readonly logger = new Logger(SitemapProcessor.name);
  private readonly MAX_URLS_PER_SITEMAP = 50000;

  @Process('generate-sitemap')
  async generateSitemap(job: Job<SitemapJob>): Promise<{ xml: string; urls: number }> {
    const { drugsData, baseUrl = 'https://pharmaiq.com', maxUrls = this.MAX_URLS_PER_SITEMAP } = job.data;
    
    this.logger.log(`Generating sitemap for ${drugsData.length} drugs`);

    try {
      const urls = this.generateSitemapUrls(drugsData, baseUrl);
      const limitedUrls = urls.slice(0, maxUrls);
      const xml = this.generateSitemapXml(limitedUrls);
      
      this.logger.log(`Successfully generated sitemap with ${limitedUrls.length} URLs`);
      return { xml, urls: limitedUrls.length };
    } catch (error) {
      this.logger.error(`Failed to generate sitemap: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Process('generate-sitemap-index')
  async generateSitemapIndex(job: Job<{ sitemaps: string[]; baseUrl?: string }>): Promise<string> {
    const { sitemaps, baseUrl = 'https://pharmaiq.com' } = job.data;
    
    this.logger.log(`Generating sitemap index for ${sitemaps.length} sitemaps`);

    try {
      const sitemapIndex = this.generateSitemapIndexXml(sitemaps, baseUrl);
      this.logger.log(`Successfully generated sitemap index`);
      return sitemapIndex;
    } catch (error) {
      this.logger.error(`Failed to generate sitemap index: ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateSitemapUrls(drugsData: ProcessedDrugData[], baseUrl: string): SitemapUrl[] {
    const urls: SitemapUrl[] = [];

    // Add static pages
    urls.push(
      {
        loc: baseUrl,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: 1.0,
      },
      {
        loc: `${baseUrl}/drugs`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: 0.9,
      },
      {
        loc: `${baseUrl}/search`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8,
      },
      {
        loc: `${baseUrl}/drugs/compare`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.7,
      }
    );

    // Add drug pages
    drugsData.forEach(drug => {
      if (drug.slug) {
        urls.push({
          loc: `${baseUrl}/drugs/${drug.slug}`,
          lastmod: drug.processedAt.toISOString().split('T')[0],
          changefreq: this.determineChangeFrequency(drug),
          priority: this.calculatePriority(drug),
        });
      }
    });

    // Sort by priority (highest first)
    return urls.sort((a, b) => b.priority - a.priority);
  }

  private determineChangeFrequency(drug: ProcessedDrugData): SitemapUrl['changefreq'] {
    const daysSinceProcessed = Math.floor(
      (Date.now() - drug.processedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Newer content changes more frequently
    if (daysSinceProcessed < 7) return 'weekly';
    if (daysSinceProcessed < 30) return 'monthly';
    return 'yearly';
  }

  private calculatePriority(drug: ProcessedDrugData): number {
    let priority = 0.5; // Base priority

    // Higher priority for higher quality drugs
    if (drug.completenessScore) {
      priority += (drug.completenessScore / 100) * 0.3;
    }

    // Higher priority for drugs with more content
    const contentScore = this.calculateContentScore(drug);
    priority += contentScore * 0.2;

    // Ensure priority is between 0.1 and 1.0
    return Math.max(0.1, Math.min(1.0, Math.round(priority * 10) / 10));
  }

  private calculateContentScore(drug: ProcessedDrugData): number {
    let score = 0;
    const maxScore = 5;

    if (drug.indications.length > 0) score++;
    if (drug.dosageAndAdministration.length > 0) score++;
    if (drug.warnings.length > 0) score++;
    if (drug.adverseReactions.length > 0) score++;
    if (drug.contraindications.length > 0) score++;

    return score / maxScore;
  }

  private generateSitemapXml(urls: SitemapUrl[]): string {
    const urlEntries = urls.map(url => `
  <url>
    <loc>${this.escapeXml(url.loc)}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }

  private generateSitemapIndexXml(sitemaps: string[], baseUrl: string): string {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const sitemapEntries = sitemaps.map(sitemap => `
  <sitemap>
    <loc>${this.escapeXml(`${baseUrl}/${sitemap}`)}</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(baseUrl: string = 'https://pharmaiq.com'): string {
    return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /
Crawl-delay: 1

User-agent: Bingbot
Allow: /
Crawl-delay: 1

User-agent: Slurp
Allow: /
Crawl-delay: 2

# Disallow admin and internal paths
Disallow: /admin/
Disallow: /api/internal/
Disallow: /_next/
Disallow: /static/

# Sitemaps
Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/sitemap-index.xml

# Crawl delay for other bots
Crawl-delay: 5`;
  }

  /**
   * Split large datasets into multiple sitemaps
   */
  splitIntoMultipleSitemaps(drugsData: ProcessedDrugData[], baseUrl: string): Array<{ xml: string; filename: string }> {
    const sitemaps: Array<{ xml: string; filename: string }> = [];
    const chunks = this.chunkArray(drugsData, this.MAX_URLS_PER_SITEMAP);

    chunks.forEach((chunk, index) => {
      const urls = this.generateSitemapUrls(chunk, baseUrl);
      const xml = this.generateSitemapXml(urls);
      const filename = index === 0 ? 'sitemap.xml' : `sitemap-${index + 1}.xml`;
      
      sitemaps.push({ xml, filename });
    });

    return sitemaps;
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}