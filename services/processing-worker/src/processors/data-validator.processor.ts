import { Injectable, Logger } from '@nestjs/common';
import { ProcessedDrugData } from '@pharmaiq/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-100 validation quality score
}

@Injectable()
export class DataValidatorProcessor {
  private readonly logger = new Logger(DataValidatorProcessor.name);

  /**
   * Validate processed drug data for completeness and quality
   */
  async validateProcessedData(data: ProcessedDrugData): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    try {
      // Required field validation
      this.validateRequiredFields(data, errors);
      
      // Content quality validation
      this.validateContentQuality(data, warnings);
      
      // Data consistency validation
      this.validateDataConsistency(data, warnings);
      
      // Calculate quality score
      score = this.calculateQualityScore(data, errors, warnings);

      const isValid = errors.length === 0;
      
      this.logger.log(`Validation completed for ${data.drugInfo.brandName}: ${isValid ? 'VALID' : 'INVALID'}, Score: ${score}`);

      return {
        isValid,
        errors,
        warnings,
        score,
      };
    } catch (error) {
      this.logger.error(`Validation error: ${error.message}`, error.stack);
      return {
        isValid: false,
        errors: [`Validation process failed: ${error.message}`],
        warnings: [],
        score: 0,
      };
    }
  }

  private validateRequiredFields(data: ProcessedDrugData, errors: string[]): void {
    // Drug info validation
    if (!data.drugInfo.brandName && !data.drugInfo.genericName) {
      errors.push('Missing both brand name and generic name');
    }

    if (!data.manufacturerInfo.manufacturerName && !data.manufacturerInfo.labelerName) {
      errors.push('Missing manufacturer information');
    }

    // Content validation - at least one major section should have content
    const hasContent = data.indications.length > 0 ||
                      data.dosageAndAdministration.length > 0 ||
                      data.warnings.length > 0;

    if (!hasContent) {
      errors.push('Missing all major content sections (indications, dosage, warnings)');
    }
  }

  private validateContentQuality(data: ProcessedDrugData, warnings: string[]): void {
    // Check for sufficient content in each section
    if (data.indications.length === 0) {
      warnings.push('No indications found');
    }

    if (data.dosageAndAdministration.length === 0) {
      warnings.push('No dosage information found');
    }

    if (data.warnings.length === 0) {
      warnings.push('No warnings found');
    }

    if (data.adverseReactions.length === 0) {
      warnings.push('No adverse reactions found');
    }

    // Check for very short content that might indicate parsing issues
    const shortContentSections = [];
    
    if (data.indications.length > 0 && data.indications.every(item => item.length < 20)) {
      shortContentSections.push('indications');
    }
    
    if (data.dosageAndAdministration.length > 0 && data.dosageAndAdministration.every(item => item.length < 20)) {
      shortContentSections.push('dosage');
    }

    if (shortContentSections.length > 0) {
      warnings.push(`Suspiciously short content in: ${shortContentSections.join(', ')}`);
    }
  }

  private validateDataConsistency(data: ProcessedDrugData, warnings: string[]): void {
    // Check if drug names are consistent
    const brandName = data.drugInfo.brandName.toLowerCase();
    const genericName = data.drugInfo.genericName.toLowerCase();

    if (brandName && genericName && brandName === genericName) {
      warnings.push('Brand name and generic name are identical - may indicate parsing error');
    }

    // Check for placeholder or default values
    const placeholderValues = ['unknown', 'n/a', 'not available', ''];
    
    Object.entries(data.drugInfo).forEach(([key, value]) => {
      if (typeof value === 'string' && placeholderValues.includes(value.toLowerCase())) {
        warnings.push(`Drug info field '${key}' contains placeholder value`);
      }
    });
  }

  private calculateQualityScore(data: ProcessedDrugData, errors: string[], warnings: string[]): number {
    let score = 100;

    // Deduct points for errors (major issues)
    score -= errors.length * 20;

    // Deduct points for warnings (minor issues)
    score -= warnings.length * 5;

    // Add points for content completeness
    const completenessBonus = this.calculateCompletenessBonus(data);
    score += completenessBonus;

    // Ensure score is within valid range
    return Math.max(0, Math.min(100, score));
  }

  private calculateCompletenessBonus(data: ProcessedDrugData): number {
    let bonus = 0;

    // Bonus for having all major sections
    if (data.indications.length > 0) bonus += 5;
    if (data.dosageAndAdministration.length > 0) bonus += 5;
    if (data.warnings.length > 0) bonus += 5;
    if (data.adverseReactions.length > 0) bonus += 3;
    if (data.contraindications.length > 0) bonus += 2;

    // Bonus for rich drug info
    if (data.drugInfo.activeIngredient) bonus += 2;
    if (data.drugInfo.strength) bonus += 2;
    if (data.drugInfo.dosageForm) bonus += 2;
    if (data.drugInfo.routeOfAdministration) bonus += 2;

    return bonus;
  }

  /**
   * Validate specific medical content for accuracy and safety
   */
  async validateMedicalContent(data: ProcessedDrugData): Promise<ValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for potentially dangerous content patterns
    this.validateDosageInformation(data, warnings, errors);
    this.validateWarningContent(data, warnings);
    this.validateDrugInteractions(data, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateQualityScore(data, errors, warnings),
    };
  }

  private validateDosageInformation(data: ProcessedDrugData, warnings: string[], errors: string[]): void {
    const dosageText = data.dosageAndAdministration.join(' ').toLowerCase();

    // Check for missing critical dosage information
    if (dosageText && !dosageText.match(/\d+\s*(mg|ml|g|units?)/)) {
      warnings.push('Dosage information may be missing specific amounts');
    }

    // Check for potentially dangerous dosage patterns
    const dangerousPatterns = [
      /overdose/i,
      /fatal/i,
      /death/i,
      /emergency/i
    ];

    dangerousPatterns.forEach(pattern => {
      if (pattern.test(dosageText)) {
        warnings.push('Dosage section contains serious safety warnings');
      }
    });
  }

  private validateWarningContent(data: ProcessedDrugData, warnings: string[]): void {
    const warningText = data.warnings.join(' ').toLowerCase();

    // Check for black box warnings
    if (warningText.includes('black box') || warningText.includes('boxed warning')) {
      warnings.push('Drug has FDA black box warning - requires special attention');
    }

    // Check for contraindication consistency
    if (data.contraindications.length === 0 && warningText.includes('contraindicated')) {
      warnings.push('Warnings mention contraindications but contraindications section is empty');
    }
  }

  private validateDrugInteractions(data: ProcessedDrugData, warnings: string[]): void {
    const allContent = [
      ...data.warnings,
      ...data.dosageAndAdministration,
      ...data.adverseReactions
    ].join(' ').toLowerCase();

    // Look for drug interaction mentions
    if (allContent.includes('drug interaction') || allContent.includes('concomitant')) {
      warnings.push('Drug has potential interactions - verify interaction section completeness');
    }
  }
}