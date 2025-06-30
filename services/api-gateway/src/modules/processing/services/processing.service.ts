import { Injectable, Logger } from '@nestjs/common';
import { DrugLabel } from '@pharmaiq/types';

export interface ProcessingResult {
  drugName: string;
  manufacturer: string;
  indications: string[];
  contraindications: string[];
  dosage: any;
  warnings: string[];
  processed: boolean;
  timestamp: string;
}

@Injectable()
export class ProcessingService {
  private readonly logger = new Logger(ProcessingService.name);

  /**
   * Process FDA label JSON data and extract structured information
   */
  async processFDALabel(labelData: any): Promise<ProcessingResult> {
    this.logger.log(`Processing FDA label for drug: ${labelData.drug_name || 'Unknown'}`);
    
    try {
      // Extract basic information from FDA label JSON
      const processed: ProcessingResult = {
        drugName: this.extractDrugName(labelData),
        manufacturer: this.extractManufacturer(labelData),
        indications: this.extractIndications(labelData),
        contraindications: this.extractContraindications(labelData),
        dosage: this.extractDosage(labelData),
        warnings: this.extractWarnings(labelData),
        processed: true,
        timestamp: new Date().toISOString()
      };

      this.logger.log(`Successfully processed FDA label for: ${processed.drugName}`);
      return processed;
    } catch (error) {
      this.logger.error(`Failed to process FDA label:`, error);
      throw new Error(`FDA label processing failed: ${error.message}`);
    }
  }

  /**
   * Process multiple FDA labels in batch
   */
  async processBatch(labelDataArray: any[]): Promise<ProcessingResult[]> {
    this.logger.log(`Processing batch of ${labelDataArray.length} FDA labels`);
    
    const results = await Promise.allSettled(
      labelDataArray.map(labelData => this.processFDALabel(labelData))
    );

    const processed = results
      .filter((result): result is PromiseFulfilledResult<ProcessingResult> => 
        result.status === 'fulfilled'
      )
      .map(result => result.value);

    const failed = results.filter(result => result.status === 'rejected').length;
    
    this.logger.log(`Batch processing complete: ${processed.length} successful, ${failed} failed`);
    return processed;
  }

  private extractDrugName(labelData: any): string {
    return labelData.drug_name || 
           labelData.openfda?.brand_name?.[0] || 
           labelData.openfda?.generic_name?.[0] || 
           'Unknown Drug';
  }

  private extractManufacturer(labelData: any): string {
    return labelData.manufacturer || 
           labelData.openfda?.manufacturer_name?.[0] || 
           'Unknown Manufacturer';
  }

  private extractIndications(labelData: any): string[] {
    const indications = [];
    
    // Try various fields that might contain indications
    if (labelData.indications_and_usage) {
      indications.push(...this.parseTextToArray(labelData.indications_and_usage));
    }
    
    if (labelData.indications) {
      if (Array.isArray(labelData.indications)) {
        indications.push(...labelData.indications);
      } else {
        indications.push(...this.parseTextToArray(labelData.indications));
      }
    }

    return this.cleanAndDedupeArray(indications);
  }

  private extractContraindications(labelData: any): string[] {
    const contraindications = [];
    
    if (labelData.contraindications) {
      if (Array.isArray(labelData.contraindications)) {
        contraindications.push(...labelData.contraindications);
      } else {
        contraindications.push(...this.parseTextToArray(labelData.contraindications));
      }
    }

    return this.cleanAndDedupeArray(contraindications);
  }

  private extractDosage(labelData: any): any {
    const dosage: any = {};
    
    if (labelData.dosage_and_administration) {
      dosage.administration = labelData.dosage_and_administration;
    }
    
    if (labelData.dosage) {
      dosage.dosage = labelData.dosage;
    }

    // Try to extract structured dosage information
    if (labelData.dosage_forms_and_strengths) {
      dosage.formsAndStrengths = labelData.dosage_forms_and_strengths;
    }

    return dosage;
  }

  private extractWarnings(labelData: any): string[] {
    const warnings = [];
    
    // Extract from various warning fields
    const warningFields = [
      'warnings',
      'warnings_and_precautions',
      'boxed_warning',
      'contraindications'
    ];

    for (const field of warningFields) {
      if (labelData[field]) {
        if (Array.isArray(labelData[field])) {
          warnings.push(...labelData[field]);
        } else {
          warnings.push(...this.parseTextToArray(labelData[field]));
        }
      }
    }

    return this.cleanAndDedupeArray(warnings);
  }

  private parseTextToArray(text: string): string[] {
    if (!text) return [];
    
    // Split by common delimiters and clean up
    return text
      .split(/[•\n\r]/)
      .map(item => item.trim())
      .filter(item => item.length > 10) // Filter out very short entries
      .slice(0, 10); // Limit to prevent too many entries
  }

  private cleanAndDedupeArray(items: string[]): string[] {
    return [...new Set(
      items
        .map(item => item.trim())
        .filter(item => item.length > 5)
    )].slice(0, 20); // Limit to 20 items max
  }

  /**
   * Convert processed data to DrugLabel format for AI enhancement
   */
  convertTodrugLabel(processed: ProcessingResult): Partial<DrugLabel> {
    return {
      drugName: processed.drugName,
      setId: `processed-${Date.now()}`,
      slug: processed.drugName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      labeler: processed.manufacturer,
      label: {
        genericName: processed.drugName, // Will be enhanced by AI
        labelerName: processed.manufacturer,
        title: processed.drugName,
        indicationsAndUsage: processed.indications.join(' '),
        contraindications: processed.contraindications.join(' '),
        warningsAndPrecautions: processed.warnings.join(' '),
        dosageAndAdministration: processed.dosage?.administration || ''
      }
    };
  }
}