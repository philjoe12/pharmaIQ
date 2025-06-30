import { Injectable, Logger } from '@nestjs/common';
import { ProcessedDrugData, AiEnhancedContentEntity } from '@pharmaiq/types';

export interface MetaTagsConfig {
  baseUrl?: string;
  siteName?: string;
  twitterHandle?: string;
  enableOpenGraph?: boolean;
  enableTwitterCards?: boolean;
  enableJsonLd?: boolean;
}

export interface GeneratedMetaTags {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  openGraph: {
    title: string;
    description: string;
    type: string;
    url: string;
    image?: string;
    siteName: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    site?: string;
    image?: string;
  };
  structuredData: any;
  htmlTags: string;
}

@Injectable()
export class MetaTagsGenerator {
  private readonly logger = new Logger(MetaTagsGenerator.name);

  private readonly defaultConfig: MetaTagsConfig = {
    baseUrl: 'https://pharmaiq.com',
    siteName: 'PharmaIQ',
    twitterHandle: '@pharmaiq',
    enableOpenGraph: true,
    enableTwitterCards: true,
    enableJsonLd: true,
  };

  /**
   * Generate comprehensive meta tags for a drug page
   */
  async generateDrugMetaTags(
    drugData: ProcessedDrugData,
    aiContent?: AiEnhancedContentEntity,
    config: Partial<MetaTagsConfig> = {}
  ): Promise<GeneratedMetaTags> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    this.logger.log(`Generating meta tags for: ${drugData.drugInfo.brandName}`);

    try {
      const title = this.generateTitle(drugData, aiContent);
      const description = this.generateDescription(drugData, aiContent);
      const keywords = this.generateKeywords(drugData);
      const canonical = `${finalConfig.baseUrl}/drugs/${drugData.slug}`;
      
      const metaTags: GeneratedMetaTags = {
        title,
        description,
        keywords,
        canonical,
        openGraph: this.generateOpenGraphTags(title, description, canonical, finalConfig),
        twitter: this.generateTwitterTags(title, description, finalConfig),
        structuredData: this.generateStructuredData(drugData, finalConfig.baseUrl!),
        htmlTags: '',
      };

      // Generate HTML tags string
      metaTags.htmlTags = this.generateHtmlTags(metaTags, finalConfig);

      this.logger.log(`Successfully generated meta tags for: ${drugData.drugInfo.brandName}`);
      return metaTags;
    } catch (error) {
      this.logger.error(`Failed to generate meta tags: ${error.message}`, error.stack);
      throw error;
    }
  }

  private generateTitle(drugData: ProcessedDrugData, aiContent?: AiEnhancedContentEntity): string {
    // Use AI-generated title if available
    if (aiContent?.enhancedTitle) {
      return aiContent.enhancedTitle;
    }

    const { brandName, genericName } = drugData.drugInfo;
    let title = brandName;

    if (genericName && genericName.toLowerCase() !== brandName.toLowerCase()) {
      title += ` (${genericName})`;
    }

    // Add primary indication if available
    if (drugData.indications.length > 0) {
      const primaryIndication = this.extractKeyPhrase(drugData.indications[0]);
      if (primaryIndication) {
        title += ` - ${primaryIndication}`;
      }
    }

    title += ' | Drug Information & Uses | PharmaIQ';

    // Ensure title is under 60 characters for SEO
    return title.length > 60 ? `${brandName} - Drug Information | PharmaIQ` : title;
  }

  private generateDescription(drugData: ProcessedDrugData, aiContent?: AiEnhancedContentEntity): string {
    // Use AI-generated description if available
    if (aiContent?.metaDescription) {
      return aiContent.metaDescription;
    }

    const { brandName, genericName } = drugData.drugInfo;
    const manufacturer = drugData.manufacturerInfo.manufacturerName;

    let description = `Learn about ${brandName}`;
    
    if (genericName && genericName.toLowerCase() !== brandName.toLowerCase()) {
      description += ` (${genericName})`;
    }

    // Add primary indication
    if (drugData.indications.length > 0) {
      const indication = this.extractKeyPhrase(drugData.indications[0]);
      if (indication) {
        description += ` for ${indication.toLowerCase()}`;
      }
    }

    description += '. Find comprehensive drug information, dosage guidelines, side effects';

    if (manufacturer) {
      description += ` from ${manufacturer}`;
    }

    description += ' for healthcare professionals.';

    // Ensure description is under 160 characters
    return description.length > 155 ? description.substring(0, 152) + '...' : description;
  }

  private generateKeywords(drugData: ProcessedDrugData): string[] {
    const keywords = new Set<string>();
    const { brandName, genericName, activeIngredient, dosageForm } = drugData.drugInfo;

    // Add drug names
    if (brandName) keywords.add(brandName.toLowerCase());
    if (genericName) keywords.add(genericName.toLowerCase());
    if (activeIngredient) keywords.add(activeIngredient.toLowerCase());

    // Add dosage form
    if (dosageForm) keywords.add(dosageForm.toLowerCase());

    // Add manufacturer
    if (drugData.manufacturerInfo.manufacturerName) {
      keywords.add(drugData.manufacturerInfo.manufacturerName.toLowerCase());
    }

    // Extract keywords from indications
    drugData.indications.slice(0, 3).forEach(indication => {
      const phrases = this.extractKeywords(indication);
      phrases.forEach(phrase => keywords.add(phrase));
    });

    // Add common pharmaceutical terms
    keywords.add('drug information');
    keywords.add('medication');
    keywords.add('prescription');
    keywords.add('healthcare');
    keywords.add('pharmaceutical');
    keywords.add('dosage');
    keywords.add('side effects');

    return Array.from(keywords).slice(0, 20); // Limit to 20 keywords
  }

  private generateOpenGraphTags(title: string, description: string, url: string, config: MetaTagsConfig) {
    return {
      title,
      description,
      type: 'website',
      url,
      siteName: config.siteName!,
      image: `${config.baseUrl}/images/og-drug-default.jpg`,
    };
  }

  private generateTwitterTags(title: string, description: string, config: MetaTagsConfig) {
    return {
      card: 'summary',
      title,
      description,
      site: config.twitterHandle,
      image: `${config.baseUrl}/images/twitter-drug-default.jpg`,
    };
  }

  private generateStructuredData(drugData: ProcessedDrugData, baseUrl: string) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Drug',
      name: drugData.drugInfo.brandName,
      alternateName: drugData.drugInfo.genericName,
      activeIngredient: drugData.drugInfo.activeIngredient,
      manufacturer: {
        '@type': 'Organization',
        name: drugData.manufacturerInfo.manufacturerName || drugData.manufacturerInfo.labelerName,
      },
      description: this.generateDescription(drugData),
      url: `${baseUrl}/drugs/${drugData.slug}`,
    };
  }

  private generateHtmlTags(metaTags: GeneratedMetaTags, config: MetaTagsConfig): string {
    const tags: string[] = [];

    // Basic meta tags
    tags.push(`<title>${this.escapeHtml(metaTags.title)}</title>`);
    tags.push(`<meta name="description" content="${this.escapeHtml(metaTags.description)}">`);
    tags.push(`<meta name="keywords" content="${metaTags.keywords.join(', ')}">`);
    tags.push(`<link rel="canonical" href="${metaTags.canonical}">`);
    tags.push(`<meta name="robots" content="index, follow">`);

    // Open Graph tags
    if (config.enableOpenGraph) {
      tags.push(`<meta property="og:title" content="${this.escapeHtml(metaTags.openGraph.title)}">`);
      tags.push(`<meta property="og:description" content="${this.escapeHtml(metaTags.openGraph.description)}">`);
      tags.push(`<meta property="og:type" content="${metaTags.openGraph.type}">`);
      tags.push(`<meta property="og:url" content="${metaTags.openGraph.url}">`);
      tags.push(`<meta property="og:site_name" content="${metaTags.openGraph.siteName}">`);
      if (metaTags.openGraph.image) {
        tags.push(`<meta property="og:image" content="${metaTags.openGraph.image}">`);
      }
    }

    // Twitter tags
    if (config.enableTwitterCards) {
      tags.push(`<meta name="twitter:card" content="${metaTags.twitter.card}">`);
      tags.push(`<meta name="twitter:title" content="${this.escapeHtml(metaTags.twitter.title)}">`);
      tags.push(`<meta name="twitter:description" content="${this.escapeHtml(metaTags.twitter.description)}">`);
      if (metaTags.twitter.site) {
        tags.push(`<meta name="twitter:site" content="${metaTags.twitter.site}">`);
      }
      if (metaTags.twitter.image) {
        tags.push(`<meta name="twitter:image" content="${metaTags.twitter.image}">`);
      }
    }

    // JSON-LD structured data
    if (config.enableJsonLd) {
      tags.push(`<script type="application/ld+json">
${JSON.stringify(metaTags.structuredData, null, 2)}
</script>`);
    }

    return tags.join('\n');
  }

  private extractKeyPhrase(text: string): string {
    // Remove HTML and extract first meaningful phrase
    const cleaned = text.replace(/<[^>]*>/g, '').trim();
    const sentences = cleaned.split(/[.!?]/);
    return sentences[0]?.substring(0, 50) || '';
  }

  private extractKeywords(text: string): string[] {
    const cleaned = text.replace(/<[^>]*>/g, '').toLowerCase();
    const words = cleaned.match(/\b\w{4,}\b/g) || [];
    return words.slice(0, 5); // Take first 5 meaningful words
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Generate meta tags for homepage
   */
  generateHomepageMetaTags(config: Partial<MetaTagsConfig> = {}): GeneratedMetaTags {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    return {
      title: 'PharmaIQ - AI-Powered Drug Information Platform',
      description: 'Comprehensive drug information powered by AI. Find detailed pharmaceutical data, dosage guidelines, side effects, and drug interactions for healthcare professionals.',
      keywords: ['drug information', 'pharmaceutical', 'medication', 'healthcare', 'AI', 'drug database'],
      canonical: finalConfig.baseUrl!,
      openGraph: {
        title: 'PharmaIQ - AI-Powered Drug Information Platform',
        description: 'Comprehensive drug information powered by AI for healthcare professionals.',
        type: 'website',
        url: finalConfig.baseUrl!,
        siteName: finalConfig.siteName!,
        image: `${finalConfig.baseUrl}/images/og-homepage.jpg`,
      },
      twitter: {
        card: 'summary_large_image',
        title: 'PharmaIQ - AI-Powered Drug Information',
        description: 'Comprehensive drug information powered by AI for healthcare professionals.',
        site: finalConfig.twitterHandle,
        image: `${finalConfig.baseUrl}/images/twitter-homepage.jpg`,
      },
      structuredData: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'PharmaIQ',
        url: finalConfig.baseUrl,
        description: 'AI-powered drug information platform for healthcare professionals',
      },
      htmlTags: '',
    };
  }
}