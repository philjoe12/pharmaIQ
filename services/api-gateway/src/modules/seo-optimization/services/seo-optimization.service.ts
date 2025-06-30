import { Injectable, Logger } from '@nestjs/common';

export interface DrugData {
  name: string;
  genericName?: string;
  manufacturer?: string;
  indications?: string[];
  category?: string;
}

export interface SeoContent {
  title: string;
  metaDescription: string;
  keywords: string[];
  structuredData: any;
  slug: string;
  optimized: boolean;
  timestamp: string;
}

export interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: number;
}

@Injectable()
export class SeoOptimizationService {
  private readonly logger = new Logger(SeoOptimizationService.name);

  /**
   * Generate SEO-optimized content for a drug
   */
  async generateSeoContent(drugData: DrugData): Promise<SeoContent> {
    this.logger.log(`Generating SEO content for drug: ${drugData.name}`);
    
    try {
      const seoContent: SeoContent = {
        title: this.generateTitle(drugData),
        metaDescription: this.generateMetaDescription(drugData),
        keywords: this.generateKeywords(drugData),
        structuredData: this.generateStructuredData(drugData),
        slug: this.generateSlug(drugData.name),
        optimized: true,
        timestamp: new Date().toISOString()
      };

      this.logger.log(`Successfully generated SEO content for: ${drugData.name}`);
      return seoContent;
    } catch (error) {
      this.logger.error(`Failed to generate SEO content for ${drugData.name}:`, error);
      throw new Error(`SEO content generation failed: ${error.message}`);
    }
  }

  /**
   * Generate SEO content for multiple drugs
   */
  async generateBatchSeoContent(drugsData: DrugData[]): Promise<SeoContent[]> {
    this.logger.log(`Generating SEO content for ${drugsData.length} drugs`);
    
    const results = await Promise.allSettled(
      drugsData.map(drugData => this.generateSeoContent(drugData))
    );

    const successful = results
      .filter((result): result is PromiseFulfilledResult<SeoContent> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failed = results.filter(result => result.status === 'rejected').length;
    
    this.logger.log(`Batch SEO generation complete: ${successful.length} successful, ${failed} failed`);
    return successful;
  }

  /**
   * Generate sitemap entries for drugs
   */
  generateSitemapEntries(seoContents: SeoContent[]): SitemapEntry[] {
    return seoContents.map(content => ({
      url: `/drugs/${content.slug}`,
      lastModified: content.timestamp,
      changeFrequency: 'monthly' as const,
      priority: 0.8
    }));
  }

  /**
   * Generate XML sitemap content
   */
  generateSitemapXml(entries: SitemapEntry[], baseUrl: string = 'https://example.com'): string {
    const urlset = entries.map(entry => `
  <url>
    <loc>${baseUrl}${entry.url}</loc>
    <lastmod>${entry.lastModified.split('T')[0]}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
  }

  private generateTitle(drugData: DrugData): string {
    const baseName = drugData.name;
    const generic = drugData.genericName;
    
    if (generic && generic.toLowerCase() !== baseName.toLowerCase()) {
      return `${baseName} (${generic}) - Drug Information & Uses | PharmaIQ`;
    }
    
    return `${baseName} - Drug Information & Uses | PharmaIQ`;
  }

  private generateMetaDescription(drugData: DrugData): string {
    const baseName = drugData.name;
    const generic = drugData.genericName;
    const manufacturer = drugData.manufacturer;
    
    let description = `Learn about ${baseName}`;
    
    if (generic && generic.toLowerCase() !== baseName.toLowerCase()) {
      description += ` (${generic})`;
    }
    
    description += '. Find drug information, uses, side effects, and dosage guidelines';
    
    if (manufacturer) {
      description += ` from ${manufacturer}`;
    }
    
    description += ' for healthcare professionals.';
    
    // Ensure it's under 160 characters
    return description.length > 155 ? description.substring(0, 152) + '...' : description;
  }

  private generateKeywords(drugData: DrugData): string[] {
    const keywords = new Set<string>();
    
    // Add drug names
    if (drugData.name) {
      keywords.add(drugData.name.toLowerCase());
    }
    
    if (drugData.genericName) {
      keywords.add(drugData.genericName.toLowerCase());
    }
    
    // Add category-based keywords
    if (drugData.category) {
      keywords.add(drugData.category.toLowerCase());
    }
    
    // Add common pharmaceutical keywords
    keywords.add('drug information');
    keywords.add('medication');
    keywords.add('prescription');
    keywords.add('healthcare');
    keywords.add('pharmaceutical');
    
    // Add indication-based keywords
    if (drugData.indications) {
      drugData.indications.forEach(indication => {
        // Extract key terms from indications
        const terms = indication
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter(term => term.length > 3);
        
        terms.forEach(term => keywords.add(term));
      });
    }
    
    return Array.from(keywords).slice(0, 15); // Limit to 15 keywords
  }

  private generateStructuredData(drugData: DrugData): any {
    const structuredData: any = {
      '@context': 'https://schema.org',
      '@type': 'Drug',
      name: drugData.name,
      alternateName: drugData.genericName,
      manufacturer: {
        '@type': 'Organization',
        name: drugData.manufacturer || 'Unknown Manufacturer'
      },
      description: `Prescription drug information for ${drugData.name}`,
      drugClass: drugData.category || 'Prescription Medication'
    };

    // Add indications if available
    if (drugData.indications && drugData.indications.length > 0) {
      structuredData.indication = drugData.indications.map(indication => ({
        '@type': 'MedicalIndication',
        name: indication
      }));
    }

    return structuredData;
  }

  private generateSlug(drugName: string): string {
    return drugName
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt(baseUrl: string = 'https://example.com'): string {
    return `User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for other bots
Crawl-delay: 1`;
  }

  /**
   * Generate meta tags for HTML head
   */
  generateMetaTags(seoContent: SeoContent): string {
    const keywords = seoContent.keywords.join(', ');
    
    return `<title>${seoContent.title}</title>
<meta name="description" content="${seoContent.metaDescription}">
<meta name="keywords" content="${keywords}">
<meta name="robots" content="index, follow">
<meta property="og:title" content="${seoContent.title}">
<meta property="og:description" content="${seoContent.metaDescription}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${seoContent.title}">
<meta name="twitter:description" content="${seoContent.metaDescription}">
<script type="application/ld+json">
${JSON.stringify(seoContent.structuredData, null, 2)}
</script>`;
  }
}