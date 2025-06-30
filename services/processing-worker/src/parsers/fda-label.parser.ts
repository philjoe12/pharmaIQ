import { Injectable, Logger } from '@nestjs/common';
import { FDALabel, ProcessedDrugData, DrugInfo, ManufacturerInfo } from '@pharmaiq/types';

@Injectable()
export class FdaLabelParser {
  private readonly logger = new Logger(FdaLabelParser.name);

  /**
   * Parse FDA label JSON data and extract structured information
   */
  async parseLabelData(labelData: FDALabel): Promise<ProcessedDrugData> {
    try {
      this.logger.log(`Parsing FDA label for: ${labelData.drugName || 'Unknown'}`);

      const drugInfo = this.extractDrugInfo(labelData);
      const indications = this.extractIndications(labelData);
      const contraindications = this.extractContraindications(labelData);
      const dosageAndAdministration = this.extractDosage(labelData);
      const warnings = this.extractWarnings(labelData);
      const adverseReactions = this.extractAdverseReactions(labelData);
      const manufacturerInfo = this.extractManufacturerInfo(labelData);

      return {
        drugInfo,
        indications,
        contraindications,
        dosageAndAdministration,
        warnings,
        adverseReactions,
        manufacturerInfo,
        rawData: labelData,
        processedAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Error parsing FDA label: ${error.message}`, error.stack);
      throw new Error(`Failed to parse FDA label: ${error.message}`);
    }
  }

  private extractDrugInfo(labelData: FDALabel): DrugInfo {
    const label = labelData.label || {};
    
    return {
      brandName: labelData.drugName || '',
      genericName: label.genericName || '',
      activeIngredient: this.extractActiveIngredient(label),
      strength: this.extractStrength(label),
      dosageForm: this.extractDosageForm(label),
      routeOfAdministration: this.extractRoute(label),
    };
  }

  private extractActiveIngredient(label: any): string {
    // Try to extract from various sources
    if (label.description) {
      const match = label.description.match(/active ingredient[^:]*:([^.]+)/i);
      if (match) return match[1].trim();
    }
    return label.genericName || '';
  }

  private extractStrength(label: any): string {
    if (label.dosageFormsAndStrengths) {
      const strengthMatch = label.dosageFormsAndStrengths.match(/(\d+\s*mg\/mL|\d+\s*mg|\d+%)/i);
      if (strengthMatch) return strengthMatch[1];
    }
    return '';
  }

  private extractDosageForm(label: any): string {
    if (label.dosageFormsAndStrengths) {
      const formMatch = label.dosageFormsAndStrengths.match(/(injection|tablet|capsule|cream|ointment|solution)/i);
      if (formMatch) return formMatch[1];
    }
    return '';
  }

  private extractRoute(label: any): string {
    if (label.dosageAndAdministration) {
      const routeMatch = label.dosageAndAdministration.match(/(subcutaneous|oral|topical|intravenous|intramuscular)/i);
      if (routeMatch) return routeMatch[1];
    }
    return '';
  }

  private extractIndications(labelData: FDALabel): string[] {
    const indicationsText = labelData.label?.indicationsAndUsage || '';
    
    if (!indicationsText) return [];

    // Parse HTML content and extract meaningful sections
    return this.parseHtmlContent(indicationsText)
      .filter((indication: string) => indication.length > 10)
      .slice(0, 10);
  }

  private extractContraindications(labelData: FDALabel): string[] {
    const contraindicationsText = labelData.label?.contraindications || '';
    
    if (!contraindicationsText) return [];

    return this.parseHtmlContent(contraindicationsText)
      .filter((contraindication: string) => contraindication.length > 10)
      .slice(0, 10);
  }

  private extractDosage(labelData: FDALabel): string[] {
    const dosageText = labelData.label?.dosageAndAdministration || '';
    
    if (!dosageText) return [];

    return this.parseHtmlContent(dosageText)
      .filter((dosage: string) => dosage.length > 10)
      .slice(0, 15);
  }

  private extractWarnings(labelData: FDALabel): string[] {
    const warningsText = labelData.label?.warningsAndPrecautions || 
                        labelData.label?.boxedWarning || '';
    
    if (!warningsText) return [];

    return this.parseHtmlContent(warningsText)
      .filter((warning: string) => warning.length > 10)
      .slice(0, 20);
  }

  private extractAdverseReactions(labelData: FDALabel): string[] {
    const adverseReactionsText = labelData.label?.adverseReactions || '';
    
    if (!adverseReactionsText) return [];

    return this.parseHtmlContent(adverseReactionsText)
      .filter((reaction: string) => reaction.length > 5)
      .slice(0, 25);
  }

  private extractManufacturerInfo(labelData: FDALabel): ManufacturerInfo {
    return {
      manufacturerName: labelData.labeler || '',
      labelerName: labelData.label?.labelerName || labelData.labeler || '',
    };
  }

  /**
   * Parse HTML content and extract text sections
   */
  private parseHtmlContent(htmlContent: string): string[] {
    if (!htmlContent) return [];

    // Remove HTML tags and extract text content
    const cleanText = htmlContent
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .trim();

    // Split by common patterns for list items and sections
    return cleanText
      .split(/(?:\d+\.\d+|\d+\)|•|■|▪)/) // Split by numbering or bullet points
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  /**
   * Validate required fields in FDA label data
   */
  validateLabelData(labelData: FDALabel): boolean {
    if (!labelData) return false;
    
    const hasBasicInfo = labelData.drugName || labelData.label?.genericName;
    const hasContent = labelData.label?.indicationsAndUsage || labelData.label?.dosageAndAdministration;

    return !!(hasBasicInfo && hasContent);
  }

  /**
   * Clean and normalize text content
   */
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/[^\w\s.,;:()\-]/g, '') // Remove special characters except basic punctuation
      .trim();
  }
}