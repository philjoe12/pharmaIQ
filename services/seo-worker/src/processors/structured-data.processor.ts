import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { ProcessedDrugData, FDALabel } from '@pharmaiq/types';

export interface StructuredDataJob {
  drugData: ProcessedDrugData;
  baseUrl?: string;
}

export interface DrugStructuredData {
  '@context': string;
  '@type': 'Drug';
  name: string;
  alternateName?: string;
  activeIngredient?: string;
  manufacturer: {
    '@type': 'Organization';
    name: string;
  };
  description: string;
  indication?: Array<{
    '@type': 'MedicalIndication';
    name: string;
  }>;
  warning?: Array<{
    '@type': 'MedicalWarning';
    name: string;
  }>;
  dosageForm?: string;
  strength?: string;
  url: string;
  medicalCode?: Array<{
    '@type': 'MedicalCode';
    code: string;
    codingSystem: string;
  }>;
}

@Processor('seo-optimization')
@Injectable()
export class StructuredDataProcessor {
  private readonly logger = new Logger(StructuredDataProcessor.name);

  @Process('generate-structured-data')
  async generateStructuredData(job: Job<StructuredDataJob>): Promise<DrugStructuredData> {
    const { drugData, baseUrl = 'https://pharmaiq.com' } = job.data;
    
    this.logger.log(`Generating structured data for: ${drugData.drugInfo.brandName}`);

    try {
      const structuredData = this.createDrugStructuredData(drugData, baseUrl);
      
      this.logger.log(`Successfully generated structured data for: ${drugData.drugInfo.brandName}`);
      return structuredData;
    } catch (error) {
      this.logger.error(`Failed to generate structured data: ${error.message}`, error.stack);
      throw error;
    }
  }

  private createDrugStructuredData(drugData: ProcessedDrugData, baseUrl: string): DrugStructuredData {
    const { drugInfo, indications, warnings, manufacturerInfo } = drugData;
    
    const structuredData: DrugStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Drug',
      name: drugInfo.brandName,
      alternateName: drugInfo.genericName,
      activeIngredient: drugInfo.activeIngredient,
      manufacturer: {
        '@type': 'Organization',
        name: manufacturerInfo.manufacturerName || manufacturerInfo.labelerName,
      },
      description: this.generateDescription(drugData),
      url: `${baseUrl}/drugs/${drugData.slug}`,
    };

    // Add dosage form and strength if available
    if (drugInfo.dosageForm) {
      structuredData.dosageForm = drugInfo.dosageForm;
    }
    
    if (drugInfo.strength) {
      structuredData.strength = drugInfo.strength;
    }

    // Add indications
    if (indications.length > 0) {
      structuredData.indication = indications.slice(0, 5).map(indication => ({
        '@type': 'MedicalIndication',
        name: this.cleanText(indication),
      }));
    }

    // Add warnings
    if (warnings.length > 0) {
      structuredData.warning = warnings.slice(0, 3).map(warning => ({
        '@type': 'MedicalWarning',
        name: this.cleanText(warning),
      }));
    }

    return structuredData;
  }

  private generateDescription(drugData: ProcessedDrugData): string {
    const { drugInfo, indications } = drugData;
    let description = `${drugInfo.brandName}`;
    
    if (drugInfo.genericName && drugInfo.genericName !== drugInfo.brandName) {
      description += ` (${drugInfo.genericName})`;
    }
    
    description += ' is a prescription medication';
    
    if (indications.length > 0) {
      const primaryIndication = this.cleanText(indications[0]);
      description += ` used for ${primaryIndication.toLowerCase()}`;
    }
    
    description += '. Find comprehensive drug information including dosage, side effects, and warnings.';
    
    return description;
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 100); // Limit length
  }

  /**
   * Generate organization structured data
   */
  generateOrganizationStructuredData(baseUrl: string = 'https://pharmaiq.com') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'PharmaIQ',
      description: 'AI-powered drug information platform providing comprehensive pharmaceutical data for healthcare professionals',
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      sameAs: [
        'https://twitter.com/pharmaiq',
        'https://linkedin.com/company/pharmaiq',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        email: 'support@pharmaiq.com',
      },
    };
  }

  /**
   * Generate breadcrumb structured data
   */
  generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  /**
   * Generate search action structured data
   */
  generateSearchActionStructuredData(baseUrl: string = 'https://pharmaiq.com') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'PharmaIQ',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }
}